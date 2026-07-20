import type { DemoModuleType, Industry, ScenarioConfig, ServiceOffer } from "../../types";
import { DEFAULT_VOCAB } from "../catalog";
import { buildDefaultScenario } from "./builders";
import { CUSTOM_SCENARIOS } from "./custom";

// Scenario configs are built on demand (they are pure functions of static
// data), then the demo engines seed them into localStorage-backed state.

export function getScenarioForService(
  service: ServiceOffer,
  industry: Industry,
): ScenarioConfig {
  const custom = CUSTOM_SCENARIOS[service.scenarioKey];
  const config = custom
    ? custom(industry.vocab, industry.name, service.scenarioKey)
    : buildDefaultScenario(service.demoModule, industry.vocab, industry.name, service.scenarioKey);
  // Surface the service's own name so the demo header matches what was clicked.
  return { ...config, title: service.name };
}

/** Neutral-vocabulary sample scenario used by the Demo Modules gallery. */
export function getModuleSampleScenario(module: DemoModuleType): ScenarioConfig {
  return buildDefaultScenario(module, DEFAULT_VOCAB, "General business", `sample:${module}`);
}
