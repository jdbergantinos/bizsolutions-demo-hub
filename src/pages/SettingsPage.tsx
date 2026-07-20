import { useState } from "react";
import { Link } from "react-router-dom";
import { Archive, Calculator, Database, Download, HardDrive, Info, RotateCcw, ShieldAlert, Upload } from "lucide-react";
import { loadPricingSettings } from "../pricing/store/pricingStorage";
import { exportBackup, importBackup, validateBackup, type AppBackup, type BackupPreview } from "../toolkit/engine/backup";
import {
  clearDemoPracticeData, clearProspectData, CURRENT_DATA_VERSION, daysSinceLastExport,
  EXPORT_REMINDER_DAYS, listSnapshots, recordManualExport, restoreSnapshot,
} from "../toolkit/engine/dataCare";
import { INDUSTRIES } from "../data/catalog";
import { useApp } from "../store/AppStore";
import { useToast } from "../store/ToastContext";
import { useOnline } from "../hooks/useOnline";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { KEYS } from "../utils/storage";

type PendingReset =
  | { kind: "demos" }
  | { kind: "industry"; industryId: string }
  | { kind: "profiles" }
  | { kind: "solutions" }
  | { kind: "favorites" }
  | { kind: "practice" }
  | { kind: "prospects" }
  | { kind: "everything" };

