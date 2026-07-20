import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Copy as CopyIcon, ExternalLink, MonitorPlay, RotateCcw } from "lucide-react";
import { useToast } from "../../store/ToastContext";
import { Modal } from "../../components/common/Modal";
import { Pill } from "../../components/common/Badge";
import { SearchInput } from "../../components/common/SearchInput";
import { getIndustry } from "../../data/catalog";
import { MODULE_TEMPLATES } from "../../data/serviceTemplates";
import { getActiveDiscovery, loadPresentations, upsertPresentation } from "../../discovery/store/discoveryStorage";
import type { CustomScenario, DemoScenarioDef } from "../types";
import { SCENARIO_LIBRARY } from "../config/scenarioLibrary";
import { customScenarioRepo } from "../store/toolkitStorage";
import { uid } from "../../utils/storage";

const inputCls = "min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm";

/** Base + custom scenarios merged (custom overrides win). */
function effectiveScenarios(customs: CustomScenario[]): (DemoScenarioDef & { customId?: string })[] {
  const overridden = SCENARIO_LIBRARY.map((base) => {
    const c = customs.find((x) => x.baseId === base.id);
    return c ? { ...base, ...c.overrides, id: base.id, customId: c.id } : base;
  });
  const brandNew = customs
    .filter((c) => !c.baseId)
    .map((c) => ({
      id: c.id,
      title: "Custom scenario",
      type: "Custom",
      industries: [],
      modules: [],
      initialData: "",
      triggerEvent: "",
      roles: [],
      steps: [],
      expectedOutcome: "",
      discussionQuestions: [],
      businessValue: "",
      resetBehavior: "Use the demo's Reset button.",
      ...c.overrides,
      customId: c.id,
    })) as (DemoScenarioDef & { customId?: string })[];
  return [...overridden, ...brandNew];
}

