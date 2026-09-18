import type { SupportPlanRule } from "../types";

// Response targets are PRELIMINARY and subject to the signed service
// agreement — the calculator makes no contractual guarantees.
// Basic, Standard, and Priority prices: owner-approved 2026-09-18 (thin evidence —
// labor-hour based). Dedicated and Custom SLA remain INTERNAL PLACEHOLDERS.

export const SUPPORT_PLANS: SupportPlanRule[] = [
  {
    id: "self-service",
    name: "Self-Service",
    channel: "Knowledge base and guides",
    coverage: "—",
    responseTarget: "No response commitment",
    includedScope: "Documentation access only",
    monthlyPrice: { minimum: 0, maximum: 0 },
    limitations: "No direct support; community/documentation only.",
  },
  {
    id: "basic",
    name: "Basic",
    channel: "Email / chat",
    coverage: "Business hours, weekdays",
    responseTarget: "Preliminary target: ~2 business days",
    includedScope: "Incident reports and how-to questions",
    monthlyPrice: { minimum: 1500, maximum: 3000 },
    limitations: "No phone support; excludes change requests.",
  },
  {
    id: "standard",
    name: "Standard",
    channel: "Email / chat / scheduled calls",
    coverage: "Business hours, Mon–Sat",
    responseTarget: "Preliminary target: ~1 business day",
    includedScope: "Incidents, how-to help, minor adjustments allowance",
    monthlyPrice: { minimum: 3500, maximum: 8000 },
    limitations: "Adjustment allowance capped monthly; excludes new features.",
  },
  {
    id: "priority",
    name: "Priority",
    channel: "Email / chat / phone",
    coverage: "Extended hours, Mon–Sat",
    responseTarget: "Preliminary target: ~4 business hours",
    includedScope: "Priority incident handling plus Standard scope",
    monthlyPrice: { minimum: 8000, maximum: 18000 },
    limitations: "Critical-incident priority; excludes project work.",
  },
  {
    id: "dedicated",
    name: "Dedicated",
    channel: "Dedicated contact person",
    coverage: "Extended hours, arranged per client",
    responseTarget: "Preliminary target: ~2 business hours",
    includedScope: "Named support contact, regular check-ins, larger allowance",
    monthlyPrice: { minimum: 15000, maximum: 30000 },
    limitations: "Scope defined in the service agreement.",
  },
  {
    id: "custom-sla",
    name: "Custom SLA",
    channel: "Per agreement",
    coverage: "Per agreement",
    responseTarget: "Defined only in the signed service agreement",
    includedScope: "Negotiated service levels and scope",
    monthlyPrice: { minimum: 20000, maximum: 60000 },
    limitations: "Requires manual scoping and a signed SLA.",
  },
];
