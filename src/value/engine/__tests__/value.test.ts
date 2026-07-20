import { beforeEach, describe, expect, it } from "vitest";
import type { PricingEstimate } from "../../../pricing/types";
import { DEFAULT_PRICING_SETTINGS, SEED_PRICING_RULES } from "../../../pricing/config/pricingSettings";
import { calculateEstimate } from "../../../pricing/engine/calculateEstimate";
import { createPackageOptions } from "../../../pricing/engine/createPackageOptions";
import type { DiscoveryRecord } from "../../../discovery/types";
import { calculateRoi, emptyRoiInputs } from "../calculateRoi";
import { recommendNextStep } from "../nextStep";
import { defaultRoadmapStages } from "../../config/roadmapStages";
import { FEATURE_VALUE } from "../../config/featureValue";
import { normalizeSections, defaultSections } from "../../../discovery/config/sections";
import type { MeetingRecord } from "../../types";

function makeLocalStorage() {
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() {
      return store.size;
    },
  } as Storage;
}

function makeDiscovery(overrides: Partial<DiscoveryRecord> = {}): DiscoveryRecord {
  return {
    schemaVersion: 1,
    id: "d1",
    createdAt: "2026-07-20T00:00:00.000Z",
    updatedAt: "2026-07-20T00:00:00.000Z",
    status: "in-progress",
    business: {
      businessName: "Test Retail (Sample)", contactPerson: "Ana", industryId: "retail",
      businessExample: "Grocery stores", location: "Olongapo", branches: 2, employees: "12",
      users: 6, monthlyTransactions: "800", yearsOperating: "5", decisionMaker: "Owner",
      stakeholders: "", implementationPeriod: "Within 3 months", budgetRange: "₱150,000 – ₱300,000", notes: "",
    },
    operations: {
      tools: ["Excel"], toolsOther: "", manualProcesses: "Stock counts", repeatedProcesses: "Reorders",
      slowReports: "", delayedTasks: "", hardToFindInfo: "", errorSpots: "Counts",
      approvalProcesses: "", customerConcerns: "Stock-outs", multiBranch: true, fieldStaff: false,
      customerPortalExpected: false,
    },
    desiredOutcomes: ["Better inventory accuracy"],
    outcomesOther: "",
    presenterNotes: "", unansweredQuestions: "", assumptions: "", itemsToVerify: "",
    problems: [{ problemId: "stock-inaccurate", severity: "major", priority: "high", note: "", verification: "verified" }],
    ...overrides,
  };
}

function makeEstimate(): PricingEstimate {
  const input = {
    businessName: "Test Retail (Sample)", contactPerson: "", industryId: "retail", businessExample: "",
    location: "", businessSize: "small" as const, branches: 1, employees: "10", users: 5,
    monthlyTransactions: "", currentSystems: "", primaryProblems: "", notes: "",
    deliveryModel: "configured-saas" as const, configurationLevel: "configured" as const,
    selectedServiceOfferIds: ["retail--inventory-and-stock-monitoring-system"],
    selectedOptionalServiceIds: [], supportPlanId: "basic", contingencyPct: 10, discountPct: 0,
    manualAdjustment: 0, manualAdjustmentReason: "",
  };
  const result = calculateEstimate(input, SEED_PRICING_RULES, DEFAULT_PRICING_SETTINGS);
  return {
    schemaVersion: 1, id: "e1", estimateNumber: "EST-2026-0001",
    createdAt: "2026-07-20T00:00:00.000Z", updatedAt: "2026-07-20T00:00:00.000Z",
    priceTableVersion: "seed-1.0.0", status: "preliminary", archived: false,
    input, result, packages: createPackageOptions(input, SEED_PRICING_RULES),
  };
}

describe("ROI calculator", () => {
  it("computes ranged time savings from manual-work inputs", () => {
    const inputs = { ...emptyRoiInputs(), manualWorkEmployees: 4, manualHoursPerEmployeeWeek: 10, employeeMonthlyCost: 17300, improvementPct: 40 };
    const r = calculateRoi(inputs, null);
    // 4 × 10 × 4.33 = 173.2 hours/month; 20–40% saved → ~35–69 hours.
    expect(r.adminHoursSavedPerMonth.minimum).toBeGreaterThan(30);
    expect(r.adminHoursSavedPerMonth.maximum).toBeGreaterThan(r.adminHoursSavedPerMonth.minimum);
    // Hourly ≈ ₱100 → value ≈ ₱3,500–₱6,900/month.
    expect(r.monthlyValueTotal.minimum).toBeGreaterThan(2000);
    expect(r.monthlyValueTotal.maximum).toBeLessThan(10000);
    expect(r.yearlyValueTotal.minimum).toBe(r.monthlyValueTotal.minimum * 12);
  });

  it("separates revenue, cost, and risk categories and keeps collections out of monthly totals", () => {
    const inputs = {
      ...emptyRoiInputs(), missedAppointmentsPerMonth: 10, valuePerAppointment: 1000,
      inventoryLossPerMonth: 5000, delayedCollections: 100000, improvementPct: 30,
    };
    const r = calculateRoi(inputs, null);
    expect(r.revenueOpportunity.some((l) => l.id === "appointments")).toBe(true);
    expect(r.costSavings.some((l) => l.id === "inventory-loss")).toBe(true);
    expect(r.riskReduction.some((l) => l.id === "collections")).toBe(true);
    // Collections (30–60% of 100k) must NOT inflate the recurring monthly total.
    expect(r.monthlyValueTotal.maximum).toBeLessThan(40000);
  });

  it("computes payback and return only when an estimate is linked", () => {
    const inputs = { ...emptyRoiInputs(), manualWorkEmployees: 10, manualHoursPerEmployeeWeek: 15, employeeMonthlyCost: 20000, improvementPct: 40 };
    const without = calculateRoi(inputs, null);
    expect(without.paybackMonths).toBeUndefined();
    const withEst = calculateRoi(inputs, makeEstimate());
    expect(withEst.paybackMonths).toBeDefined();
    expect(withEst.paybackMonths!.minimum).toBeGreaterThanOrEqual(1);
    expect(withEst.paybackMonths!.maximum).toBeGreaterThanOrEqual(withEst.paybackMonths!.minimum);
    expect(withEst.firstYearReturnPct).toBeDefined();
  });

  it("flags uncertainty from sparse inputs and aggressive assumptions", () => {
    expect(calculateRoi(emptyRoiInputs(), null).uncertainty).toBe("high");
    const aggressive = { ...emptyRoiInputs(), manualWorkEmployees: 5, manualHoursPerEmployeeWeek: 10, employeeMonthlyCost: 15000, reportHoursPerWeek: 5, missedAppointmentsPerMonth: 5, lostLeadsPerMonth: 5, improvementPct: 80 };
    expect(calculateRoi(aggressive, null).uncertainty).toBe("medium");
  });
});

