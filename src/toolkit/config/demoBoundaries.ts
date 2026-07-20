// Reusable "what this demonstration is and is not" boundary lists.

export const DEMO_INCLUDES = [
  "Proposed screens and layouts",
  "Sample workflows from intake to completion",
  "Sample roles and conceptual permissions",
  "Sample records (all fictional)",
  "Interactive forms you can actually use",
  "Conceptual dashboards and charts",
  "Simulated notifications",
  "Preliminary recommendations",
  "Preliminary pricing where available",
];

export const DEMO_EXCLUDES = [
  "Production database",
  "Production security",
  "Real user accounts",
  "Real integrations",
  "Real payment processing",
  "Real email or SMS sending",
  "Real customer data",
  "Production hosting",
  "Data migration",
  "Regulatory certification",
  "Guaranteed performance",
  "Final contractual scope",
];

/** Additional exclusions surfaced for sensitive industries. */
export const INDUSTRY_EXCLUSIONS: Record<string, string[]> = {
  healthcare: ["Electronic medical records", "Diagnosis or treatment functions", "Prescription handling"],
  lending: ["Loan calculations", "Credit scoring", "Core banking", "Payment custody"],
  cooperative: ["Financial ledgers", "Loan computation"],
  insurance: ["Policy pricing", "Underwriting decisions", "Official financial records"],
  law: ["Confidential case-file storage"],
  accounting: ["Accounting, tax, or payroll engines"],
  government: ["Citizen-record systems", "Official government registries"],
  telecom: ["Core network operations", "Billing engines"],
  mining: ["Machinery control", "Safety-critical operations"],
};
