import { getIndustry, getService } from "../../data/catalog";
import type { ServiceOffer } from "../../types";
import type {
  EstimateInput,
  EstimateLine,
  EstimateResult,
  InternalPricingDetails,
  ModulePricingRule,
  PriceRange,
  PricingRules,
  PricingSettings,
  ServicePricingOverride,
} from "../types";
import { add, isZero, midpoint, negate, pctOf, range, roundRange, scale, ZERO } from "./money";

// Pure pricing engine. Everything here is derived from the rule set and the
// estimate input — no UI state, no storage — so it can be tested directly.

export interface ServicePriceInfo {
  service: ServiceOffer;
  setup: PriceRange;
  monthly: PriceRange;
  complexity: number;
  manualReviewRequired: boolean;
  notes: string[];
}

/** Resolve one service offer's baseline price (module default + override). */
export function calculateModulePrice(
  serviceOfferId: string,
  rules: PricingRules,
): ServicePriceInfo | null {
  const service = getService(serviceOfferId);
  if (!service) return null;
  const modRule: ModulePricingRule | undefined = rules.modulePricing.find(
    (m) => m.module === service.demoModule,
  );
  if (!modRule) return null;
  const override: ServicePricingOverride | undefined = rules.serviceOverrides.find(
    (o) => o.serviceOfferId === serviceOfferId,
  );
  return {
    service,
    setup: override?.setupPrice ?? modRule.setupPrice,
    monthly: override?.monthlyPrice ?? modRule.monthlyPrice,
    complexity: override?.complexity ?? modRule.complexity,
    manualReviewRequired: override?.manualReviewRequired ?? false,
    notes: [...modRule.notes, ...(override?.notes ?? [])],
  };
}

/** Industry risk percentage + manual-review flag, reusing catalog cautions. */
export function calculateRiskAdjustment(
  industryId: string,
  rules: PricingRules,
): { riskPct: number; manualReview: boolean; note: string } {
  const specific = rules.industryRisk.find((r) => r.industryId === industryId);
  if (specific) return { riskPct: specific.riskPct, manualReview: specific.manualReview, note: specific.note };
  const industry = getIndustry(industryId);
  if (industry?.cautions?.length) {
    return {
      riskPct: rules.defaultIndustryRiskPctWhenCautioned,
      manualReview: false,
      note: "Industry cautions apply — see the industry's caution notes.",
    };
  }
  return { riskPct: 0, manualReview: false, note: "" };
}

interface RecurringArgs {
  input: EstimateInput;
  rules: PricingRules;
  servicePrices: ServicePriceInfo[];
  oneTimeSubtotalBeforeTax: PriceRange;
}

