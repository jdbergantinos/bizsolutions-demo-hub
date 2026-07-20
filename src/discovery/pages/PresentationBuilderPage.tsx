import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Copy, Eye, MonitorPlay, Plus, RotateCcw, Trash2 } from "lucide-react";
import { getIndustry, INDUSTRIES } from "../../data/catalog";
import { useApp } from "../../store/AppStore";
import { useToast } from "../../store/ToastContext";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { Pill } from "../../components/common/Badge";
import type { SalesPresentation } from "../types";
import { SECTION_META, defaultSections } from "../config/sections";
import { loadEstimates } from "../../pricing/store/pricingStorage";
import {
  deletePresentation, getActiveDiscovery, loadDiscoveries, loadPresentations,
  loadWorkflows, newPresentation, upsertPresentation,
} from "../store/discoveryStorage";
import { uid } from "../../utils/storage";

const ACCENTS = ["#0f4c81", "#0e7490", "#15803d", "#b45309", "#be185d", "#6d28d9"];
const inputCls = "min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm";

export function PresentationBuilderPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { solutions } = useApp();

  const [all, setAll] = useState<SalesPresentation[]>(loadPresentations);
  const [p, setP] = useState<SalesPresentation | null>(() => {
    const discoveryId = params.get("discovery");
    const fromSolutions = params.get("fromSolutions") === "1";
    if (discoveryId) {
      const existing = loadPresentations().find((x) => x.discoveryId === discoveryId);
      if (existing) return existing;
      const d = loadDiscoveries().find((x) => x.id === discoveryId);
      if (d) {
        const accepted = d.recommendationSet?.recommendations.filter((r) => r.decision === "accepted") ?? [];
        return newPresentation({
          title: `Presentation for ${d.business.businessName || "client"}`,
          businessName: d.business.businessName,
          industryId: d.business.industryId,
          businessExample: d.business.businessExample,
          location: d.business.location,
          discoveryId: d.id,
          workflowId: d.workflowId,
          demoServiceIds: accepted.slice(0, 4).map((r) => r.serviceOfferId),
        });
      }
    }
    if (fromSolutions && solutions.length > 0) {
      return newPresentation({
        industryId: solutions[0].industryId,
        demoServiceIds: solutions.map((s) => s.serviceId).slice(0, 6),
      });
    }
    const active = getActiveDiscovery();
    const existing = loadPresentations()[0];
    if (existing) return existing;
    if (active) {
      return newPresentation({
        title: `Presentation for ${active.business.businessName || "client"}`,
        businessName: active.business.businessName,
        industryId: active.business.industryId,
        businessExample: active.business.businessExample,
        discoveryId: active.id,
        workflowId: active.workflowId,
      });
    }
    return null;
  });
  const [confirmReset, setConfirmReset] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Persist edits (debounced).
  useEffect(() => {
    if (!p) return;
    const t = setTimeout(() => setAll(upsertPresentation({ ...p, updatedAt: new Date().toISOString() })), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p]);

  const industry = p ? getIndustry(p.industryId) : undefined;
  const workflows = loadWorkflows();
  const estimates = loadEstimates().filter((e) => !e.archived);
  const set = (patch: Partial<SalesPresentation>) => setP((x) => (x ? { ...x, ...patch } : x));

  if (!p) {
    return (
      <div className="space-y-4">
        <Header />
        <button
          onClick={() => setP(newPresentation())}
          className="flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-accent text-sm font-bold text-white hover:opacity-90"
        >
          <Plus className="h-5 w-5" /> New presentation
        </button>
        <p className="text-center text-sm text-slate-400">
          Tip: run a discovery first — the builder prefills everything from it.
        </p>
      </div>
    );
  }

  const moveSection = (index: number, dir: -1 | 1) => {
    const j = index + dir;
    if (j < 0 || j >= p.sections.length) return;
    const copy = [...p.sections];
    [copy[index], copy[j]] = [copy[j], copy[index]];
    set({ sections: copy });
  };

  return (
    <div className="space-y-4">
      <Header />

      {/* Presentation picker */}
      {all.length > 0 && (
        <div className="flex gap-2">
          <select
            value={p.id}
            onChange={(e) => {
              const found = all.find((x) => x.id === e.target.value);
              if (found) setP(found);
            }}
            aria-label="Select presentation"
            className={`${inputCls} flex-1`}
          >
            {all.map((x) => (
              <option key={x.id} value={x.id}>
                {x.title} {x.businessName ? `— ${x.businessName}` : ""}
              </option>
            ))}
            {!all.some((x) => x.id === p.id) && <option value={p.id}>{p.title} (unsaved)</option>}
          </select>
          <button
            onClick={() => setP(newPresentation())}
            aria-label="New presentation"
            className="min-h-11 rounded-xl border border-slate-300 px-3 text-slate-600 hover:bg-slate-50"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              const copy = { ...p, id: uid(), title: p.title + " (Copy)", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
              setAll(upsertPresentation(copy));
              setP(copy);
              toast("Presentation duplicated.");
            }}
            aria-label="Duplicate presentation"
            className="min-h-11 rounded-xl border border-slate-300 px-3 text-slate-600 hover:bg-slate-50"
          >
            <Copy className="h-4 w-4" />
          </button>
          <button onClick={() => setConfirmReset(true)} aria-label="Delete presentation" className="min-h-11 rounded-xl border border-red-200 px-3 text-red-600 hover:bg-red-50">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Client & meeting details */}
      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Client & meeting</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <L label="Presentation title"><input value={p.title} onChange={(e) => set({ title: e.target.value })} className={inputCls} /></L>
          <L label="Client business name"><input value={p.businessName} onChange={(e) => set({ businessName: e.target.value })} className={inputCls} /></L>
          <L label="Industry">
            <select value={p.industryId} onChange={(e) => set({ industryId: e.target.value, businessExample: "" })} className={inputCls}>
              <option value="">— Select —</option>
              {INDUSTRIES.map((i) => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
          </L>
          <L label="Business example">
            <select value={p.businessExample} onChange={(e) => set({ businessExample: e.target.value })} className={inputCls} disabled={!industry}>
              <option value="">— Select —</option>
              {industry?.examples.map((ex) => (
                <option key={ex} value={ex}>{ex}</option>
              ))}
            </select>
          </L>
          <L label="Client location"><input value={p.location} onChange={(e) => set({ location: e.target.value })} className={inputCls} /></L>
          <L label="Presenter name"><input value={p.presenterName} onChange={(e) => set({ presenterName: e.target.value })} className={inputCls} /></L>
          <L label="Meeting date"><input type="date" value={p.meetingDate} onChange={(e) => set({ meetingDate: e.target.value })} className={inputCls} /></L>
          <L label="Meeting purpose"><input value={p.meetingPurpose} onChange={(e) => set({ meetingPurpose: e.target.value })} placeholder="e.g. First solution presentation" className={inputCls} /></L>
        </div>
        <L label="Presenter-only notes (never shown in client view)">
          <textarea value={p.presenterNotes} onChange={(e) => set({ presenterNotes: e.target.value })} rows={2} className={`${inputCls} py-2`} />
        </L>
      </section>

      {/* Branding */}
      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Client branding</h2>
        <L label="Accent color">
          <div className="flex items-center gap-2">
            {ACCENTS.map((c) => (
              <button key={c} type="button" aria-label={`Accent ${c}`} onClick={() => set({ accentColor: c })}
                className={`h-9 w-9 rounded-full border-2 ${p.accentColor === c ? "border-slate-900" : "border-transparent"}`}
                style={{ backgroundColor: c }} />
            ))}
            <input type="color" value={p.accentColor ?? "#0f4c81"} onChange={(e) => set({ accentColor: e.target.value })} aria-label="Custom accent color" className="h-9 w-9 cursor-pointer rounded-full border border-slate-300" />
          </div>
        </L>
        <L label="Client logo (stored only on this device)">
          <div className="flex items-center gap-3">
            {p.logo && <img src={p.logo} alt="Logo preview" className="h-11 w-11 rounded-lg border border-slate-200 object-cover" />}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const reader = new FileReader();
                reader.onload = () => set({ logo: String(reader.result) });
                reader.readAsDataURL(f);
              }}
              className="text-xs"
            />
            {p.logo && (
              <button type="button" onClick={() => { set({ logo: undefined }); if (fileRef.current) fileRef.current.value = ""; }} className="text-xs font-medium text-red-600 hover:underline">
                Remove
              </button>
            )}
          </div>
        </L>
      </section>

      {/* Content links */}
      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Content sources</h2>
        <L label="Discovery record (problems & challenges)">
          <select value={p.discoveryId ?? ""} onChange={(e) => set({ discoveryId: e.target.value || undefined })} className={inputCls}>
            <option value="">— None —</option>
            {loadDiscoveries().map((d) => (
              <option key={d.id} value={d.id}>{d.business.businessName || "Unnamed"} ({d.problems.length} problems)</option>
            ))}
          </select>
        </L>
        <L label="Workflow comparison">
          <select value={p.workflowId ?? ""} onChange={(e) => set({ workflowId: e.target.value || undefined })} className={inputCls}>
            <option value="">— None —</option>
            {workflows.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </L>
        <L label="Pricing estimate (client view only)">
          <select value={p.estimateId ?? ""} onChange={(e) => set({ estimateId: e.target.value || undefined })} className={inputCls}>
            <option value="">— None —</option>
            {estimates.map((e) => (
              <option key={e.id} value={e.id}>{e.estimateNumber} · {e.input.businessName}</option>
            ))}
          </select>
        </L>
        {industry && (
          <L label="Demos to feature">
            <div className="max-h-40 space-y-1 overflow-y-auto rounded-xl border border-slate-200 p-2">
              {industry.services.map((s) => (
                <label key={s.id} className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg px-2 text-sm hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={p.demoServiceIds.includes(s.id)}
                    onChange={(e) =>
                      set({
                        demoServiceIds: e.target.checked
                          ? [...p.demoServiceIds, s.id]
                          : p.demoServiceIds.filter((x) => x !== s.id),
                      })
                    }
                    className="h-4 w-4 accent-[var(--app-accent)]"
                  />
                  {s.name}
                </label>
              ))}
            </div>
          </L>
        )}
      </section>

      {/* Sections */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-1 text-sm font-semibold text-slate-900">Presentation sections</h2>
        <p className="mb-2 text-xs text-slate-400">Toggle sections off to hide them; reorder with the arrows.</p>
        <ul className="space-y-1">
          {p.sections.map((s, i) => (
            <li key={s.id} className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
              <input
                type="checkbox"
                checked={s.enabled}
                aria-label={`Include ${SECTION_META[s.id].title}`}
                onChange={(e) => set({ sections: p.sections.map((x) => (x.id === s.id ? { ...x, enabled: e.target.checked } : x)) })}
                className="h-4 w-4 accent-[var(--app-accent)]"
              />
              <span className={`flex-1 text-sm ${s.enabled ? "text-slate-800" : "text-slate-400 line-through"}`}>
                {SECTION_META[s.id].title}
              </span>
              {(s.id === "implementation-process" || s.id === "next-steps") && <Pill tone="gray">outline</Pill>}
              <button aria-label="Move up" disabled={i === 0} onClick={() => moveSection(i, -1)} className="rounded border border-slate-200 px-1.5 py-0.5 text-xs text-slate-500 disabled:opacity-30">↑</button>
              <button aria-label="Move down" disabled={i === p.sections.length - 1} onClick={() => moveSection(i, 1)} className="rounded border border-slate-200 px-1.5 py-0.5 text-xs text-slate-500 disabled:opacity-30">↓</button>
            </li>
          ))}
        </ul>
        <button
          onClick={() => set({ sections: defaultSections() })}
          className="mt-2 inline-flex min-h-10 items-center gap-1 rounded-lg border border-slate-300 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Restore default sections
        </button>
      </section>

      {/* Launch */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => {
            if (!p.businessName.trim()) {
              toast("Enter the client's business name first.", "info");
              return;
            }
            navigate(`/presentation?id=${p.id}&preview=1`);
          }}
          className="flex min-h-13 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <Eye className="h-4 w-4" /> Preview
        </button>
        <button
          onClick={() => {
            if (!p.businessName.trim()) {
              toast("Enter the client's business name first.", "info");
              return;
            }
            navigate(`/presentation?id=${p.id}`);
          }}
          className="flex min-h-13 items-center justify-center gap-2 rounded-xl bg-accent text-sm font-bold text-white hover:opacity-90"
        >
          <MonitorPlay className="h-5 w-5" /> Start presentation
        </button>
      </div>

      {confirmReset && (
        <ConfirmDialog
          title="Delete this presentation?"
          message={`"${p.title}" will be removed from this device.`}
          confirmLabel="Delete"
          onConfirm={() => {
            const next = deletePresentation(p.id);
            setAll(next);
            setP(next[0] ?? null);
            setConfirmReset(false);
            toast("Presentation deleted.");
          }}
          onCancel={() => setConfirmReset(false)}
        />
      )}
    </div>
  );
}

function Header() {
  const navigate = useNavigate();
  return (
    <>
      <button onClick={() => navigate("/discovery")} className="inline-flex min-h-10 items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Discovery
      </button>
      <header>
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <MonitorPlay className="h-5 w-5 text-accent" /> Presentation Builder
        </h1>
        <p className="text-sm text-slate-500">Assemble a client-branded guided presentation from your discovery work.</p>
      </header>
    </>
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
