import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Copy, FileCheck2, MonitorPlay, RefreshCcw, Sparkles } from "lucide-react";
import { useToast } from "../../store/ToastContext";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { getService } from "../../data/catalog";
import { loadEstimates } from "../../pricing/store/pricingStorage";
import { getActiveDiscovery, loadPresentations, upsertPresentation } from "../../discovery/store/discoveryStorage";
import { FEATURE_VALUE } from "../config/featureValue";
import { SCOPE_DISCLAIMER } from "../config/scopeTemplates";
import { buildScope } from "../engine/buildScope";
import { scopeRepo } from "../store/valueStorage";
import type { PreliminaryScope } from "../types";

const inputCls = "min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm";

export function ScopeBuilderPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [scope, setScope] = useState<PreliminaryScope>(() => {
    const existing = scopeRepo.loadAll()[0];
    if (existing) return existing;
    const discovery = getActiveDiscovery();
    const estimate = loadEstimates().filter((e) => !e.archived)[0] ?? null;
    return buildScope(discovery, estimate);
  });
  const [confirmRegen, setConfirmRegen] = useState(false);
  const [showValue, setShowValue] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => scopeRepo.upsert({ ...scope, updatedAt: new Date().toISOString() }), 400);
    return () => clearTimeout(t);
  }, [scope]);

  const setList = (key: keyof Pick<PreliminaryScope, "included" | "notIncluded" | "clientResponsibilities" | "providerResponsibilities" | "openQuestions">, text: string) =>
    setScope((s) => ({ ...s, [key]: text.split("\n").filter((x) => x.trim()) }));

  const linkedEstimate = loadEstimates().find((e) => e.id === scope.pricingEstimateId) ?? null;
  const featuredServiceIds =
    linkedEstimate?.input.selectedServiceOfferIds ??
    getActiveDiscovery()?.recommendationSet?.recommendations.filter((r) => r.decision === "accepted").map((r) => r.serviceOfferId) ??
    [];

  const copyScope = async () => {
    const text = [
      scope.name.toUpperCase(),
      SCOPE_DISCLAIMER,
      "",
      "INCLUDED",
      ...scope.included.map((x) => `• ${x}`),
      "",
      "NOT INCLUDED",
      ...scope.notIncluded.map((x) => `• ${x}`),
      "",
      "CLIENT RESPONSIBILITIES",
      ...scope.clientResponsibilities.map((x) => `• ${x}`),
      "",
      "PROVIDER RESPONSIBILITIES",
      ...scope.providerResponsibilities.map((x) => `• ${x}`),
      "",
      "OPEN QUESTIONS",
      ...scope.openQuestions.map((x) => `• ${x}`),
      scope.notes && `\nNotes: ${scope.notes}`,
    ].filter(Boolean);
    try {
      await navigator.clipboard.writeText(text.join("\n"));
      toast("Scope copied.");
    } catch {
      toast("Clipboard blocked by the browser.", "info");
    }
  };

  const addToPresentation = () => {
    const p = loadPresentations()[0];
    if (!p) {
      toast("No presentation exists yet — create one in the Presentation Builder first.", "info");
      return;
    }
    upsertPresentation({ ...p, scopeId: scope.id, updatedAt: new Date().toISOString() });
    toast(`Scope attached to "${p.title}".`);
  };

  return (
    <div className="space-y-4">
      <button onClick={() => navigate("/discovery")} className="inline-flex min-h-10 items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Discovery
      </button>
      <header>
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <FileCheck2 className="h-5 w-5 text-accent" /> Preliminary Scope Builder
        </h1>
        <p className="text-sm text-slate-500">{SCOPE_DISCLAIMER}</p>
      </header>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setConfirmRegen(true)} className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-slate-300 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50">
          <RefreshCcw className="h-3.5 w-3.5" /> Regenerate from discovery & estimate
        </button>
        <button onClick={copyScope} className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-slate-300 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50">
          <Copy className="h-3.5 w-3.5" /> Copy
        </button>
        <button onClick={addToPresentation} className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-slate-300 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50">
          <MonitorPlay className="h-3.5 w-3.5" /> Add to presentation
        </button>
      </div>

      <L label="Scope name">
        <input value={scope.name} onChange={(e) => setScope((s) => ({ ...s, name: e.target.value }))} placeholder="e.g. Preliminary scope — Bella Salon" className={inputCls} />
      </L>

      <ListEditor title="Included" tone="green" value={scope.included} onChange={(t) => setList("included", t)} />
      <ListEditor title="Not included" tone="amber" value={scope.notIncluded} onChange={(t) => setList("notIncluded", t)} />
      <ListEditor title="Client responsibilities" tone="blue" value={scope.clientResponsibilities} onChange={(t) => setList("clientResponsibilities", t)} />
      <ListEditor title="Provider responsibilities" tone="blue" value={scope.providerResponsibilities} onChange={(t) => setList("providerResponsibilities", t)} />
      <ListEditor title="Open questions" tone="violet" value={scope.openQuestions} onChange={(t) => setList("openQuestions", t)} />

      <L label="Notes">
        <textarea value={scope.notes} onChange={(e) => setScope((s) => ({ ...s, notes: e.target.value }))} rows={2} placeholder="e.g. Phase 2 items to revisit in January" className={`${inputCls} py-2`} />
      </L>

      {/* Feature-to-value explanations */}
      {featuredServiceIds.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <button onClick={() => setShowValue((v) => !v)} className="flex w-full items-center justify-between text-sm font-semibold text-slate-900">
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-accent" /> Feature-to-value explanations ({featuredServiceIds.length})
            </span>
            <span className="text-xs font-normal text-slate-400">{showValue ? "Hide" : "Show"}</span>
          </button>
          {showValue && (
            <div className="mt-3 space-y-3">
              <p className="text-[11px] italic text-amber-700">
                AI-generated business explanation — verify with client. The "problem addressed" text comes from the catalog.
              </p>
              {featuredServiceIds.map((id) => {
                const svc = getService(id);
                if (!svc) return null;
                const fv = FEATURE_VALUE[svc.demoModule];
                return (
                  <div key={id} className="rounded-xl border border-slate-200 p-3 text-xs">
                    <p className="text-sm font-semibold text-slate-900">{svc.name}</p>
                    <dl className="mt-1.5 space-y-1 text-slate-600">
                      <FvRow k="What it is" v={fv.whatItIs} />
                      <FvRow k="Problem addressed" v={svc.problem} />
                      <FvRow k="How the workflow improves" v={fv.workflowImprovement} />
                      <FvRow k="Operational benefit" v={fv.operationalBenefit} />
                      <FvRow k="Management benefit" v={fv.managementBenefit} />
                      <FvRow k="Customer benefit" v={fv.customerBenefit} />
                      <FvRow k="Employee benefit" v={fv.employeeBenefit} />
                    </dl>
                    {svc.riskLevel !== "low" && (
                      <p className="mt-1.5 text-amber-700">⚠ Caution applies — {svc.riskLevel} risk; verify before committing scope.</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {confirmRegen && (
        <ConfirmDialog
          title="Regenerate the scope?"
          message="The scope will be rebuilt from the active discovery and latest estimate. Your manual edits will be replaced."
          confirmLabel="Regenerate"
          onConfirm={() => {
            const discovery = getActiveDiscovery();
            const estimate = loadEstimates().filter((e) => !e.archived)[0] ?? null;
            const fresh = buildScope(discovery, estimate);
            setScope({ ...fresh, id: scope.id, createdAt: scope.createdAt });
            setConfirmRegen(false);
            toast("Scope regenerated.");
          }}
          onCancel={() => setConfirmRegen(false)}
        />
      )}
    </div>
  );
}

function ListEditor({ title, tone, value, onChange }: { title: string; tone: "green" | "amber" | "blue" | "violet"; value: string[]; onChange: (text: string) => void }) {
  const border = { green: "border-emerald-200", amber: "border-amber-200", blue: "border-sky-200", violet: "border-violet-200" }[tone];
  return (
    <section className={`rounded-2xl border ${border} bg-white p-4 shadow-sm`}>
      <h2 className="mb-1 text-sm font-semibold text-slate-900">{title}</h2>
      <p className="mb-2 text-[11px] text-slate-400">One item per line — edit freely before saving or presenting.</p>
      <textarea
        value={value.join("\n")}
        onChange={(e) => onChange(e.target.value)}
        rows={Math.min(12, Math.max(4, value.length + 1))}
        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
      />
    </section>
  );
}

function FvRow({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="inline font-semibold text-slate-500">{k}:</dt> <dd className="inline">{v}</dd>
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
