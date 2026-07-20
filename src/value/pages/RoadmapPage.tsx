import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Map, MonitorPlay, Plus, RotateCcw } from "lucide-react";
import { useToast } from "../../store/ToastContext";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { Modal } from "../../components/common/Modal";
import { Pill } from "../../components/common/Badge";
import { getActiveDiscovery, loadPresentations, upsertPresentation } from "../../discovery/store/discoveryStorage";
import { roadmapForDiscovery } from "../../discovery/engine/workspace";
import { defaultRoadmapStages, ROADMAP_DISCLAIMER } from "../config/roadmapStages";
import { newRoadmap, roadmapRepo } from "../store/valueStorage";
import type { ImplementationRoadmap, RoadmapStage } from "../types";
import { uid } from "../../utils/storage";

const inputCls = "min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm";

export function RoadmapPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [roadmap, setRoadmap] = useState<ImplementationRoadmap>(() => {
    // The ACTIVE client's roadmap only — never the first roadmap that exists.
    const d = getActiveDiscovery();
    const existing = roadmapForDiscovery(d);
    if (existing) return existing;
    return newRoadmap({
      name: d ? `Roadmap — ${d.business.businessName || "client"}` : "Implementation roadmap",
      discoveryId: d?.id,
    });
  });
  const [editStage, setEditStage] = useState<RoadmapStage | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => roadmapRepo.upsert({ ...roadmap, updatedAt: new Date().toISOString() }), 400);
    return () => clearTimeout(t);
  }, [roadmap]);

  const set = (patch: Partial<ImplementationRoadmap>) => setRoadmap((r) => ({ ...r, ...patch }));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= roadmap.stages.length) return;
    const copy = [...roadmap.stages];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    set({ stages: copy });
  };

  const addToPresentation = () => {
    const p = loadPresentations()[0];
    if (!p) {
      toast("No presentation exists yet — create one in the Presentation Builder first.", "info");
      return;
    }
    upsertPresentation({ ...p, roadmapId: roadmap.id, updatedAt: new Date().toISOString() });
    toast(`Roadmap attached to "${p.title}".`);
  };

  return (
    <div className="space-y-4">
      <button onClick={() => navigate("/discovery")} className="inline-flex min-h-10 items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Discovery
      </button>
      <header>
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <Map className="h-5 w-5 text-accent" /> Implementation Roadmap
        </h1>
        <p className="text-sm text-slate-500">{ROADMAP_DISCLAIMER}</p>
      </header>

      <div className="flex flex-wrap gap-2">
        <input value={roadmap.name} onChange={(e) => set({ name: e.target.value })} aria-label="Roadmap name" placeholder="e.g. Roadmap — Bella Salon" className={`${inputCls} flex-1 sm:max-w-xs`} />
        <button onClick={addToPresentation} className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-slate-300 px-3 text-sm font-medium text-slate-600 hover:bg-slate-50">
          <MonitorPlay className="h-4 w-4" /> Add to presentation
        </button>
        <button onClick={() => setConfirmReset(true)} className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-red-200 px-3 text-sm font-medium text-red-600 hover:bg-red-50">
          <RotateCcw className="h-4 w-4" /> Reset stages
        </button>
      </div>

      {/* Visual timeline */}
      <ol className="relative space-y-2 border-l-2 border-accent/30 pl-5">
        {roadmap.stages.map((s, i) => (
          <li key={s.id} className="relative">
            <span className={`absolute -left-[27px] top-3 h-3.5 w-3.5 rounded-full border-2 border-white ${s.milestone ? "bg-amber-500" : "bg-accent"}`} />
            <button
              onClick={() => setEditStage(s)}
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm hover:border-slate-300"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-slate-900">
                  <span className="mr-1.5 text-xs text-slate-400">{i + 1}.</span>
                  {s.title}
                </p>
                <span className="shrink-0 text-[11px] text-slate-400">{s.durationRange}</span>
              </div>
              {s.description && <p className="mt-0.5 text-xs text-slate-500">{s.description}</p>}
              <div className="mt-1 flex flex-wrap gap-1">
                <Pill tone="gray">{s.responsible}</Pill>
                {s.milestone && <Pill tone="amber">Milestone</Pill>}
                {s.clientDependency && <Pill tone="blue">Client dependency</Pill>}
                {s.technicalReview && <Pill tone="violet">Technical review</Pill>}
              </div>
            </button>
            <div className="mt-0.5 flex justify-end gap-1">
              <MiniBtn label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>↑</MiniBtn>
              <MiniBtn label="Move down" disabled={i === roadmap.stages.length - 1} onClick={() => move(i, 1)}>↓</MiniBtn>
            </div>
          </li>
        ))}
      </ol>

      <button
        onClick={() => {
          const s: RoadmapStage = { id: uid(), title: "New stage", description: "", responsible: "Provider", durationRange: "TBD", clientDependency: false, technicalReview: false, milestone: false };
          set({ stages: [...roadmap.stages, s] });
          setEditStage(s);
        }}
        className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 text-sm font-medium text-slate-600 hover:bg-slate-50"
      >
        <Plus className="h-4 w-4" /> Add stage
      </button>

      {editStage && (
        <Modal title="Edit stage" onClose={() => setEditStage(null)}>
          <div className="space-y-3">
            <L label="Stage title"><input value={editStage.title} onChange={(e) => updateStage({ ...editStage, title: e.target.value })} placeholder="e.g. Client acceptance testing" className={inputCls} /></L>
            <L label="Description"><textarea value={editStage.description} onChange={(e) => updateStage({ ...editStage, description: e.target.value })} rows={2} placeholder="e.g. Client verifies the flows against agreed scenarios" className={`${inputCls} py-2`} /></L>
            <div className="grid grid-cols-2 gap-3">
              <L label="Responsible party">
                <select value={editStage.responsible} onChange={(e) => updateStage({ ...editStage, responsible: e.target.value })} className={inputCls}>
                  <option>Provider</option>
                  <option>Client</option>
                  <option>Both</option>
                </select>
              </L>
              <L label="Estimated duration range"><input value={editStage.durationRange} onChange={(e) => updateStage({ ...editStage, durationRange: e.target.value })} placeholder="e.g. 1–2 weeks" className={inputCls} /></L>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {([["clientDependency", "Client dependency"], ["technicalReview", "Technical review"], ["milestone", "Milestone"]] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => updateStage({ ...editStage, [key]: !editStage[key] })}
                  aria-pressed={editStage[key]}
                  className={`min-h-10 rounded-lg px-3 text-xs font-medium ${editStage[key] ? "bg-accent text-white" : "border border-slate-300 text-slate-600 hover:bg-slate-50"}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => {
                  set({ stages: roadmap.stages.filter((x) => x.id !== editStage.id) });
                  setEditStage(null);
                }}
                className="min-h-11 flex-1 rounded-xl border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Remove stage
              </button>
              <button onClick={() => setEditStage(null)} className="min-h-11 flex-1 rounded-xl bg-accent text-sm font-semibold text-white hover:opacity-90">
                Done
              </button>
            </div>
          </div>
        </Modal>
      )}

      {confirmReset && (
        <ConfirmDialog
          title="Reset to the default 13 stages?"
          message="Your stage edits will be replaced by the standard implementation sequence."
          confirmLabel="Reset"
          onConfirm={() => {
            set({ stages: defaultRoadmapStages() });
            setConfirmReset(false);
            toast("Roadmap reset to default stages.");
          }}
          onCancel={() => setConfirmReset(false)}
        />
      )}
    </div>
  );

  function updateStage(next: RoadmapStage) {
    setRoadmap((r) => ({ ...r, stages: r.stages.map((x) => (x.id === next.id ? next : x)) }));
    setEditStage(next);
  }
}

function MiniBtn({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button aria-label={label} title={label} disabled={disabled} onClick={onClick} className="inline-flex h-7 min-w-7 items-center justify-center rounded border border-slate-200 px-1.5 text-xs text-slate-500 hover:bg-slate-50 disabled:opacity-30">
      {children}
    </button>
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
