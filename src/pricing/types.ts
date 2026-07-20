import type { DemoModuleType } from "../types";

// ---------- Core pricing vocabulary ----------

export type DeliveryModel =
  | "shared-saas"
  | "configured-saas"
  | "custom-built"
  | "white-label"
  | "exclusive-source-transfer";

export type ConfigurationLevel =
  | "standard"
  | "configured"
  | "customized"
  | "advanced"
  | "enterprise";

export type BusinessSizeId =
  | "solo"
  | "micro"
  | "small"
  | "medium"
  | "multi-branch"
  | "franchise"
  | "enterprise-org";

export type PricingStatus =
  | "calculated"
  | "range-only"
  | "manual-review-required"
  | "not-available";

export type EstimateStatus =
  | "draft"
  | "preliminary"
  | "manual-review"
  | "approved-for-proposal";

/** All amounts are Philippine pesos (whole numbers). */
export interface PriceRange {
  minimum: number;
  maximum: number;
}

// ---------- Configuration (seed + admin-editable) ----------

export interface DeliveryModelRule {
  id: DeliveryModel;
  name: string;
  description: string;
  typicalCharges: string[];
  /** Comparison-table attributes. */
  ownership: string;
  reusability: string;
  initialCostTendency: string;
  monthlyCostTendency: string;
  customizationLevel: string;
  recommendedFor: string;
  sourceCodeAvailability: string;
  exclusivity: string;
  maintenanceResponsibility: string;
  /** Calculation inputs. */
  baseSetup: PriceRange;
  baseMonthly: PriceRange;
  moduleSetupFactor: number;
  moduleMonthlyFactor: number;
  /** Monthly maintenance as a % of the one-time subtotal (custom builds). */
  maintenancePctMonthly?: number;
  sourceCodePremiumPct?: number;
  exclusivityPremiumPct?: number;
}

export interface ConfigurationLevelRule {
  id: ConfigurationLevel;
  name: string;
  description: string;
  setupFactor: number;
  monthlyFactor: number;
  defaultContingencyPct: number;
}

export interface BusinessSizeRule {
  id: BusinessSizeId;
  name: string;
  description: string;
  sizeFactor: number;
  includedUsers: number;
  includedBranches: number;
  suggestedConfigurationLevel: ConfigurationLevel;
  suggestedDeliveryModels: DeliveryModel[];
}

export interface ModulePricingRule {
  module: DemoModuleType;
  setupPrice: PriceRange;
  monthlyPrice: PriceRange;
  /** 1 (simple) – 5 (very complex). */
  complexity: number;
  includedFunctions: string[];
  notes: string[];
}

/** Optional per-service override of the module defaults. */
export interface ServicePricingOverride {
  serviceOfferId: string;
  setupPrice?: PriceRange;
  monthlyPrice?: PriceRange;
  complexity?: number;
  manualReviewRequired?: boolean;
  notes?: string[];
}

export type OptionalServiceCategory =
  | "Discovery & Planning"
  | "Branding & User Experience"
  | "Data & Migration"
  | "Training & Deployment"
  | "Integrations"
  | "Reporting & Automation"
  | "Support & Ownership";

export interface OptionalServiceRule {
  id: string;
  name: string;
  category: OptionalServiceCategory;
  description: string;
  oneTimePrice?: PriceRange;
  monthlyPrice?: PriceRange;
  complexity: number;
  dependencies: string[];
  /** Empty array = available for every delivery model. */
  deliveryModels: DeliveryModel[];
  manualReviewRequired: boolean;
  pricingStatus: PricingStatus;
  /** Third-party cost note triggered by selecting this option. */
  thirdPartyNote?: string;
}

export interface SupportPlanRule {
  id: string;
  name: string;
  channel: string;
  coverage: string;
  responseTarget: string;
  includedScope: string;
  monthlyPrice: PriceRange;
  limitations: string;
}

export interface IndustryRiskRule {
  industryId: string;
  riskPct: number;
  manualReview: boolean;
  note: string;
}

export interface UserBranchRules {
  extraUserMonthly: PriceRange;
  extraBranchMonthly: PriceRange;
  extraBranchSetup: PriceRange;
}

