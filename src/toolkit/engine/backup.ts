// Full-application backup: a versioned snapshot of every "bizsolutions."
// localStorage key (client profiles, discoveries, presentations, pricing,
// ROI, scopes, roadmaps, meetings, history, custom scenarios, settings…).

export interface AppBackup {
  backupVersion: 1;
  exportedAt: string;
  app: "bizsolutions-demo-hub";
  keys: Record<string, unknown>;
}

const PREFIX = "bizsolutions.";

export function exportBackup(): string {
  const keys: Record<string, unknown> = {};
  for (const k of Object.keys(localStorage)) {
    if (!k.startsWith(PREFIX)) continue;
    try {
      keys[k] = JSON.parse(localStorage.getItem(k)!);
    } catch {
      // Skip unparseable values rather than corrupting the backup.
    }
  }
  const backup: AppBackup = {
    backupVersion: 1,
    exportedAt: new Date().toISOString(),
    app: "bizsolutions-demo-hub",
    keys,
  };
  return JSON.stringify(backup, null, 2);
}

export interface BackupPreview {
  exportedAt: string;
  keyCount: number;
  keys: { key: string; summary: string }[];
}

export function validateBackup(json: string): { errors: string[]; backup?: AppBackup; preview?: BackupPreview } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { errors: ["That is not valid JSON."] };
  }
  if (typeof parsed !== "object" || parsed === null) return { errors: ["Backup must be a JSON object."] };
  const b = parsed as Partial<AppBackup>;
  const errors: string[] = [];
  if (b.backupVersion !== 1) errors.push("Unsupported backup version — expected backupVersion 1.");
  if (b.app !== "bizsolutions-demo-hub") errors.push("This file is not a BizSolutions Demo Hub backup.");
  if (typeof b.keys !== "object" || b.keys === null || Array.isArray(b.keys)) errors.push("Backup keys section is missing or invalid.");
  if (errors.length > 0) return { errors };

  const badKeys = Object.keys(b.keys!).filter((k) => !k.startsWith(PREFIX));
  if (badKeys.length > 0) errors.push(`Backup contains ${badKeys.length} key(s) outside the app's namespace.`);
  if (errors.length > 0) return { errors };

  const preview: BackupPreview = {
    exportedAt: typeof b.exportedAt === "string" ? b.exportedAt : "unknown",
    keyCount: Object.keys(b.keys!).length,
    keys: Object.entries(b.keys!).map(([key, value]) => {
      let summary: string = typeof value;
      if (Array.isArray(value)) summary = `${value.length} entries`;
      else if (value && typeof value === "object") {
        const items = (value as { items?: unknown[]; estimates?: unknown[] }).items ?? (value as { estimates?: unknown[] }).estimates;
        summary = Array.isArray(items) ? `${items.length} record(s)` : "object";
      }
      return { key, summary };
    }),
  };
  return { errors: [], backup: b as AppBackup, preview };
}

/**
 * Applies a validated backup. "merge" overwrites only the keys present in the
 * backup; "replace" clears every app key first (destructive — confirm in UI).
 */
export function importBackup(backup: AppBackup, mode: "merge" | "replace"): number {
  if (mode === "replace") {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => localStorage.removeItem(k));
  }
  let written = 0;
  for (const [k, v] of Object.entries(backup.keys)) {
    if (!k.startsWith(PREFIX)) continue;
    try {
      localStorage.setItem(k, JSON.stringify(v));
      written++;
    } catch {
      // Storage full — count what succeeded; UI reports the number written.
    }
  }
  return written;
}
