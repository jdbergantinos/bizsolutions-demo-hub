import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, ClipboardList, Copy, Download, FileCheck2, FileText,
  GitCompareArrows, Lightbulb, Map, MonitorPlay, NotebookPen, Package, Plus,
  RotateCcw, Save, ScanSearch, Smartphone, Trash2, TrendingUp, Upload, UserPlus,
} from "lucide-react";
import { getIndustry, INDUSTRIES } from "../../data/catalog";
import { useApp } from "../../store/AppStore";
import { useToast } from "../../store/ToastContext";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { EmptyState } from "../../components/common/EmptyState";
import { Pill } from "../../components/common/Badge";
import type { DiscoveryRecord, DiscoveryStatus } from "../types";
import { BUDGET_RANGES, IMPLEMENTATION_PERIODS, OUTCOME_OPTIONS, TOOL_OPTIONS } from "../config/discoveryOptions";
import { buildDiscoverySummary, discoveryCompleteness } from "../engine/recommend";
import {
  deleteDiscovery, exportDiscoveryData, getActiveDiscoveryId, importDiscoveryData,
  loadDiscoveries, newDiscovery, setActiveDiscoveryId, upsertDiscovery,
} from "../store/discoveryStorage";
import { activeProfileIdForDiscovery, profileFromDiscovery } from "../engine/workspace";

const STATUS_META: Record<DiscoveryStatus, { label: string; tone: "gray" | "blue" | "amber" | "green" | "violet" }> = {
  draft: { label: "Draft", tone: "gray" },
  "in-progress": { label: "In progress", tone: "blue" },
  "ready-for-recommendation": { label: "Ready for recommendation", tone: "green" },
  "requires-follow-up": { label: "Requires follow-up", tone: "amber" },
  completed: { label: "Completed", tone: "violet" },
};

const inputCls =
  "min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

export function DiscoveryPage() {
  const [params] = useSearchParams();
  const { profiles, setActiveProfile } = useApp();
  const [records, setRecords] = useState<DiscoveryRecord[]>(loadDiscoveries);
  const [editing, setEditing] = useState<DiscoveryRecord | null>(() => {
    const clientId = params.get("client");
    const industryId = params.get("industry");
    if (!clientId && !industryId) return null;
    const profile = clientId ? null : undefined;
    const d = newDiscovery();
    if (industryId) d.business.industryId = industryId;
    if (clientId) {
      const p = profiles.find((x) => x.id === clientId);
      if (p) {
        d.clientProfileId = p.id;
        d.business.businessName = p.businessName;
        d.business.contactPerson = p.contactPerson;
        d.business.industryId = p.industryId || d.business.industryId;
        d.business.branches = Math.max(1, Number(p.branches) || 1);
        d.business.employees = p.employees;
        d.business.notes = p.primaryProblems;
      }
    }
    void profile;
    return d;
  });

  if (editing) {
    return (
      <DiscoveryWizard
        record={editing}
        onSaved={(r) => {
          setRecords(upsertDiscovery(r));
          setActiveDiscoveryId(r.id);
          setActiveProfile(activeProfileIdForDiscovery(r.id, profiles));
        }}
        onExit={() => {
          setRecords(loadDiscoveries());
          setEditing(null);
        }}
      />
    );
  }

  return <DiscoveryHub records={records} setRecords={setRecords} onEdit={setEditing} />;
}

// ---------------- Hub ----------------

