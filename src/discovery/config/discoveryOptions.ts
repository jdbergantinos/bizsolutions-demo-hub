// Selectable options used by the discovery questionnaire.

export const TOOL_OPTIONS = [
  "Paper or notebook",
  "Excel",
  "Google Sheets",
  "Messenger",
  "Viber",
  "WhatsApp",
  "Email",
  "Existing POS",
  "Existing CRM",
  "Accounting software",
  "Custom legacy system",
  "No formal system",
  "Other",
];

export const OUTCOME_OPTIONS = [
  "Faster transactions",
  "Better customer service",
  "Fewer errors",
  "Reduced manual work",
  "Better inventory accuracy",
  "Faster approvals",
  "Better follow-up",
  "Centralized records",
  "Multi-branch visibility",
  "Improved reporting",
  "Better staff accountability",
  "Customer self-service",
  "Automated reminders",
  "Better collections",
  "Business growth",
  "Other",
];

export const BUDGET_RANGES = [
  "Below ₱50,000",
  "₱50,000 – ₱150,000",
  "₱150,000 – ₱300,000",
  "₱300,000 – ₱600,000",
  "Above ₱600,000",
  "Not yet discussed",
];

export const IMPLEMENTATION_PERIODS = [
  "As soon as possible",
  "Within 1 month",
  "Within 3 months",
  "Within 6 months",
  "Next year",
  "Exploring options only",
];

/** Maps desired outcomes to the demo modules that serve them (used in scoring). */
export const OUTCOME_MODULE_MAP: Record<string, string[]> = {
  "Faster transactions": ["ordering", "booking", "quotation"],
  "Better customer service": ["crm", "portal", "maintenance"],
  "Fewer errors": ["universal", "ordering", "inventory"],
  "Reduced manual work": ["tasks", "universal", "approvals"],
  "Better inventory accuracy": ["inventory"],
  "Faster approvals": ["approvals", "procurement"],
  "Better follow-up": ["crm", "membership"],
  "Centralized records": ["universal", "crm", "documents"],
  "Multi-branch visibility": ["dashboard", "inventory"],
  "Improved reporting": ["dashboard"],
  "Better staff accountability": ["tasks", "scheduling", "projects"],
  "Customer self-service": ["portal", "booking"],
  "Automated reminders": ["booking", "membership"],
  "Better collections": ["billing"],
  "Business growth": ["crm", "dashboard", "membership"],
};