/** Build the recurring (monthly) line items. */
export function calculateRecurringPrice({ input, rules, servicePrices, oneTimeSubtotalBeforeTax }: RecurringArgs): EstimateLine[] {
  const dm = rules.deliveryModels.find((d) => d.id === input.deliveryModel)!;
  const level = rules.configurationLevels.find((c) => c.id === input.configurationLevel)!;
  const size = rules.businessSizes.find((s) => s.id === input.businessSize)!;
  const lines: EstimateLine[] = [];

  lines.push({
    id: "base-subscription",
    label: dm.id === "custom-built" || dm.id === "exclusive-source-transfer"
      ? "Hosting or infrastructure allowance"
      : "Base platform subscription",
    range: roundRange(scale(dm.baseMonthly, size.sizeFactor), 100),
    note: `${dm.name} · includes ${size.includedUsers} users and ${size.includedBranches} branch(es)`,
  });

  const moduleMonthly = servicePrices.reduce(
    (sum, sp) => add(sum, sp.monthly),
    ZERO,
  );
  if (!isZero(moduleMonthly)) {
    lines.push({
      id: "module-subscription",
      label: `Selected module subscription (${servicePrices.length} module${servicePrices.length === 1 ? "" : "s"})`,
      range: roundRange(scale(moduleMonthly, dm.moduleMonthlyFactor * level.monthlyFactor), 100),
    });
  }

  const extraBranches = Math.max(0, input.branches - size.includedBranches);
  if (extraBranches > 0) {
    lines.push({
      id: "extra-branches",
      label: `Additional branches (${extraBranches})`,
      range: roundRange(scale(rules.userBranchRules.extraBranchMonthly, extraBranches), 100),
    });
  }

  const extraUsers = Math.max(0, input.users - size.includedUsers);
  if (extraUsers > 0) {
    lines.push({
      id: "extra-users",
      label: `Additional users (${extraUsers})`,
      range: roundRange(scale(rules.userBranchRules.extraUserMonthly, extraUsers), 100),
    });
  }

  const optionalMonthly = selectedOptionals(input, rules)
    .filter((o) => o.monthlyPrice)
    .reduce((sum, o) => add(sum, o.monthlyPrice!), ZERO);
  if (!isZero(optionalMonthly)) {
    lines.push({
      id: "optional-monthly",
      label: "Optional services & usage allowances",
      range: roundRange(optionalMonthly, 100),
      note: "Storage, messaging, and external-API allowances per selected options",
    });
  }

  const support = rules.supportPlans.find((s) => s.id === input.supportPlanId);
  if (support && !isZero(support.monthlyPrice)) {
    lines.push({ id: "support-plan", label: `Support plan — ${support.name}`, range: support.monthlyPrice });
  }

  if (dm.maintenancePctMonthly) {
    lines.push({
      id: "maintenance",
      label: "Maintenance allowance",
      range: roundRange(pctOf(oneTimeSubtotalBeforeTax, dm.maintenancePctMonthly), 100),
      note: `≈${dm.maintenancePctMonthly}% of the one-time estimate per month`,
    });
  }

  return lines;
}

function selectedOptionals(input: EstimateInput, rules: PricingRules) {
  return input.selectedOptionalServiceIds
    .map((id) => rules.optionalServices.find((o) => o.id === id))
    .filter((o): o is NonNullable<typeof o> => Boolean(o));
}

