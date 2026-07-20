import type { DemoModuleType } from "../types";
import type { DeliveryModel, PriceRange } from "../pricing/types";
import type { NextStepId, OpportunityStatus } from "../value/types";

// ---------- Security & scope boundary ----------

export type SecurityGrouping =
  | "Expected production foundation"
  | "Optional"
  | "Requires technical assessment"
  | "Requires third-party service"
  | "Not included in the demo"
  | "Not yet verified";

export interface SecurityControl {
  id: string;
  name: string;
  description: string;
  grouping: SecurityGrouping;
}

// ---------- Integrations ----------

export type IntegrationCategory =
  | "Communication"
  | "Productivity"
  | "Sales & Marketing"
  | "E-commerce"
  | "Payments"
  | "Business Systems"
  | "Technical";

export type IntegrationStatus =
  | "demonstration-only"
  | "configuration-available"
  | "third-party-setup-required"
  | "technical-assessment-required"
  | "custom-development-required"
  | "not-currently-supported";

export interface IntegrationDef {
  id: string;
  name: string;
  description: string;
  category: IntegrationCategory;
  status: IntegrationStatus;
  availability: string;
  setupEstimate?: PriceRange;
  thirdPartyCostNote: string;
  technicalAssessmentRequired: boolean;
  authenticationRequirement: string;
  dataAccessConsideration: string;
  risk: string;
  deliveryModels: DeliveryModel[];
  demoAvailable: boolean;
}

export interface IntegrationAssessment {
  schemaVersion: 1;
  id: string;
  integrationId: string;
  clientName: string;
  existingProvider: string;
  accountOwnership: string;
  apiAvailable: string;
  documentationAvailable: string;
  sandboxAvailable: string;
  requiredData: string;
  dataDirection: string;
  frequency: string;
  expectedVolume: string;
  authenticationType: string;
  errorHandlingExpectation: string;
  securityRequirement: string;
  technicalContact: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// ---------- Notification simulator ----------

export type NotificationChannel = "in-app" | "email" | "sms" | "messenger" | "push";

export interface NotificationEventDef {
  id: string;
  label: string;
  defaultMessage: string;
  suggestedRoles: string[];
}

export interface SimulatedNotification {
  schemaVersion: 1;
  id: string;
  eventId: string;
  channel: NotificationChannel;
  recipientRole: string;
  message: string;
  sentAt: string;
}

// ---------- Approval showcase ----------

export interface ApprovalLevelDef {
  role: string;
  label: string;
}

export interface ApprovalScenarioDef {
  id: string;
  name: string;
  requester: string;
  subject: string;
  amountNote?: string;
  levels: ApprovalLevelDef[];
}

export interface ApprovalShowcaseState {
  schemaVersion: 1;
  id: string; // scenario id
  currentLevel: number;
  decisions: { level: number; decision: "approved" | "rejected"; comment: string; at: string }[];
  status: "pending" | "approved" | "rejected";
  updatedAt: string;
}

// ---------- Dashboard selector ----------

export interface DashboardCardDef {
  id: string;
  label: string;
  sampleValue: string;
  relevantModules: DemoModuleType[];
}

export interface DashboardPreference {
  schemaVersion: 1;
  id: string;
  name: string;
  cardIds: string[];
  roleVisibility: Record<string, string[]>; // cardId -> role ids
  branchVisibility: string;
  customReportsRequired: string[];
  createdAt: string;
  updatedAt: string;
}

// ---------- Industry presentation templates ----------

export interface IndustryTemplate {
  industryId: string;
  name: string;
  commonProblems: string[]; // problem catalog ids
  discoveryQuestions: string[];
  recommendedModules: DemoModuleType[];
  defaultCurrentWorkflow: string[];
  defaultProposedWorkflow: string[];
  demoSequence: DemoModuleType[];
  suggestedDashboards: string[]; // dashboard card ids
  typicalIntegrations: string[]; // integration ids
  suggestedNextStep: NextStepId;
}

// ---------- Demo scenario library ----------

export interface DemoScenarioDef {
  id: string;
  title: string;
  type: string;
  /** Empty array = compatible with every industry. */
  industries: string[];
  modules: DemoModuleType[];
  initialData: string;
  triggerEvent: string;
  roles: string[];
  steps: string[];
  expectedOutcome: string;
  discussionQuestions: string[];
  businessValue: string;
  resetBehavior: string;
}

export interface CustomScenario {
  schemaVersion: 1;
  id: string;
  baseId?: string;
  overrides: Partial<Omit<DemoScenarioDef, "id">>;
  createdAt: string;
  updatedAt: string;
}

// ---------- Objection guide ----------

export interface ObjectionEntry {
  id: string;
  question: string;
  recommendedResponse: string;
  askTheClient: string[];
  verifyTechnically: string;
  overpromiseRisk: string;
  commercialModel: string;
  scopeDisclaimer: string;
}

// ---------- Presentation history ----------

export interface PresentationHistoryRecord {
  schemaVersion: 1;
  id: string;
  clientName: string;
  date: string;
  industryId: string;
  attendees: string;
  presentationId?: string;
  problemsDiscussed: string;
  modulesShown: string;
  scenariosShown: string;
  roleViewsShown: string;
  packagePresented: string;
  pricingEstimateId?: string;
  roiEstimateId?: string;
  questions: string;
  objections: string;
  decisions: string;
  nextStep: string;
  followUpDate: string;
  status: OpportunityStatus;
  outcome: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}
