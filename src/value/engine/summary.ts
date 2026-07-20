import { getIndustry, getService } from "../../data/catalog";
import type { PricingEstimate } from "../../pricing/types";
import { pesoRange } from "../../pricing/engine/money";
import { CLIENT_DISCLAIMER } from "../../pricing/config/pricingSettings";
import type { DiscoveryRecord, WorkflowComparison } from "../../discovery/types";
import { getProblem } from "../../discovery/config/problemCatalog";
import type {
  ImplementationRoadmap,
  MeetingRecord,
  NextStepRecommendation,
  PreliminaryScope,
  RoiResult,
} from "../types";
import { ROI_DISCLAIMER } from "./calculateRoi";
import { SCOPE_DISCLAIMER } from "../config/scopeTemplates";
import { ROADMAP_DISCLAIMER } from "../config/roadmapStages";

export interface SummarySources {
  discovery: DiscoveryRecord | null;
  workflow: WorkflowComparison | null;
  estimate: PricingEstimate | null;
  roiResult: RoiResult | null;
  scope: PreliminaryScope | null;
  roadmap: ImplementationRoadmap | null;
  meeting: MeetingRecord | null;
  nextStep: NextStepRecommendation | null;
}

/**
 * Client discussion summary as plain text. Client view omits presenter-only
 * notes, internal remarks, and rule internals.
 */
export function buildDiscussionSummary(s: SummarySources, clientView: boolean): string {
  const d = s.discovery;
  const industry = getIndustry(d?.business.industryId ?? s.estimate?.input.industryId ?? "");
  const name = d?.business.businessName ?? s.estimate?.input.businessName ?? "Client";
  const L: string[] = [
    `CLIENT DISCUSSION SUMMARY — ${name}`,
    `Prepared ${new Date().toISOString().slice(0, 10)}${clientView ? "" : " · INTERNAL VIEW"}`,
    "",
  ];

  if (d) {
    L.push(
      "BUSINESS SITUATION",
      `Industry: ${industry?.name ?? "—"}${d.business.businessExample ? ` (${d.business.businessExample})` : ""}`,
      `Location: ${d.business.location || "—"} · Branches: ${d.business.branches} · Employees: ${d.business.employees || "—"} · Users: ${d.business.users}`,
      d.operations.tools.length ? `Current tools: ${d.operations.tools.join(", ")}` : "",
      "",
    );
    if (d.problems.length > 0) {
      L.push(
        "CONFIRMED PROBLEMS",
        ...d.problems.map((p) => {
          const cat = getProblem(p.problemId);
          const tag = clientView ? "" : ` [${p.severity}/${p.priority}${p.verification === "assumed" ? ", assumed" : ""}]`;
          return `• ${cat?.title ?? p.customTitle ?? p.problemId}${tag}`;
        }),
        "",
      );
    }
    if (d.desiredOutcomes.length > 0) {
      L.push("DESIRED OUTCOMES", ...d.desiredOutcomes.map((o) => `• ${o}`), "");
    }
    const accepted = d.recommendationSet?.recommendations.filter((r) => r.decision === "accepted") ?? [];
    if (accepted.length > 0) {
      L.push(
        "RECOMMENDED SOLUTION (selected modules)",
        ...accepted.map((r) => `• ${getService(r.serviceOfferId)?.name ?? r.serviceOfferId}`),
        "",
      );
    }
  }

  if (s.workflow) {
    L.push(
      "WORKFLOW: TODAY VS PROPOSED",
      `Current (${s.workflow.current.length} steps): ${s.workflow.current.map((x) => x.title).join(" → ")}`,
      `Proposed (${s.workflow.proposed.length} steps): ${s.workflow.proposed.map((x) => x.title).join(" → ")}`,
      "",
    );
  }

  if (s.roiResult) {
    L.push(
      "BUSINESS VALUE (illustrative)",
      `Estimated monthly value: ${pesoRange(s.roiResult.monthlyValueTotal)}`,
      `Estimated yearly value: ${pesoRange(s.roiResult.yearlyValueTotal)}`,
      s.roiResult.paybackMonths
        ? `Estimated payback: ${s.roiResult.paybackMonths.minimum}–${s.roiResult.paybackMonths.maximum} months`
        : "",
      `Uncertainty: ${s.roiResult.uncertainty}`,
      ROI_DISCLAIMER,
      "",
    );
  }

  if (s.estimate) {
    L.push(
      "PRELIMINARY PRICING",
      `One-time implementation: ${pesoRange(s.estimate.result.oneTimeTotal)}`,
      `Monthly: ${pesoRange(s.estimate.result.recurringTotal, " per month")}`,
      s.estimate.result.manualReviewReasons.length > 0 ? "Manual technical review required — figures are not final." : "",
      "",
    );
    if (s.estimate.packages.length > 0) {
      L.push("PACKAGE OPTIONS", ...s.estimate.packages.map((p) => `• ${p.name}${p.recommended ? " (Recommended)" : ""} — ${p.serviceOfferIds.length} modules`), "");
    }
  }

  if (s.scope) {
    L.push(
      "PRELIMINARY SCOPE",
      "Included:",
      ...s.scope.included.slice(0, 12).map((x) => `• ${x}`),
      "Not included:",
      ...s.scope.notIncluded.slice(0, 8).map((x) => `• ${x}`),
      "Open questions:",
      ...s.scope.openQuestions.slice(0, 8).map((x) => `• ${x}`),
      SCOPE_DISCLAIMER,
      "",
    );
  }

  if (s.roadmap) {
    L.push(
      "IMPLEMENTATION ROADMAP (outline)",
      ...s.roadmap.stages.map((st, i) => `${i + 1}. ${st.title} (${st.durationRange})${st.milestone ? " ★" : ""}`),
      ROADMAP_DISCLAIMER,
      "",
    );
  }

  if (s.nextStep) {
    L.push(
      "RECOMMENDED NEXT STEP",
      `${s.nextStep.overrideStepId ? "(Presenter override) " : ""}${s.nextStep.label}`,
      clientView ? "" : `Reason: ${s.nextStep.reason}`,
      "",
    );
  }

  if (!clientView) {
    if (s.meeting) {
      L.push(
        "MEETING RECORD (internal)",
        `Status: ${s.meeting.status} · Decision-makers present: ${s.meeting.decisionMakersPresent ? "yes" : "no"}`,
        s.meeting.clientConcerns && `Concerns: ${s.meeting.clientConcerns}`,
        s.meeting.budgetDiscussion && `Budget discussion: ${s.meeting.budgetDiscussion}`,
        s.meeting.itemsNotApproved && `Not approved: ${s.meeting.itemsNotApproved}`,
        "",
      );
    }
    if (d?.presenterNotes) L.push(`Presenter notes: ${d.presenterNotes}`, "");
  }

  L.push("DISCLAIMERS", ROI_DISCLAIMER, CLIENT_DISCLAIMER, SCOPE_DISCLAIMER);
  return L.filter((x): x is string => Boolean(x)).join("\n");
}
