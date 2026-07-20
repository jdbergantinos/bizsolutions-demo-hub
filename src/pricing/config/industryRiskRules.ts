import type { IndustryRiskRule } from "../types";

// Industry risk adjustments reuse the catalog's existing caution data:
// any industry with cautions gets the default risk % (see PricingRules
// .defaultIndustryRiskPctWhenCautioned); the entries below override that
// with specific percentages or force manual review. INTERNAL PLACEHOLDERS.

export const INDUSTRY_RISK: IndustryRiskRule[] = [
  { industryId: "healthcare", riskPct: 12, manualReview: false, note: "Nonclinical scope only; any patient-data feature requires review." },
  { industryId: "law", riskPct: 10, manualReview: false, note: "No confidential case-file storage without a security review." },
  { industryId: "accounting", riskPct: 8, manualReview: false, note: "No accounting/tax/payroll engines — status tracking only." },
  { industryId: "cooperative", riskPct: 10, manualReview: false, note: "No loan computation or financial ledger." },
  { industryId: "insurance", riskPct: 10, manualReview: false, note: "No pricing engines or underwriting decisions." },
  { industryId: "lending", riskPct: 15, manualReview: true, note: "Highly regulated; every lending estimate needs manual review." },
  { industryId: "government", riskPct: 15, manualReview: true, note: "Procurement, compliance, and citizen-data duties require review." },
  { industryId: "telecom", riskPct: 10, manualReview: false, note: "No core network or billing-engine work." },
  { industryId: "mining", riskPct: 10, manualReview: false, note: "No machinery control or safety-critical operations." },
  { industryId: "maritime", riskPct: 8, manualReview: false, note: "Documentation and status systems only at this stage." },
  { industryId: "bpo", riskPct: 8, manualReview: false, note: "Security and uptime expectations above SME norm." },
  { industryId: "recruitment", riskPct: 8, manualReview: false, note: "Personal-data protection obligations apply." },
];