function DiscoveryHub({
  records,
  setRecords,
  onEdit,
}: {
  records: DiscoveryRecord[];
  setRecords: (r: DiscoveryRecord[]) => void;
  onEdit: (r: DiscoveryRecord) => void;
}) {
  const toast = useToast();
  const navigate = useNavigate();
  const { profiles, saveProfile, setActiveProfile } = useApp();
  const activeId = getActiveDiscoveryId();
  const [confirmDelete, setConfirmDelete] = useState<DiscoveryRecord | null>(null);
  const [importText, setImportText] = useState("");
  const [showData, setShowData] = useState(false);

  const tools = [
    { to: "/problem-scanner", label: "Problem Scanner", icon: ScanSearch, desc: "Select and rate the client's business problems" },
    { to: "/solution-recommendations", label: "Recommendations", icon: Lightbulb, desc: "Generate a solution from the discovery" },
    { to: "/workflow-comparison", label: "Workflow Comparison", icon: GitCompareArrows, desc: "Before-and-after workflow builder" },
    { to: "/presentation-builder", label: "Presentation Builder", icon: MonitorPlay, desc: "Assemble the client-branded presentation" },
    { to: "/roi", label: "ROI & Business Value", icon: TrendingUp, desc: "Illustrative value estimate from client inputs" },
    { to: "/packages", label: "Package Comparison", icon: Package, desc: "Essential / Growth / Advanced side by side" },
    { to: "/scope", label: "Scope Builder", icon: FileCheck2, desc: "Preliminary scope for discussion" },
    { to: "/roadmap", label: "Roadmap", icon: Map, desc: "Implementation stages outline" },
    { to: "/meetings", label: "Meetings & Next Steps", icon: NotebookPen, desc: "Decision log and recommended next step" },
    { to: "/summary", label: "Discussion Summary", icon: FileText, desc: "Polished client summary and acknowledgment" },
  ];

  const toolkitTools = [
    { to: "/templates", label: "Industry Templates", desc: "Ready-made presentation starting points" },
    { to: "/scenario-library", label: "Scenario Library", desc: "Realistic demo walkthroughs" },
    { to: "/trust", label: "Trust Center", desc: "Security explanation & demo boundaries" },
    { to: "/integrations", label: "Integrations", desc: "Catalog & assessment questionnaire" },
    { to: "/notifications", label: "Notification Simulator", desc: "Preview and simulate messages" },
    { to: "/approvals-showcase", label: "Approval Showcase", desc: "Multi-level approval walkthroughs" },
    { to: "/dashboard-selector", label: "Dashboard Selector", desc: "Pick cards & reports with the client" },
    { to: "/objections", label: "Objection Guide", desc: "Presenter-only answers to hard questions" },
    { to: "/history", label: "Presentation History", desc: "Lightweight local sales tracker" },
  ];

  return (
    <div className="space-y-4">
      <header>
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <ClipboardList className="h-5 w-5 text-accent" /> Client Discovery
        </h1>
        <p className="text-sm text-slate-500">
          Structured interviews that turn client problems into recommendations and presentations. Stored only on this device.
        </p>
      </header>

      <button
        onClick={() => onEdit(newDiscovery())}
        className="flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-accent text-sm font-bold text-white hover:opacity-90"
      >
        <Plus className="h-5 w-5" /> New discovery interview
      </button>

      <button
        onClick={() => navigate("/intake")}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50"
      >
        <Smartphone className="h-5 w-5" /> Hand to client for intake
      </button>

      <div className="grid grid-cols-2 gap-2">
        {tools.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm hover:shadow"
          >
            <t.icon className="h-5 w-5 text-accent" />
            <p className="mt-1.5 text-sm font-semibold text-slate-900">{t.label}</p>
            <p className="mt-0.5 text-[11px] text-slate-500">{t.desc}</p>
          </Link>
        ))}
      </div>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-800">Presenter toolkit</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {toolkitTools.map((t) => (
            <Link key={t.to} to={t.to} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm hover:shadow">
              <p className="text-sm font-semibold text-slate-900">{t.label}</p>
              <p className="mt-0.5 text-[11px] text-slate-500">{t.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-800">Discovery records ({records.length})</h2>
        {records.length === 0 ? (
          <EmptyState
            icon="ClipboardList"
            title="No discoveries yet"
            message="Start a discovery interview before or during a client meeting — it feeds the problem scanner, recommendations, and presentation."
          />
        ) : (
          <ul className="space-y-2">
            {records
              .slice()
              .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
              .map((r) => {
                const st = STATUS_META[r.status];
                const active = r.id === activeId;
                const linkedProfile = r.clientProfileId ? profiles.find((p) => p.id === r.clientProfileId) : undefined;
                return (
                  <li key={r.id} className={`rounded-2xl border bg-white p-4 shadow-sm ${active ? "border-accent ring-1 ring-accent/30" : "border-slate-200"}`}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {r.business.businessName || "Unnamed client"}
                      </p>
                      <Pill tone={st.tone}>{st.label}</Pill>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {getIndustry(r.business.industryId)?.name ?? "No industry"} · {discoveryCompleteness(r)}% complete ·{" "}
                      {r.problems.length} problem(s) · {new Date(r.updatedAt).toLocaleDateString()}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          setActiveDiscoveryId(r.id);
                          setActiveProfile(activeProfileIdForDiscovery(r.id, profiles));
                          onEdit(r);
                        }}
                        className="min-h-10 rounded-lg bg-accent px-3 text-xs font-semibold text-white hover:opacity-90"
                      >
                        Continue
                      </button>
                      {!active && (
                        <button
                          onClick={() => {
                            setActiveDiscoveryId(r.id);
                            setActiveProfile(activeProfileIdForDiscovery(r.id, profiles));
                            setRecords([...records]);
                            toast(`"${r.business.businessName || "Discovery"}" is now active.`);
                          }}
                          className="min-h-10 rounded-lg border border-slate-300 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50"
                        >
                          Set active
                        </button>
                      )}
                      <button
                        onClick={() => navigate("/presentation-builder?discovery=" + r.id)}
                        className="min-h-10 rounded-lg border border-slate-300 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50"
                      >
                        Build presentation
                      </button>
                      {linkedProfile ? (
                        <span className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-medium text-emerald-700">
                          <UserPlus className="h-3.5 w-3.5" /> In Client Profiles
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            if (!r.business.businessName.trim()) {
                              toast("Add the client's business name to the discovery first.", "info");
                              return;
                            }
                            const profile = profileFromDiscovery(r);
                            saveProfile(profile);
                            setRecords(upsertDiscovery({ ...r, clientProfileId: profile.id, updatedAt: new Date().toISOString() }));
                            toast(`"${profile.businessName}" saved to Client Profiles.`);
                          }}
                          className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-slate-300 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50"
                        >
                          <UserPlus className="h-3.5 w-3.5" /> Save to Client Profile
                        </button>
                      )}
                      <button
                        onClick={() => setConfirmDelete(r)}
                        className="ml-auto min-h-10 rounded-lg border border-red-200 px-3 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                );
              })}
          </ul>
        )}
      </section>

      {/* Data export / import */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <button onClick={() => setShowData((v) => !v)} className="flex w-full items-center justify-between text-sm font-semibold text-slate-800">
          Discovery data backup
          <span className="text-xs font-normal text-slate-400">{showData ? "Hide" : "Show"}</span>
        </button>
        {showData && (
          <div className="mt-3 space-y-2">
            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(exportDiscoveryData());
                  toast("Discovery data JSON copied to clipboard.");
                } catch {
                  setImportText(exportDiscoveryData());
                  toast("Clipboard blocked — JSON placed in the box below.", "info");
                }
              }}
              className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Download className="h-4 w-4" /> Export all discovery data (JSON)
            </button>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              rows={4}
              placeholder="Paste exported JSON here to import…"
              className={`${inputCls} py-2 font-mono text-xs`}
            />
            <button
              disabled={!importText.trim()}
              onClick={() => {
                const result = importDiscoveryData(importText);
                if (result.errors.length > 0) {
                  toast(`Import rejected: ${result.errors[0]}`, "info");
                } else {
                  setRecords(loadDiscoveries());
                  setImportText("");
                  toast(
                    `Imported ${result.imported!.discoveries} discoveries, ${result.imported!.workflows} workflows, ${result.imported!.presentations} presentations.`,
                  );
                }
              }}
              className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              <Upload className="h-4 w-4" /> Validate & import
            </button>
          </div>
        )}
      </section>

      {confirmDelete && (
        <ConfirmDialog
          title="Delete this discovery?"
          message={`The discovery for "${confirmDelete.business.businessName || "Unnamed client"}" — including its problems and recommendations — will be removed from this device.`}
          confirmLabel="Delete"
          onConfirm={() => {
            setRecords(deleteDiscovery(confirmDelete.id));
            setConfirmDelete(null);
            toast("Discovery deleted.");
          }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}

// ---------------- Wizard ----------------

const STEPS = ["Business Information", "Current Operations", "Desired Outcomes", "Review & Actions"];

function DiscoveryWizard({
  record,
  onSaved,
  onExit,
}: {
  record: DiscoveryRecord;
  onSaved: (r: DiscoveryRecord) => void;
  onExit: () => void;
}) {
  const toast = useToast();
  const navigate = useNavigate();
  const { profiles } = useApp();
  const [d, setD] = useState<DiscoveryRecord>(record);
  const [step, setStep] = useState(0);
  const [confirmReset, setConfirmReset] = useState(false);

  // Autosave (debounced) so "continue later" is always safe.
  useEffect(() => {
    const t = setTimeout(() => onSaved({ ...d, updatedAt: new Date().toISOString() }), 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d]);

  const setB = (patch: Partial<DiscoveryRecord["business"]>) =>
    setD((x) => ({ ...x, business: { ...x.business, ...patch } }));
  const setO = (patch: Partial<DiscoveryRecord["operations"]>) =>
    setD((x) => ({ ...x, operations: { ...x.operations, ...patch } }));

  const industry = getIndustry(d.business.industryId);
  const completeness = useMemo(() => discoveryCompleteness(d), [d]);

  const saveAndExit = (status?: DiscoveryStatus) => {
    onSaved({ ...d, status: status ?? d.status, updatedAt: new Date().toISOString() });
    toast("Discovery saved. Continue anytime from the Discovery hub.");
    onExit();
  };

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Discovery Interview</h1>
          <p className="text-sm text-slate-500">
            Step {step + 1} of {STEPS.length}: {STEPS[step]} · {completeness}% complete
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => saveAndExit()}
            className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-slate-300 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            <Save className="h-3.5 w-3.5" /> Save & exit
          </button>
          <button
            onClick={() => setConfirmReset(true)}
            aria-label="Reset discovery"
            className="min-h-10 rounded-lg border border-slate-300 px-3 text-slate-600 hover:bg-slate-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      <div className="flex gap-1">
        {STEPS.map((s, i) => (
          <button key={s} title={s} onClick={() => setStep(i)} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-accent" : "bg-slate-200"}`} />
        ))}
      </div>

      {step === 0 && (
        <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          {profiles.length > 0 && (
            <Field label="Client profile">
              <select
                value={d.clientProfileId ?? ""}
                onChange={(e) => {
                  const p = profiles.find((x) => x.id === e.target.value);
                  if (!p) {
                    setD((x) => ({ ...x, clientProfileId: undefined }));
                    return;
                  }
                  setD((x) => ({
                    ...x,
                    clientProfileId: p.id,
                    business: {
                      ...x.business,
                      businessName: p.businessName,
                      contactPerson: p.contactPerson,
                      industryId: p.industryId || x.business.industryId,
                      branches: Math.max(1, Number(p.branches) || 1),
                      employees: p.employees,
                    },
                  }));
                }}
                className={inputCls}
              >
                <option value="">— Temporary discovery profile —</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>{p.businessName || "Unnamed business"}</option>
                ))}
              </select>
            </Field>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Business name" required>
              <input value={d.business.businessName} onChange={(e) => setB({ businessName: e.target.value })} placeholder="e.g. Subic Bay Grocery Corp." className={inputCls} />
            </Field>
            <Field label="Contact person">
              <input value={d.business.contactPerson} onChange={(e) => setB({ contactPerson: e.target.value })} placeholder="e.g. Maria Santos — General Manager" className={inputCls} />
            </Field>
          </div>
          <Field label="Industry" required>
            <select value={d.business.industryId} onChange={(e) => setB({ industryId: e.target.value, businessExample: "" })} className={inputCls}>
              <option value="">— Select industry —</option>
              {INDUSTRIES.map((i) => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
          </Field>
          {industry && (
            <Field label="Business example">
              <select value={d.business.businessExample} onChange={(e) => setB({ businessExample: e.target.value })} className={inputCls}>
                <option value="">— Select example —</option>
                {industry.examples.map((ex) => (
                  <option key={ex} value={ex}>{ex}</option>
                ))}
              </select>
            </Field>
          )}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Field label="Location">
              <input value={d.business.location} onChange={(e) => setB({ location: e.target.value })} placeholder="e.g. Olongapo City" className={inputCls} />
            </Field>
            <Field label="Branches">
              <input type="number" min={1} value={d.business.branches} onChange={(e) => setB({ branches: Math.max(1, Number(e.target.value) || 1) })} className={inputCls} />
            </Field>
            <Field label="Employees">
              <input type="number" min={0} value={d.business.employees} onChange={(e) => setB({ employees: e.target.value })} placeholder="e.g. 12" className={inputCls} />
            </Field>
            <Field label="System users">
              <input type="number" min={1} value={d.business.users} onChange={(e) => setB({ users: Math.max(1, Number(e.target.value) || 1) })} className={inputCls} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Monthly transactions (approx.)">
              <input value={d.business.monthlyTransactions} onChange={(e) => setB({ monthlyTransactions: e.target.value })} placeholder="e.g. 500 orders" className={inputCls} />
            </Field>
            <Field label="Years operating">
              <input value={d.business.yearsOperating} onChange={(e) => setB({ yearsOperating: e.target.value })} placeholder="e.g. 8 years" className={inputCls} />
            </Field>
            <Field label="Primary decision-maker">
              <input value={d.business.decisionMaker} onChange={(e) => setB({ decisionMaker: e.target.value })} placeholder="e.g. The owner, with the manager's input" className={inputCls} />
            </Field>
            <Field label="Other stakeholders">
              <input value={d.business.stakeholders} onChange={(e) => setB({ stakeholders: e.target.value })} placeholder="e.g. Spouse co-owner, branch managers" className={inputCls} />
            </Field>
            <Field label="Target implementation period">
              <select value={d.business.implementationPeriod} onChange={(e) => setB({ implementationPeriod: e.target.value })} className={inputCls}>
                <option value="">— Select —</option>
                {IMPLEMENTATION_PERIODS.map((x) => (
                  <option key={x} value={x}>{x}</option>
                ))}
              </select>
            </Field>
            <Field label="Preliminary budget range">
              <select value={d.business.budgetRange} onChange={(e) => setB({ budgetRange: e.target.value })} className={inputCls}>
                <option value="">— Select —</option>
                {BUDGET_RANGES.map((x) => (
                  <option key={x} value={x}>{x}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Notes">
            <textarea value={d.business.notes} onChange={(e) => setB({ notes: e.target.value })} rows={2} placeholder="e.g. Planning a second branch next year" className={`${inputCls} py-2`} />
          </Field>
        </section>
      )}

      {step === 1 && (
        <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <Field label="What systems or tools are currently being used?">
            <div className="flex flex-wrap gap-1.5">
              {TOOL_OPTIONS.map((t) => {
                const on = d.operations.tools.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setO({ tools: on ? d.operations.tools.filter((x) => x !== t) : [...d.operations.tools, t] })}
                    className={`min-h-10 rounded-xl px-3 text-xs font-medium ${on ? "bg-accent text-white" : "border border-slate-300 text-slate-600 hover:bg-slate-50"}`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </Field>
          {d.operations.tools.includes("Other") && (
            <Field label="Other tools">
              <input value={d.operations.toolsOther} onChange={(e) => setO({ toolsOther: e.target.value })} placeholder="e.g. Old DOS-based POS from 2010" className={inputCls} />
            </Field>
          )}
          <TextArea label="Which processes are manual?" value={d.operations.manualProcesses} onChange={(v) => setO({ manualProcesses: v })} />
          <TextArea label="Which processes are repeated frequently?" value={d.operations.repeatedProcesses} onChange={(v) => setO({ repeatedProcesses: v })} />
          <TextArea label="Which reports take the most time?" value={d.operations.slowReports} onChange={(v) => setO({ slowReports: v })} />
          <TextArea label="Which tasks are often delayed?" value={d.operations.delayedTasks} onChange={(v) => setO({ delayedTasks: v })} />
          <TextArea label="Which information is difficult to find?" value={d.operations.hardToFindInfo} onChange={(v) => setO({ hardToFindInfo: v })} />
          <TextArea label="Where do errors commonly happen?" value={d.operations.errorSpots} onChange={(v) => setO({ errorSpots: v })} />
          <TextArea label="Which processes require approval?" value={d.operations.approvalProcesses} onChange={(v) => setO({ approvalProcesses: v })} />
          <TextArea label="Which customer concerns happen repeatedly?" value={d.operations.customerConcerns} onChange={(v) => setO({ customerConcerns: v })} />
          <div className="space-y-2">
            <Toggle label="Multiple branches involved" checked={d.operations.multiBranch} onChange={(v) => setO({ multiBranch: v })} />
            <Toggle label="Employees working in the field" checked={d.operations.fieldStaff} onChange={(v) => setO({ fieldStaff: v })} />
            <Toggle label="Customers expected to use a portal or mobile app" checked={d.operations.customerPortalExpected} onChange={(v) => setO({ customerPortalExpected: v })} />
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <Field label="Which outcomes matter most to the client?">
            <div className="flex flex-wrap gap-1.5">
              {OUTCOME_OPTIONS.map((o) => {
                const on = d.desiredOutcomes.includes(o);
                return (
                  <button
                    key={o}
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      setD((x) => ({
                        ...x,
                        desiredOutcomes: on ? x.desiredOutcomes.filter((y) => y !== o) : [...x.desiredOutcomes, o],
                      }))
                    }
                    className={`min-h-10 rounded-xl px-3 text-xs font-medium ${on ? "bg-accent text-white" : "border border-slate-300 text-slate-600 hover:bg-slate-50"}`}
                  >
                    {o}
                  </button>
                );
              })}
            </div>
          </Field>
          {d.desiredOutcomes.includes("Other") && (
            <Field label="Other desired outcome">
              <input value={d.outcomesOther} onChange={(e) => setD((x) => ({ ...x, outcomesOther: e.target.value }))} placeholder="e.g. Reduce the owner's daily workload" className={inputCls} /></Field>
          )}
          <p className="rounded-xl bg-accent-soft/60 px-3 py-2 text-xs text-slate-600">
            Next: mark the specific problems in the <strong>Problem Scanner</strong> — recommendations are generated from problems plus these outcomes.
          </p>
        </section>
      )}

      {step === 3 && (
        <section className="space-y-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Discovery record</h2>
              <Pill tone="blue">{completeness}% complete</Pill>
            </div>
            <Field label="Discovery status">
              <select
                value={d.status}
                onChange={(e) => setD((x) => ({ ...x, status: e.target.value as DiscoveryStatus }))}
                className={inputCls}
              >
                {Object.entries(STATUS_META).map(([id, s]) => (
                  <option key={id} value={id}>{s.label}</option>
                ))}
              </select>
            </Field>
            <TextArea label="Presenter notes" value={d.presenterNotes} onChange={(v) => setD((x) => ({ ...x, presenterNotes: v }))} />
            <TextArea label="Unanswered questions" value={d.unansweredQuestions} onChange={(v) => setD((x) => ({ ...x, unansweredQuestions: v }))} />
            <TextArea label="Assumptions" value={d.assumptions} onChange={(v) => setD((x) => ({ ...x, assumptions: v }))} />
            <TextArea label="Items requiring verification" value={d.itemsToVerify} onChange={(v) => setD((x) => ({ ...x, itemsToVerify: v }))} />
            <p className="mt-2 text-xs text-slate-500">
              Problems selected so far: <strong>{d.problems.length}</strong> (edit in the Problem Scanner).
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <ActionBtn
              onClick={() => {
                onSaved({ ...d, updatedAt: new Date().toISOString() });
                navigate("/problem-scanner");
              }}
            >
              <ScanSearch className="h-4 w-4" /> Scan problems
            </ActionBtn>
            <ActionBtn
              onClick={() => {
                onSaved({ ...d, status: d.status === "draft" ? "ready-for-recommendation" : d.status, updatedAt: new Date().toISOString() });
                navigate("/solution-recommendations");
              }}
            >
              <Lightbulb className="h-4 w-4" /> Generate recommendations
            </ActionBtn>
            <ActionBtn
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(buildDiscoverySummary(d));
                  toast("Discovery summary copied.");
                } catch {
                  toast("Clipboard blocked by the browser.", "info");
                }
              }}
            >
              <Copy className="h-4 w-4" /> Copy summary
            </ActionBtn>
            <ActionBtn
              onClick={() => {
                onSaved({ ...d, updatedAt: new Date().toISOString() });
                navigate("/presentation-builder?discovery=" + d.id);
              }}
            >
              <MonitorPlay className="h-4 w-4" /> Load into presentation
            </ActionBtn>
          </div>
          <button
            onClick={() => saveAndExit()}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent text-sm font-semibold text-white hover:opacity-90"
          >
            <Save className="h-4 w-4" /> Save discovery
          </button>
        </section>
      )}

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="flex min-h-13 items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-30"
        >
          <ArrowLeft className="h-4 w-4" /> Previous
        </button>
        <button
          onClick={() => {
            if (step === 0 && (!d.business.businessName.trim() || !d.business.industryId)) {
              toast("Enter the business name and select an industry first.", "info");
              return;
            }
            setStep((s) => Math.min(STEPS.length - 1, s + 1));
          }}
          disabled={step === STEPS.length - 1}
          className="flex min-h-13 items-center justify-center gap-1.5 rounded-xl bg-accent text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40"
        >
          Next <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {confirmReset && (
        <ConfirmDialog
          title="Reset this discovery?"
          message="All answers in this discovery interview will be cleared. Saved problems and recommendations for it are cleared too."
          confirmLabel="Reset"
          onConfirm={() => {
            const fresh = newDiscovery({ id: d.id, createdAt: d.createdAt, clientProfileId: d.clientProfileId });
            setD(fresh);
            setStep(0);
            setConfirmReset(false);
            toast("Discovery reset.");
          }}
          onCancel={() => setConfirmReset(false)}
        />
      )}
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
    </label>
  );
}

// Sample answers per question, so every blank shows a concrete example.
const TEXTAREA_SAMPLES: Record<string, string> = {
  "Which processes are manual?": "e.g. Stock counting, daily sales tally, order slips",
  "Which processes are repeated frequently?": "e.g. Weekly reorder from the same three suppliers",
  "Which reports take the most time?": "e.g. Monthly sales summary takes a whole day",
  "Which tasks are often delayed?": "e.g. Supplier payments and customer follow-ups",
  "Which information is difficult to find?": "e.g. Last year's prices; which branch has stock",
  "Where do errors commonly happen?": "e.g. Handwritten order slips get miscopied",
  "Which processes require approval?": "e.g. Discounts above 10%, purchases above ₱20,000",
  "Which customer concerns happen repeatedly?": "e.g. \"Is my order ready?\" calls every day",
  "Presenter notes": "e.g. Owner is price-sensitive but frustrated by stock-outs",
  "Unanswered questions": "e.g. How many products do they actually carry?",
  Assumptions: "e.g. Assumed ~500 transactions/month — confirm",
  "Items requiring verification": "e.g. Whether both branches share one supplier list",
};

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <Field label={label}>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        placeholder={TEXTAREA_SAMPLES[label] ?? "e.g. Type the client's answer here"}
        className={`${inputCls} py-2`}
      />
    </Field>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm text-slate-700 hover:bg-slate-50">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-[var(--app-accent)]" />
      {label}
    </label>
  );
}

function ActionBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="flex min-h-12 items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50"
    >
      {children}
    </button>
  );
}
