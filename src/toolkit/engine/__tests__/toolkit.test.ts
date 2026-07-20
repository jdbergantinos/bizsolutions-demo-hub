import { beforeEach, describe, expect, it } from "vitest";
import { exportBackup, importBackup, validateBackup } from "../backup";
import { INDUSTRY_TEMPLATES } from "../../config/industryTemplates";
import { SCENARIO_LIBRARY } from "../../config/scenarioLibrary";
import { INTEGRATION_CATALOG } from "../../config/integrationCatalog";
import { OBJECTION_GUIDE } from "../../config/objectionGuide";
import { getProblem } from "../../../discovery/config/problemCatalog";
import { DASHBOARD_CARDS } from "../../config/dashboardCards";

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
  // Object.keys(localStorage) must reflect stored keys for backup export.
  return store;
}

// Object.keys on our stub won't list Map entries; patch a proxy-like helper.
function makeEnumerableLocalStorage() {
  const backing: Record<string, string> = {};
  globalThis.localStorage = new Proxy(
    {
      getItem: (k: string) => (k in backing ? backing[k] : null),
      setItem: (k: string, v: string) => {
        backing[k] = String(v);
      },
      removeItem: (k: string) => {
        delete backing[k];
      },
      clear: () => {
        Object.keys(backing).forEach((k) => delete backing[k]);
      },
      key: (i: number) => Object.keys(backing)[i] ?? null,
      get length() {
        return Object.keys(backing).length;
      },
    },
    {
      ownKeys: (t) => [...Reflect.ownKeys(t), ...Object.keys(backing)],
      getOwnPropertyDescriptor: (t, p) =>
        typeof p === "string" && p in backing
          ? { enumerable: true, configurable: true, value: backing[p] }
          : Reflect.getOwnPropertyDescriptor(t, p),
      get: (t, p) => (typeof p === "string" && p in backing ? backing[p] : Reflect.get(t, p)),
    },
  ) as unknown as Storage;
}

