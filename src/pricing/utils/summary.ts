import { getIndustry, getService } from "../../data/catalog";
import type { PricingEstimate, PricingRules, PricingSettings } from "../types";
import { pesoRange } from "../engine/money";
import { CLIENT_DISCLAIMER } from "../config/pricingSettings";

export function validUntil(estimate: PricingEstimate, settings: PricingSettings): string {
  const d = new Date(estimate.createdAt);
  d.setDate(d.getDate() + settings.estimateValidityDays);
  return d.toISOString().slice(0, 10);
}

/** Plain-text client-facing summary for copy / share / print. */
export function buildClientSummary(
  estimate: PricingEstimate,
  settings: PricingSettings,
  rules: PricingRules,
): string {
  const { input, result } = estimate;
  const industry = getIndustry(input.industryId);
  const services = input.selectedServiceOfferIds
    .map((id) => getService(id)?.name)
    .filter(Boolean);
  const recommended = estimate.packages.find((p) => p.recommended);

  const lines: string[] = [
    `PRELIMINARY ESTIMATE ${estimate.estimateNumber}`,
    `Date: ${estimate.createdAt.slice(0, 10)} · Valid until: ${validUntil(estimate, settings)}`,
    "",
    `Business: ${input.businessName}`,
    `Industry: ${industry?.name ?? input.industryId}${input.businessExample ? ` (${input.businessExample})` : ""}`,
    `Business size: ${input.businessSize} · Branches: ${input.branches} · Users: ${input.users}`,
    `Delivery model: ${input.deliveryModel}`,
    recommended ? `Recommended package: ${recommended.name}` : "",
    "",
    "SELECTED MODULES",
    ...services.map((s) => `• ${s}`),
  ];

  if (input.selectedOptionalServiceIds.length > 0) {
    lines.push("", "OPTIONAL SERVICES INCLUDED");
    lines.push(
      ...input.selectedOptionalServiceIds.map((id) => {
        const opt = rules.optionalServices.find((o) => o.id === id);
        return `• ${opt?.name ?? id}`;
      }),
    );
  }

  lines.push(
    "",
    `ESTIMATED ONE-TIME IMPLEMENTATION: ${pesoRange(result.oneTimeTotal)}`,
    `ESTIMATED MONTHLY: ${pesoRange(result.recurringTotal, " per month")}`,
  );

  if (result.manualReviewReasons.length > 0) {
    lines.push("", "MANUAL TECHNICAL REVIEW REQUIRED — figures above are not final.");
  }

  lines.push(
    "",
    "THIRD-PARTY COSTS — not included unless explicitly stated:",
    ...result.thirdPartyNotes.map((n) => `• ${n}`),
    "",
    "ASSUMPTIONS",
    ...result.assumptions.map((a) => `• ${a}`),
    "",
    "EXCLUSIONS",
    ...result.exclusions.map((e) => `• ${e}`),
    "",
    "NEXT STEPS",
    "• Business-process discovery meeting",
    "• Confirmation of requirements and integrations",
    "• Formal proposal with a signed scope of work",
    "",
    CLIENT_DISCLAIMER,
  );

  return lines.filter((l) => l !== null).join("\n");
}

/** Plain-text package comparison for copy / share. */
export function buildPackageComparison(
  estimate: PricingEstimate,
  totals: { name: string; oneTime: string; monthly: string; recommended: boolean }[],
): string {
  const lines = [
    `PACKAGE OPTIONS — ${estimate.input.businessName} (${estimate.estimateNumber})`,
    "",
    ...totals.map(
      (t) =>
        `${t.name}${t.recommended ? " (Recommended)" : ""}\n  One-time: ${t.oneTime}\n  Monthly: ${t.monthly}`,
    ),
    "",
    CLIENT_DISCLAIMER,
  ];
  return lines.join("\n");
}
