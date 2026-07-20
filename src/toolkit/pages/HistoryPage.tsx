import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, History, Plus, Trash2 } from "lucide-react";
import { getIndustry, INDUSTRIES } from "../../data/catalog";
import { useToast } from "../../store/ToastContext";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { EmptyState } from "../../components/common/EmptyState";
import { Pill } from "../../components/common/Badge";
import { midpoint, pesoRange } from "../../pricing/engine/money";
import { loadEstimates } from "../../pricing/store/pricingStorage";
import { getActiveDiscovery, loadPresentations } from "../../discovery/store/discoveryStorage";
import { roiRepo } from "../../value/store/valueStorage";
import type { OpportunityStatus } from "../../value/types";
import type { PresentationHistoryRecord } from "../types";
import { historyRepo, newHistoryRecord } from "../store/toolkitStorage";

const inputCls = "min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm";

const STATUS_LABELS: Record<OpportunityStatus, string> = {
  "new-lead": "New lead", qualified: "Qualified", "discovery-required": "Discovery required",
  "demo-completed": "Demo completed", "proposal-requested": "Proposal requested",
  "technical-review-required": "Technical review required", negotiation: "Negotiation",
  "on-hold": "On hold", won: "Won", lost: "Lost", "not-qualified": "Not qualified",
};

