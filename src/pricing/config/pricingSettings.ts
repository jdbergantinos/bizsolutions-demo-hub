import type { PricingRules, PricingSettings } from "../types";
import { DELIVERY_MODELS } from "./deliveryModels";
import { CONFIGURATION_LEVELS } from "./configurationLevels";
import { BUSINESS_SIZES } from "./businessSizeRules";
import { MODULE_PRICING, SERVICE_OVERRIDES } from "./modulePricing";
import { OPTIONAL_SERVICES } from "./optionalServices";
import { SUPPORT_PLANS } from "./supportPlans";
import { INDUSTRY_RISK } from "./industryRiskRules";

export const PRICE_TABLE_VERSION = "seed-1.0.0";

/**
 * All seed amounts are internal placeholders — NOT researched Philippine
 * market pricing. Settings shows the owner-review warning for this reason.
 */
export const SEED_PRICING_RULES: PricingRules = {
  version: PRICE_TABLE_VERSION,
  pricingSource: "Internal placeholder — owner verification required",
  deliveryModels: DELIVERY_MODELS,
  configurationLevels: CONFIGURATION_LEVELS,
  businessSizes: BUSINESS_SIZES,
  modulePricing: MODULE_PRICING,
  serviceOverrides: SERVICE_OVERRIDES,
  optionalServices: OPTIONAL_SERVICES,
  supportPlans: SUPPORT_PLANS,
  industryRisk: INDUSTRY_RISK,
  defaultIndustryRiskPctWhenCautioned: 8,
  userBranchRules: {
    extraUserMonthly: { minimum: 150, maximum: 250 },
    extraBranchMonthly: { minimum: 800, maximum: 1500 },
    extraBranchSetup: { minimum: 5000, maximum: 10000 },
  },
  internalCost: {
    internalCostRatio: 0.55,
    developmentShare: 0.6,
    projectManagementShare: 0.15,
    qaShare: 0.1,
    contractorShare: 0.1,
    infrastructureShare: 0.05,
    salesCommissionPct: 5,
  },
};

export const DEFAULT_PRICING_SETTINGS: PricingSettings = {
  currency: "PHP",
  vatEnabled: false,
  vatPct: 12,
  pricesVatInclusive: false,
  estimateValidityDays: 30,
  defaultContingencyPct: 10,
  targetGrossMarginPct: 35,
  minimumGrossMarginPct: 20,
  maximumDiscountPct: 15,
  defaultSupportPlanId: "basic",
  defaultDeliveryModel: "configured-saas",
  defaultConfigurationLevel: "configured",
  internalPin: "",
  priceTableVersion: PRICE_TABLE_VERSION,
  lastPriceReviewDate: "",
  thirdPartyDisclaimer:
    "Third-party costs (hosting providers, domain fees, SMS usage, email services, payment-gateway fees, app-store fees, third-party APIs, accounting or e-commerce subscriptions, and other external licenses) are not included unless explicitly stated.",
  defaultAssumptions: [
    "Client provides timely feedback, content, and sample records.",
    "Standard modules are used unless a customization is listed.",
    "Work is performed remotely unless on-site services are listed.",
    "Estimate assumes the stated branches and users; changes affect pricing.",
  ],
  defaultExclusions: [
    "Third-party fees and licenses (listed separately).",
    "Hardware, devices, and internet connectivity.",
    "Content writing, product photography, and data encoding beyond listed services.",
    "Accounting, tax, payroll, loan, or medical functionality.",
  ],
};

export const CLIENT_DISCLAIMER =
  "Preliminary estimate only. This is not a binding quotation or contract. Final pricing is subject to business-process discovery, confirmed requirements, integrations, data migration, security and privacy requirements, third-party fees, taxes, infrastructure requirements, implementation schedule, and a signed scope of work.";
