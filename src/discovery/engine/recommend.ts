import { getIndustry } from "../../data/catalog";
import type { ServiceOffer } from "../../types";
import type { BusinessSizeRule } from "../../pricing/types";
import { BUSINESS_SIZES } from "../../pricing/config/businessSizeRules";
import type {
  DiscoveryRecord,
  Recommendation,
  RecommendationSet,
  RecommendationTier,
} from "../types";
import { getProblem, PROBLEM_CATALOG } from "../config/problemCatalog";
import { OUTCOME_MODULE_MAP } from "../config/discoveryOptions";

// Transparent, rule-based recommendation engine. Every score is the sum of
// visible reasons; the UI shows why each module was suggested. This is an
// automated suggestion, never a guarantee of business results.

const SEVERITY_WEIGHT = { minor: 1, moderate: 2, major: 3, critical: 4 } as const;
const PRIORITY_WEIGHT = { low: 1, medium: 1.5, high: 2, urgent: 2.5 } as const;

/** Resolve an industry's service offers that serve a given problem. */
export function getServicesForProblem(problemId: string, industryId: string): ServiceOffer[] {
  const problem = getProblem(problemId);
  const industry = getIndustry(industryId);
  if (!problem || !industry) return [];
  return industry.services.filter(
    (s) =>
      problem.relatedDemoModuleIds.includes(s.demoModule) ||
      problem.relatedServiceOfferIds?.includes(s.id),
  );
}

/** Common problems typically seen in an industry (for the industry entry point). */
export function commonProblemsForIndustry(industryId: string) {
  const industry = getIndustry(industryId);
  if (!industry) return [];
  const modules = new Set(industry.services.map((s) => s.demoModule));
  return PROBLEM_CATALOG.filter((p) => p.relatedDemoModuleIds.some((m) => modules.has(m)));
}

export function sizeRuleFor(discovery: DiscoveryRecord): BusinessSizeRule {
  const { branches, users } = discovery.business;
  const employees = Number(discovery.business.employees) || 0;
  if (branches >= 5) return BUSINESS_SIZES.find((s) => s.id === "franchise")!;
  if (branches >= 2) return BUSINESS_SIZES.find((s) => s.id === "multi-branch")!;
  if (employees > 25 || users > 10) return BUSINESS_SIZES.find((s) => s.id === "medium")!;
  if (employees > 5 || users > 3) return BUSINESS_SIZES.find((s) => s.id === "small")!;
  if (employees > 1) return BUSINESS_SIZES.find((s) => s.id === "micro")!;
  return BUSINESS_SIZES.find((s) => s.id === "solo")!;
}

export function generateRecommendations(
  discovery: DiscoveryRecord,
  existingSolutionServiceIds: string[] = [],
): RecommendationSet {
  const industry = getIndustry(discovery.business.industryId);
  if (!industry) {
    return {
      generatedAt: new Date().toISOString(),
      recommendations: [],
      suggestedDeliveryModel: "configured-saas",
      suggestedConfigurationLevel: "configured",
      notes: "Select an industry in the discovery record to generate recommendations.",
    };
  }

  const size = sizeRuleFor(discovery);
  const outcomeModules = new Map<string, string[]>(); // module → outcomes it serves
  for (const outcome of discovery.desiredOutcomes) {
    for (const m of OUTCOME_MODULE_MAP[outcome] ?? []) {
      outcomeModules.set(m, [...(outcomeModules.get(m) ?? []), outcome]);
    }
  }

  const recommendations: Recommendation[] = industry.services.map((service) => {
    let score = 0;
    const reasons: string[] = [];
    const addressesProblems: string[] = [];
    const benefits = new Set<string>();

    for (const sel of discovery.problems) {
      const problem = getProblem(sel.problemId);
      if (!problem) continue; // custom problems don't score automatically
      const matches =
        problem.relatedDemoModuleIds.includes(service.demoModule) ||
        problem.relatedServiceOfferIds?.includes(service.id);
      if (!matches) continue;
      const pts = SEVERITY_WEIGHT[sel.severity] * PRIORITY_WEIGHT[sel.priority];
      score += pts;
      addressesProblems.push(problem.title);
      reasons.push(
        `Addresses "${problem.title}" (${sel.severity}, ${sel.priority} priority${sel.verification === "assumed" ? ", assumed" : ""})`,
      );
      problem.expectedBenefits.forEach((b) => benefits.add(b));
    }

    const servedOutcomes = outcomeModules.get(service.demoModule) ?? [];
    if (servedOutcomes.length > 0) {
      score += servedOutcomes.length * 1.5;
      reasons.push(`Supports desired outcome${servedOutcomes.length > 1 ? "s" : ""}: ${servedOutcomes.join(", ")}`);
    }

    if (existingSolutionServiceIds.includes(service.id)) {
      score += 2;
      reasons.push("Already in the Selected Solutions list for this client.");
    }

    if (discovery.operations.multiBranch && service.demoModule === "dashboard") {
      score += 1.5;
      reasons.push("Multi-branch operation benefits from branch-level dashboards.");
    }
    if (discovery.operations.fieldStaff && service.demoModule === "delivery") {
      score += 1.5;
      reasons.push("Field employees make dispatch tracking valuable.");
    }
    if (discovery.operations.customerPortalExpected && service.demoModule === "portal") {
      score += 2;
      reasons.push("The client expects customers to use a portal.");
    }

    // Tier classification. Risk buckets win over score.
    let tier: RecommendationTier;
    if (service.riskLevel === "high") {
      tier = "not-initially";
      reasons.push("High-risk area — deliberately excluded from an initial phase.");
    } else if (service.riskLevel === "moderate") {
      tier = score > 0 ? "technical-review" : "not-initially";
      if (score > 0) reasons.push("Caution applies — needs a technical review before inclusion.");
    } else if (score >= 6) {
      tier = "recommended";
    } else if (score >= 2.5) {
      tier = "optional";
    } else if (score > 0) {
      tier = "future-phase";
    } else {
      tier = "future-phase";
      reasons.push("No selected problem maps here yet — available for a later phase.");
    }

    return {
      serviceOfferId: service.id,
      tier,
      score: Math.round(score * 10) / 10,
      reasons,
      addressesProblems,
      expectedBenefits: [...benefits],
      dependencies: [],
      caution: industry.cautions?.[0],
      decision: "pending",
    };
  });

  recommendations.sort((a, b) => b.score - a.score);

  return {
    generatedAt: new Date().toISOString(),
    recommendations,
    suggestedDeliveryModel: size.suggestedDeliveryModels[0] ?? "configured-saas",
    suggestedConfigurationLevel: size.suggestedConfigurationLevel,
    notes: `Automated suggestion based on the client's selected problems and business profile (${size.name}). Verify with the client — this is not a guarantee of business results.`,
  };
}

