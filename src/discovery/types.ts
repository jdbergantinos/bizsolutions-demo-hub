import type { DemoModuleType } from "../types";
import type { ConfigurationLevel, DeliveryModel } from "../pricing/types";

// ---------- Discovery questionnaire ----------

export type DiscoveryStatus =
  | "draft"
  | "in-progress"
  | "ready-for-recommendation"
  | "requires-follow-up"
  | "completed";

export interface DiscoveryBusinessInfo {
  businessName: string;
  contactPerson: string;
  industryId: string;
  businessExample: string;
  location: string;
  branches: number;
  employees: string;
  users: number;
  monthlyTransactions: string;
  yearsOperating: string;
  decisionMaker: string;
  stakeholders: string;
  implementationPeriod: string;
  budgetRange: string;
  notes: string;
}

export interface DiscoveryOperations {
  tools: string[];
  toolsOther: string;
  manualProcesses: string;
  repeatedProcesses: string;
  slowReports: string;
  delayedTasks: string;
  hardToFindInfo: string;
  errorSpots: string;
  approvalProcesses: string;
  customerConcerns: string;
  multiBranch: boolean;
  fieldStaff: boolean;
  customerPortalExpected: boolean;
}

export type ProblemSeverity = "minor" | "moderate" | "major" | "critical";
export type ProblemPriority = "low" | "medium" | "high" | "urgent";

export interface SelectedProblem {
  /** Catalog problem id, or `custom:<uid>` for presenter-added problems. */
  problemId: string;
  customTitle?: string;
  customCategory?: string;
  severity: ProblemSeverity;
  priority: ProblemPriority;
  note: string;
  /** "verified" = confirmed by the client; "assumed" = presenter's assumption. */
  verification: "verified" | "assumed";
}

export type RecommendationTier =
  | "recommended"
  | "optional"
  | "future-phase"
  | "technical-review"
  | "not-initially";

export interface Recommendation {
  serviceOfferId: string;
  tier: RecommendationTier;
  score: number;
  /** Why it was recommended — problem titles and profile facts. */
  reasons: string[];
  addressesProblems: string[];
  expectedBenefits: string[];
  dependencies: string[];
  caution?: string;
  /** Presenter decision. */
  decision: "accepted" | "removed" | "later-phase" | "pending";
}

export interface RecommendationSet {
  generatedAt: string;
  recommendations: Recommendation[];
  suggestedDeliveryModel: DeliveryModel;
  suggestedConfigurationLevel: ConfigurationLevel;
  notes: string;
}

export interface DiscoveryRecord {
  schemaVersion: 1;
  id: string;
  createdAt: string;
  updatedAt: string;
  status: DiscoveryStatus;
  clientProfileId?: string;
  business: DiscoveryBusinessInfo;
  operations: DiscoveryOperations;
  desiredOutcomes: string[];
  outcomesOther: string;
  presenterNotes: string;
  unansweredQuestions: string;
  assumptions: string;
  itemsToVerify: string;
  problems: SelectedProblem[];
  recommendationSet?: RecommendationSet;
  workflowId?: string;
}

// ---------- Problem catalog (centralized mapping) ----------

export type ProblemCategory =
  | "Customer & Sales"
  | "Operations"
  | "Inventory & Purchasing"
  | "Scheduling & Staff"
  | "Finance & Collections"
  | "Documents & Compliance";

export interface BusinessProblem {
  id: string;
  category: ProblemCategory;
  title: string;
  description: string;
  /**
   * Problems map to demo-module types; concrete service-offer IDs are
   * resolved per industry at runtime (industries share module types but
   * have industry-specific offer IDs).
   */
  relatedDemoModuleIds: DemoModuleType[];
  /** Optional explicit offers that apply regardless of module resolution. */
  relatedServiceOfferIds?: string[];
  suggestedWorkflowImprovement: string;
  expectedBenefits: string[];
  riskNotes?: string[];
}

// ---------- Workflow comparison ----------

export interface CurrentWorkflowStep {
  id: string;
  title: string;
  description: string;
  responsible: string;
  tool: string;
  estimatedMinutes: number;
  delayMinutes: number;
  commonError: string;
  notes: string;
  flags: {
    bottleneck: boolean;
    approvalPoint: boolean;
    customerInteraction: boolean;
    duplicateEntry: boolean;
    reportingStep: boolean;
  };
}

export interface ProposedWorkflowStep {
  id: string;
  title: string;
  automated: boolean;
  responsibleRole: string;
  relatedModule: DemoModuleType | "";
  expectedResult: string;
  notification: string;
  requiresApproval: boolean;
  notes: string;
}

export interface WorkflowComparison {
  schemaVersion: 1;
  id: string;
  name: string;
  industryId?: string;
  discoveryId?: string;
  createdAt: string;
  updatedAt: string;
  current: CurrentWorkflowStep[];
  proposed: ProposedWorkflowStep[];
}

// ---------- Presentation builder ----------

export type PresentationSectionId =
  | "client-overview"
  | "current-challenges"
  | "business-problems"
  | "current-workflow"
  | "proposed-workflow"
  | "recommended-solution"
  | "interactive-demo"
  | "role-views"
  | "business-value"
  | "package-comparison"
  | "preliminary-pricing"
  | "preliminary-scope"
  | "implementation-process"
  | "questions"
  | "next-steps"
  | "client-acknowledgment";

export interface PresentationSection {
  id: PresentationSectionId;
  enabled: boolean;
}

export interface SalesPresentation {
  schemaVersion: 1;
  id: string;
  title: string;
  businessName: string;
  logo?: string;
  accentColor?: string;
  industryId: string;
  businessExample: string;
  location: string;
  discoveryId?: string;
  workflowId?: string;
  /** Pricing estimate attached for the pricing/package sections. */
  estimateId?: string;
  /** Phase B content links (all optional, all backward compatible). */
  roiId?: string;
  scopeId?: string;
  roadmapId?: string;
  meetingId?: string;
  /** Service offers to feature in the interactive-demo section. */
  demoServiceIds: string[];
  presenterName: string;
  meetingDate: string;
  meetingPurpose: string;
  presenterNotes: string;
  sections: PresentationSection[];
  lastSectionIndex: number;
  createdAt: string;
  updatedAt: string;
}

// ---------- Role-based views ----------

export interface RoleView {
  id: string;
  name: string;
  description: string;
  dashboardCards: string[];
  menuItems: string[];
  visibleRecords: string;
  allowedActions: string[];
  notifications: string[];
  primaryWorkflow: string;
}