describe("configuration integrity", () => {
  it("templates reference valid problems, cards, and integrations", () => {
    expect(INDUSTRY_TEMPLATES.length).toBeGreaterThanOrEqual(12);
    for (const t of INDUSTRY_TEMPLATES) {
      for (const pid of t.commonProblems) expect(getProblem(pid), `${t.industryId}:${pid}`).toBeDefined();
      for (const cid of t.suggestedDashboards) expect(DASHBOARD_CARDS.some((c) => c.id === cid), `${t.industryId}:${cid}`).toBe(true);
      for (const iid of t.typicalIntegrations) expect(INTEGRATION_CATALOG.some((x) => x.id === iid), `${t.industryId}:${iid}`).toBe(true);
      expect(t.discoveryQuestions.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("scenario library entries are complete", () => {
    expect(SCENARIO_LIBRARY.length).toBeGreaterThanOrEqual(15);
    for (const s of SCENARIO_LIBRARY) {
      expect(s.steps.length, s.id).toBeGreaterThanOrEqual(3);
      expect(s.discussionQuestions.length, s.id).toBeGreaterThanOrEqual(1);
      expect(s.expectedOutcome, s.id).toBeTruthy();
      expect(s.resetBehavior, s.id).toBeTruthy();
    }
  });

  it("integration catalog entries carry honest metadata", () => {
    expect(INTEGRATION_CATALOG.length).toBeGreaterThanOrEqual(35);
    for (const x of INTEGRATION_CATALOG) {
      expect(x.thirdPartyCostNote, x.id).toBeTruthy();
      expect(x.risk, x.id).toBeTruthy();
      expect(x.deliveryModels.length, x.id).toBeGreaterThan(0);
    }
    // Payment integrations must all require technical assessment.
    for (const x of INTEGRATION_CATALOG.filter((i) => i.category === "Payments")) {
      expect(x.technicalAssessmentRequired, x.id).toBe(true);
    }
  });

  it("objection guide entries include overpromise risk and client questions", () => {
    expect(OBJECTION_GUIDE.length).toBeGreaterThanOrEqual(16);
    for (const o of OBJECTION_GUIDE) {
      expect(o.overpromiseRisk, o.id).toBeTruthy();
      expect(o.askTheClient.length, o.id).toBeGreaterThanOrEqual(1);
    }
  });
});

describe("template application", () => {
  beforeEach(makeLocalStorage);

  it("creates a new presentation without touching existing ones", async () => {
    const { applyIndustryTemplate } = await import("../applyTemplate");
    const { loadPresentations, newPresentation, upsertPresentation } = await import("../../../discovery/store/discoveryStorage");
    const custom = newPresentation({ title: "My custom deck", businessName: "Keep Me Corp" });
    upsertPresentation(custom);
    const created = applyIndustryTemplate(INDUSTRY_TEMPLATES[0]);
    const all = loadPresentations();
    expect(all).toHaveLength(2);
    const kept = all.find((p) => p.id === custom.id);
    expect(kept?.title).toBe("My custom deck");
    expect(kept?.businessName).toBe("Keep Me Corp");
    expect(created.industryId).toBe("retail");
    expect(created.workflowId).toBeTruthy();
    expect(created.demoServiceIds.length).toBeGreaterThan(0);
  });
});

describe("toolkit storage", () => {
  beforeEach(makeLocalStorage);

  it("records simulated notifications and history with pipeline data", async () => {
    const { notificationRepo, historyRepo, newHistoryRecord, assessmentRepo, newAssessment } = await import("../../store/toolkitStorage");
    notificationRepo.upsert({ schemaVersion: 1, id: "n1", eventId: "low-stock", channel: "sms", recipientRole: "Manager", message: "test", sentAt: new Date().toISOString() });
    expect(notificationRepo.loadAll()).toHaveLength(1);
    historyRepo.upsert(newHistoryRecord({ clientName: "Pipeline Co", status: "qualified" }));
    expect(historyRepo.loadAll()[0].clientName).toBe("Pipeline Co");
    const a = newAssessment("gcash");
    assessmentRepo.upsert({ ...a, existingProvider: "Gateway X" });
    expect(assessmentRepo.loadAll()[0].existingProvider).toBe("Gateway X");
  });
});

describe("backup and restore", () => {
  beforeEach(makeEnumerableLocalStorage);

  it("exports app keys, rejects invalid backups, and supports merge vs replace", () => {
    localStorage.setItem("bizsolutions.favorites", JSON.stringify({ industries: ["retail"], services: [], scenarios: [] }));
    localStorage.setItem("bizsolutions.toolkit.history.v1", JSON.stringify({ version: 1, items: [{ schemaVersion: 1, id: "h1" }] }));
    localStorage.setItem("unrelated.key", "ignore-me");

    const json = exportBackup();
    const { errors, backup, preview } = validateBackup(json);
    expect(errors).toEqual([]);
    expect(preview!.keyCount).toBe(2);
    expect(preview!.keys.some((k) => k.key === "unrelated.key")).toBe(false);

    // Invalid inputs are rejected with readable errors, never a crash.
    expect(validateBackup("not json").errors.length).toBeGreaterThan(0);
    expect(validateBackup("{}").errors.length).toBeGreaterThan(0);
    expect(validateBackup(JSON.stringify({ backupVersion: 1, app: "other-app", keys: {} })).errors.join(" ")).toMatch(/not a BizSolutions/);
    expect(validateBackup(JSON.stringify({ backupVersion: 1, app: "bizsolutions-demo-hub", keys: { "evil.key": 1 } })).errors.join(" ")).toMatch(/outside the app's namespace/);

    // Merge keeps keys not present in the backup.
    localStorage.setItem("bizsolutions.extra", JSON.stringify({ keep: true }));
    localStorage.setItem("bizsolutions.favorites", JSON.stringify({ industries: [], services: [], scenarios: [] }));
    const merged = importBackup(backup!, "merge");
    expect(merged).toBe(2);
    expect(JSON.parse(localStorage.getItem("bizsolutions.favorites")!).industries).toEqual(["retail"]);
    expect(localStorage.getItem("bizsolutions.extra")).not.toBeNull();

    // Replace clears app keys first.
    importBackup(backup!, "replace");
    expect(localStorage.getItem("bizsolutions.extra")).toBeNull();
    expect(localStorage.getItem("bizsolutions.toolkit.history.v1")).not.toBeNull();
    expect(localStorage.getItem("unrelated.key")).toBe("ignore-me");
  });
});
