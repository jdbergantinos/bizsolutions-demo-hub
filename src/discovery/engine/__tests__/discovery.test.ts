import { beforeEach, describe, expect, it } from "vitest";
import type { DiscoveryRecord } from "../../types";
import {
  commonProblemsForIndustry,
  discoveryCompleteness,
  generateRecommendations,
  getServicesForProblem,
  sizeRuleFor,
} from "../recommend";
import { validateDiscoveryExport } from "../validate";
import { PROBLEM_CATALOG } from "../../config/problemCatalog";
import { getRolesForIndustry } from "../../config/roleConfigs";

function makeDiscovery(overrides: Partial<DiscoveryRecord> = {}): DiscoveryRecord {
  return {
    schemaVersion: 1,
    id: "d1",
    createdAt: "2026-07-20T00:00:00.000Z",
    updatedAt: "2026-07-20T00:00:00.000Z",
    status: "in-progress",
    business: {
      businessName: "Test Retail (Sample)",
      contactPerson: "Ana",
      industryId: "retail",
      businessExample: "Grocery stores",
      location: "Olongapo",
      branches: 2,
      employees: "12",
      users: 6,
      monthlyTransactions: "800",
      yearsOperating: "5",
      decisionMaker: "Owner",
      stakeholders: "",
      implementationPeriod: "Within 3 months",
      budgetRange: "₱150,000 – ₱300,000",
      notes: "",
    },
    operations: {
      tools: ["Excel", "Messenger"],
      toolsOther: "",
      manualProcesses: "Stock counting",
      repeatedProcesses: "Reorders",
      slowReports: "Weekly sales",
      delayedTasks: "",
      hardToFindInfo: "",
      errorSpots: "Stock counts",
      approvalProcesses: "",
      customerConcerns: "Out-of-stock items",
      multiBranch: true,
      fieldStaff: false,
      customerPortalExpected: false,
    },
    desiredOutcomes: ["Better inventory accuracy", "Improved reporting"],
    outcomesOther: "",
    presenterNotes: "",
    unansweredQuestions: "",
    assumptions: "",
    itemsToVerify: "",
    problems: [
      { problemId: "stock-inaccurate", severity: "critical", priority: "urgent", note: "", verification: "verified" },
      { problemId: "lowstock-late", severity: "major", priority: "high", note: "", verification: "verified" },
      { problemId: "reports-take-hours", severity: "moderate", priority: "medium", note: "", verification: "assumed" },
    ],
    ...overrides,
  };
}

describe("problem catalog mapping", () => {
  it("every catalog problem maps to at least one demo module", () => {
    for (const p of PROBLEM_CATALOG) {
      expect(p.relatedDemoModuleIds.length, p.id).toBeGreaterThan(0);
      expect(p.expectedBenefits.length, p.id).toBeGreaterThan(0);
    }
  });

  it("resolves problems to industry-specific service offers", () => {
    const services = getServicesForProblem("stock-inaccurate", "retail");
    expect(services.length).toBeGreaterThan(0);
    expect(services.every((s) => s.industryId === "retail")).toBe(true);
    expect(services.some((s) => s.demoModule === "inventory")).toBe(true);
  });

  it("lists common problems for an industry", () => {
    const problems = commonProblemsForIndustry("retail");
    expect(problems.some((p) => p.id === "stock-inaccurate")).toBe(true);
  });
});

describe("recommendation engine", () => {
  it("recommends inventory offers for severe stock problems and explains why", () => {
    const set = generateRecommendations(makeDiscovery());
    const inv = set.recommendations.find((r) => r.serviceOfferId === "retail--inventory-and-stock-monitoring-system");
    expect(inv).toBeDefined();
    expect(inv!.tier).toBe("recommended");
    expect(inv!.score).toBeGreaterThan(5);
    expect(inv!.reasons.join(" ")).toMatch(/Stock counts are inaccurate/);
    // A module with no matching problem stays out of the recommended tier.
    const loyalty = set.recommendations.find((r) => r.serviceOfferId === "retail--customer-loyalty-program");
    expect(loyalty!.tier).not.toBe("recommended");
  });

  it("suggests a commercial model and configuration level from business size", () => {
    const set = generateRecommendations(makeDiscovery());
    expect(set.suggestedDeliveryModel).toBeTruthy();
    expect(set.suggestedConfigurationLevel).toBeTruthy();
    expect(sizeRuleFor(makeDiscovery()).id).toBe("multi-branch");
  });

  it("routes risky services to review/not-initially tiers", () => {
    const d = makeDiscovery({
      business: { ...makeDiscovery().business, industryId: "lending" },
      problems: [{ problemId: "leads-forgotten", severity: "major", priority: "high", note: "", verification: "verified" }],
    });
    const set = generateRecommendations(d);
    const intake = set.recommendations.find((r) => r.serviceOfferId === "lending--application-intake");
    expect(intake).toBeDefined();
    expect(intake!.tier).toBe("not-initially");
  });
});

describe("discovery completeness", () => {
  it("scores an empty discovery low and a filled one high", () => {
    const empty = makeDiscovery({
      business: { ...makeDiscovery().business, businessName: "", industryId: "", businessExample: "", location: "", employees: "", monthlyTransactions: "", yearsOperating: "", decisionMaker: "", implementationPeriod: "", budgetRange: "" },
      operations: { ...makeDiscovery().operations, tools: [], manualProcesses: "", repeatedProcesses: "", errorSpots: "", customerConcerns: "" },
      desiredOutcomes: [],
      problems: [],
    });
    expect(discoveryCompleteness(empty)).toBeLessThan(20);
    expect(discoveryCompleteness(makeDiscovery())).toBeGreaterThan(80);
  });
});

describe("role configurations", () => {
  it("uses industry-specific role names with defaults as fallback", () => {
    const auto = getRolesForIndustry("automotive");
    expect(auto.map((r) => r.name)).toContain("Mechanic");
    const generic = getRolesForIndustry("waste");
    expect(generic.length).toBeGreaterThan(0);
    expect(generic[0].dashboardCards.length).toBeGreaterThan(0);
  });
});

describe("export validation and storage", () => {
  beforeEach(() => {
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
  });

  it("rejects invalid imports with readable errors", () => {
    expect(validateDiscoveryExport(null).errors.length).toBeGreaterThan(0);
    expect(validateDiscoveryExport({ exportVersion: 2 }).errors.length).toBeGreaterThan(0);
    const bad = { exportVersion: 1, exportedAt: "", discoveries: [{ nonsense: true }], workflows: [], presentations: [] };
    expect(validateDiscoveryExport(bad).errors.join(" ")).toMatch(/discovery record/);
  });

  it("round-trips discovery data through export and import", async () => {
    const storage = await import("../../store/discoveryStorage");
    storage.upsertDiscovery(makeDiscovery());
    const json = storage.exportDiscoveryData();
    const { errors } = validateDiscoveryExport(JSON.parse(json));
    expect(errors).toEqual([]);
    localStorage.clear();
    const result = storage.importDiscoveryData(json);
    expect(result.errors).toEqual([]);
    expect(result.imported!.discoveries).toBe(1);
    expect(storage.loadDiscoveries()[0].business.businessName).toBe("Test Retail (Sample)");
  });
});
