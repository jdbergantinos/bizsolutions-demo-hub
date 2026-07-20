import type { OptionalServiceRule } from "../types";

// Optional add-on services and integrations. INTERNAL PLACEHOLDER prices.
// deliveryModels: [] means available for every delivery model.

const o = (
  id: string,
  name: string,
  category: OptionalServiceRule["category"],
  description: string,
  rest: Partial<OptionalServiceRule> = {},
): OptionalServiceRule => ({
  id,
  name,
  category,
  description,
  complexity: 2,
  dependencies: [],
  deliveryModels: [],
  manualReviewRequired: false,
  pricingStatus: "calculated",
  ...rest,
});

export const OPTIONAL_SERVICES: OptionalServiceRule[] = [
  // Discovery and Planning
  o("discovery-process", "Business-process discovery", "Discovery & Planning", "Structured walkthrough of the client's current operations.", { oneTimePrice: { minimum: 8000, maximum: 15000 } }),
  o("discovery-workshop", "Requirements workshop", "Discovery & Planning", "Facilitated session to confirm scope and priorities.", { oneTimePrice: { minimum: 6000, maximum: 12000 } }),
  o("discovery-workflow-docs", "Workflow documentation", "Discovery & Planning", "Written documentation of agreed workflows.", { oneTimePrice: { minimum: 5000, maximum: 10000 } }),
  o("discovery-tech-assessment", "Technical assessment", "Discovery & Planning", "Review of existing systems, data, and infrastructure.", { oneTimePrice: { minimum: 8000, maximum: 15000 } }),
  o("discovery-security", "Security and privacy assessment", "Discovery & Planning", "Review of data-privacy and security requirements.", { oneTimePrice: { minimum: 10000, maximum: 20000 }, complexity: 3, manualReviewRequired: true, pricingStatus: "range-only" }),
  o("discovery-migration-assessment", "Data migration assessment", "Discovery & Planning", "Assessment of existing records before migration.", { oneTimePrice: { minimum: 5000, maximum: 10000 } }),

  // Branding and User Experience
  o("brand-client", "Client branding", "Branding & User Experience", "Logo and brand colors applied across the system.", { oneTimePrice: { minimum: 5000, maximum: 10000 }, complexity: 1 }),
  o("brand-colors", "Custom color scheme", "Branding & User Experience", "Custom palette beyond the standard theme.", { oneTimePrice: { minimum: 3000, maximum: 6000 }, complexity: 1 }),
  o("brand-domain", "Custom domain", "Branding & User Experience", "System served on the client's own domain.", { oneTimePrice: { minimum: 3000, maximum: 6000 }, complexity: 1, thirdPartyNote: "Domain registration and renewal fees are billed by the registrar." }),
  o("brand-advanced-ui", "Advanced UI customization", "Branding & User Experience", "Layout and screen changes beyond theming.", { oneTimePrice: { minimum: 15000, maximum: 35000 }, complexity: 4 }),
  o("brand-white-label", "White-label branding", "Branding & User Experience", "Full removal of agency identity for partner operation.", { oneTimePrice: { minimum: 20000, maximum: 40000 }, complexity: 3, deliveryModels: ["white-label", "exclusive-source-transfer"] }),
  o("brand-app-icon", "Mobile-app icon and splash screen", "Branding & User Experience", "Installable-app icon and launch screen using client branding.", { oneTimePrice: { minimum: 3000, maximum: 6000 }, complexity: 1 }),

  // Data and Migration
  o("data-initial-setup", "Initial data setup", "Data & Migration", "Encoding of starting records (items, staff, customers).", { oneTimePrice: { minimum: 5000, maximum: 12000 } }),
  o("data-spreadsheet-import", "Spreadsheet import", "Data & Migration", "Import of existing spreadsheets into the system.", { oneTimePrice: { minimum: 5000, maximum: 12000 } }),
  o("data-cleaning", "Data cleaning", "Data & Migration", "De-duplication and correction of imported records.", { oneTimePrice: { minimum: 6000, maximum: 15000 }, complexity: 3 }),
  o("data-migration", "Data migration", "Data & Migration", "Migration from an existing system.", { oneTimePrice: { minimum: 15000, maximum: 40000 }, complexity: 4, dependencies: ["discovery-migration-assessment"], pricingStatus: "range-only" }),
  o("data-historical-import", "Historical record import", "Data & Migration", "Import of past transactions or records.", { oneTimePrice: { minimum: 8000, maximum: 20000 }, complexity: 3 }),
  o("data-document-import", "Document import", "Data & Migration", "Bulk upload and tagging of existing files.", { oneTimePrice: { minimum: 5000, maximum: 12000 } }),

  // Training and Deployment
  o("train-admin-online", "Online administrator training", "Training & Deployment", "Remote training for system administrators.", { oneTimePrice: { minimum: 3000, maximum: 6000 }, complexity: 1 }),
  o("train-staff-online", "Online staff training", "Training & Deployment", "Remote training sessions for daily users.", { oneTimePrice: { minimum: 4000, maximum: 8000 }, complexity: 1 }),
  o("train-onsite", "On-site training", "Training & Deployment", "In-person training at the client's location.", { oneTimePrice: { minimum: 8000, maximum: 20000 }, complexity: 2, thirdPartyNote: "Travel and accommodation outside the base area are billed at cost." }),
  o("train-materials", "Training materials", "Training & Deployment", "Written quick-start guides for the client's team.", { oneTimePrice: { minimum: 3000, maximum: 7000 }, complexity: 1 }),
  o("deploy-assist", "Deployment assistance", "Training & Deployment", "Assisted rollout to devices and branches.", { oneTimePrice: { minimum: 5000, maximum: 12000 } }),
  o("deploy-golive", "Go-live support", "Training & Deployment", "Dedicated support during the first days of use.", { oneTimePrice: { minimum: 5000, maximum: 12000 } }),

  // Integrations
  o("int-website-forms", "Website inquiry forms", "Integrations", "Inquiries from the client's website flow into the system.", { oneTimePrice: { minimum: 5000, maximum: 10000 } }),
  o("int-facebook-leads", "Facebook lead forms", "Integrations", "Facebook lead-form submissions captured automatically.", { oneTimePrice: { minimum: 6000, maximum: 12000 } }),
  o("int-email", "Email", "Integrations", "System notifications delivered by email.", { oneTimePrice: { minimum: 4000, maximum: 8000 }, monthlyPrice: { minimum: 300, maximum: 800 }, thirdPartyNote: "Email-service fees beyond the included allowance are billed by the provider." }),
  o("int-sms", "SMS", "Integrations", "SMS notifications and reminders.", { oneTimePrice: { minimum: 5000, maximum: 10000 }, monthlyPrice: { minimum: 300, maximum: 800 }, thirdPartyNote: "SMS credits are billed by the SMS provider per message." }),
  o("int-gcal", "Google Calendar", "Integrations", "Bookings synced with Google Calendar.", { oneTimePrice: { minimum: 5000, maximum: 10000 } }),
  o("int-payment", "Payment gateway", "Integrations", "Online payment collection via a licensed gateway.", { oneTimePrice: { minimum: 12000, maximum: 25000 }, complexity: 4, manualReviewRequired: true, pricingStatus: "range-only", thirdPartyNote: "Payment-gateway transaction fees are charged by the gateway provider." }),
  o("int-accounting", "Accounting software", "Integrations", "Data exchange with an established accounting tool.", { oneTimePrice: { minimum: 12000, maximum: 30000 }, complexity: 4, pricingStatus: "range-only", thirdPartyNote: "Accounting-software subscription is billed by its vendor." }),
  o("int-ecommerce", "E-commerce platform", "Integrations", "Orders or stock synced with an e-commerce platform.", { oneTimePrice: { minimum: 12000, maximum: 30000 }, complexity: 4, pricingStatus: "range-only", thirdPartyNote: "E-commerce platform fees are billed by the platform." }),
  o("int-barcode", "Barcode or QR scanner", "Integrations", "Scanner-based lookup and tracking.", { oneTimePrice: { minimum: 6000, maximum: 15000 }, complexity: 3 }),
  o("int-existing-crm", "Existing CRM", "Integrations", "Connection to a CRM the client already uses.", { oneTimePrice: { minimum: 10000, maximum: 25000 }, complexity: 4, pricingStatus: "range-only" }),
  o("int-thirdparty-api", "Third-party API", "Integrations", "Connection to another provider's documented API.", { oneTimePrice: { minimum: 10000, maximum: 30000 }, complexity: 4, pricingStatus: "range-only", thirdPartyNote: "Third-party API usage fees are billed by the API provider." }),
  o("int-custom", "Custom integration", "Integrations", "Integration requiring bespoke engineering.", { oneTimePrice: { minimum: 20000, maximum: 60000 }, complexity: 5, manualReviewRequired: true, pricingStatus: "manual-review-required" }),

  // Reporting and Automation
  o("rep-custom-report", "Custom report", "Reporting & Automation", "A report designed for the client's format.", { oneTimePrice: { minimum: 4000, maximum: 10000 } }),
  o("rep-custom-dashboard", "Custom dashboard", "Reporting & Automation", "Dashboard cards and charts for the client's KPIs.", { oneTimePrice: { minimum: 6000, maximum: 15000 } }),
  o("rep-auto-reminders", "Automated reminders", "Reporting & Automation", "Scheduled reminders for follow-ups and renewals.", { oneTimePrice: { minimum: 4000, maximum: 10000 } }),
  o("rep-approval-workflow", "Approval workflow", "Reporting & Automation", "Additional approval chains beyond the standard flow.", { oneTimePrice: { minimum: 6000, maximum: 15000 }, complexity: 3 }),
  o("rep-scheduled-report", "Scheduled report", "Reporting & Automation", "Reports generated and sent on a schedule.", { oneTimePrice: { minimum: 4000, maximum: 10000 } }),
  o("rep-advanced-analytics", "Advanced analytics", "Reporting & Automation", "Deeper analysis views across branches and periods.", { oneTimePrice: { minimum: 10000, maximum: 25000 }, complexity: 4 }),
  o("rep-notification-workflow", "Additional notification workflow", "Reporting & Automation", "Extra notification rules and templates.", { oneTimePrice: { minimum: 3000, maximum: 8000 } }),

  // Support and Ownership
  o("own-basic-support", "Basic support onboarding", "Support & Ownership", "Setup of the support process and contact channel.", { oneTimePrice: { minimum: 2000, maximum: 4000 }, complexity: 1 }),
  o("own-priority-support", "Priority support onboarding", "Support & Ownership", "Priority handling setup for critical operations.", { oneTimePrice: { minimum: 3000, maximum: 6000 }, complexity: 1 }),
  o("own-maintenance", "Maintenance agreement", "Support & Ownership", "Ongoing updates and preventive maintenance.", { monthlyPrice: { minimum: 3000, maximum: 8000 }, complexity: 2 }),
  o("own-tech-docs", "Technical documentation", "Support & Ownership", "System documentation for the client's technical team.", { oneTimePrice: { minimum: 10000, maximum: 25000 }, complexity: 3 }),
  o("own-source-handover", "Source-code handover", "Support & Ownership", "Source code delivered per the transfer agreement.", { oneTimePrice: { minimum: 30000, maximum: 80000 }, complexity: 4, deliveryModels: ["custom-built", "exclusive-source-transfer"], manualReviewRequired: true, pricingStatus: "manual-review-required" }),
  o("own-exclusivity", "Exclusivity", "Support & Ownership", "Contractual restriction on resale to competitors.", { oneTimePrice: { minimum: 30000, maximum: 100000 }, complexity: 3, deliveryModels: ["custom-built", "exclusive-source-transfer"], manualReviewRequired: true, pricingStatus: "manual-review-required" }),
  o("own-client-infra", "Client infrastructure deployment", "Support & Ownership", "Deployment on infrastructure the client controls.", { oneTimePrice: { minimum: 15000, maximum: 40000 }, complexity: 4, deliveryModels: ["custom-built", "exclusive-source-transfer"], manualReviewRequired: true, pricingStatus: "range-only", thirdPartyNote: "Client-side hosting and infrastructure costs are paid by the client." }),
];
