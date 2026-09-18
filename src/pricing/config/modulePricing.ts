import type { ModulePricingRule, ServicePricingOverride } from "../types";

// Baseline per-module prices (Configured SaaS at Standard level, before any
// factors). Every service offer in the catalog maps to one of these 20
// module types, so every offer is priceable. Owner-approved 2026-09-18 from
// Philippine market research; revisit after real implementation hours are known.

export const MODULE_PRICING: ModulePricingRule[] = [
  { module: "crm", setupPrice: { minimum: 10000, maximum: 18000 }, monthlyPrice: { minimum: 800, maximum: 1500 }, complexity: 2, includedFunctions: ["Lead pipeline", "Assignments", "Notes & history"], notes: [] },
  { module: "booking", setupPrice: { minimum: 10000, maximum: 18000 }, monthlyPrice: { minimum: 800, maximum: 1500 }, complexity: 2, includedFunctions: ["Schedule view", "Confirmations", "Staff assignment"], notes: [] },
  { module: "inventory", setupPrice: { minimum: 12000, maximum: 22000 }, monthlyPrice: { minimum: 1200, maximum: 2000 }, complexity: 3, includedFunctions: ["Stock list", "Reorder alerts", "Adjustments"], notes: [] },
  { module: "ordering", setupPrice: { minimum: 14000, maximum: 26000 }, monthlyPrice: { minimum: 1200, maximum: 2200 }, complexity: 3, includedFunctions: ["Orders", "Line items", "Totals"], notes: [] },
  { module: "procurement", setupPrice: { minimum: 12000, maximum: 22000 }, monthlyPrice: { minimum: 900, maximum: 1600 }, complexity: 3, includedFunctions: ["Purchase orders", "Approvals", "Receiving"], notes: [] },
  { module: "quotation", setupPrice: { minimum: 12000, maximum: 22000 }, monthlyPrice: { minimum: 900, maximum: 1600 }, complexity: 3, includedFunctions: ["Quotation builder", "Approval flow"], notes: [] },
  { module: "projects", setupPrice: { minimum: 14000, maximum: 24000 }, monthlyPrice: { minimum: 1200, maximum: 2000 }, complexity: 3, includedFunctions: ["Job tracking", "Stages", "Activity history"], notes: [] },
  { module: "portal", setupPrice: { minimum: 16000, maximum: 28000 }, monthlyPrice: { minimum: 1300, maximum: 2300 }, complexity: 4, includedFunctions: ["Client requests", "Status visibility"], notes: [] },
  { module: "approvals", setupPrice: { minimum: 10000, maximum: 18000 }, monthlyPrice: { minimum: 700, maximum: 1300 }, complexity: 2, includedFunctions: ["Routing", "Decision trail"], notes: [] },
  { module: "scheduling", setupPrice: { minimum: 10000, maximum: 18000 }, monthlyPrice: { minimum: 800, maximum: 1500 }, complexity: 2, includedFunctions: ["Shift planning", "Attendance"], notes: [] },
  { module: "tasks", setupPrice: { minimum: 8000, maximum: 14000 }, monthlyPrice: { minimum: 600, maximum: 1100 }, complexity: 1, includedFunctions: ["Task board", "Checklists"], notes: [] },
  { module: "documents", setupPrice: { minimum: 10000, maximum: 18000 }, monthlyPrice: { minimum: 800, maximum: 1500 }, complexity: 2, includedFunctions: ["Document register", "Deadlines"], notes: [] },
  { module: "delivery", setupPrice: { minimum: 14000, maximum: 25000 }, monthlyPrice: { minimum: 1200, maximum: 2000 }, complexity: 3, includedFunctions: ["Dispatch board", "Proof of delivery"], notes: [] },
  { module: "maintenance", setupPrice: { minimum: 11000, maximum: 19000 }, monthlyPrice: { minimum: 800, maximum: 1500 }, complexity: 2, includedFunctions: ["Tickets", "Priorities", "Resolution log"], notes: [] },
  { module: "membership", setupPrice: { minimum: 12000, maximum: 22000 }, monthlyPrice: { minimum: 1000, maximum: 1800 }, complexity: 3, includedFunctions: ["Members", "Packages", "Renewals"], notes: [] },
  { module: "learning", setupPrice: { minimum: 16000, maximum: 26000 }, monthlyPrice: { minimum: 1200, maximum: 2200 }, complexity: 4, includedFunctions: ["Enrollment", "Progress", "Completion"], notes: [] },
  { module: "billing", setupPrice: { minimum: 12000, maximum: 22000 }, monthlyPrice: { minimum: 1000, maximum: 1800 }, complexity: 3, includedFunctions: ["Billing list", "Collection status"], notes: ["Display/status tracking only — no accounting ledger."] },
  { module: "dashboard", setupPrice: { minimum: 10000, maximum: 18000 }, monthlyPrice: { minimum: 700, maximum: 1300 }, complexity: 2, includedFunctions: ["Summary cards", "Charts"], notes: [] },
  { module: "production", setupPrice: { minimum: 16000, maximum: 26000 }, monthlyPrice: { minimum: 1200, maximum: 2200 }, complexity: 4, includedFunctions: ["Batch tracking", "Yields", "QC remarks"], notes: [] },
  { module: "universal", setupPrice: { minimum: 8000, maximum: 16000 }, monthlyPrice: { minimum: 700, maximum: 1300 }, complexity: 2, includedFunctions: ["Configurable records & stages"], notes: [] },
];

/** Industries with hand-reviewed seed overrides. */
export const SEED_PRICED_INDUSTRIES = [
  "retail",
  "realestate",
  "automotive",
  "food",
  "professional",
];

// Per-service tweaks for the five seed industries. Anything not listed
// falls back to its module's generic price above.
export const SERVICE_OVERRIDES: ServicePricingOverride[] = [
  { serviceOfferId: "retail--inventory-and-stock-monitoring-system", setupPrice: { minimum: 14000, maximum: 24000 }, notes: ["Multi-branch stock views included at Configured level."] },
  { serviceOfferId: "retail--online-ordering-website", setupPrice: { minimum: 18000, maximum: 32000 }, monthlyPrice: { minimum: 1300, maximum: 2300 }, complexity: 4 },
  { serviceOfferId: "realestate--lead-management-crm", setupPrice: { minimum: 12000, maximum: 22000 }, notes: ["Includes property-interest fields and agent assignment."] },
  { serviceOfferId: "realestate--tenant-portal", complexity: 4, notes: ["Tenant accounts require privacy review at Advanced level."] },
  { serviceOfferId: "automotive--job-order-management", setupPrice: { minimum: 16000, maximum: 26000 }, notes: ["Vehicle history linkage included."] },
  { serviceOfferId: "automotive--quotation-and-approval-system", setupPrice: { minimum: 14000, maximum: 22000 } },
  { serviceOfferId: "food--online-ordering", setupPrice: { minimum: 18000, maximum: 32000 }, monthlyPrice: { minimum: 1300, maximum: 2300 }, complexity: 4 },
  { serviceOfferId: "food--commissary-production-tracking", complexity: 4 },
  { serviceOfferId: "professional--secure-document-sharing", manualReviewRequired: true, notes: ["Confidential document handling needs a security review."] },
];
