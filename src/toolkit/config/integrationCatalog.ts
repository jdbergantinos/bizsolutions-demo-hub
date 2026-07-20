import type { IntegrationCategory, IntegrationDef, IntegrationStatus } from "../types";
import type { DeliveryModel, PriceRange } from "../../pricing/types";

// Integration catalog. Every entry is honest about its state: nothing in this
// demo app is actually integrated, so statuses describe what would be
// involved in production — never a claim that it already works.

export const INTEGRATION_STATUS_META: Record<IntegrationStatus, { label: string; tone: "gray" | "blue" | "amber" | "violet" | "red" }> = {
  "demonstration-only": { label: "Demonstration only", tone: "gray" },
  "configuration-available": { label: "Configuration available", tone: "blue" },
  "third-party-setup-required": { label: "Third-party setup required", tone: "amber" },
  "technical-assessment-required": { label: "Technical assessment required", tone: "violet" },
  "custom-development-required": { label: "Custom development required", tone: "red" },
  "not-currently-supported": { label: "Not currently supported", tone: "red" },
};

const ALL_MODELS: DeliveryModel[] = ["shared-saas", "configured-saas", "custom-built", "white-label", "exclusive-source-transfer"];
const CUSTOM_MODELS: DeliveryModel[] = ["custom-built", "exclusive-source-transfer"];

const i = (
  id: string,
  name: string,
  category: IntegrationCategory,
  description: string,
  status: IntegrationStatus,
  o: Partial<IntegrationDef> = {},
): IntegrationDef => ({
  id,
  name,
  category,
  description,
  status,
  availability: "Concept shown in demos; production availability confirmed only after assessment.",
  thirdPartyCostNote: "Third-party fees, if any, are billed by the provider and are not included.",
  technicalAssessmentRequired: false,
  authenticationRequirement: "Provider account owned by the client",
  dataAccessConsideration: "Only the data needed for the integration is exchanged.",
  risk: "Depends on the provider's API stability and terms.",
  deliveryModels: ALL_MODELS,
  demoAvailable: false,
  setupEstimate: undefined,
  ...o,
});

const r = (minimum: number, maximum: number): PriceRange => ({ minimum, maximum });

