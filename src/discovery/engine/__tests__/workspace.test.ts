import { beforeEach, describe, expect, it } from "vitest";
import type { PricingEstimate } from "../../../pricing/types";
import {
  estimateForDiscovery,
  latestMeetingForDiscovery,
  roadmapForDiscovery,
  roiForDiscovery,
  scopeForDiscovery,
  workflowForDiscovery,
} from "../workspace";
import type { DiscoveryRecord, WorkflowComparison } from "../../types";
import { newDiscovery, upsertWorkflow } from "../../store/discoveryStorage";
import {
  meetingRepo, newMeeting, newRoadmap, newRoiEstimate, roadmapRepo, roiRepo, scopeRepo,
} from "../../../value/store/valueStorage";

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

function seedEstimates(estimates: Partial<PricingEstimate>[]) {
  localStorage.setItem(
    "bizsolutions.pricing.estimates.v1",
    JSON.stringify({
      version: 1,
      estimates: estimates.map((e, i) => ({ schemaVersion: 1, id: e.id ?? `est${i}`, archived: false, result: {}, packages: [], estimateNumber: `EST-${i}`, ...e })),
    }),
  );
}

function discovery(name: string): DiscoveryRecord {
  const d = newDiscovery();
  d.business.businessName = name;
  return d;
}

describe("client-workspace finders", () => {
  let a: DiscoveryRecord;
  let b: DiscoveryRecord;

  beforeEach(() => {
    makeLocalStorage();
    a = discovery("Client A");
    b = discovery("Client B");
  });

  it("resolves the estimate by discovery id, never another client's", () => {
    seedEstimates([
      { id: "estB", input: { discoveryId: b.id, businessName: "Client B" } as PricingEstimate["input"] },
      { id: "estA", input: { discoveryId: a.id, businessName: "Client A" } as PricingEstimate["input"] },
    ]);
    expect(estimateForDiscovery(a)?.id).toBe("estA");
    expect(estimateForDiscovery(b)?.id).toBe("estB");
    // A discovery with no matching estimate gets null, not "the first one".
    expect(estimateForDiscovery(discovery("Client C"))).toBeNull();
    expect(estimateForDiscovery(null)).toBeNull();
  });

  it("falls back to an exact business-name match when there is no id link", () => {
    seedEstimates([{ id: "estA", input: { businessName: "Client A" } as PricingEstimate["input"] }]);
    expect(estimateForDiscovery(a)?.id).toBe("estA");
    expect(estimateForDiscovery(b)).toBeNull();
  });

  it("roi/scope/roadmap finders return only the active client's record", () => {
    roiRepo.upsert(newRoiEstimate({ id: "roiA", discoveryId: a.id }));
    roiRepo.upsert(newRoiEstimate({ id: "roiB", discoveryId: b.id }));
    roadmapRepo.upsert(newRoadmap({ id: "rmB", discoveryId: b.id }));
    scopeRepo.upsert({ schemaVersion: 1, id: "scopeA", name: "A", discoveryId: a.id, included: [], notIncluded: [], clientResponsibilities: [], providerResponsibilities: [], openQuestions: [], notes: "", createdAt: "", updatedAt: "" });

    expect(roiForDiscovery(a)?.id).toBe("roiA");
    expect(roiForDiscovery(b)?.id).toBe("roiB");
    expect(roadmapForDiscovery(a)).toBeNull(); // only B has a roadmap
    expect(roadmapForDiscovery(b)?.id).toBe("rmB");
    expect(scopeForDiscovery(a)?.id).toBe("scopeA");
    expect(scopeForDiscovery(b)).toBeNull();
  });

  it("workflow finder matches the discovery's linked workflow or its discoveryId", () => {
    const wf: WorkflowComparison = { schemaVersion: 1, id: "wfA", name: "A flow", discoveryId: a.id, createdAt: "", updatedAt: "", current: [], proposed: [] };
    upsertWorkflow(wf);
    a.workflowId = "wfA";
    expect(workflowForDiscovery(a)?.id).toBe("wfA");
    expect(workflowForDiscovery(b)).toBeNull();
  });

  it("meeting finder returns the newest meeting for that client only", () => {
    meetingRepo.upsert(newMeeting({ id: "mA1", discoveryId: a.id, updatedAt: "2026-07-01T00:00:00.000Z" }));
    meetingRepo.upsert(newMeeting({ id: "mA2", discoveryId: a.id, updatedAt: "2026-07-20T00:00:00.000Z" }));
    meetingRepo.upsert(newMeeting({ id: "mB1", discoveryId: b.id, updatedAt: "2026-07-25T00:00:00.000Z" }));
    expect(latestMeetingForDiscovery(a)?.id).toBe("mA2"); // newest of A's, not B's later one
    expect(latestMeetingForDiscovery(b)?.id).toBe("mB1");
  });
});
