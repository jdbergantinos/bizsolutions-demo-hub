import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowDown, ArrowLeft, ArrowRight, Copy, GitCompareArrows, Plus, Trash2 } from "lucide-react";
import { useToast } from "../../store/ToastContext";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { EmptyState } from "../../components/common/EmptyState";
import { Modal } from "../../components/common/Modal";
import { Pill } from "../../components/common/Badge";
import { MODULE_TEMPLATES } from "../../data/serviceTemplates";
import type { DemoModuleType } from "../../types";
import type { CurrentWorkflowStep, ProposedWorkflowStep, WorkflowComparison } from "../types";
import { templateCurrentSteps, templateProposedSteps } from "../config/workflowTemplates";
import { workflowSavings } from "../engine/recommend";
import { getActiveDiscovery, loadWorkflows, upsertDiscovery, upsertWorkflow, deleteWorkflow } from "../store/discoveryStorage";
import { uid } from "../../utils/storage";

const inputCls = "min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm";

const FLAG_LABELS: Record<keyof CurrentWorkflowStep["flags"], string> = {
  bottleneck: "Bottleneck",
  approvalPoint: "Approval point",
  customerInteraction: "Customer interaction",
  duplicateEntry: "Duplicate entry",
  reportingStep: "Reporting step",
};

function newWorkflow(discoveryId?: string, industryId?: string): WorkflowComparison {
  const now = new Date().toISOString();
  return {
    schemaVersion: 1,
    id: uid(),
    name: "Before & After Workflow",
    discoveryId,
    industryId,
    createdAt: now,
    updatedAt: now,
    current: templateCurrentSteps(),
    proposed: templateProposedSteps(),
  };
}

