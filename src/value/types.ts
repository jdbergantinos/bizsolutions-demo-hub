import type { PriceRange } from "../pricing/types";

// ---------- ROI / business-value calculator ----------

export interface RoiInputs {
  manualWorkEmployees: number;
  manualHoursPerEmployeeWeek: number;
  employeeMonthlyCost: number;
  reportHoursPerWeek: number;
  missedAppointmentsPerMonth: number;
  valuePerAppointment: number;
  lostLeadsPerMonth: number;
  valuePerConvertedLead: number;
  inventoryLossPerMonth: number;
  delayedCollections: number;
  paperCommsCostPerMonth: number;
  duplicateEntryHoursPerWeek: number;
  averageProcessDelayDays: number;
  /** Client-agreed improvement assumption, as a percentage (e.g. 30). */
  improvementPct: number;
  clientAssumptions: string;
  presenterNotes: string;
}

export interface RoiLine {
  id: string;
  label: string;
  range: PriceRange;
  note?: string;
}

export type UncertaintyLevel = "high" | "medium" | "low";

export interface RoiResult {
  adminHoursSavedPerMonth: PriceRange;
  reportingHoursSavedPerMonth: PriceRange;
  /** Grouped value lines. */
  timeSavings: RoiLine[];
  costSavings: RoiLine[];
  revenueOpportunity: RoiLine[];
  riskReduction: RoiLine[];
  nonFinancialBenefits: string[];
  monthlyValueTotal: PriceRange;
  yearlyValueTotal: PriceRange;
  /** Only computed when a pricing estimate is linked. */
  paybackMonths?: PriceRange;
  firstYearReturnPct?: PriceRange;
  assumptions: string[];
  uncertainty: UncertaintyLevel;
  uncertaintyReason: string;
}

export interface RoiEstimate {
  schemaVersion: 1;
  id: string;
  name: string;
  discoveryId?: string;
  pricingEstimateId?: string;
  inputs: RoiInputs;
  createdAt: string;
  updatedAt: string;
}

// ---------- Preliminary scope ----------

export interface PreliminaryScope {
  schemaVersion: 1;
  id: string;
  name: string;
  discoveryId?: string;
  pricingEstimateId?: string;
  /** Editable line lists (one item per line in the editor). */
  included: string[];
  notIncluded: string[];
  clientResponsibilities: string[];
  providerResponsibilities: string[];
  openQuestions: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// ---------- Implementation roadmap ----------

export interface RoadmapStage {
  id: string;
  title: string;
  description: string;
  responsible: string;
  /** e.g. "1–2 weeks" — a range in words, never a promised date. */
  durationRange: string;
  clientDependency: boolean;
  technicalReview: boolean;
  milestone: boolean;
}

export interface ImplementationRoadmap {
  schemaVersion: 1;
  id: string;
  name: string;
  discoveryId?: string;
  stages: RoadmapStage[];
  createdAt: string;
  updatedAt: string;
}

// ---------- Meetings, next steps, acknowledgments ----------

export type OpportunityStatus =
  | "new-lead"
  | "qualified"
  | "discovery-required"
  | "demo-completed"
  | "proposal-requested"
  | "technical-review-required"
  | "negotiation"
  | "on-hold"
  | "won"
  | "lost"
  | "not-qualified";

export interface MeetingRecord {
  schemaVersion: 1;
  id: string;
  discoveryId?: string;
  pricingEstimateId?: string;
  presentationId?: string;
  clientName: string;
  meetingDate: string;
  meetingType: string;
  attendees: string;
  decisionMakersPresent: boolean;
  presenter: string;
  topicsDiscussed: string;
  confirmedProblems: string;
  requestedModules: string;
  requestedChanges: string;
  clientConcerns: string;
  budgetDiscussion: string;
  followUpQuestions: string;
  technicalIssues: string;
  decisionsMade: string;
  itemsNotApproved: string;
  nextAction: string;
  followUpDate: string;
  status: OpportunityStatus;
  createdAt: string;
  updatedAt: string;
}

export type NextStepId =
  | "discovery-workshop"
  | "stakeholder-demo"
  | "technical-assessment"
  | "request-documents"
  | "request-workflow-examples"
  | "customized-prototype"
  | "formal-proposal"
  | "review-integrations"
  | "review-data-migration"
  | "review-security"
  | "decision-meeting"
  | "on-hold"
  | "not-qualified";

export interface NextStepRecommendation {
  stepId: NextStepId;
  label: string;
  reason: string;
  requiredAttendees: string;
  requiredPreparation: string;
  informationNeeded: string;
  suggestedOutput: string;
  /** Presenter's manual override, when they disagree with the rule. */
  overrideStepId?: NextStepId;
  overrideReason?: string;
}

export type AcknowledgmentChoice =
  | "reflects-discussion"
  | "changes-required"
  | "another-demo"
  | "technical-assessment"
  | "formal-proposal"
  | "not-ready";

export interface ClientAcknowledgment {
  schemaVersion: 1;
  id: string;
  discoveryId?: string;
  meetingId?: string;
  choice: AcknowledgmentChoice;
  representativeName: string;
  representativeRole: string;
  date: string;
  comments: string;
  createdAt: string;
}

// ---------- Feature-to-value explanations ----------

export interface FeatureValueExplanation {
  whatItIs: string;
  workflowImprovement: string;
  operationalBenefit: string;
  managementBenefit: string;
  customerBenefit: string;
  employeeBenefit: string;
}
