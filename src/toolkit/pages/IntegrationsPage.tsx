import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ClipboardCheck, Plug } from "lucide-react";
import { useToast } from "../../store/ToastContext";
import { Modal } from "../../components/common/Modal";
import { Pill } from "../../components/common/Badge";
import { SearchInput } from "../../components/common/SearchInput";
import { pesoRange } from "../../pricing/engine/money";
import type { IntegrationAssessment, IntegrationDef } from "../types";
import { INTEGRATION_CATALOG, INTEGRATION_CATEGORIES, INTEGRATION_STATUS_META } from "../config/integrationCatalog";
import { assessmentRepo, newAssessment } from "../store/toolkitStorage";

const inputCls = "min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm";

export function IntegrationsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [assessing, setAssessing] = useState<IntegrationDef | null>(null);
  const assessments = assessmentRepo.loadAll();

  const visible = INTEGRATION_CATALOG.filter((x) => {
    const q = search.trim().toLowerCase();
    return (!q || x.name.toLowerCase().includes(q) || x.description.toLowerCase().includes(q)) && (!category || x.category === category);
  });

  return (
    <div className="space-y-4">
      <button onClick={() => navigate("/discovery")} className="inline-flex min-h-10 items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Discovery
      </button>
      <header>
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <Plug className="h-5 w-5 text-accent" /> Integration Showcase
        </h1>
        <p className="text-sm text-slate-500">
          What each connection would involve — honestly. Nothing here is live in this demo; statuses describe production work.
        </p>
      </header>

      <SearchInput value={search} onChange={setSearch} placeholder="Search integrations…" />
      <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1">
        <CatChip active={!category} onClick={() => setCategory("")}>All</CatChip>
        {INTEGRATION_CATEGORIES.map((c) => (
          <CatChip key={c} active={category === c} onClick={() => setCategory(c)}>{c}</CatChip>
        ))}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {visible.map((x) => {
          const meta = INTEGRATION_STATUS_META[x.status];
          const hasAssessment = assessments.some((a) => a.integrationId === x.id);
          return (
            <div key={x.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-slate-900">{x.name}</p>
                <Pill tone={meta.tone}>{meta.label}</Pill>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">{x.description}</p>
              <dl className="mt-2 space-y-0.5 text-[11px] text-slate-500">
                <D k="Availability" v={x.availability} />
                {x.setupEstimate && <D k="Setup estimate" v={pesoRange(x.setupEstimate)} />}
                <D k="Third-party cost" v={x.thirdPartyCostNote} />
                <D k="Authentication" v={x.authenticationRequirement} />
                <D k="Data access" v={x.dataAccessConsideration} />
                <D k="Risk" v={x.risk} />
              </dl>
              <div className="mt-2 flex items-center gap-2">
                {x.technicalAssessmentRequired && <Pill tone="violet">Assessment required</Pill>}
                {x.demoAvailable && <Pill tone="green">Concept in demo</Pill>}
                <button
                  onClick={() => setAssessing(x)}
                  className="ml-auto inline-flex min-h-10 items-center gap-1 rounded-lg border border-slate-300 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  <ClipboardCheck className="h-3.5 w-3.5" /> {hasAssessment ? "Edit assessment" : "Assess"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {assessing && (
        <AssessmentModal
          integration={assessing}
          existing={assessments.find((a) => a.integrationId === assessing.id) ?? null}
          onClose={() => setAssessing(null)}
        />
      )}
    </div>
  );
}

function AssessmentModal({ integration, existing, onClose }: { integration: IntegrationDef; existing: IntegrationAssessment | null; onClose: () => void }) {
  const toast = useToast();
  const [a, setA] = useState<IntegrationAssessment>(existing ?? newAssessment(integration.id));
  const set = (patch: Partial<IntegrationAssessment>) => setA((x) => ({ ...x, ...patch }));

  const fields: { key: keyof IntegrationAssessment; label: string }[] = [
    { key: "clientName", label: "Client" },
    { key: "existingProvider", label: "Existing provider" },
    { key: "accountOwnership", label: "Who owns the account?" },
    { key: "apiAvailable", label: "API available?" },
    { key: "documentationAvailable", label: "Documentation available?" },
    { key: "sandboxAvailable", label: "Sandbox / test environment?" },
    { key: "requiredData", label: "Required data" },
    { key: "dataDirection", label: "Data direction (in / out / both)" },
    { key: "frequency", label: "Frequency (real-time / hourly / daily)" },
    { key: "expectedVolume", label: "Expected volume" },
    { key: "authenticationType", label: "Authentication type" },
    { key: "errorHandlingExpectation", label: "Error-handling expectation" },
    { key: "securityRequirement", label: "Security requirement" },
    { key: "technicalContact", label: "Responsible technical contact" },
  ];

  return (
    <Modal title={`Assessment — ${integration.name}`} onClose={onClose} wide>
      <div className="space-y-3">
        <p className="text-xs text-slate-500">
          Answers feed the technical assessment. No integration is committed until this is reviewed.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {fields.map((f) => (
            <label key={f.key} className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">{f.label}</span>
              <input value={String(a[f.key] ?? "")} onChange={(e) => set({ [f.key]: e.target.value } as Partial<IntegrationAssessment>)} className={inputCls} />
            </label>
          ))}
        </div>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">Notes</span>
          <textarea value={a.notes} onChange={(e) => set({ notes: e.target.value })} rows={2} className={`${inputCls} py-2`} />
        </label>
        <button
          onClick={() => {
            assessmentRepo.upsert({ ...a, updatedAt: new Date().toISOString() });
            toast("Integration assessment saved.");
            onClose();
          }}
          className="min-h-11 w-full rounded-xl bg-accent text-sm font-semibold text-white hover:opacity-90"
        >
          Save assessment
        </button>
      </div>
    </Modal>
  );
}

function CatChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`min-h-10 shrink-0 rounded-xl px-3 text-xs font-medium ${active ? "bg-accent text-white" : "border border-slate-300 bg-white text-slate-600"}`}
    >
      {children}
    </button>
  );
}

function D({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="inline font-semibold text-slate-400">{k}:</dt> <dd className="inline">{v}</dd>
    </div>
  );
}
