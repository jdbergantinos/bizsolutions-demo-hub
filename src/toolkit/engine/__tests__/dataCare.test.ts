import { beforeEach, describe, expect, it } from "vitest";
import {
  clearDemoPracticeData,
  clearProspectData,
  CURRENT_DATA_VERSION,
  daysSinceLastExport,
  listSnapshots,
  MAX_SNAPSHOTS,
  META_KEYS,
  recordManualExport,
  restoreSnapshot,
  runMigrations,
  takeDailySnapshot,
} from "../dataCare";

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

beforeEach(makeEnumerableLocalStorage);

describe("automatic snapshots", () => {
  it("takes one snapshot per day, rotates to the newest three, and restores", () => {
    localStorage.setItem("bizsolutions.profiles", JSON.stringify([{ id: "p1", businessName: "Real Client" }]));

    expect(takeDailySnapshot(new Date("2026-07-20T08:00:00Z"))).toBe(true);
    // Same day → no second snapshot.
    expect(takeDailySnapshot(new Date("2026-07-20T18:00:00Z"))).toBe(false);
    expect(takeDailySnapshot(new Date("2026-07-21T08:00:00Z"))).toBe(true);
    expect(takeDailySnapshot(new Date("2026-07-22T08:00:00Z"))).toBe(true);
    expect(takeDailySnapshot(new Date("2026-07-23T08:00:00Z"))).toBe(true);
    const snaps = listSnapshots();
    expect(snaps).toHaveLength(MAX_SNAPSHOTS);
    expect(snaps[0].takenAt.slice(0, 10)).toBe("2026-07-23"); // newest first

    // Snapshots live OUTSIDE the app namespace, so a backup never contains them.
    expect(META_KEYS.snapshots.startsWith("bizsolutions.")).toBe(false);
    expect(snaps[0].backup.keys[META_KEYS.snapshots]).toBeUndefined();

    // Damage the data, then restore.
    localStorage.removeItem("bizsolutions.profiles");
    const restored = restoreSnapshot(snaps[0].takenAt);
    expect(restored).toBeGreaterThan(0);
    expect(JSON.parse(localStorage.getItem("bizsolutions.profiles")!)[0].businessName).toBe("Real Client");
  });

  it("skips snapshots when there is nothing to protect", () => {
    expect(takeDailySnapshot()).toBe(false);
    expect(listSnapshots()).toHaveLength(0);
  });
});

describe("export reminder", () => {
  it("tracks days since the last manual export", () => {
    expect(daysSinceLastExport()).toBeNull();
    recordManualExport(new Date("2026-07-13T08:00:00Z"));
    expect(daysSinceLastExport(new Date("2026-07-20T08:00:00Z"))).toBe(7);
  });
});

describe("sample vs prospect clearing", () => {
  function seedBoth() {
    localStorage.setItem("bizsolutions.demo.retail-inventory", JSON.stringify([{ id: "r1" }]));
    localStorage.setItem("bizsolutions.toolkit.notifications.v1", JSON.stringify({ version: 1, items: [] }));
    localStorage.setItem("bizsolutions.toolkit.approvals.v1", JSON.stringify({ version: 1, items: [] }));
    localStorage.setItem("bizsolutions.profiles", JSON.stringify([{ id: "p1" }]));
    localStorage.setItem("bizsolutions.discovery.records.v1", JSON.stringify({ version: 1, items: [] }));
    localStorage.setItem("bizsolutions.pricing.estimates.v1", JSON.stringify({ version: 1, estimates: [] }));
    localStorage.setItem("bizsolutions.pricing.rules.v1", JSON.stringify({ version: "x" }));
    localStorage.setItem("bizsolutions.favorites", JSON.stringify({ industries: [] }));
  }

  it("clearing practice data keeps every prospect record", () => {
    seedBoth();
    const n = clearDemoPracticeData();
    expect(n).toBe(3);
    expect(localStorage.getItem("bizsolutions.demo.retail-inventory")).toBeNull();
    expect(localStorage.getItem("bizsolutions.toolkit.notifications.v1")).toBeNull();
    expect(localStorage.getItem("bizsolutions.profiles")).not.toBeNull();
    expect(localStorage.getItem("bizsolutions.discovery.records.v1")).not.toBeNull();
    expect(localStorage.getItem("bizsolutions.pricing.estimates.v1")).not.toBeNull();
  });

  it("clearing prospect data keeps demos, settings, and pricing rules — and snapshots first", () => {
    seedBoth();
    const n = clearProspectData();
    expect(n).toBe(3); // profiles, discovery records, estimates (of the seeded keys)
    expect(localStorage.getItem("bizsolutions.profiles")).toBeNull();
    expect(localStorage.getItem("bizsolutions.discovery.records.v1")).toBeNull();
    expect(localStorage.getItem("bizsolutions.pricing.estimates.v1")).toBeNull();
    expect(localStorage.getItem("bizsolutions.demo.retail-inventory")).not.toBeNull();
    expect(localStorage.getItem("bizsolutions.pricing.rules.v1")).not.toBeNull();
    expect(localStorage.getItem("bizsolutions.favorites")).not.toBeNull();
    // Safety snapshot captured the pre-clear state, including profiles.
    const snaps = listSnapshots();
    expect(snaps.length).toBeGreaterThan(0);
    expect(snaps[0].backup.keys["bizsolutions.profiles"]).toBeDefined();
  });
});

describe("storage-version migrations", () => {
  it("runs once and stamps the current data version", () => {
    const first = runMigrations();
    expect(first.from).toBe(0);
    expect(first.to).toBe(CURRENT_DATA_VERSION);
    expect(Number(localStorage.getItem(META_KEYS.dataVersion))).toBe(CURRENT_DATA_VERSION);
    const second = runMigrations();
    expect(second.from).toBe(CURRENT_DATA_VERSION);
    expect(second.to).toBe(CURRENT_DATA_VERSION);
  });
});
