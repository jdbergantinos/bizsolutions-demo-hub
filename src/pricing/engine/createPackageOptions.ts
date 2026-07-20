import { getIndustry } from "../../data/catalog";
import type { EstimateInput, PackageOption, PricingRules } from "../types";
import { calculateModulePrice } from "./calculateEstimate";

// Generates the three client-facing packages from the CURRENT selections and
// pricing rules — never from hard-coded module lists.

const CORE_MODULES = ["crm", "booking", "projects", "ordering", "inventory", "quotation"];
const GROWTH_OPTIONAL_IDS = ["rep-auto-reminders", "rep-custom-dashboard", "brand-client"];
const ADVANCED_EXTRA_OPTIONALS = ["rep-advanced-analytics", "deploy-golive"];

export function createPackageOptions(input: EstimateInput, rules: PricingRules): PackageOption[] {
  const industry = getIndustry(input.industryId);
  const selected = input.selectedServiceOfferIds;

  // Rank the selected services: core problem-solving modules first, then by
  // complexity (simpler modules make better Essential candidates).
  const ranked = [...selected].sort((a, b) => {
    const pa = calculateModulePrice(a, rules);
    const pb = calculateModulePrice(b, rules);
    if (!pa || !pb) return 0;
    const coreA = CORE_MODULES.includes(pa.service.demoModule) ? 0 : 1;
    const coreB = CORE_MODULES.includes(pb.service.demoModule) ? 0 : 1;
    return coreA - coreB || pa.complexity - pb.complexity;
  });

  const essentialServices = ranked.slice(0, Math.max(1, Math.min(3, ranked.length)));
  const growthServices = ranked.slice(0, Math.max(essentialServices.length, Math.min(6, ranked.length)));

  const availableOptional = (ids: string[]) =>
    ids.filter((id) => rules.optionalServices.some((o) => o.id === id));

  const growthOptionals = [
    ...new Set([
      ...input.selectedOptionalServiceIds.filter((id) =>
        rules.optionalServices.find((o) => o.id === id && ["Reporting & Automation", "Branding & User Experience"].includes(o.category)),
      ),
      ...availableOptional(GROWTH_OPTIONAL_IDS),
    ]),
  ].slice(0, 4);

  const advancedOptionals = [
    ...new Set([...input.selectedOptionalServiceIds, ...growthOptionals, ...availableOptional(ADVANCED_EXTRA_OPTIONALS)]),
  ];

  return [
    {
      id: "pkg-essential",
      name: "Essential",
      description: `The minimum recommended modules that address the primary business problem${industry ? ` for ${industry.name.toLowerCase()}` : ""}.`,
      serviceOfferIds: essentialServices,
      optionalServiceIds: [],
      configurationLevel: "standard",
      supportPlanId: "basic",
      recommended: false,
    },
    {
      id: "pkg-growth",
      name: "Growth",
      description: "Essential plus automation, reporting, customer-facing functions, and operational controls.",
      serviceOfferIds: growthServices,
      optionalServiceIds: growthOptionals,
      configurationLevel: "configured",
      supportPlanId: "standard",
      recommended: true,
    },
    {
      id: "pkg-advanced",
      name: "Advanced",
      description: "Growth plus multi-branch functions, integrations, advanced permissions, customized reporting, and priority support.",
      serviceOfferIds: [...ranked],
      optionalServiceIds: advancedOptionals,
      configurationLevel: input.configurationLevel === "standard" ? "customized" : input.configurationLevel,
      supportPlanId: "priority",
      recommended: false,
    },
  ];
}

/** Applies a package's choices onto an estimate input for calculation. */
export function inputForPackage(input: EstimateInput, pkg: PackageOption): EstimateInput {
  return {
    ...input,
    selectedServiceOfferIds: pkg.serviceOfferIds,
    selectedOptionalServiceIds: pkg.optionalServiceIds,
    configurationLevel: pkg.configurationLevel,
    supportPlanId: pkg.supportPlanId,
    deliveryModel: pkg.deliveryModel ?? input.deliveryModel,
  };
}