export function SettingsPage() {
  const app = useApp();
  const toast = useToast();
  const online = useOnline();
  const [industryPick, setIndustryPick] = useState("");
  const [pending, setPending] = useState<PendingReset | null>(null);
  const [backupText, setBackupText] = useState("");
  const [backupPreview, setBackupPreview] = useState<{ backup: AppBackup; preview: BackupPreview } | null>(null);
  const [confirmReplace, setConfirmReplace] = useState(false);

  const storageUsed = (() => {
    let bytes = 0;
    for (const k of Object.keys(localStorage)) {
      if (k.startsWith("bizsolutions.")) bytes += (localStorage.getItem(k)?.length ?? 0) * 2;
    }
    return (bytes / 1024).toFixed(1);
  })();

  const runReset = (r: PendingReset) => {
    switch (r.kind) {
      case "demos":
        app.resetDemos();
        toast("Demo data restored.");
        break;
      case "industry": {
        const industry = INDUSTRIES.find((i) => i.id === r.industryId);
        industry?.services.forEach((s) => app.resetDemos(s.scenarioKey));
        toast(`Demo data for ${industry?.name ?? "industry"} restored.`);
        break;
      }
      case "profiles":
        app.resetProfiles();
        toast("Client profiles reset.");
        break;
      case "solutions":
        app.resetSolutions();
        toast("Selected solutions reset.");
        break;
      case "favorites":
        app.resetFavorites();
        toast("Favorites reset.");
        break;
      case "practice": {
        const n = clearDemoPracticeData();
        toast(`Demo & practice data cleared (${n} storage areas). Client profiles and prospect records are untouched.`);
        break;
      }
      case "prospects": {
        const n = clearProspectData();
        toast(`Real prospect data cleared (${n} storage areas). A safety snapshot was taken first.`);
        setTimeout(() => window.location.reload(), 1200);
        break;
      }
      case "everything":
        app.resetEverything();
        toast("Demo data restored. The application has been fully reset.");
        break;
    }
    setPending(null);
  };

  const confirmText: Record<PendingReset["kind"], string> = {
    practice:
      "Demo-module records, simulated-notification history, and approval-showcase states will be cleared. Client profiles, discoveries, estimates, and all other prospect records are kept. A safety snapshot is taken first.",
    prospects:
      "All REAL prospect data will be deleted: client profiles, discoveries, workflows, presentations, estimates, ROI, scopes, roadmaps, meetings, acknowledgments, assessments, and history. Demo data, settings, and pricing rules are kept. A safety snapshot is taken first.",
    demos: "All demo records in every module will be restored to the original sample data. Client profiles and prospect records are kept.",
    industry: "All demo records for the selected industry will be restored to sample data.",
    profiles: "All client profiles (including temporary logos) will be deleted from this device.",
    solutions: "The selected client solutions list will be emptied.",
    favorites: "All favorited industries, services, and scenarios will be cleared.",
    everything:
      "Everything stored by this app on this device — demo records, client profiles, solutions, favorites, presentation setup — will be deleted.",
  };

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-slate-900">Settings</h1>

      {/* Status */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-slate-800">
          <HardDrive className="h-4 w-4" /> Application status
        </h2>
        <dl className="space-y-2 text-sm">
          <Row label="Connection">
            <span className={online ? "text-emerald-600" : "text-amber-600"}>
              {online ? "Online (app also works offline)" : "Offline — running from device cache"}
            </span>
          </Row>
          <Row label="Local storage used">{storageUsed} KB</Row>
          <Row label="Data location">This device only (localStorage)</Row>
          <Row label="Version">1.0.0</Row>
          <Row label="Data-format version">v{CURRENT_DATA_VERSION} (auto-migrated on app updates)</Row>
        </dl>
      </section>

      {/* Resets */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-slate-800">
          <RotateCcw className="h-4 w-4" /> Reset demo data
        </h2>
        <div className="space-y-2">
          <ResetBtn label="Reset all demos" onClick={() => setPending({ kind: "demos" })} />
          <div className="flex gap-2">
            <select
              value={industryPick}
              onChange={(e) => setIndustryPick(e.target.value)}
              aria-label="Industry to reset"
              className="min-h-11 flex-1 rounded-xl border border-slate-300 bg-white px-3 text-sm"
            >
              <option value="">Reset one industry…</option>
              {INDUSTRIES.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
            <button
              disabled={!industryPick}
              onClick={() => setPending({ kind: "industry", industryId: industryPick })}
              className="min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              Reset
            </button>
          </div>
          <ResetBtn label="Reset client profiles" onClick={() => setPending({ kind: "profiles" })} />
          <ResetBtn label="Reset selected solutions" onClick={() => setPending({ kind: "solutions" })} />
          <ResetBtn label="Reset favorites" onClick={() => setPending({ kind: "favorites" })} />
          <div className="my-2 border-t border-slate-100 pt-2">
            <p className="mb-2 text-xs text-slate-500">
              <strong>Sample vs. real data:</strong> demo/practice data is the play area
              (demo records, simulated notifications, approval walkthroughs); prospect data
              is your actual clients (profiles, discoveries, estimates, meetings, history).
            </p>
            <div className="space-y-2">
              <ResetBtn label="Clear demo & practice data (keeps prospects)" onClick={() => setPending({ kind: "practice" })} />
              <button
                onClick={() => setPending({ kind: "prospects" })}
                className="min-h-11 w-full rounded-xl border border-red-300 text-sm font-medium text-red-700 hover:bg-red-50"
              >
                Clear real prospect data (keeps demos & settings)
              </button>
            </div>
          </div>
          <button
            onClick={() => setPending({ kind: "everything" })}
            className="min-h-11 w-full rounded-xl bg-red-600 text-sm font-semibold text-white hover:bg-red-700"
          >
            Reset entire application
          </button>
        </div>
      </section>

      {/* Pricing */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-800">
          <Calculator className="h-4 w-4" /> Pricing
        </h2>
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Pricing values are initial internal estimates and require owner review before use with
          clients.
        </p>
        <dl className="mt-2 space-y-2 text-sm">
          <Row label="Price-table version">{loadPricingSettings().priceTableVersion}</Row>
          <Row label="Last price review">{loadPricingSettings().lastPriceReviewDate || "Not yet reviewed"}</Row>
          <Row label="Storage">This device only</Row>
        </dl>
        <p className="mt-2 text-[11px] text-slate-400">Pricing configuration is stored only on this device.</p>
        <Link
          to="/pricing/admin"
          className="mt-3 flex min-h-11 items-center justify-center rounded-xl border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Open Pricing Administration
        </Link>
      </section>

      {/* Backup & restore */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-800">
          <Archive className="h-4 w-4" /> Backup & restore
        </h2>
        <p className="mb-2 text-xs text-slate-500">
          Exports everything this app stores on this device — profiles, discoveries, presentations,
          estimates, ROI, scopes, roadmaps, meetings, history, custom scenarios, pricing
          configuration, and settings — as one versioned JSON file.
        </p>
        {(() => {
          const days = daysSinceLastExport();
          const due = days === null || days >= EXPORT_REMINDER_DAYS;
          return due ? (
            <p className="mb-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              {days === null
                ? "You have never exported a backup file. Snapshots on this device do not protect against losing the phone — export one now and keep it somewhere safe."
                : `Your last exported backup is ${days} day(s) old. Consider exporting a fresh one.`}
            </p>
          ) : (
            <p className="mb-2 text-[11px] text-slate-400">Last exported backup: {days === 0 ? "today" : `${days} day(s) ago`}.</p>
          );
        })()}
        <button
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(exportBackup());
              recordManualExport();
              toast("Full backup JSON copied to clipboard — save it somewhere safe.");
            } catch {
              setBackupText(exportBackup());
              recordManualExport();
              toast("Clipboard blocked — backup placed in the box below for manual copying.", "info");
            }
          }}
          className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-accent text-sm font-semibold text-white hover:opacity-90"
        >
          <Download className="h-4 w-4" /> Export full backup
        </button>

        {/* Automatic snapshots */}
        <div className="mt-3 rounded-xl border border-slate-200 p-3">
          <p className="text-xs font-semibold text-slate-700">Automatic snapshots (kept on this device)</p>
          <p className="mt-0.5 text-[11px] text-slate-400">
            Taken once a day when you open the app; the last 3 are kept. They survive in-app
            resets and protect against accidental deletions — not against losing the phone.
          </p>
          {listSnapshots().length === 0 ? (
            <p className="mt-2 text-xs text-slate-400">No snapshots yet — one is taken the next time the app opens with data present.</p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {listSnapshots().map((s) => (
                <li key={s.takenAt} className="flex items-center justify-between gap-2 text-xs text-slate-600">
                  <span>
                    {new Date(s.takenAt).toLocaleString()} · {Object.keys(s.backup.keys).length} storage keys
                  </span>
                  <button
                    onClick={() => {
                      const n = restoreSnapshot(s.takenAt);
                      if (n >= 0) {
                        toast(`Snapshot restored (${n} storage keys). Reloading…`);
                        setTimeout(() => window.location.reload(), 1200);
                      } else {
                        toast("Snapshot could not be restored.", "info");
                      }
                    }}
                    className="min-h-9 shrink-0 rounded-lg border border-slate-300 px-3 font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Restore
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <textarea
          value={backupText}
          onChange={(e) => setBackupText(e.target.value)}
          rows={4}
          placeholder="Paste a backup JSON here to restore…"
          className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-mono text-xs"
        />
        <button
          disabled={!backupText.trim()}
          onClick={() => {
            const result = validateBackup(backupText);
            if (result.errors.length > 0) {
              toast(`Backup rejected: ${result.errors[0]}`, "info");
              setBackupPreview(null);
            } else {
              setBackupPreview({ backup: result.backup!, preview: result.preview! });
            }
          }}
          className="mt-2 inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
        >
          <Upload className="h-4 w-4" /> Validate & preview restore
        </button>
        {backupPreview && (
          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold text-slate-700">
              Backup from {backupPreview.preview.exportedAt.slice(0, 19).replace("T", " ")} · {backupPreview.preview.keyCount} storage keys. Nothing applied yet.
            </p>
            <ul className="mt-1 max-h-32 space-y-0.5 overflow-y-auto text-[11px] text-slate-500">
              {backupPreview.preview.keys.map((k) => (
                <li key={k.key}>{k.key} — {k.summary}</li>
              ))}
            </ul>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  const n = importBackup(backupPreview.backup, "merge");
                  setBackupPreview(null);
                  setBackupText("");
                  toast(`Merged ${n} storage keys from the backup. Reload to see everything.`);
                  setTimeout(() => window.location.reload(), 1200);
                }}
                className="min-h-11 rounded-xl bg-accent text-xs font-semibold text-white"
              >
                Merge into current data
              </button>
              <button onClick={() => setConfirmReplace(true)} className="min-h-11 rounded-xl bg-red-600 text-xs font-semibold text-white hover:bg-red-700">
                Replace all current data
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Storage keys */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-800">
          <Database className="h-4 w-4" /> localStorage keys
        </h2>
        <ul className="space-y-1 font-mono text-[11px] text-slate-500">
          <li>{KEYS.favorites} — favorited items</li>
          <li>{KEYS.recents} — recently opened demos</li>
          <li>{KEYS.profiles} — client profiles</li>
          <li>{KEYS.activeProfile} — active profile id</li>
          <li>{KEYS.solutions} — selected client solutions</li>
          <li>{KEYS.presentation} — presentation setup</li>
          <li>{KEYS.demoPrefix}&lt;scenario&gt; — records per demo scenario</li>
          <li>bizsolutions.pricing.estimates.v1 — saved pricing estimates</li>
          <li>bizsolutions.pricing.settings.v1 — pricing settings</li>
          <li>bizsolutions.pricing.rules.v1 — customized pricing rules</li>
          <li>bizsolutions.pricing.draft.v1 — in-progress estimate draft</li>
          <li>bizsolutions.discovery.records.v1 — client discovery records</li>
          <li>bizsolutions.discovery.active.v1 — active discovery id</li>
          <li>bizsolutions.discovery.workflows.v1 — workflow comparisons</li>
          <li>bizsolutions.discovery.presentations.v1 — guided presentations</li>
          <li>bizsolutions.value.roi.v1 — ROI / business-value estimates</li>
          <li>bizsolutions.value.scopes.v1 — preliminary scopes</li>
          <li>bizsolutions.value.roadmaps.v1 — implementation roadmaps</li>
          <li>bizsolutions.value.meetings.v1 — meeting records</li>
          <li>bizsolutions.value.acknowledgments.v1 — client acknowledgments</li>
          <li>bizsolutions.value.summaries.v1 — saved discussion summaries</li>
          <li>bizsolutions.toolkit.assessments.v1 — integration assessments</li>
          <li>bizsolutions.toolkit.notifications.v1 — simulated notification history</li>
          <li>bizsolutions.toolkit.approvals.v1 — approval showcase states</li>
          <li>bizsolutions.toolkit.dashboards.v1 — dashboard preferences</li>
          <li>bizsolutions.toolkit.scenarios.v1 — customized demo scenarios</li>
          <li>bizsolutions.toolkit.history.v1 — presentation history / sales tracker</li>
          <li>bizsolutions.toolkit.boundaryack.v1 — acknowledged demo-boundary notices</li>
        </ul>
      </section>

      {/* Safety */}
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-amber-800">
          <ShieldAlert className="h-4 w-4" /> Demo limitations
        </h2>
        <ul className="list-inside list-disc space-y-1 text-xs leading-relaxed text-amber-800">
          <li>Demonstration only — no real data is stored or transmitted; nothing leaves this device.</li>
          <li>All names, businesses, and records are fictional sample data.</li>
          <li>Payment methods shown (Cash, GCash, bank transfer, card) are display-only; no payments are processed.</li>
          <li>No accounting, tax, payroll, loan, credit-scoring, medical, or safety-critical functions are implemented.</li>
          <li>These demos are not production-ready, certified, or connected to real services.</li>
        </ul>
      </section>

      <p className="flex items-center gap-1.5 text-xs text-slate-400">
        <Info className="h-3.5 w-3.5" /> Install tip: open the browser menu and choose “Add to Home
        screen” / “Install app” to use this hub full-screen and offline.
      </p>

      {pending && (
        <ConfirmDialog
          title="Confirm reset"
          message={confirmText[pending.kind]}
          confirmLabel="Reset"
          onConfirm={() => runReset(pending)}
          onCancel={() => setPending(null)}
        />
      )}

      {confirmReplace && backupPreview && (
        <ConfirmDialog
          title="Replace ALL current data?"
          message="Every record currently on this device will be deleted and replaced by the backup's contents. This cannot be undone unless you exported a backup of the current data first."
          confirmLabel="Replace everything"
          onConfirm={() => {
            const n = importBackup(backupPreview.backup, "replace");
            setConfirmReplace(false);
            setBackupPreview(null);
            setBackupText("");
            toast(`Replaced all data with ${n} storage keys from the backup. Reloading…`);
            setTimeout(() => window.location.reload(), 1200);
          }}
          onCancel={() => setConfirmReplace(false)}
        />
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-800">{children}</dd>
    </div>
  );
}

function ResetBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="min-h-11 w-full rounded-xl border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50"
    >
      {label}
    </button>
  );
}
