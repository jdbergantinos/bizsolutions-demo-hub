// Core data model for the BizSolutions Demo Hub.
// Catalog data (industries, service offers) is static configuration;
// demo state lives in localStorage only.

export type DemoModuleType =
  | "crm"
  | "booking"
  | "inventory"
  | "ordering"
  | "procurement"
  | "quotation"
  | "projects"
  | "portal"
  | "approvals"
  | "scheduling"
  | "tasks"
  | "documents"
  | "delivery"
  | "maintenance"
  | "membership"
  | "learning"
  | "billing"
  | "dashboard"
  | "production"
  | "universal";

/** The 6 concrete engines the 20 module types render through. */
export type EngineKind =
  | "records"
  | "pipeline"
  | "booking"
  | "inventory"
  | "lineitems"
  | "dashboard";

export type RiskLevel = "low" | "moderate" | "high";
export type DemoStatus = "available" | "basic" | "coming-soon";

export type IndustryCategory =
  | "Commerce & Retail"
  | "Food & Hospitality"
  | "Professional Services"
  | "Community & Education"
  | "Industrial & Logistics"
  | "Field & Home Services"
  | "Health & Wellness"
  | "Technology & Media"
  | "Regulated & Public";

/** Industry-specific wording that demo templates interpolate. */
export interface Vocab {
  client: string;
  clients: string;
  item: string;
  items: string;
  worker: string;
  workers: string;
  job: string;
  jobs: string;
  business: string;
}

export interface ServiceOffer {
  id: string;
  industryId: string;
  name: string;
  description: string;
  problem: string;
  solution: string;
  benefits: string[];
  functions: string[];
  workflowSteps: string[];
  screens: string[];
  demoModule: DemoModuleType;
  scenarioKey: string;
  riskLevel: RiskLevel;
  demoStatus: DemoStatus;
}

export interface Industry {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: IndustryCategory;
  examples: string[];
  /** True when the source material flags this as a good initial market. */
  priority: boolean;
  initialMarketRating?: string;
  cautions?: string[];
  vocab: Vocab;
  services: ServiceOffer[];
}

// ---------- Demo scenario configuration ----------

export type FieldType =
  | "text"
  | "number"
  | "currency"
  | "select"
  | "date"
  | "time"
  | "textarea";

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  required?: boolean;
  placeholder?: string;
}

export interface StatusDef {
  id: string;
  label: string;
  /** Tailwind-friendly tone used for badges/columns. */
  tone: "gray" | "blue" | "amber" | "green" | "red" | "violet";
}

export interface ColumnDef {
  key: string;
  label: string;
}

export interface CatalogItem {
  name: string;
  price: number;
}

export interface DashboardChartPoint {
  label: string;
  value: number;
  value2?: number;
}

export interface DashboardConfig {
  cards: { label: string; value: string; sub?: string }[];
  barTitle: string;
  bar: DashboardChartPoint[];
  lineTitle: string;
  line: DashboardChartPoint[];
  pieTitle: string;
  pie: { label: string; value: number }[];
}

export interface ScenarioConfig {
  key: string;
  engine: EngineKind;
  module: DemoModuleType;
  title: string;
  recordName: string;
  recordNamePlural: string;
  nameField: string;
  fields: FieldDef[];
  columns: ColumnDef[];
  statuses: StatusDef[];
  assigneeLabel: string;
  assigneeOptions: string[];
  /** For the line-items engine: what can be added as a line. */
  catalog?: CatalogItem[];
  catalogLabel?: string;
  /** For the inventory engine. */
  qtyKey?: string;
  reorderKey?: string;
  /** For the booking engine. */
  dateKey?: string;
  timeKey?: string;
  dashboard?: DashboardConfig;
  helpText: string;
  notification: string;
  records: SeedRecord[];
}

export interface LineItem {
  id: string;
  name: string;
  qty: number;
  price: number;
}

export interface NoteEntry {
  id: string;
  text: string;
  at: string;
}

export interface ActivityEntry {
  id: string;
  text: string;
  at: string;
}

export interface SeedRecord {
  values: Record<string, string | number>;
  status: string;
  assignee?: string;
  lineItems?: LineItem[];
}

export interface DemoRecord {
  id: string;
  values: Record<string, string | number>;
  status: string;
  assignee?: string;
  lineItems?: LineItem[];
  notes: NoteEntry[];
  activity: ActivityEntry[];
  createdAt: string;
}

// ---------- Local-only app state ----------

export interface ClientProfile {
  id: string;
  businessName: string;
  contactPerson: string;
  industryId: string;
  businessType: string;
  branches: string;
  employees: string;
  currentSystems: string;
  primaryProblems: string;
  desiredOutcomes: string;
  notes: string;
  /** Data-URL of a temporary logo, stored only on this device. */
  logo?: string;
  accentColor?: string;
  createdAt: string;
}

export interface SelectedSolution {
  id: string;
  serviceId: string;
  industryId: string;
  note: string;
  addedAt: string;
}

export interface RecentDemo {
  serviceId: string;
  industryId: string;
  at: string;
}

export interface GuidedStep {
  title: string;
  detail: string;
  /** Demo module most relevant to this step, for the "open demo" shortcut. */
  module?: DemoModuleType;
}

export interface GuidedScenario {
  id: string;
  name: string;
  description: string;
  steps: GuidedStep[];
}

export interface PresentationState {
  active: boolean;
  profileId?: string;
  businessName: string;
  industryId?: string;
  serviceIds: string[];
  scenarioId?: string;
  branches: string;
  employees: string;
  primaryProblem: string;
  accentColor?: string;
  logo?: string;
  stepIndex: number;
  /** Optional pricing estimate attached to the presentation (client view only). */
  estimateId?: string;
  showPricing?: boolean;
}

export interface FavoritesState {
  industries: string[];
  services: string[];
  scenarios: string[];
}