/** The main pure estimate calculation. */
export function calculateEstimate(
  input: EstimateInput,
  rules: PricingRules,
  settings: PricingSettings,
): EstimateResult {
  const dm = rules.deliveryModels.find((d) => d.id === input.deliveryModel);
  const level = rules.configurationLevels.find((c) => c.id === input.configurationLevel);
  const size = rules.businessSizes.find((s) => s.id === input.businessSize);
  if (!dm || !level || !size) {
    throw new Error("Estimate input references an unknown delivery model, level, or size.");
  }

  const industry = getIndustry(input.industryId);
  const risk = calculateRiskAdjustment(input.industryId, rules);
  const servicePrices = input.selectedServiceOfferIds
    .map((id) => calculateModulePrice(id, rules))
    .filter((s): s is ServicePriceInfo => s !== null);
  const optionals = selectedOptionals(input, rules);

  const manualReviewReasons: string[] = [];
  if (risk.manualReview && industry) {
    manualReviewReasons.push(`${industry.name}: ${risk.note}`);
  }
  for (const sp of servicePrices) {
    if (sp.service.riskLevel === "high" || sp.manualReviewRequired) {
      manualReviewReasons.push(`Service "${sp.service.name}" requires a technical review before pricing is final.`);
    }
  }
  for (const opt of optionals) {
    if (opt.manualReviewRequired) {
      manualReviewReasons.push(`Option "${opt.name}" requires manual scoping and review.`);
    }
  }

  // ---------- One-time lines ----------
  const oneTimeLines: EstimateLine[] = [];

  oneTimeLines.push({
    id: "base-implementation",
    label: `Core implementation — ${dm.name}`,
    range: roundRange(scale(dm.baseSetup, size.sizeFactor)),
    note: `Business size: ${size.name}`,
  });

  const moduleSetup = servicePrices.reduce((sum, sp) => add(sum, sp.setup), ZERO);
  if (!isZero(moduleSetup)) {
    oneTimeLines.push({
      id: "module-setup",
      label: `Selected module setup (${servicePrices.length})`,
      range: roundRange(scale(moduleSetup, dm.moduleSetupFactor * level.setupFactor * size.sizeFactor)),
      note: `${level.name} configuration level`,
    });
  }

  const extraBranches = Math.max(0, input.branches - size.includedBranches);
  if (extraBranches > 0) {
    oneTimeLines.push({
      id: "branch-setup",
      label: `Additional branch setup (${extraBranches})`,
      range: roundRange(scale(rules.userBranchRules.extraBranchSetup, extraBranches)),
    });
  }

  // Optional one-time charges, grouped per category for a readable estimate.
  const categories = [...new Set(optionals.map((o) => o.category))];
  for (const cat of categories) {
    const catTotal = optionals
      .filter((o) => o.category === cat && o.oneTimePrice)
      .reduce((sum, o) => add(sum, o.oneTimePrice!), ZERO);
    if (!isZero(catTotal)) {
      oneTimeLines.push({
        id: `optional-${cat}`,
        label: cat,
        range: roundRange(catTotal),
        note: optionals.filter((o) => o.category === cat).map((o) => o.name).join(", "),
      });
    }
  }

  const coreSoFar = add(...oneTimeLines.map((l) => l.range));

  if (risk.riskPct > 0) {
    oneTimeLines.push({
      id: "risk-adjustment",
      label: "Industry risk & compliance allowance",
      range: roundRange(pctOf(coreSoFar, risk.riskPct)),
      note: risk.note,
    });
  }

  if (dm.sourceCodePremiumPct || dm.exclusivityPremiumPct) {
    const pct = (dm.sourceCodePremiumPct ?? 0) + (dm.exclusivityPremiumPct ?? 0);
    oneTimeLines.push({
      id: "ownership-premium",
      label: "Source-code & exclusivity premium",
      range: roundRange(pctOf(coreSoFar, pct)),
      note: "Per the transfer and exclusivity agreement",
    });
  }

  const beforeContingency = add(...oneTimeLines.map((l) => l.range));

  if (input.contingencyPct > 0) {
    oneTimeLines.push({
      id: "contingency",
      label: `Contingency (${input.contingencyPct}%)`,
      range: roundRange(pctOf(beforeContingency, input.contingencyPct)),
    });
  }

  if (input.discountPct > 0) {
    const base = add(...oneTimeLines.map((l) => l.range));
    oneTimeLines.push({
      id: "discount",
      label: `Discount (${input.discountPct}%)`,
      range: roundRange(negate(pctOf(base, input.discountPct))),
    });
  }

  if (input.manualAdjustment !== 0) {
    oneTimeLines.push({
      id: "manual-adjustment",
      label: "Manual adjustment",
      range: range(input.manualAdjustment, input.manualAdjustment),
      note: input.manualAdjustmentReason || undefined,
    });
  }

  const oneTimeSubtotal = roundRange(add(...oneTimeLines.map((l) => l.range)));
  const oneTimeTax = settings.vatEnabled ? roundRange(pctOf(oneTimeSubtotal, settings.vatPct), 100) : null;
  const oneTimeTotal = oneTimeTax ? add(oneTimeSubtotal, oneTimeTax) : oneTimeSubtotal;

  // ---------- Recurring lines ----------
  const recurringLines = calculateRecurringPrice({
    input,
    rules,
    servicePrices,
    oneTimeSubtotalBeforeTax: oneTimeSubtotal,
  });
  const recurringSubtotal = roundRange(add(...recurringLines.map((l) => l.range)), 100);
  const recurringTax = settings.vatEnabled ? roundRange(pctOf(recurringSubtotal, settings.vatPct), 50) : null;
  const recurringTotal = recurringTax ? add(recurringSubtotal, recurringTax) : recurringSubtotal;

  // ---------- Notes ----------
  const thirdPartyNotes = [
    settings.thirdPartyDisclaimer,
    ...new Set(optionals.map((o) => o.thirdPartyNote).filter((n): n is string => Boolean(n))),
  ];

  const assumptions = [
    ...settings.defaultAssumptions,
    `Assumes ${input.branches} branch(es) and up to ${input.users} system users.`,
    `Delivery model: ${dm.name}; configuration level: ${level.name}.`,
  ];
  if (industry?.cautions?.length) {
    assumptions.push(...industry.cautions.map((c) => `Industry caution: ${c}`));
  }

  // ---------- Internal pricing ----------
  const internal = computeInternal(oneTimeSubtotal, input, rules, settings);

  const internalWarnings = [...internal.warnings];
  if (input.discountPct > settings.maximumDiscountPct) {
    internalWarnings.push(`Discount ${input.discountPct}% exceeds the configured maximum of ${settings.maximumDiscountPct}%.`);
  }
  if (input.contingencyPct === 0 && (input.configurationLevel === "customized" || input.configurationLevel === "advanced" || input.configurationLevel === "enterprise")) {
    internalWarnings.push("Contingency is zero for customized/advanced work — add a contingency allowance.");
  }
  if (input.manualAdjustment !== 0 && !input.manualAdjustmentReason.trim()) {
    internalWarnings.push("Manual adjustment has no recorded reason.");
  }

  const pricingStatus: EstimateResult["pricingStatus"] =
    manualReviewReasons.length > 0
      ? "manual-review-required"
      : optionals.some((o) => o.pricingStatus === "range-only")
        ? "range-only"
        : "calculated";

  return {
    oneTimeLines,
    oneTimeSubtotal,
    oneTimeTax,
    oneTimeTotal,
    recurringLines,
    recurringSubtotal,
    recurringTax,
    recurringTotal,
    thirdPartyNotes,
    assumptions,
    exclusions: [...settings.defaultExclusions],
    manualReviewReasons,
    internalWarnings,
    internal,
    pricingStatus,
  };
}

