import type { PricingEstimate } from "../../pricing/types";
import type { DiscoveryRecord } from "../../discovery/types";
import { discoveryCompleteness } from "../../discovery/engine/recommend";
import { getIndustry } from "../../data/catalog";
import type { MeetingRecord, NextStepId, NextStepRecommendation } from "../types";

// Rules-based next-step recommendation. Rules are evaluated top-to-bottom;
// the first match wins. The presenter can always override manually.
// This tool never sends messages or schedules anything automatically.

export const NEXT_STEPS: Record<NextStepId, { label: string; attendees: string; preparation: string; output: string }> = {
  "discovery-workshop": { label: "Conduct discovery workshop", attendees: "Owner, key process staff, presenter", preparation: "Discovery questionnaire, sample records from the client", output: "Completed discovery record with verified problems" },
  "stakeholder-demo": { label: "Schedule stakeholder demonstration", attendees: "Decision-makers, department heads", preparation: "Client-branded presentation with featured demos", output: "Stakeholder feedback and confirmed interest" },
  "technical-assessment": { label: "Perform technical assessment", attendees: "Technical lead, client IT contact", preparation: "Access details, integration documentation, data samples", output: "Technical assessment notes and revised estimate" },
  "request-documents": { label: "Request sample documents", attendees: "Client admin staff", preparation: "List of needed forms, reports, and records", output: "Sample documents for configuration" },
  "request-workflow-examples": { label: "Request workflow examples", attendees: "Process owners", preparation: "Workflow-comparison template", output: "Documented current workflows" },
  "customized-prototype": { label: "Prepare customized prototype", attendees: "Presenter, technical lead", preparation: "Discovery record, branding assets, priority module list", output: "Client-branded prototype demo" },
  "formal-proposal": { label: "Prepare formal proposal", attendees: "Owner / decision-makers", preparation: "Verified pricing, confirmed scope, roadmap", output: "Formal proposal document" },
  "review-integrations": { label: "Review integrations", attendees: "Technical lead, third-party vendor contacts", preparation: "List of systems, API documentation, account access", output: "Integration feasibility notes" },
  "review-data-migration": { label: "Review data migration", attendees: "Technical lead, client data owner", preparation: "Data samples, record counts, current system access", output: "Migration assessment" },
  "review-security": { label: "Review security and privacy requirements", attendees: "Technical lead, client compliance contact", preparation: "Data-privacy requirements, regulatory obligations", output: "Security & privacy requirements note" },
  "decision-meeting": { label: "Schedule decision meeting", attendees: "All decision-makers", preparation: "Summary, package comparison, preliminary pricing", output: "Go / no-go decision" },
  "on-hold": { label: "Put opportunity on hold", attendees: "—", preparation: "Agree a re-contact date", output: "Follow-up reminder note" },
  "not-qualified": { label: "Mark not qualified", attendees: "—", preparation: "Record the reason for future reference", output: "Closed opportunity record" },
};

export function recommendNextStep(
  discovery: DiscoveryRecord | null,
  meeting: MeetingRecord | null,
  estimate: PricingEstimate | null,
): NextStepRecommendation {
  const make = (stepId: NextStepId, reason: string, infoNeeded: string): NextStepRecommendation => ({
    stepId,
    label: NEXT_STEPS[stepId].label,
    reason,
    requiredAttendees: NEXT_STEPS[stepId].attendees,
    requiredPreparation: NEXT_STEPS[stepId].preparation,
    informationNeeded: infoNeeded,
    suggestedOutput: NEXT_STEPS[stepId].output,
  });

  // Terminal statuses first.
  if (meeting?.status === "not-qualified" || meeting?.status === "lost") {
    return make("not-qualified", "The opportunity status is marked as not qualified or lost.", "Reason for disqualification, for future reference.");
  }
  if (meeting?.status === "on-hold") {
    return make("on-hold", "The opportunity is on hold per the meeting record.", "An agreed date to reconnect.");
  }

  // Security-sensitive industries need the privacy conversation early.
  const industry = getIndustry(discovery?.business.industryId ?? estimate?.input.industryId ?? "");
  const sensitive = ["lending", "government", "healthcare", "law", "insurance", "cooperative"].includes(industry?.id ?? "");

  // Technical blockers outrank sales steps.
  if (estimate && estimate.result.manualReviewReasons.length > 0) {
    return make(
      "technical-assessment",
      "The pricing estimate contains items flagged for manual technical review.",
      estimate.result.manualReviewReasons.join("; "),
    );
  }
  if (meeting?.technicalIssues.trim()) {
    return make("technical-assessment", "The meeting recorded technical issues requiring verification.", meeting.technicalIssues);
  }
  if (sensitive && discovery) {
    return make("review-security", `${industry!.name} carries security and privacy obligations that must be reviewed before scoping.`, "Applicable privacy and regulatory requirements.");
  }

  // Discovery quality gates.
  const completeness = discovery ? discoveryCompleteness(discovery) : 0;
  if (!discovery || completeness < 40 || meeting?.status === "discovery-required") {
    return make(
      "discovery-workshop",
      discovery
        ? `The discovery is only ${completeness}% complete — recommendations need firmer ground.`
        : "No discovery record exists for this client yet.",
      "Current tools, processes, volumes, and confirmed problems.",
    );
  }
  if (discovery.problems.length > 0 && !discovery.operations.manualProcesses && !discovery.operations.repeatedProcesses) {
    return make("request-workflow-examples", "Problems are selected but current workflows are undocumented.", "Step-by-step description of the client's current process.");
  }

  // Integration / migration follow-ups from the estimate.
  const optionalIds = estimate?.input.selectedOptionalServiceIds ?? [];
  if (optionalIds.some((id) => id.startsWith("int-"))) {
    return make("review-integrations", "The estimate includes integrations that need feasibility review.", "Third-party system details and account access.");
  }
  if (optionalIds.some((id) => id.startsWith("data-"))) {
    return make("review-data-migration", "The estimate includes data services that need a migration review.", "Data samples, volumes, and current system details.");
  }

  // Sales-stage progression.
  if (meeting?.status === "proposal-requested" || meeting?.status === "negotiation") {
    return make("formal-proposal", "The client has requested a proposal (per the meeting record).", "Verified pricing and confirmed scope.");
  }
  if (meeting && !meeting.decisionMakersPresent) {
    return make("decision-meeting", "Decision-makers were not present at the last meeting.", "Availability of every decision-maker.");
  }
  if (meeting?.status === "demo-completed") {
    return make("formal-proposal", "The demonstration is complete and no blockers were recorded.", "Final module list and commercial preferences.");
  }
  if (meeting?.status === "qualified" || meeting?.status === "new-lead") {
    return make("stakeholder-demo", "The opportunity is qualified but stakeholders have not seen a demonstration.", "Stakeholder list and availability.");
  }

  return make("customized-prototype", "Discovery is solid — a client-branded prototype is the strongest next persuader.", "Branding assets and priority workflows.");
}
