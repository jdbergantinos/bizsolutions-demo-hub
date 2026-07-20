// Seed lists for the preliminary scope builder. buildScope() combines these
// with the discovery + estimate; the presenter edits everything before saving.

export const SCOPE_DISCLAIMER =
  "Preliminary scope for discussion only — not a final contract or statement of work.";

export const NOT_INCLUDED_BASE = [
  "Hardware, devices, and internet connectivity",
  "Third-party subscriptions and licenses (billed by their vendors)",
  "Real payment processing or custody of funds",
  "Accounting, tax, or payroll engines",
  "App-store publication fees",
  "Regulatory certification or legal compliance sign-off",
  "Custom features not listed in the included section",
];

/** Added only when the matching optional service was NOT selected. */
export const CONDITIONAL_EXCLUSIONS: { optionalServiceId: string; text: string }[] = [
  { optionalServiceId: "data-cleaning", text: "Data cleaning (not selected)" },
  { optionalServiceId: "data-historical-import", text: "Historical record migration (not selected)" },
  { optionalServiceId: "data-migration", text: "Data migration from existing systems (not selected)" },
  { optionalServiceId: "own-source-handover", text: "Source-code transfer (not selected)" },
  { optionalServiceId: "int-custom", text: "Production system integrations (none selected)" },
];

export const CLIENT_RESPONSIBILITIES = [
  "Provide accurate requirements and business rules",
  "Assign decision-makers with authority to approve",
  "Provide starting data and sample records",
  "Review deliverables within agreed timeframes",
  "Attend testing and training sessions",
  "Secure third-party accounts (email, SMS, domains, gateways)",
  "Obtain necessary permissions and approvals",
];

export const PROVIDER_RESPONSIBILITIES = [
  "Confirm requirements before build",
  "Configure or develop the approved scope",
  "Conduct agreed testing",
  "Provide agreed training",
  "Deploy according to the approved plan",
  "Provide agreed support after go-live",
];

export const OPEN_QUESTIONS_BASE = [
  "Requirements not yet confirmed in writing",
  "Integrations requiring technical assessment",
  "Data volume and migration condition unknown",
  "Security or privacy requirements to confirm",
  "Approval structure and signatories to confirm",
  "Reports requiring sample formats from the client",
  "Hardware and device compatibility to verify",
];