export function ScenarioLibraryPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [customs, setCustoms] = useState<CustomScenario[]>(customScenarioRepo.loadAll);
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [editing, setEditing] = useState<(DemoScenarioDef & { customId?: string }) | null>(null);

  const activeIndustryId = getActiveDiscovery()?.business.industryId;
  const scenarios = effectiveScenarios(customs).filter((s) => {
    const q = search.trim().toLowerCase();
    return !q || s.title.toLowerCase().includes(q) || s.type.toLowerCase().includes(q);
  });

  const demoLinkFor = (s: DemoScenarioDef): string | null => {
    if (s.modules.length === 0) return null;
    const industry = activeIndustryId ? getIndustry(activeIndustryId) : null;
    const svc = industry?.services.find((x) => s.modules.includes(x.demoModule));
    return svc ? `#/demo/${svc.id}` : `#/demo/module/${s.modules[0]}`;
  };

  const addToPresentation = (s: DemoScenarioDef) => {
    const p = loadPresentations()[0];
    if (!p) {
      toast("No presentation exists yet — create one in the Presentation Builder first.", "info");
      return;
    }
    upsertPresentation({
      ...p,
      presenterNotes: `${p.presenterNotes}\nScenario to run: ${s.title} — ${s.steps.length} steps.`.trim(),
      updatedAt: new Date().toISOString(),
    });
    toast(`Scenario noted in "${p.title}" presenter notes.`);
  };

  return (
    <div className="space-y-4">
      <button onClick={() => navigate("/discovery")} className="inline-flex min-h-10 items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Discovery
      </button>
      <header>
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <BookOpen className="h-5 w-5 text-accent" /> Demo Scenario Library
        </h1>
        <p className="text-sm text-slate-500">
          Realistic stories to walk through in the demos — problems appearing and being handled, not just features.
        </p>
      </header>

      <SearchInput value={search} onChange={setSearch} placeholder="Search scenarios…" />

      <div className="space-y-2">
        {scenarios.map((s) => {
          const open = openId === s.id;
          const demoLink = demoLinkFor(s);
          return (
            <div key={s.id} className={`rounded-2xl border bg-white p-4 shadow-sm ${open ? "border-accent" : "border-slate-200"}`}>
              <button onClick={() => setOpenId(open ? null : s.id)} className="w-full text-left">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">{s.title}</p>
                  <span className="flex shrink-0 gap-1">
                    <Pill tone="blue">{s.type}</Pill>
                    {s.customId && <Pill tone="violet">Customized</Pill>}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">
                  {s.modules.map((m) => MODULE_TEMPLATES[m]?.label).filter(Boolean).join(" · ") || "Any module"} ·{" "}
                  {s.industries.length === 0 ? "All industries" : s.industries.join(", ")}
                </p>
              </button>

              {open && (
                <div className="mt-3 space-y-2.5 border-t border-slate-100 pt-3 text-xs text-slate-600">
                  <p><strong>Initial data:</strong> {s.initialData}</p>
                  <p><strong>Trigger:</strong> {s.triggerEvent}</p>
                  <p><strong>Roles:</strong> {s.roles.join(", ")}</p>
                  <div>
                    <p className="font-semibold">Walkthrough:</p>
                    <ol className="mt-1 list-inside list-decimal space-y-0.5">
                      {s.steps.map((st) => (
                        <li key={st}>{st}</li>
                      ))}
                    </ol>
                  </div>
                  <p><strong>Expected outcome:</strong> {s.expectedOutcome}</p>
                  <div>
                    <p className="font-semibold">Ask the client:</p>
                    <ul className="mt-0.5 list-inside list-disc space-y-0.5">
                      {s.discussionQuestions.map((q) => (
                        <li key={q}>{q}</li>
                      ))}
                    </ul>
                  </div>
                  <p><strong>Business value:</strong> {s.businessValue}</p>
                  <p className="flex items-center gap-1 text-slate-400"><RotateCcw className="h-3 w-3" /> {s.resetBehavior}</p>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {demoLink && (
                      <a href={demoLink} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-1 rounded-lg bg-accent px-3 text-xs font-semibold text-white hover:opacity-90">
                        <ExternalLink className="h-3.5 w-3.5" /> Launch scenario demo
                      </a>
                    )}
                    <button onClick={() => addToPresentation(s)} className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-slate-300 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50">
                      <MonitorPlay className="h-3.5 w-3.5" /> Add to presentation
                    </button>
                    <button onClick={() => setEditing(s)} className="min-h-10 rounded-lg border border-slate-300 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50">
                      Customize
                    </button>
                    <button
                      onClick={() => {
                        const copy: CustomScenario = {
                          schemaVersion: 1, id: uid(), overrides: { ...s, title: s.title + " (Copy)" },
                          createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
                        };
                        setCustoms(customScenarioRepo.upsert(copy));
                        toast("Scenario duplicated as a custom scenario.");
                      }}
                      className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-slate-300 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50"
                    >
                      <CopyIcon className="h-3.5 w-3.5" /> Duplicate
                    </button>
                    {s.customId && (
                      <button
                        onClick={() => {
                          setCustoms(customScenarioRepo.remove(s.customId!));
                          toast("Customization removed — scenario reset to the library version.");
                        }}
                        className="min-h-10 rounded-lg border border-red-200 px-3 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        Reset to library version
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {editing && (
        <Modal title={`Customize — ${editing.title}`} onClose={() => setEditing(null)} wide>
          <ScenarioEditor
            scenario={editing}
            onSave={(patch) => {
              const existing = customs.find((c) => c.id === editing.customId);
              const record: CustomScenario = existing
                ? { ...existing, overrides: { ...existing.overrides, ...patch }, updatedAt: new Date().toISOString() }
                : { schemaVersion: 1, id: uid(), baseId: editing.id, overrides: patch, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
              setCustoms(customScenarioRepo.upsert(record));
              setEditing(null);
              toast("Scenario customization saved.");
            }}
          />
        </Modal>
      )}
    </div>
  );
}

function ScenarioEditor({ scenario, onSave }: { scenario: DemoScenarioDef; onSave: (patch: Partial<DemoScenarioDef>) => void }) {
  const [title, setTitle] = useState(scenario.title);
  const [initialData, setInitialData] = useState(scenario.initialData);
  const [trigger, setTrigger] = useState(scenario.triggerEvent);
  const [steps, setSteps] = useState(scenario.steps.join("\n"));
  const [outcome, setOutcome] = useState(scenario.expectedOutcome);
  return (
    <div className="space-y-3">
      <L label="Title"><input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} /></L>
      <L label="Initial / sample data"><textarea value={initialData} onChange={(e) => setInitialData(e.target.value)} rows={2} className={`${inputCls} py-2`} /></L>
      <L label="Trigger event"><input value={trigger} onChange={(e) => setTrigger(e.target.value)} className={inputCls} /></L>
      <L label="Steps (one per line)"><textarea value={steps} onChange={(e) => setSteps(e.target.value)} rows={6} className={`${inputCls} py-2`} /></L>
      <L label="Expected outcome"><textarea value={outcome} onChange={(e) => setOutcome(e.target.value)} rows={2} className={`${inputCls} py-2`} /></L>
      <button
        onClick={() => onSave({ title, initialData, triggerEvent: trigger, steps: steps.split("\n").filter((x) => x.trim()), expectedOutcome: outcome })}
        className="min-h-11 w-full rounded-xl bg-accent text-sm font-semibold text-white hover:opacity-90"
      >
        Save customization
      </button>
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