export const INTEGRATION_CATALOG: IntegrationDef[] = [
  // Communication
  i("email", "Email", "Communication", "System notifications delivered by email.", "third-party-setup-required", { setupEstimate: r(4000, 8000), thirdPartyCostNote: "Email-service fees beyond the free tier are billed by the provider.", demoAvailable: true, availability: "Simulated in the notification simulator; production needs an email service account." }),
  i("sms", "SMS", "Communication", "SMS notifications and reminders via a local SMS gateway.", "third-party-setup-required", { setupEstimate: r(5000, 10000), thirdPartyCostNote: "SMS credits are billed per message by the SMS provider.", demoAvailable: true, availability: "Simulated in the notification simulator; production needs an SMS provider account." }),
  i("messenger", "Messenger", "Communication", "Notifications and inquiries through Facebook Messenger.", "technical-assessment-required", { technicalAssessmentRequired: true, risk: "Platform policy changes can affect messaging permissions." }),
  i("viber", "Viber", "Communication", "Notifications through Viber business messages.", "technical-assessment-required", { technicalAssessmentRequired: true, thirdPartyCostNote: "Viber business messaging is billed by Viber/partners." }),
  i("whatsapp", "WhatsApp", "Communication", "Notifications through the WhatsApp Business API.", "technical-assessment-required", { technicalAssessmentRequired: true, thirdPartyCostNote: "WhatsApp Business API fees are billed by Meta/partners." }),
  i("push", "Push notifications", "Communication", "App push notifications on installed devices.", "configuration-available", { setupEstimate: r(5000, 10000), demoAvailable: true, availability: "Concept simulated; production push requires platform configuration." }),

  // Productivity
  i("gcal", "Google Calendar", "Productivity", "Bookings synced to Google Calendar.", "configuration-available", { setupEstimate: r(5000, 10000), authenticationRequirement: "Client's Google account authorization (OAuth)" }),
  i("gdrive", "Google Drive", "Productivity", "Documents stored in the client's Drive.", "technical-assessment-required", { technicalAssessmentRequired: true, authenticationRequirement: "Client's Google account authorization (OAuth)" }),
  i("m365", "Microsoft 365", "Productivity", "Calendar or file connections to Microsoft 365.", "technical-assessment-required", { technicalAssessmentRequired: true, authenticationRequirement: "Client's Microsoft account authorization" }),
  i("gsheets", "Google Sheets", "Productivity", "Data pushed to or pulled from Sheets.", "configuration-available", { setupEstimate: r(5000, 12000) }),
  i("excel", "Excel import & export", "Productivity", "Spreadsheet import/export of records.", "configuration-available", { setupEstimate: r(4000, 8000), demoAvailable: false, availability: "Standard capability in production builds; not wired in this demo." }),

  // Sales & Marketing
  i("webforms", "Website forms", "Sales & Marketing", "Website inquiries flow into the CRM.", "configuration-available", { setupEstimate: r(5000, 10000), demoAvailable: true, availability: "CRM intake shown in demos; production needs the client's website connection." }),
  i("fbleads", "Facebook lead forms", "Sales & Marketing", "Facebook lead-form submissions captured automatically.", "third-party-setup-required", { setupEstimate: r(6000, 12000), authenticationRequirement: "Client's Facebook page admin access" }),
  i("crm-ext", "Existing CRM", "Sales & Marketing", "Connection to a CRM the client already uses.", "technical-assessment-required", { technicalAssessmentRequired: true }),
  i("marketing", "Marketing automation", "Sales & Marketing", "Sync with an email-marketing platform.", "technical-assessment-required", { technicalAssessmentRequired: true }),
  i("ads", "Advertising platforms", "Sales & Marketing", "Conversion data to ad platforms.", "custom-development-required", { technicalAssessmentRequired: true }),

  // E-commerce
  i("shopify", "Shopify", "E-commerce", "Orders and stock synced with Shopify.", "technical-assessment-required", { technicalAssessmentRequired: true, thirdPartyCostNote: "Shopify subscription billed by Shopify." }),
  i("shopee", "Shopee", "E-commerce", "Order retrieval from Shopee.", "technical-assessment-required", { technicalAssessmentRequired: true, risk: "Marketplace API access and rate limits change; assessment required." }),
  i("lazada", "Lazada", "E-commerce", "Order retrieval from Lazada.", "technical-assessment-required", { technicalAssessmentRequired: true, risk: "Marketplace API access and rate limits change; assessment required." }),
  i("tiktok", "TikTok Shop", "E-commerce", "Order retrieval from TikTok Shop.", "technical-assessment-required", { technicalAssessmentRequired: true }),
  i("woo", "WooCommerce", "E-commerce", "Orders and stock synced with WooCommerce.", "configuration-available", { setupEstimate: r(12000, 30000), technicalAssessmentRequired: true }),

  // Payments — always assessment + gateway ownership; never payment custody.
  i("gcash", "GCash-related gateway", "Payments", "Online payment collection through a licensed gateway supporting GCash.", "technical-assessment-required", { technicalAssessmentRequired: true, authenticationRequirement: "Client's own merchant account with the gateway", thirdPartyCostNote: "Gateway transaction fees are charged by the provider.", risk: "Money movement — requires review; the system never holds funds." }),
  i("maya", "Maya", "Payments", "Payment collection via a Maya merchant account.", "technical-assessment-required", { technicalAssessmentRequired: true, authenticationRequirement: "Client's Maya merchant account", thirdPartyCostNote: "Maya transaction fees apply.", risk: "Money movement — requires review; the system never holds funds." }),
  i("bankpay", "Bank payment gateway", "Payments", "Payments through a bank's online gateway.", "technical-assessment-required", { technicalAssessmentRequired: true, risk: "Bank onboarding and compliance requirements apply." }),
  i("cardpay", "Card payment gateway", "Payments", "Card payments via a licensed gateway.", "technical-assessment-required", { technicalAssessmentRequired: true, risk: "Card-data rules (PCI) apply — handled by the gateway, never stored locally." }),
  i("otherpay", "Other payment provider", "Payments", "Any other licensed payment provider.", "technical-assessment-required", { technicalAssessmentRequired: true }),

  // Business Systems
  i("accounting", "Accounting software", "Business Systems", "Data exchange with an established accounting tool.", "technical-assessment-required", { technicalAssessmentRequired: true, thirdPartyCostNote: "Accounting-software subscription billed by its vendor." }),
  i("pos", "POS", "Business Systems", "Sales data from an existing point-of-sale system.", "technical-assessment-required", { technicalAssessmentRequired: true }),
  i("erp", "ERP", "Business Systems", "Exchange with an existing ERP.", "custom-development-required", { technicalAssessmentRequired: true, deliveryModels: CUSTOM_MODELS }),
  i("legacy", "Existing custom system", "Business Systems", "Connection to a bespoke legacy system.", "custom-development-required", { technicalAssessmentRequired: true, deliveryModels: CUSTOM_MODELS }),
  i("barcode", "Barcode scanner", "Business Systems", "Scanner-based lookup and stock movements.", "configuration-available", { setupEstimate: r(6000, 15000), demoAvailable: false, availability: "Hardware-dependent; verified during deployment." }),
  i("qr", "QR scanner", "Business Systems", "QR-based check-in, tracking, or lookup.", "configuration-available", { setupEstimate: r(5000, 12000) }),
  i("biometric", "Biometric device", "Business Systems", "Attendance from a biometric device.", "technical-assessment-required", { technicalAssessmentRequired: true, risk: "Device compatibility varies widely — assessment mandatory." }),

  // Technical
  i("rest", "REST API", "Technical", "A documented API for other systems to connect to.", "custom-development-required", { deliveryModels: CUSTOM_MODELS, technicalAssessmentRequired: true }),
  i("webhooks", "Webhooks", "Technical", "Event notifications pushed to other systems.", "custom-development-required", { deliveryModels: CUSTOM_MODELS }),
  i("sftp", "SFTP", "Technical", "Scheduled file exchange over SFTP.", "custom-development-required", { deliveryModels: CUSTOM_MODELS }),
  i("csv", "CSV import", "Technical", "Bulk record import from CSV files.", "configuration-available", { setupEstimate: r(4000, 10000) }),
  i("dbmig", "Database migration", "Technical", "Migration from an existing database.", "technical-assessment-required", { technicalAssessmentRequired: true }),
  i("sso", "Single sign-on", "Technical", "Sign-in via the client's identity provider.", "custom-development-required", { deliveryModels: CUSTOM_MODELS, technicalAssessmentRequired: true }),
];

export const INTEGRATION_CATEGORIES: IntegrationCategory[] = [
  "Communication",
  "Productivity",
  "Sales & Marketing",
  "E-commerce",
  "Payments",
  "Business Systems",
  "Technical",
];
