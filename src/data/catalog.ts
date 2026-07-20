import { INDUSTRY_SEEDS } from "./industries/seeds";
import { MODULE_TEMPLATES, interpolate } from "./serviceTemplates";
import type { DemoModuleType, EngineKind, Industry, ServiceOffer, Vocab } from "../types";

export const DEFAULT_VOCAB: Vocab = {
  client: "customer",
  clients: "customers",
  item: "item",
  items: "items",
  worker: "staff member",
  workers: "staff",
  job: "job",
  jobs: "jobs",
  business: "business",
};

/** Which concrete engine renders each of the 20 module types. */
export const MODULE_ENGINE: Record<DemoModuleType, EngineKind> = {
  crm: "pipeline",
  booking: "booking",
  inventory: "inventory",
  ordering: "lineitems",
  procurement: "lineitems",
  quotation: "lineitems",
  projects: "records",
  portal: "records",
  approvals: "records",
  scheduling: "booking",
  tasks: "records",
  documents: "records",
  delivery: "records",
  maintenance: "records",
  membership: "records",
  learning: "records",
  billing: "records",
  dashboard: "dashboard",
  production: "records",
  universal: "records",
};

const slugify = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

export const INDUSTRIES: Industry[] = INDUSTRY_SEEDS.map((seed) => {
  const vocab: Vocab = { ...DEFAULT_VOCAB, ...seed.vocab };
  const services: ServiceOffer[] = seed.services.map((svc) => {
    const t = MODULE_TEMPLATES[svc.module];
    const i = (text: string) => cap(interpolate(text, vocab, seed.name));
    return {
      id: `${seed.id}--${slugify(svc.name)}`,
      industryId: seed.id,
      name: svc.name,
      description: i(t.shortDesc),
      problem: i(t.problem),
      solution: i(t.solution),
      benefits: t.benefits.map(i),
      functions: t.functions.map(i),
      workflowSteps: t.workflow.map(i),
      screens: t.screens,
      demoModule: svc.module,
      scenarioKey: svc.scenarioKey ?? `${seed.id}:${svc.module}`,
      riskLevel: svc.risk ?? "low",
      demoStatus: "available",
    };
  });
  return {
    id: seed.id,
    name: seed.name,
    description: seed.description,
    icon: seed.icon,
    category: seed.category,
    examples: seed.examples,
    priority: seed.priority,
    initialMarketRating: seed.initialMarketRating,
    cautions: seed.cautions,
    vocab,
    services,
  };
});

export const ALL_SERVICES: ServiceOffer[] = INDUSTRIES.flatMap((i) => i.services);

export const CATEGORIES = [...new Set(INDUSTRIES.map((i) => i.category))];

export function getIndustry(id: string | undefined): Industry | undefined {
  return INDUSTRIES.find((i) => i.id === id);
}

export function getService(serviceId: string | undefined): ServiceOffer | undefined {
  return ALL_SERVICES.find((s) => s.id === serviceId);
}

/** Industries flagged as sensitive get extra caution notices in the UI. */
export function isSensitive(industry: Industry): boolean {
  return Boolean(industry.cautions && industry.cautions.length > 0);
}