// ---------- Discovery completeness & summary ----------

export function discoveryCompleteness(d: DiscoveryRecord): number {
  const b = d.business;
  const o = d.operations;
  const checks: boolean[] = [
    Boolean(b.businessName.trim()),
    Boolean(b.industryId),
    Boolean(b.businessExample),
    Boolean(b.location.trim()),
    b.branches >= 1,
    Boolean(b.employees),
    b.users >= 1,
    Boolean(b.monthlyTransactions.trim()),
    Boolean(b.yearsOperating.trim()),
    Boolean(b.decisionMaker.trim()),
    Boolean(b.implementationPeriod),
    Boolean(b.budgetRange),
    o.tools.length > 0,
    Boolean(o.manualProcesses.trim()),
    Boolean(o.repeatedProcesses.trim()),
    Boolean(o.errorSpots.trim()),
    Boolean(o.customerConcerns.trim()),
    d.desiredOutcomes.length > 0,
    d.problems.length > 0,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export function buildDiscoverySummary(d: DiscoveryRecord): string {
  const industry = getIndustry(d.business.industryId);
  const lines = [
    `DISCOVERY SUMMARY — ${d.business.businessName || "Unnamed client"}`,
    `Date: ${d.updatedAt.slice(0, 10)} · Status: ${d.status.replace(/-/g, " ")} · Completeness: ${discoveryCompleteness(d)}%`,
    "",
    `Industry: ${industry?.name ?? "—"}${d.business.businessExample ? ` (${d.business.businessExample})` : ""}`,
    `Location: ${d.business.location || "—"} · Branches: ${d.business.branches} · Employees: ${d.business.employees || "—"} · Users: ${d.business.users}`,
    `Decision-maker: ${d.business.decisionMaker || "—"} · Timeline: ${d.business.implementationPeriod || "—"} · Budget: ${d.business.budgetRange || "—"}`,
    "",
    `Current tools: ${d.operations.tools.join(", ") || "—"}${d.operations.toolsOther ? ` (${d.operations.toolsOther})` : ""}`,
    d.operations.manualProcesses && `Manual processes: ${d.operations.manualProcesses}`,
    d.operations.errorSpots && `Error-prone areas: ${d.operations.errorSpots}`,
    d.operations.customerConcerns && `Recurring customer concerns: ${d.operations.customerConcerns}`,
    "",
    `Desired outcomes: ${d.desiredOutcomes.join(", ") || "—"}`,
    "",
    "CONFIRMED PROBLEMS",
    ...d.problems.map((p) => {
      const cat = getProblem(p.problemId);
      return `• ${cat?.title ?? p.customTitle ?? p.problemId} [${p.severity}/${p.priority}${p.verification === "assumed" ? ", assumed" : ""}]${p.note ? ` — ${p.note}` : ""}`;
    }),
    d.assumptions && `\nAssumptions: ${d.assumptions}`,
    d.itemsToVerify && `To verify: ${d.itemsToVerify}`,
    d.unansweredQuestions && `Unanswered questions: ${d.unansweredQuestions}`,
    d.presenterNotes && `Presenter notes: ${d.presenterNotes}`,
  ];
  return lines.filter((l): l is string => Boolean(l)).join("\n");
}

/** Time-savings figures for the workflow comparison (estimates from user inputs). */
export function workflowSavings(currentMinutes: number, currentDelay: number, proposedSteps: number, currentSteps: number) {
  return {
    currentTotalMinutes: currentMinutes + currentDelay,
    stepReduction: Math.max(0, currentSteps - proposedSteps),
    note: "Estimated from the values entered above — not a measured or guaranteed result.",
  };
}
