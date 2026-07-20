import { exportBackup, importBackup, validateBackup, type AppBackup } from "./backup";

// Data-care utilities: automatic local snapshots, export reminders, the
// sample-vs-prospect reset split, and storage-version migrations.
//
// Meta keys deliberately use the "bizsolutions-meta." prefix, which is
// OUTSIDE the app-data namespace ("bizsolutions."): snapshots and version
// markers survive in-app resets and are never included in backups
// (otherwise a snapshot would contain snapshots, and "reset everything"
// would delete its own safety net).
export const META_KEYS = {
  snapshots: "bizsolutions-meta.snapshots.v1",
  lastExport: "bizsolutions-meta.lastexport.v1",
  dataVersion: "bizsolutions-meta.dataversion",
} as const;

const APP_PREFIX = "bizsolutions.";
export const MAX_SNAPSHOTS = 3;

// ---------- Automatic snapshots ----------

export interface Snapshot {
  takenAt: string;
  backup: AppBackup;
}

export function listSnapshots(): Snapshot[] {
  try {
    const raw = localStorage.getItem(META_KEYS.snapshots);
    const parsed = raw ? (JSON.parse(raw) as Snapshot[]) : [];
    return Array.isArray(parsed) ? parsed.filter((s) => s && s.takenAt && s.backup?.backupVersion === 1) : [];
  } catch {
    return [];
  }
}

/**
 * Takes at most one snapshot per calendar day, keeping the newest
 * MAX_SNAPSHOTS. Returns true when a new snapshot was stored.
 */
export function takeDailySnapshot(now = new Date()): boolean {
  try {
    const today = now.toISOString().slice(0, 10);
    const existing = listSnapshots();
    if (existing.some((s) => s.takenAt.slice(0, 10) === today)) return false;
    const backup = JSON.parse(exportBackup()) as AppBackup;
    if (Object.keys(backup.keys).length === 0) return false; // nothing to protect yet
    const next = [{ takenAt: now.toISOString(), backup }, ...existing].slice(0, MAX_SNAPSHOTS);
    localStorage.setItem(META_KEYS.snapshots, JSON.stringify(next));
    return true;
  } catch {
    return false; // storage full — never break app startup over a snapshot
  }
}

/** Restores a snapshot (replace mode). Returns keys written, or -1 on failure. */
export function restoreSnapshot(takenAt: string): number {
  const snap = listSnapshots().find((s) => s.takenAt === takenAt);
  if (!snap) return -1;
  const { errors, backup } = validateBackup(JSON.stringify(snap.backup));
  if (errors.length > 0 || !backup) return -1;
  return importBackup(backup, "replace");
}

// ---------- Manual-export reminder ----------

export function recordManualExport(now = new Date()): void {
  try {
    localStorage.setItem(META_KEYS.lastExport, JSON.stringify(now.toISOString()));
  } catch {
    // ignore
  }
}

/** Days since the last manual export, or null if never exported. */
export function daysSinceLastExport(now = new Date()): number | null {
  try {
    const raw = localStorage.getItem(META_KEYS.lastExport);
    if (!raw) return null;
    const then = new Date(JSON.parse(raw) as string).getTime();
    return Math.floor((now.getTime() - then) / 86_400_000);
  } catch {
    return null;
  }
}

export const EXPORT_REMINDER_DAYS = 7;

// ---------- Sample/practice vs prospect data ----------

/**
 * Demo & practice data: demo-module records, simulated-notification history,
 * and approval-showcase states. Client profiles and prospect records are
 * untouched. A snapshot is taken first as a safety net.
 */
export function clearDemoPracticeData(): number {
  takeDailySnapshot();
  const targets = [
    (k: string) => k.startsWith(APP_PREFIX + "demo."),
    (k: string) => k === "bizsolutions.toolkit.notifications.v1",
    (k: string) => k === "bizsolutions.toolkit.approvals.v1",
  ];
  return removeMatching((k) => targets.some((t) => t(k)));
}

/**
 * Real prospect data: everything describing actual clients and deals —
 * profiles, solutions, discoveries, workflows, presentations, estimates,
 * ROI, scopes, roadmaps, meetings, acknowledgments, summaries, assessments,
 * history, dashboard preferences. Demo records, favorites, settings, pricing
 * rules, and custom scenarios are kept. Snapshot taken first.
 */
export function clearProspectData(): number {
  takeDailySnapshot();
  const exact = new Set([
    "bizsolutions.profiles",
    "bizsolutions.activeProfile",
    "bizsolutions.solutions",
    "bizsolutions.presentation",
    "bizsolutions.discovery.records.v1",
    "bizsolutions.discovery.active.v1",
    "bizsolutions.discovery.workflows.v1",
    "bizsolutions.discovery.presentations.v1",
    "bizsolutions.pricing.estimates.v1",
    "bizsolutions.pricing.draft.v1",
    "bizsolutions.value.roi.v1",
    "bizsolutions.value.scopes.v1",
    "bizsolutions.value.roadmaps.v1",
    "bizsolutions.value.meetings.v1",
    "bizsolutions.value.acknowledgments.v1",
    "bizsolutions.value.summaries.v1",
    "bizsolutions.toolkit.assessments.v1",
    "bizsolutions.toolkit.history.v1",
    "bizsolutions.toolkit.dashboards.v1",
  ]);
  return removeMatching((k) => exact.has(k));
}

function removeMatching(match: (key: string) => boolean): number {
  const keys = Object.keys(localStorage).filter((k) => k.startsWith(APP_PREFIX) && match(k));
  keys.forEach((k) => localStorage.removeItem(k));
  return keys.length;
}

// ---------- Storage-version migrations ----------

/**
 * Bump CURRENT_DATA_VERSION and append a migration when a future app update
 * changes a stored format. Migrations run once, in order, at startup.
 */
export const CURRENT_DATA_VERSION = 1;

const MIGRATIONS: Record<number, () => void> = {
  // 2: () => { ...upgrade v1 records to v2... },
};

export function runMigrations(): { from: number; to: number } {
  let from = 0;
  try {
    from = Number(localStorage.getItem(META_KEYS.dataVersion)) || 0;
  } catch {
    return { from: 0, to: 0 };
  }
  if (from >= CURRENT_DATA_VERSION) return { from, to: from };
  for (let v = from + 1; v <= CURRENT_DATA_VERSION; v++) {
    try {
      MIGRATIONS[v]?.();
    } catch {
      // A failing migration must never brick the app; data loaders are
      // individually tolerant of old shapes.
    }
  }
  try {
    localStorage.setItem(META_KEYS.dataVersion, String(CURRENT_DATA_VERSION));
  } catch {
    // ignore
  }
  return { from, to: CURRENT_DATA_VERSION };
}
