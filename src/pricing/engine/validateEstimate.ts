import type { EstimateInput, PriceRange, PricingRules } from "../types";

// Validation for estimate inputs and imported pricing configurations.
// Imported JSON must never crash the app — validate before applying.

export function validateEstimateInput(input: EstimateInput, rules: PricingRules): string[] {
  const errors: string[] = [];
  if (!input.businessName.trim()) errors.push("Enter the client's business name.");
  if (!input.industryId) errors.push("Select an industry.");
  if (input.selectedServiceOfferIds.length === 0) errors.push("Select at least one service offer.");
  if (!rules.deliveryModels.some((d) => d.id === input.deliveryModel)) errors.push("Select a delivery model.");
  if (!rules.configurationLevels.some((c) => c.id === input.configurationLevel)) errors.push("Select a configuration level.");
  if (!rules.businessSizes.some((s) => s.id === input.businessSize)) errors.push("Select a business size.");
  if (input.branches < 1) errors.push("Branches must be at least 1.");
  if (input.users < 1) errors.push("System users must be at least 1.");
  if (input.discountPct < 0 || input.discountPct > 100) errors.push("Discount must be between 0 and 100%.");
  if (input.contingencyPct < 0 || input.contingencyPct > 50) errors.push("Contingency must be between 0 and 50%.");
  // Delivery-model restrictions on optional services.
  for (const id of input.selectedOptionalServiceIds) {
    const opt = rules.optionalServices.find((o) => o.id === id);
    if (opt && opt.deliveryModels.length > 0 && !opt.deliveryModels.includes(input.deliveryModel)) {
      errors.push(`"${opt.name}" is not available for the selected delivery model.`);
    }
  }
  return errors;
}

const isRange = (r: unknown): r is PriceRange =>
  typeof r === "object" &&
  r !== null &&
  typeof (r as PriceRange).minimum === "number" &&
  typeof (r as PriceRange).maximum === "number" &&
  (r as PriceRange).minimum >= 0 &&
  (r as PriceRange).maximum >= (r as PriceRange).minimum;

/**
 * Validates an imported pricing-rules object. Returns a list of problems;
 * an empty list means the import is safe to apply.
 */
export function validatePricingRules(data: unknown): string[] {
  const errors: string[] = [];
  if (typeof data !== "object" || data === null) return ["Import is not a JSON object."];
  const r = data as Partial<PricingRules>;

  if (typeof r.version !== "string" || !r.version) errors.push("Missing version string.");
  if (typeof r.pricingSource !== "string") errors.push("Missing pricingSource string.");

  const checkArray = (name: string, arr: unknown, min: number) => {
    if (!Array.isArray(arr) || arr.length < min) errors.push(`${name} must be an array with at least ${min} entries.`);
    return Array.isArray(arr);
  };

  if (checkArray("deliveryModels", r.deliveryModels, 1)) {
    for (const d of r.deliveryModels!) {
      if (!d.id || !isRange(d.baseSetup) || !isRange(d.baseMonthly) || typeof d.moduleSetupFactor !== "number") {
        errors.push(`Delivery model "${d?.id ?? "?"}" has missing or invalid pricing fields.`);
      }
    }
  }
  if (checkArray("configurationLevels", r.configurationLevels, 1)) {
    for (const c of r.configurationLevels!) {
      if (!c.id || typeof c.setupFactor !== "number" || c.setupFactor <= 0) {
        errors.push(`Configuration level "${c?.id ?? "?"}" has an invalid setup factor.`);
      }
    }
  }
  if (checkArray("businessSizes", r.businessSizes, 1)) {
    for (const s of r.businessSizes!) {
      if (!s.id || typeof s.sizeFactor !== "number" || s.sizeFactor <= 0) {
        errors.push(`Business size "${s?.id ?? "?"}" has an invalid size factor.`);
      }
    }
  }
  if (checkArray("modulePricing", r.modulePricing, 1)) {
    for (const m of r.modulePricing!) {
      if (!m.module || !isRange(m.setupPrice) || !isRange(m.monthlyPrice)) {
        errors.push(`Module pricing "${m?.module ?? "?"}" has invalid price ranges.`);
      }
    }
  }
  if (checkArray("optionalServices", r.optionalServices, 1)) {
    for (const o of r.optionalServices!) {
      if (!o.id || !o.name || (!o.oneTimePrice && !o.monthlyPrice)) {
        errors.push(`Optional service "${o?.id ?? "?"}" needs at least one price range.`);
      } else if ((o.oneTimePrice && !isRange(o.oneTimePrice)) || (o.monthlyPrice && !isRange(o.monthlyPrice))) {
        errors.push(`Optional service "${o.id}" has an invalid price range.`);
      }
    }
  }
  if (checkArray("supportPlans", r.supportPlans, 1)) {
    for (const s of r.supportPlans!) {
      if (!s.id || !isRange(s.monthlyPrice)) errors.push(`Support plan "${s?.id ?? "?"}" has an invalid monthly price.`);
    }
  }
  if (!Array.isArray(r.industryRisk)) errors.push("industryRisk must be an array.");
  if (!Array.isArray(r.serviceOverrides)) errors.push("serviceOverrides must be an array.");
  if (
    typeof r.userBranchRules !== "object" ||
    r.userBranchRules === null ||
    !isRange(r.userBranchRules.extraUserMonthly) ||
    !isRange(r.userBranchRules.extraBranchMonthly) ||
    !isRange(r.userBranchRules.extraBranchSetup)
  ) {
    errors.push("userBranchRules is missing or has invalid ranges.");
  }
  if (typeof r.internalCost !== "object" || r.internalCost === null || typeof r.internalCost.internalCostRatio !== "number") {
    errors.push("internalCost rules are missing or invalid.");
  }
  return errors;
}