export interface InternalCostRules {
  /** Internal cost ≈ ratio × one-time estimate midpoint. */
  internalCostRatio: number;
  developmentShare: number;
  projectManagementShare: number;
  qaShare: number;
  contractorShare: number;
  infrastructureShare: number;
  salesCommissionPct: number;
}

/** The complete editable rule set the engine calculates from. */
export interface PricingRules {
  version: string;
  pricingSource: string;
  deliveryModels: DeliveryModelRule[];
  configurationLevels: ConfigurationLevelRule[];
  businessSizes: BusinessSizeRule[];
  modulePricing: ModulePricingRule[];
  serviceOverrides: ServicePricingOverride[];
  optionalServices: OptionalServiceRule[];
  supportPlans: SupportPlanRule[];
  industryRisk: IndustryRiskRule[];
  defaultIndustryRiskPctWhenCautioned: number;
  userBranchRules: UserBranchRules;
  internalCost: InternalCostRules;
}

export interface PricingSettings {
  currency: "PHP";
  vatEnabled: boolean;
  vatPct: number;
  pricesVatInclusive: boolean;
  estimateValidityDays: number;
  defaultContingencyPct: number;
  targetGrossMarginPct: number;
  minimumGrossMarginPct: number;
  maximumDiscountPct: number;
  defaultSupportPlanId: string;
  defaultDeliveryModel: DeliveryModel;
  defaultConfigurationLevel: ConfigurationLevel;
  internalPin: string;
  priceTableVersion: string;
  lastPriceReviewDate: string;
  thirdPartyDisclaimer: string;
  defaultAssumptions: string[];
  defaultExclusions: string[];
}

// ---------- Estimate input / output ----------

export interface EstimateInput {
  clientProfileId?: string;
  /** Links the estimate to the discovery it was built from (client workspace). */
  discoveryId?: string;
  businessName: string;
  contactPerson: string;
  industryId: string;
  businessExample: string;
  location: string;
  businessSize: BusinessSizeId;
  branches: number;
  employees: string;
  users: number;
  monthlyTransactions: string;
  currentSystems: string;
  primaryProblems: string;
  notes: string;
  deliveryModel: DeliveryModel;
  configurationLevel: ConfigurationLevel;
  selectedServiceOfferIds: string[];
  selectedOptionalServiceIds: string[];
  supportPlanId: string;
  contingencyPct: number;
  discountPct: number;
  manualAdjustment: number;
  manualAdjustmentReason: string;
}

export interface EstimateLine {
  id: string;
  label: string;
  range: PriceRange;
  note?: string;
}

export interface InternalPricingDetails {
  estimatedInternalCost: PriceRange;
  allowances: EstimateLine[];
  salesCommission: PriceRange;
  targetGrossMarginPct: number;
  suggestedSellingPrice: PriceRange;
  minimumAcceptablePrice: number;
  effectiveMarginPct: number;
  warnings: string[];
}

export interface EstimateResult {
  oneTimeLines: EstimateLine[];
  oneTimeSubtotal: PriceRange;
  oneTimeTax: PriceRange | null;
  oneTimeTotal: PriceRange;
  recurringLines: EstimateLine[];
  recurringSubtotal: PriceRange;
  recurringTax: PriceRange | null;
  recurringTotal: PriceRange;
  thirdPartyNotes: string[];
  assumptions: string[];
  exclusions: string[];
  manualReviewReasons: string[];
  internalWarnings: string[];
  internal: InternalPricingDetails;
  pricingStatus: PricingStatus;
}

// ---------- Packages ----------

export interface PackageOption {
  id: string;
  name: string;
  description: string;
  serviceOfferIds: string[];
  optionalServiceIds: string[];
  configurationLevel: ConfigurationLevel;
  supportPlanId: string;
  recommended: boolean;
  /** Optional per-package delivery-model override (Phase B comparison). */
  deliveryModel?: DeliveryModel;
}

// ---------- Stored estimate ----------

export interface PricingEstimate {
  /** Migration-safe schema version for stored estimates. */
  schemaVersion: 1;
  id: string;
  estimateNumber: string;
  createdAt: string;
  updatedAt: string;
  priceTableVersion: string;
  status: EstimateStatus;
  archived: boolean;
  input: EstimateInput;
  /** Snapshot of the computed result at save time. */
  result: EstimateResult;
  packages: PackageOption[];
}
