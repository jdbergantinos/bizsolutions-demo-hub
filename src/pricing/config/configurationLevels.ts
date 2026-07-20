import type { ConfigurationLevelRule } from "../types";

// Factors are INTERNAL PLACEHOLDERS pending owner review. They scale module
// setup/monthly prices; they are configuration data, not UI constants.

export const CONFIGURATION_LEVELS: ConfigurationLevelRule[] = [
  {
    id: "standard",
    name: "Standard",
    description:
      "Existing module with standard fields, statuses, workflow, and reports.",
    setupFactor: 1.0,
    monthlyFactor: 1.0,
    defaultContingencyPct: 7,
  },
  {
    id: "configured",
    name: "Configured",
    description:
      "Existing module with changes to terminology, forms, statuses, roles, dashboard cards, and notification templates.",
    setupFactor: 1.25,
    monthlyFactor: 1.05,
    defaultContingencyPct: 10,
  },
  {
    id: "customized",
    name: "Customized",
    description:
      "Significant changes or creation of client-specific workflow behavior, reports, permissions, and screens.",
    setupFactor: 1.6,
    monthlyFactor: 1.1,
    defaultContingencyPct: 15,
  },
  {
    id: "advanced",
    name: "Advanced",
    description:
      "Complex integrations, data migration, advanced permissions, automation, high usage, or sensitive information.",
    setupFactor: 2.1,
    monthlyFactor: 1.2,
    defaultContingencyPct: 18,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description:
      "Multiple branches, large transaction volume, formal service-level requirements, advanced security, technical documentation, and complex deployment.",
    setupFactor: 2.8,
    monthlyFactor: 1.35,
    defaultContingencyPct: 20,
  },
];