function computeInternal(
  oneTimeSubtotal: PriceRange,
  input: EstimateInput,
  rules: PricingRules,
  settings: PricingSettings,
): InternalPricingDetails {
  const c = rules.internalCost;
  const cost = roundRange(scale(oneTimeSubtotal, c.internalCostRatio));
  const allowances: EstimateLine[] = [
    { id: "cost-dev", label: "Development allowance", range: roundRange(scale(cost, c.developmentShare)) },
    { id: "cost-pm", label: "Project management allowance", range: roundRange(scale(cost, c.projectManagementShare)) },
    { id: "cost-qa", label: "QA allowance", range: roundRange(scale(cost, c.qaShare)) },
    { id: "cost-contractor", label: "Contractor allowance", range: roundRange(scale(cost, c.contractorShare)) },
    { id: "cost-infra", label: "Infrastructure allowance", range: roundRange(scale(cost, c.infrastructureShare)) },
  ];
  const salesCommission = roundRange(pctOf(oneTimeSubtotal, c.salesCommissionPct), 100);

  const margin = settings.targetGrossMarginPct;
  // Suggested selling price = internal cost ÷ (1 − target gross margin).
  const suggested = margin < 100 ? roundRange(scale(cost, 1 / (1 - margin / 100))) : cost;
  const minimumAcceptable = Math.round(cost.maximum / (1 - settings.minimumGrossMarginPct / 100));

  const sellingMid = midpoint(oneTimeSubtotal) * (1 - input.discountPct / 100);
  const costMid = midpoint(cost);
  const effectiveMarginPct = sellingMid > 0 ? Math.round(((sellingMid - costMid) / sellingMid) * 100) : 0;

  const warnings: string[] = [];
  if (sellingMid < costMid) warnings.push("Estimated selling price is below the estimated internal cost.");
  if (effectiveMarginPct < settings.minimumGrossMarginPct && sellingMid > 0) {
    warnings.push(`Effective gross margin (~${effectiveMarginPct}%) is below the configured minimum of ${settings.minimumGrossMarginPct}%.`);
  }

  return {
    estimatedInternalCost: cost,
    allowances,
    salesCommission,
    targetGrossMarginPct: margin,
    suggestedSellingPrice: suggested,
    minimumAcceptablePrice: minimumAcceptable,
    effectiveMarginPct,
    warnings,
  };
}