describe("scope builder", () => {
  beforeEach(makeLocalStorage);

  it("includes selected modules and lists unselected options as exclusions", async () => {
    const { buildScope } = await import("../buildScope");
    const scope = buildScope(makeDiscovery(), makeEstimate());
    expect(scope.included.join(" ")).toMatch(/Inventory and stock-monitoring system/);
    expect(scope.notIncluded.join(" ")).toMatch(/Data migration.*not selected/);
    expect(scope.notIncluded.join(" ")).toMatch(/Source-code transfer/);
    expect(scope.clientResponsibilities.length).toBeGreaterThanOrEqual(7);
    expect(scope.openQuestions.length).toBeGreaterThan(0);
  });
});

describe("next-step rules", () => {
  const meeting = (patch: Partial<MeetingRecord>): MeetingRecord => ({
    schemaVersion: 1, id: "m1", clientName: "X", meetingDate: "2026-07-20", meetingType: "Demo session",
    attendees: "", decisionMakersPresent: true, presenter: "", topicsDiscussed: "", confirmedProblems: "",
    requestedModules: "", requestedChanges: "", clientConcerns: "", budgetDiscussion: "",
    followUpQuestions: "", technicalIssues: "", decisionsMade: "", itemsNotApproved: "",
    nextAction: "", followUpDate: "", status: "qualified",
    createdAt: "2026-07-20T00:00:00.000Z", updatedAt: "2026-07-20T00:00:00.000Z", ...patch,
  });

  it("terminal statuses and technical issues take priority", () => {
    expect(recommendNextStep(makeDiscovery(), meeting({ status: "not-qualified" }), null).stepId).toBe("not-qualified");
    expect(recommendNextStep(makeDiscovery(), meeting({ status: "on-hold" }), null).stepId).toBe("on-hold");
    expect(recommendNextStep(makeDiscovery(), meeting({ technicalIssues: "API unknown" }), null).stepId).toBe("technical-assessment");
  });

  it("routes incomplete discoveries to a workshop and proposal requests to a proposal", () => {
    expect(recommendNextStep(null, null, null).stepId).toBe("discovery-workshop");
    expect(recommendNextStep(makeDiscovery(), meeting({ status: "proposal-requested" }), null).stepId).toBe("formal-proposal");
    const noDm = recommendNextStep(makeDiscovery(), meeting({ decisionMakersPresent: false }), null);
    expect(noDm.stepId).toBe("decision-meeting");
    expect(noDm.reason).toBeTruthy();
  });
});

describe("configuration completeness", () => {
  it("has a default roadmap of 13 stages with milestones", () => {
    const stages = defaultRoadmapStages();
    expect(stages).toHaveLength(13);
    expect(stages.filter((s) => s.milestone).length).toBeGreaterThanOrEqual(2);
  });

  it("has a feature-value explanation for every module type", () => {
    for (const [module, fv] of Object.entries(FEATURE_VALUE)) {
      expect(fv.whatItIs, module).toBeTruthy();
      expect(fv.customerBenefit, module).toBeTruthy();
      expect(fv.employeeBenefit, module).toBeTruthy();
    }
  });

  it("normalizeSections appends Phase B sections to old presentations", () => {
    const old = defaultSections().filter((s) => !["business-value", "preliminary-scope", "client-acknowledgment"].includes(s.id));
    const normalized = normalizeSections(old);
    expect(normalized.map((s) => s.id)).toContain("business-value");
    expect(normalized.map((s) => s.id)).toContain("preliminary-scope");
    expect(normalized.map((s) => s.id)).toContain("client-acknowledgment");
    expect(normalized.length).toBe(defaultSections().length);
  });
});

describe("value storage", () => {
  beforeEach(makeLocalStorage);

  it("round-trips Phase B records through repositories and the export bundle", async () => {
    const storage = await import("../../store/valueStorage");
    storage.roiRepo.upsert(storage.newRoiEstimate({ name: "ROI test" }));
    storage.meetingRepo.upsert(storage.newMeeting({ clientName: "Ack Corp" }));
    const bundle = storage.exportValueBundle();
    expect(bundle.roi).toHaveLength(1);
    expect(bundle.meetings).toHaveLength(1);
    localStorage.clear();
    storage.importValueBundle(bundle);
    expect(storage.roiRepo.loadAll()[0].name).toBe("ROI test");
    expect(storage.meetingRepo.loadAll()[0].clientName).toBe("Ack Corp");
    // Invalid entries are dropped, not crashed on.
    storage.importValueBundle({ roi: [{ bad: true } as never] });
    expect(storage.roiRepo.loadAll()).toHaveLength(1);
  });
});