export function WorkflowComparisonPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [workflow, setWorkflow] = useState<WorkflowComparison | null>(() => {
    const discovery = getActiveDiscovery();
    // Reuse the discovery's linked workflow when it exists.
    if (discovery?.workflowId) {
      const existing = loadWorkflows().find((w) => w.id === discovery.workflowId);
      if (existing) return existing;
    }
    const existing = loadWorkflows()[0];
    if (existing && !params.get("template")) return existing;
    const w = newWorkflow(discovery?.id, params.get("industry") ?? discovery?.business.industryId);
    upsertWorkflow(w);
    if (discovery) upsertDiscovery({ ...discovery, workflowId: w.id, updatedAt: new Date().toISOString() });
    return w;
  });
  const [editCurrent, setEditCurrent] = useState<CurrentWorkflowStep | null>(null);
  const [editProposed, setEditProposed] = useState<ProposedWorkflowStep | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  // Persist edits.
  useEffect(() => {
    if (workflow) upsertWorkflow({ ...workflow, updatedAt: new Date().toISOString() });
  }, [workflow]);

  if (!workflow) {
    return <EmptyState icon="GitCompareArrows" title="No workflow" message="Something went wrong creating the workflow." />;
  }

  const set = (patch: Partial<WorkflowComparison>) => setWorkflow((w) => (w ? { ...w, ...patch } : w));

  const totalMinutes = workflow.current.reduce((s, x) => s + x.estimatedMinutes, 0);
  const totalDelay = workflow.current.reduce((s, x) => s + x.delayMinutes, 0);
  const savings = workflowSavings(totalMinutes, totalDelay, workflow.proposed.length, workflow.current.length);

  const move = <T,>(list: T[], i: number, dir: -1 | 1): T[] => {
    const j = i + dir;
    if (j < 0 || j >= list.length) return list;
    const copy = [...list];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    return copy;
  };

  const copyComparison = async () => {
    const text = [
      `WORKFLOW COMPARISON — ${workflow.name}`,
      "",
      "CURRENT (manual):",
      ...workflow.current.map((s, i) => `${i + 1}. ${s.title} (${s.responsible}, ${s.tool}, ~${s.estimatedMinutes} min + ${s.delayMinutes} min waiting)`),
      "",
      "PROPOSED (with the system):",
      ...workflow.proposed.map((s, i) => `${i + 1}. ${s.title}${s.automated ? " [automated]" : ""} (${s.responsibleRole})`),
      "",
      `Current process time: ~${savings.currentTotalMinutes} minutes including waiting.`,
      `Step reduction: ${savings.stepReduction} step(s).`,
      savings.note,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      toast("Workflow comparison copied.");
    } catch {
      toast("Clipboard blocked by the browser.", "info");
    }
  };

  return (
    <div className="space-y-4">
      <button onClick={() => navigate("/discovery")} className="inline-flex min-h-10 items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Discovery
      </button>
      <header className="flex items-start justify-between gap-2">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <GitCompareArrows className="h-5 w-5 text-accent" /> Workflow Comparison
          </h1>
          <input
            value={workflow.name}
            onChange={(e) => set({ name: e.target.value })}
            aria-label="Workflow name"
            className="mt-1 w-full max-w-xs rounded-lg border border-transparent px-1 text-sm text-slate-500 hover:border-slate-200 focus:border-slate-300 focus:outline-none"
          />
        </div>
        <div className="flex gap-2">
          <button onClick={copyComparison} aria-label="Copy comparison" className="min-h-10 rounded-lg border border-slate-300 px-3 text-slate-600 hover:bg-slate-50">
            <Copy className="h-4 w-4" />
          </button>
          <button onClick={() => setConfirmReset(true)} aria-label="Reset workflow to template" className="min-h-10 rounded-lg border border-red-200 px-3 text-red-600 hover:bg-red-50">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Estimated impact */}
      <div className="grid grid-cols-3 gap-2">
        <StatCard label="Current process time" value={`~${savings.currentTotalMinutes} min`} sub="incl. waiting" />
        <StatCard label="Current steps" value={String(workflow.current.length)} sub={`${workflow.current.filter((s) => s.flags.bottleneck).length} bottleneck(s)`} />
        <StatCard label="Step reduction" value={`−${savings.stepReduction}`} sub="proposed vs current" />
      </div>
      <p className="text-xs italic text-slate-400">{savings.note}</p>

      {/* Side-by-side on desktop, stacked on mobile */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Current */}
        <section>
          <h2 className="mb-2 text-sm font-semibold text-slate-800">Current workflow (manual)</h2>
          <div className="space-y-1.5">
            {workflow.current.map((s, i) => (
              <div key={s.id}>
                <button
                  onClick={() => setEditCurrent(s)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm hover:border-slate-300"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-slate-900">
                      <span className="mr-1.5 text-xs text-slate-400">{i + 1}.</span>
                      {s.title}
                    </p>
                    <span className="shrink-0 text-[11px] text-slate-400">~{s.estimatedMinutes + s.delayMinutes} min</span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {s.responsible} · {s.tool}
                    {s.commonError ? ` · ⚠ ${s.commonError}` : ""}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {(Object.keys(FLAG_LABELS) as (keyof typeof FLAG_LABELS)[])
                      .filter((f) => s.flags[f])
                      .map((f) => (
                        <Pill key={f} tone={f === "bottleneck" ? "red" : f === "approvalPoint" ? "amber" : "gray"}>
                          {FLAG_LABELS[f]}
                        </Pill>
                      ))}
                  </div>
                </button>
                <div className="mt-0.5 flex justify-end gap-1 pr-1">
                  <MiniBtn label="Move up" disabled={i === 0} onClick={() => set({ current: move(workflow.current, i, -1) })}>↑</MiniBtn>
                  <MiniBtn label="Move down" disabled={i === workflow.current.length - 1} onClick={() => set({ current: move(workflow.current, i, 1) })}>↓</MiniBtn>
                  <MiniBtn label="Duplicate" onClick={() => set({ current: [...workflow.current.slice(0, i + 1), { ...s, id: uid(), title: s.title + " (copy)" }, ...workflow.current.slice(i + 1)] })}>⧉</MiniBtn>
                  <MiniBtn
                    label="Convert to proposed step"
                    onClick={() => {
                      const proposed: ProposedWorkflowStep = {
                        id: uid(),
                        title: s.title,
                        automated: false,
                        responsibleRole: s.responsible,
                        relatedModule: "",
                        expectedResult: "Recorded in the system instead of " + (s.tool || "manual tools"),
                        notification: "",
                        requiresApproval: s.flags.approvalPoint,
                        notes: s.notes,
                      };
                      set({ proposed: [...workflow.proposed, proposed] });
                      toast("Step converted into the proposed workflow.");
                    }}
                  >
                    <ArrowRight className="h-3 w-3" />
                  </MiniBtn>
                </div>
                {i < workflow.current.length - 1 && <ArrowDown className="mx-auto my-0.5 h-3.5 w-3.5 text-slate-300" />}
              </div>
            ))}
          </div>
          <button
            onClick={() => {
              const s: CurrentWorkflowStep = { id: uid(), title: "New step", description: "", responsible: "", tool: "", estimatedMinutes: 5, delayMinutes: 0, commonError: "", notes: "", flags: { bottleneck: false, approvalPoint: false, customerInteraction: false, duplicateEntry: false, reportingStep: false } };
              set({ current: [...workflow.current, s] });
              setEditCurrent(s);
            }}
            className="mt-2 inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <Plus className="h-4 w-4" /> Add current step
          </button>
        </section>

        {/* Proposed */}
        <section>
          <h2 className="mb-2 text-sm font-semibold text-slate-800">Proposed workflow (with the system)</h2>
          <div className="space-y-1.5">
            {workflow.proposed.map((s, i) => (
              <div key={s.id}>
                <button
                  onClick={() => setEditProposed(s)}
                  className="w-full rounded-xl border border-accent/40 bg-accent-soft/40 p-3 text-left shadow-sm hover:border-accent"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-slate-900">
                      <span className="mr-1.5 text-xs text-slate-400">{i + 1}.</span>
                      {s.title}
                    </p>
                    {s.automated && <Pill tone="green">Automated</Pill>}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {s.responsibleRole}
                    {s.relatedModule ? ` · ${MODULE_TEMPLATES[s.relatedModule].label}` : ""}
                    {s.requiresApproval ? " · Approval required" : ""}
                  </p>
                  {s.expectedResult && <p className="mt-0.5 text-[11px] text-slate-400">→ {s.expectedResult}</p>}
                  {s.notification && <p className="text-[11px] text-emerald-700">🔔 {s.notification}</p>}
                </button>
                <div className="mt-0.5 flex justify-end gap-1 pr-1">
                  <MiniBtn label="Move up" disabled={i === 0} onClick={() => set({ proposed: move(workflow.proposed, i, -1) })}>↑</MiniBtn>
                  <MiniBtn label="Move down" disabled={i === workflow.proposed.length - 1} onClick={() => set({ proposed: move(workflow.proposed, i, 1) })}>↓</MiniBtn>
                  <MiniBtn label="Duplicate" onClick={() => set({ proposed: [...workflow.proposed.slice(0, i + 1), { ...s, id: uid(), title: s.title + " (copy)" }, ...workflow.proposed.slice(i + 1)] })}>⧉</MiniBtn>
                </div>
                {i < workflow.proposed.length - 1 && <ArrowDown className="mx-auto my-0.5 h-3.5 w-3.5 text-accent/50" />}
              </div>
            ))}
          </div>
          <button
            onClick={() => {
              const s: ProposedWorkflowStep = { id: uid(), title: "New step", automated: false, responsibleRole: "", relatedModule: "", expectedResult: "", notification: "", requiresApproval: false, notes: "" };
              set({ proposed: [...workflow.proposed, s] });
              setEditProposed(s);
            }}
            className="mt-2 inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <Plus className="h-4 w-4" /> Add proposed step
          </button>
        </section>
      </div>

      {/* Editors */}
      {editCurrent && (
        <Modal title="Edit current step" onClose={() => setEditCurrent(null)} wide>
          <CurrentStepForm
            step={editCurrent}
            onChange={(s) => {
              set({ current: workflow.current.map((x) => (x.id === s.id ? s : x)) });
              setEditCurrent(s);
            }}
            onDelete={() => {
              set({ current: workflow.current.filter((x) => x.id !== editCurrent.id) });
              setEditCurrent(null);
            }}
            onClose={() => setEditCurrent(null)}
          />
        </Modal>
      )}
      {editProposed && (
        <Modal title="Edit proposed step" onClose={() => setEditProposed(null)} wide>
          <ProposedStepForm
            step={editProposed}
            onChange={(s) => {
              set({ proposed: workflow.proposed.map((x) => (x.id === s.id ? s : x)) });
              setEditProposed(s);
            }}
            onDelete={() => {
              set({ proposed: workflow.proposed.filter((x) => x.id !== editProposed.id) });
              setEditProposed(null);
            }}
            onClose={() => setEditProposed(null)}
          />
        </Modal>
      )}

      {confirmReset && (
        <ConfirmDialog
          title="Reset to the template workflow?"
          message="Both step lists will be replaced by the example template. Your edits to this comparison will be lost."
          confirmLabel="Reset"
          onConfirm={() => {
            deleteWorkflow(workflow.id);
            const w = newWorkflow(workflow.discoveryId, workflow.industryId);
            upsertWorkflow(w);
            setWorkflow(w);
            setConfirmReset(false);
            toast("Workflow reset to template.");
          }}
          onCancel={() => setConfirmReset(false)}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
      <p className="text-lg font-bold text-slate-900">{value}</p>
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className="text-[10px] text-slate-400">{sub}</p>
    </div>
  );
}

function MiniBtn({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-7 min-w-7 items-center justify-center rounded border border-slate-200 px-1.5 text-xs text-slate-500 hover:bg-slate-50 disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function CurrentStepForm({ step, onChange, onDelete, onClose }: { step: CurrentWorkflowStep; onChange: (s: CurrentWorkflowStep) => void; onDelete: () => void; onClose: () => void }) {
  return (
    <div className="space-y-3">
      <L label="Step title"><input value={step.title} onChange={(e) => onChange({ ...step, title: e.target.value })} className={inputCls} /></L>
      <L label="Description"><textarea value={step.description} onChange={(e) => onChange({ ...step, description: e.target.value })} rows={2} className={`${inputCls} py-2`} /></L>
      <div className="grid grid-cols-2 gap-3">
        <L label="Responsible person / role"><input value={step.responsible} onChange={(e) => onChange({ ...step, responsible: e.target.value })} className={inputCls} /></L>
        <L label="Current tool"><input value={step.tool} onChange={(e) => onChange({ ...step, tool: e.target.value })} className={inputCls} /></L>
        <L label="Estimated time (minutes)"><input type="number" min={0} value={step.estimatedMinutes} onChange={(e) => onChange({ ...step, estimatedMinutes: Math.max(0, Number(e.target.value) || 0) })} className={inputCls} /></L>
        <L label="Typical waiting / delay (minutes)"><input type="number" min={0} value={step.delayMinutes} onChange={(e) => onChange({ ...step, delayMinutes: Math.max(0, Number(e.target.value) || 0) })} className={inputCls} /></L>
      </div>
      <L label="Common error"><input value={step.commonError} onChange={(e) => onChange({ ...step, commonError: e.target.value })} className={inputCls} /></L>
      <L label="Notes"><textarea value={step.notes} onChange={(e) => onChange({ ...step, notes: e.target.value })} rows={2} className={`${inputCls} py-2`} /></L>
      <div>
        <p className="mb-1 text-xs font-medium text-slate-600">Mark this step as:</p>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(FLAG_LABELS) as (keyof typeof FLAG_LABELS)[]).map((f) => (
            <button
              key={f}
              onClick={() => onChange({ ...step, flags: { ...step.flags, [f]: !step.flags[f] } })}
              aria-pressed={step.flags[f]}
              className={`min-h-10 rounded-lg px-3 text-xs font-medium ${step.flags[f] ? "bg-accent text-white" : "border border-slate-300 text-slate-600 hover:bg-slate-50"}`}
            >
              {FLAG_LABELS[f]}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={onDelete} className="min-h-11 flex-1 rounded-xl border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50">Delete step</button>
        <button onClick={onClose} className="min-h-11 flex-1 rounded-xl bg-accent text-sm font-semibold text-white hover:opacity-90">Done</button>
      </div>
    </div>
  );
}

function ProposedStepForm({ step, onChange, onDelete, onClose }: { step: ProposedWorkflowStep; onChange: (s: ProposedWorkflowStep) => void; onDelete: () => void; onClose: () => void }) {
  return (
    <div className="space-y-3">
      <L label="Step title"><input value={step.title} onChange={(e) => onChange({ ...step, title: e.target.value })} className={inputCls} /></L>
      <div className="grid grid-cols-2 gap-3">
        <L label="Execution">
          <select value={step.automated ? "auto" : "manual"} onChange={(e) => onChange({ ...step, automated: e.target.value === "auto" })} className={inputCls}>
            <option value="manual">Manual (staff performs it)</option>
            <option value="auto">Automated (system performs it)</option>
          </select>
        </L>
        <L label="Responsible role"><input value={step.responsibleRole} onChange={(e) => onChange({ ...step, responsibleRole: e.target.value })} className={inputCls} /></L>
      </div>
      <L label="Related module">
        <select value={step.relatedModule} onChange={(e) => onChange({ ...step, relatedModule: e.target.value as DemoModuleType | "" })} className={inputCls}>
          <option value="">— None —</option>
          {(Object.keys(MODULE_TEMPLATES) as DemoModuleType[]).map((m) => (
            <option key={m} value={m}>{MODULE_TEMPLATES[m].label}</option>
          ))}
        </select>
      </L>
      <L label="Expected result"><input value={step.expectedResult} onChange={(e) => onChange({ ...step, expectedResult: e.target.value })} className={inputCls} /></L>
      <L label="Notification (simulated)"><input value={step.notification} onChange={(e) => onChange({ ...step, notification: e.target.value })} placeholder="e.g. Customer receives status update" className={inputCls} /></L>
      <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm text-slate-700">
        <input type="checkbox" checked={step.requiresApproval} onChange={(e) => onChange({ ...step, requiresApproval: e.target.checked })} className="h-4 w-4 accent-[var(--app-accent)]" />
        Requires approval
      </label>
      <L label="Notes"><textarea value={step.notes} onChange={(e) => onChange({ ...step, notes: e.target.value })} rows={2} className={`${inputCls} py-2`} /></L>
      <div className="flex gap-2 pt-1">
        <button onClick={onDelete} className="min-h-11 flex-1 rounded-xl border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50">Delete step</button>
        <button onClick={onClose} className="min-h-11 flex-1 rounded-xl bg-accent text-sm font-semibold text-white hover:opacity-90">Done</button>
      </div>
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