export function HistoryPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [records, setRecords] = useState<PresentationHistoryRecord[]>(historyRepo.loadAll);
  const [editing, setEditing] = useState<PresentationHistoryRecord | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<PresentationHistoryRecord | null>(null);

  const estimates = loadEstimates();
  const month = new Date().toISOString().slice(0, 7);
  const active = records.filter((r) => !["won", "lost", "not-qualified"].includes(r.status));
  const pipelineValue = active.reduce((sum, r) => {
    const e = estimates.find((x) => x.id === r.pricingEstimateId);
    return sum + (e ? midpoint(e.result.oneTimeTotal) : 0);
  }, 0);
  const cards = [
    { label: "Presentations this month", value: String(records.filter((r) => r.date.startsWith(month)).length) },
    { label: "Qualified opportunities", value: String(records.filter((r) => r.status === "qualified").length) },
    { label: "Proposals requested", value: String(records.filter((r) => r.status === "proposal-requested").length) },
    { label: "Follow-ups due", value: String(records.filter((r) => r.followUpDate && r.followUpDate <= new Date().toISOString().slice(0, 10) && !["won", "lost", "not-qualified"].includes(r.status)).length) },
    { label: "Est. pipeline value", value: pipelineValue > 0 ? pesoRange({ minimum: pipelineValue, maximum: pipelineValue }) : "—" },
    { label: "Won", value: String(records.filter((r) => r.status === "won").length) },
    { label: "Lost", value: String(records.filter((r) => r.status === "lost").length) },
  ];

  const byIndustry = Object.entries(
    records.reduce<Record<string, number>>((acc, r) => {
      const name = getIndustry(r.industryId)?.name ?? "Unspecified";
      acc[name] = (acc[name] ?? 0) + 1;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);

  if (editing) {
    return (
      <HistoryEditor
        record={editing}
        onSaved={(r) => setRecords(historyRepo.upsert(r))}
        onExit={() => {
          setRecords(historyRepo.loadAll());
          setEditing(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <button onClick={() => navigate("/discovery")} className="inline-flex min-h-10 items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Discovery
      </button>
      <header>
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <History className="h-5 w-5 text-accent" /> Presentation History
        </h1>
        <p className="text-sm text-slate-500">
          A lightweight local sales tracker — not a secure multi-user CRM. Everything stays on this device.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <p className="truncate text-sm font-bold text-slate-900">{c.value}</p>
            <p className="text-[11px] text-slate-500">{c.label}</p>
          </div>
        ))}
        <div className="col-span-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:col-span-1">
          <p className="text-[11px] font-semibold text-slate-500">By industry</p>
          <p className="truncate text-[11px] text-slate-600">
            {byIndustry.slice(0, 3).map(([n, c]) => `${n} (${c})`).join(", ") || "—"}
          </p>
        </div>
      </div>

      <button
        onClick={() => {
          const d = getActiveDiscovery();
          const p = loadPresentations()[0];
          const e = loadEstimates().filter((x) => !x.archived)[0];
          setEditing(
            newHistoryRecord({
              clientName: d?.business.businessName ?? p?.businessName ?? "",
              industryId: d?.business.industryId ?? p?.industryId ?? "",
              presentationId: p?.id,
              pricingEstimateId: e?.id,
              roiEstimateId: roiRepo.loadAll()[0]?.id,
              modulesShown: p?.demoServiceIds.length ? `${p.demoServiceIds.length} featured demos` : "",
            }),
          );
        }}
        className="flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-accent text-sm font-bold text-white hover:opacity-90"
      >
        <Plus className="h-5 w-5" /> Log a presentation
      </button>

      {records.length === 0 ? (
        <EmptyState icon="History" title="No presentations logged" message="Log each client presentation to build your local pipeline view." />
      ) : (
        <ul className="space-y-2">
          {records
            .slice()
            .sort((a, b) => b.date.localeCompare(a.date))
            .map((r) => (
              <li key={r.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-slate-900">{r.clientName || "Unnamed client"}</p>
                  <Pill tone={r.status === "won" ? "green" : ["lost", "not-qualified"].includes(r.status) ? "red" : "blue"}>
                    {STATUS_LABELS[r.status]}
                  </Pill>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">
                  {r.date} · {getIndustry(r.industryId)?.name ?? "—"}
                  {r.followUpDate ? ` · Follow-up ${r.followUpDate}` : ""}
                </p>
                {r.nextStep && <p className="mt-1 text-xs text-slate-600">Next: {r.nextStep}</p>}
                <div className="mt-2 flex gap-2">
                  <button onClick={() => setEditing(r)} className="min-h-10 rounded-lg bg-accent px-3 text-xs font-semibold text-white hover:opacity-90">
                    Open
                  </button>
                  <button onClick={() => setConfirmDelete(r)} className="ml-auto min-h-10 rounded-lg border border-red-200 px-3 text-xs font-medium text-red-600 hover:bg-red-50">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
        </ul>
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Delete this history record?"
          message={`The record for "${confirmDelete.clientName || "Unnamed client"}" (${confirmDelete.date}) will be removed.`}
          confirmLabel="Delete"
          onConfirm={() => {
            setRecords(historyRepo.remove(confirmDelete.id));
            setConfirmDelete(null);
            toast("History record deleted.");
          }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}

function HistoryEditor({ record, onSaved, onExit }: { record: PresentationHistoryRecord; onSaved: (r: PresentationHistoryRecord) => void; onExit: () => void }) {
  const [r, setR] = useState(record);
  const set = (patch: Partial<PresentationHistoryRecord>) => setR((x) => ({ ...x, ...patch }));

  useEffect(() => {
    const t = setTimeout(() => onSaved({ ...r, updatedAt: new Date().toISOString() }), 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r]);

  const fields: { key: keyof PresentationHistoryRecord; label: string; area?: boolean; ph: string }[] = [
    { key: "attendees", label: "Attendees", ph: "e.g. Owner, branch manager, head cashier" },
    { key: "problemsDiscussed", label: "Problems discussed", area: true, ph: "e.g. No-shows, stock-outs, slow reports" },
    { key: "modulesShown", label: "Modules shown", ph: "e.g. Booking, inventory, dashboard" },
    { key: "scenariosShown", label: "Demo scenarios shown", ph: "e.g. Low-stock, missed appointment" },
    { key: "roleViewsShown", label: "Role views shown", ph: "e.g. Owner, cashier" },
    { key: "packagePresented", label: "Package presented", ph: "e.g. Growth (recommended)" },
    { key: "questions", label: "Questions", area: true, ph: "e.g. Can staff use their own phones?" },
    { key: "objections", label: "Objections", area: true, ph: "e.g. Worried the team won't adapt" },
    { key: "decisions", label: "Decisions", area: true, ph: "e.g. Wants the spouse to see the demo first" },
    { key: "nextStep", label: "Next step", ph: "e.g. Prepare formal proposal" },
    { key: "outcome", label: "Outcome", ph: "e.g. Very positive — asked about start dates" },
    { key: "notes", label: "Notes", area: true, ph: "e.g. Best time to call: mornings before opening" },
  ];

  return (
    <div className="space-y-4">
      <button onClick={onExit} className="inline-flex min-h-10 items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> History
      </button>
      <h1 className="text-xl font-bold text-slate-900">Presentation Record</h1>
      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-2 gap-3">
          <L label="Client"><input value={r.clientName} onChange={(e) => set({ clientName: e.target.value })} placeholder="e.g. Bella Salon & Spa" className={inputCls} /></L>
          <L label="Date"><input type="date" value={r.date} onChange={(e) => set({ date: e.target.value })} className={inputCls} /></L>
          <L label="Industry">
            <select value={r.industryId} onChange={(e) => set({ industryId: e.target.value })} className={inputCls}>
              <option value="">— Select —</option>
              {INDUSTRIES.map((i) => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
          </L>
          <L label="Opportunity status">
            <select value={r.status} onChange={(e) => set({ status: e.target.value as OpportunityStatus })} className={inputCls}>
              {Object.entries(STATUS_LABELS).map(([id, label]) => (
                <option key={id} value={id}>{label}</option>
              ))}
            </select>
          </L>
        </div>
        {fields.map((f) =>
          f.area ? (
            <L key={f.key} label={f.label}>
              <textarea value={String(r[f.key] ?? "")} onChange={(e) => set({ [f.key]: e.target.value } as Partial<PresentationHistoryRecord>)} rows={2} placeholder={f.ph} className={`${inputCls} py-2`} />
            </L>
          ) : (
            <L key={f.key} label={f.label}>
              <input value={String(r[f.key] ?? "")} onChange={(e) => set({ [f.key]: e.target.value } as Partial<PresentationHistoryRecord>)} placeholder={f.ph} className={inputCls} />
            </L>
          ),
        )}
        <L label="Follow-up date"><input type="date" value={r.followUpDate} onChange={(e) => set({ followUpDate: e.target.value })} className={inputCls} /></L>
      </section>
      <p className="text-xs italic text-slate-400">Saved automatically. Local tracker only — not a secure multi-user CRM.</p>
    </div>
  );
}

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>
      {children}
    </label>
  );
}
