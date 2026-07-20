import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Archive, Calculator, Copy, FileText, Plus, Settings2, Trash2 } from "lucide-react";
import { getIndustry, INDUSTRIES } from "../../data/catalog";
import { useToast } from "../../store/ToastContext";
import { SearchInput } from "../../components/common/SearchInput";
import { EmptyState } from "../../components/common/EmptyState";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { Pill } from "../../components/common/Badge";
import type { EstimateStatus, PricingEstimate } from "../types";
import { pesoRange } from "../engine/money";
import {
  deleteEstimate, loadDraft, loadEstimates, newEstimateId, nextEstimateNumber, upsertEstimate,
} from "../store/pricingStorage";

const STATUS_LABEL: Record<EstimateStatus, { label: string; tone: "gray" | "blue" | "amber" | "green" }> = {
  draft: { label: "Draft", tone: "gray" },
  preliminary: { label: "Preliminary", tone: "blue" },
  "manual-review": { label: "Manual review", tone: "amber" },
  "approved-for-proposal": { label: "Ready for proposal", tone: "green" },
};

export function PricingListPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [estimates, setEstimates] = useState<PricingEstimate[]>(loadEstimates);
  const [search, setSearch] = useState("");
  const [industryFilter, setIndustryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<PricingEstimate | null>(null);
  const hasDraft = useMemo(() => loadDraft() !== null, []);

  const visible = estimates
    .filter((e) => {
      const q = search.trim().toLowerCase();
      return (
        e.archived === showArchived &&
        (!q || e.input.businessName.toLowerCase().includes(q) || e.estimateNumber.toLowerCase().includes(q)) &&
        (!industryFilter || e.input.industryId === industryFilter) &&
        (!statusFilter || e.status === statusFilter)
      );
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const duplicate = (e: PricingEstimate) => {
    const all = loadEstimates();
    const now = new Date().toISOString();
    const copy: PricingEstimate = {
      ...e,
      id: newEstimateId(),
      estimateNumber: nextEstimateNumber(all),
      createdAt: now,
      updatedAt: now,
      status: e.status === "approved-for-proposal" ? "preliminary" : e.status,
      archived: false,
    };
    setEstimates(upsertEstimate(copy));
    toast(`Duplicated as ${copy.estimateNumber}.`);
  };

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between gap-2">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <Calculator className="h-5 w-5 text-accent" /> Pricing Configurator
          </h1>
          <p className="text-sm text-slate-500">Preliminary estimates — stored only on this device.</p>
        </div>
        <Link
          to="/pricing/admin"
          className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-slate-300 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50"
        >
          <Settings2 className="h-3.5 w-3.5" /> Pricing admin
        </Link>
      </header>

      <button
        onClick={() => navigate("/pricing/new")}
        className="flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-accent text-sm font-bold text-white hover:opacity-90"
      >
        <Plus className="h-5 w-5" /> {hasDraft ? "Continue draft estimate" : "New estimate"}
      </button>

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="flex-1">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by client or estimate number…" />
        </div>
        <div className="flex gap-2">
          <select value={industryFilter} onChange={(e) => setIndustryFilter(e.target.value)} aria-label="Filter by industry" className="min-h-11 flex-1 rounded-xl border border-slate-300 bg-white px-3 text-sm">
            <option value="">All industries</option>
            {INDUSTRIES.map((i) => (
              <option key={i.id} value={i.id}>{i.name}</option>
            ))}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status" className="min-h-11 flex-1 rounded-xl border border-slate-300 bg-white px-3 text-sm">
            <option value="">All statuses</option>
            {Object.entries(STATUS_LABEL).map(([id, s]) => (
              <option key={id} value={id}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      <label className="flex items-center gap-2 text-xs text-slate-500">
        <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} className="h-4 w-4 accent-[var(--app-accent)]" />
        Show archived estimates
      </label>

      {visible.length === 0 ? (
        <EmptyState
          icon="FileText"
          title={showArchived ? "No archived estimates" : "No estimates yet"}
          message="Create an estimate from here, or from any industry, service offer, client profile, or the Selected Solutions screen."
        />
      ) : (
        <ul className="space-y-2">
          {visible.map((e) => {
            const st = STATUS_LABEL[e.status];
            return (
              <li key={e.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <Link to={`/pricing/estimate/${e.id}`} className="block">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-slate-900">{e.input.businessName}</span>
                    <Pill tone={st.tone}>{st.label}</Pill>
                  </div>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                    <FileText className="h-3.5 w-3.5" /> {e.estimateNumber} · {getIndustry(e.input.industryId)?.name} ·{" "}
                    {new Date(e.updatedAt).toLocaleDateString()}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    One-time {pesoRange(e.result.oneTimeTotal)} · {pesoRange(e.result.recurringTotal, "/mo")}
                  </p>
                </Link>
                <div className="mt-2 flex gap-2">
                  <button onClick={() => duplicate(e)} className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-slate-300 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50">
                    <Copy className="h-3.5 w-3.5" /> Duplicate
                  </button>
                  <button
                    onClick={() => {
                      const updated = { ...e, archived: !e.archived, updatedAt: new Date().toISOString() };
                      setEstimates(upsertEstimate(updated));
                      toast(updated.archived ? "Estimate archived." : "Estimate restored.");
                    }}
                    className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-slate-300 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50"
                  >
                    <Archive className="h-3.5 w-3.5" /> {e.archived ? "Restore" : "Archive"}
                  </button>
                  <button onClick={() => setConfirmDelete(e)} className="ml-auto inline-flex min-h-10 items-center gap-1 rounded-lg border border-red-200 px-3 text-xs font-medium text-red-600 hover:bg-red-50">
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {confirmDelete && (
        <ConfirmDialog
          title={`Delete ${confirmDelete.estimateNumber}?`}
          message={`The estimate for "${confirmDelete.input.businessName}" will be permanently removed from this device.`}
          confirmLabel="Delete"
          onConfirm={() => {
            setEstimates(deleteEstimate(confirmDelete.id));
            setConfirmDelete(null);
            toast("Estimate deleted.");
          }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
