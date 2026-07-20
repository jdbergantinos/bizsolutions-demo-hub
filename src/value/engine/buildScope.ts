import { getIndustry, getService } from "../../data/catalog";
import type { PricingEstimate } from "../../pricing/types";
import { loadPricingRules } from "../../pricing/store/pricingStorage";
import type { DiscoveryRecord } from "../../discovery/types";
import type { PreliminaryScope } from "../types";
import {
  CLIENT_RESPONSIBILITIES,
  CONDITIONAL_EXCLUSIONS,
  NOT_INCLUDED_BASE,
  OPEN_QUESTIONS_BASE,
  PROVIDER_RESPONSIBILITIES,
} from "../config/scopeTemplates";
import { uid } from "../../utils/storage";

/**
 * Generates an editable preliminary scope from the discovery and (optionally)
 * a pricing estimate. Output is a draft for discussion, never a contract.
 */
export function buildScope(
  discovery: DiscoveryRecord | null,
  estimate: PricingEstimate | null,
): PreliminaryScope {
  const now = new Date().toISOString();
  const rules = loadPricingRules();
  const industry = getIndustry(estimate?.input.industryId ?? discovery?.business.industryId ?? "");

  const serviceIds =
    estimate?.input.selectedServiceOfferIds ??
    discovery?.recommendationSet?.recommendations.filter((r) => r.decision === "accepted").map((r) => r.serviceOfferId) ??
    [];
  const optionalIds = estimate?.input.selectedOptionalServiceIds ?? [];
  const optionalNames = optionalIds
    .map((id) => rules.optionalServices.find((o) => o.id === id)?.name)
    .filter((n): n is string => Boolean(n));

  const included: string[] = [];
  for (const id of serviceIds) {
    const svc = getService(id);
    if (!svc) continue;
    const mod = rules.modulePricing.find((m) => m.module === svc.demoModule);
    included.push(`${svc.name} (${mod?.includedFunctions.join(", ") ?? "standard functions"})`);
  }
  if (estimate) {
    const size = rules.businessSizes.find((s) => s.id === estimate.input.businessSize);
    included.push(`Up to ${estimate.input.users} system users (${size?.includedUsers ?? "-"} included in base)`);
    included.push(`${estimate.input.branches} branch(es)`);
    const level = rules.configurationLevels.find((c) => c.id === estimate.input.configurationLevel);
    if (level) included.push(`${level.name} configuration level (${level.description})`);
    const support = rules.supportPlans.find((s) => s.id === estimate.input.supportPlanId);
    if (support) included.push(`Support plan: ${support.name} (${support.includedScope})`);
    const dm = rules.deliveryModels.find((d) => d.id === estimate.input.deliveryModel);
    if (dm) included.push(`Delivery model: ${dm.name}`);
  } else if (discovery) {
    included.push(`Up to ${discovery.business.users} system users`);
    included.push(`${discovery.business.branches} branch(es)`);
  }
  included.push(...optionalNames.map((n) => `Optional service: ${n}`));
  if (!optionalNames.some((n) => /training/i.test(n))) {
    included.push("Basic online administrator orientation (standard)");
  }
  included.push("Standard module reports and dashboard cards");
  included.push("Deployment assumes standard hosting on the provider's platform");

  const notIncluded = [
    ...NOT_INCLUDED_BASE,
    ...CONDITIONAL_EXCLUSIONS.filter((c) => !optionalIds.includes(c.optionalServiceId)).map((c) => c.text),
  ];

  const openQuestions = [...OPEN_QUESTIONS_BASE];
  if (discovery?.unansweredQuestions) openQuestions.push(`From discovery: ${discovery.unansweredQuestions}`);
  if (discovery?.itemsToVerify) openQuestions.push(`To verify: ${discovery.itemsToVerify}`);
  if (estimate?.result.manualReviewReasons.length) {
    openQuestions.push(...estimate.result.manualReviewReasons.map((r) => `Technical review: ${r}`));
  }
  if (industry?.cautions?.length) {
    openQuestions.push(...industry.cautions.map((c) => `Industry caution: ${c}`));
  }

  return {
    schemaVersion: 1,
    id: uid(),
    name: `Preliminary scope — ${discovery?.business.businessName ?? estimate?.input.businessName ?? "client"}`,
    discoveryId: discovery?.id,
    pricingEstimateId: estimate?.id,
    included,
    notIncluded,
    clientResponsibilities: [...CLIENT_RESPONSIBILITIES],
    providerResponsibilities: [...PROVIDER_RESPONSIBILITIES],
    openQuestions,
    notes: "",
    createdAt: now,
    updatedAt: now,
  };
}
