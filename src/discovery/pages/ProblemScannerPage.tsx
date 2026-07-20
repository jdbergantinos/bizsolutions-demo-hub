import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Check, Lightbulb, Plus, ScanSearch } from "lucide-react";
import { getIndustry } from "../../data/catalog";
import { useToast } from "../../store/ToastContext";
import { EmptyState } from "../../components/common/EmptyState";
import { Modal } from "../../components/common/Modal";
import { Pill } from "../../components/common/Badge";
import type { DiscoveryRecord, ProblemPriority, ProblemSeverity, SelectedProblem } from "../types";
import { PROBLEM_CATALOG, PROBLEM_CATEGORIES, getProblem } from "../config/problemCatalog";
import { getServicesForProblem } from "../engine/recommend";
import { getActiveDiscovery, newDiscovery, setActiveDiscoveryId, upsertDiscovery } from "../store/discoveryStorage";
import { uid } from "../../utils/storage";

const SEVERITIES: ProblemSeverity[] = ["minor", "moderate", "major", "critical"];
const PRIORITIES: ProblemPriority[] = ["low", "medium", "high", "urgent"];

const SEVERITY_TONE: Record<ProblemSeverity, "gray" | "blue" | "amber" | "red"> = {
  minor: "gray",
  moderate: "blue",
  major: "amber",
  critical: "red",
};

export function ProblemScannerPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [discovery, setDiscovery] = useState<DiscoveryRecord | null>(() => {
    const active = getActiveDiscovery();
    if (active) return active;
    const industryId = params.get("industry");
    if (industryId) {
      const d = newDiscovery();
      d.business.industryId = industryId;
      d.status = "in-progress";
      upsertDiscovery(d);
      setActiveDiscoveryId(d.id);
      return d;
    }
    return null;
  });
  const [editing, setEditing] = useState<SelectedProblem | null>(null);
  const [customOpen, setCustomOpen] = useState(false);

  if (!discovery) {
    return (
      <EmptyState
        icon="ScanSearch"
        title="No active discovery"
        message="The problem scanner records problems into a discovery. Start one first — it takes a minute."
        action={
          <Link to="/discovery" className="text-sm font-semibold text-accent hover:underline">
            Start a discovery
          </Link>
        }
      />
    );
  }

  const industry = getIndustry(discovery.business.industryId);
  const persist = (next: DiscoveryRecord) => {
    const updated = { ...next, updatedAt: new Date().toISOString() };
    upsertDiscovery(updated);
    setDiscovery(updated);
  };

  const selectionFor = (problemId: string) => discovery.problems.find((p) => p.problemId === problemId);

  const toggle = (problemId: string) => {
    const exists = selectionFor(problemId);
    if (exists) {
      persist({ ...discovery, problems: discovery.problems.filter((p) => p.problemId !== problemId) });
    } else {
      const sel: SelectedProblem = { problemId, severity: "moderate", priority: "medium", note: "", verification: "verified" };
      persist({ ...discovery, problems: [...discovery.problems, sel] });
      setEditing(sel);
    }
  };

  const updateSelection = (sel: SelectedProblem) => {
    persist({ ...discovery, problems: discovery.problems.map((p) => (p.problemId === sel.problemId ? sel : p)) });
    setEditing(sel);
  };

  return (
    <div className="space-y-4">
      <button onClick={() => navigate("/discovery")} className="inline-flex min-h-10 items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Discovery
      </button>
      <header>
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <ScanSearch className="h-5 w-5 text-accent" /> Business Problem Scanner
        </h1>
        <p className="text-sm text-slate-500">
          {discovery.business.businessName || "Unnamed client"}
          {industry ? ` · ${industry.name}` : ""} · {discovery.problems.length} selected
        </p>
      </header>

      <div className="flex gap-2">
        <button
          onClick={() => setCustomOpen(true)}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          <Plus className="h-4 w-4" /> Custom problem
        </button>
        <button
          onClick={() => navigate("/solution-recommendations")}
          disabled={discovery.problems.length === 0}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-accent px-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40"
        >
          <Lightbulb className="h-4 w-4" /> Generate recommendations
        </button>
      </div>

      {PROBLEM_CATEGORIES.map((cat) => (
        <section key={cat}>
          <h2 className="mb-2 text-sm font-semibold text-slate-800">{cat}</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {PROBLEM_CATALOG.filter((p) => p.category === cat).map((p) => {
              const sel = selectionFor(p.id);
              const services = industry ? getServicesForProblem(p.id, industry.id) : [];
              return (
                <button
                  key={p.id}
                  onClick={() => (sel ? setEditing(sel) : toggle(p.id))}
                  className={`rounded-2xl border p-3 text-left shadow-sm transition ${
                    sel ? "border-accent bg-accent-soft/50 ring-1 ring-accent/30" : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">{p.title}</p>
                    {sel && <Check className="h-4 w-4 shrink-0 text-accent" />}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">{p.description}</p>
                  {sel ? (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      <Pill tone={SEVERITY_TONE[sel.severity]}>{sel.severity}</Pill>
                      <Pill tone="violet">{sel.priority} priority</Pill>
                      <Pill tone={sel.verification === "verified" ? "green" : "amber"}>{sel.verification}</Pill>
                    </div>
                  ) : (
                    services.length > 0 && (
                      <p className="mt-1 text-[11px] text-slate-400">
                        Solved by: {services.slice(0, 2).map((s) => s.name).join(", ")}
                        {services.length > 2 ? "…" : ""}
                      </p>
                    )
                  )}
                </button>
              );
            })}
          </div>
        </section>
      ))}

      {/* Custom problems */}
      {discovery.problems.some((p) => p.problemId.startsWith("custom:")) && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-slate-800">Custom problems</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {discovery.problems
              .filter((p) => p.problemId.startsWith("custom:"))
              .map((sel) => (
                <button
                  key={sel.problemId}
                  onClick={() => setEditing(sel)}
                  className="rounded-2xl border border-accent bg-accent-soft/50 p-3 text-left shadow-sm ring-1 ring-accent/30"
                >
                  <p className="text-sm font-semibold text-slate-900">{sel.customTitle}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    <Pill tone={SEVERITY_TONE[sel.severity]}>{sel.severity}</Pill>
                    <Pill tone="violet">{sel.priority} priority</Pill>
                    <Pill tone={sel.verification === "verified" ? "green" : "amber"}>{sel.verification}</Pill>
                  </div>
                </button>
              ))}
          </div>
        </section>
      )}

      {/* Selection editor */}
      {editing && (
        <ProblemEditor
          selection={editing}
          industryId={discovery.business.industryId}
          onChange={updateSelection}
          onRemove={() => {
            persist({ ...discovery, problems: discovery.problems.filter((p) => p.problemId !== editing.problemId) });
            setEditing(null);
            toast("Problem removed from the discovery.");
          }}
          onClose={() => setEditing(null)}
        />
      )}

      {/* Custom problem creator */}
      {customOpen && (
        <CustomProblemModal
          onAdd={(title, category) => {
            const sel: SelectedProblem = {
              problemId: `custom:${uid()}`,
              customTitle: title,
              customCategory: category,
              severity: "moderate",
              priority: "medium",
              note: "",
              verification: "verified",
            };
            persist({ ...discovery, problems: [...discovery.problems, sel] });
            setCustomOpen(false);
            setEditing(sel);
            toast("Custom problem added.");
          }}
          onClose={() => setCustomOpen(false)}
        />
      )}
    </div>
  );
}

function ProblemEditor({
  selection,
  industryId,
  onChange,
  onRemove,
  onClose,
}: {
  selection: SelectedProblem;
  industryId: string;
  onChange: (s: SelectedProblem) => void;
  onRemove: () => void;
  onClose: () => void;
}) {
  const catalog = getProblem(selection.problemId);
  const title = catalog?.title ?? selection.customTitle ?? "Problem";
  const services = catalog ? getServicesForProblem(selection.problemId, industryId) : [];

  return (
    <Modal title={title} onClose={onClose}>
      <div className="space-y-4">
        {catalog && (
          <>
            <p className="text-sm text-slate-600">{catalog.description}</p>
            <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
              <p><span className="font-semibold">Suggested improvement:</span> {catalog.suggestedWorkflowImprovement}</p>
              <p className="mt-1"><span className="font-semibold">Possible benefits:</span> {catalog.expectedBenefits.join("; ")}</p>
              {services.length > 0 && (
                <p className="mt-1"><span className="font-semibold">Related offers:</span> {services.map((s) => s.name).join(", ")}</p>
              )}
              {catalog.riskNotes?.map((r) => (
                <p key={r} className="mt-1 text-amber-700">⚠ {r}</p>
              ))}
            </div>
          </>
        )}

        <ChoiceRow
          label="Severity"
          options={SEVERITIES}
          value={selection.severity}
          onPick={(v) => onChange({ ...selection, severity: v as ProblemSeverity })}
        />
        <ChoiceRow
          label="Priority"
          options={PRIORITIES}
          value={selection.priority}
          onPick={(v) => onChange({ ...selection, priority: v as ProblemPriority })}
        />
        <ChoiceRow
          label="Verification"
          options={["verified", "assumed"]}
          value={selection.verification}
          onPick={(v) => onChange({ ...selection, verification: v as "verified" | "assumed" })}
        />
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">Notes</span>
          <textarea
            value={selection.note}
            onChange={(e) => onChange({ ...selection, note: e.target.value })}
            rows={2}
            className="min-h-11 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />
        </label>

        <div className="flex gap-2">
          <button onClick={onRemove} className="min-h-11 flex-1 rounded-xl border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50">
            Remove problem
          </button>
          <button onClick={onClose} className="min-h-11 flex-1 rounded-xl bg-accent text-sm font-semibold text-white hover:opacity-90">
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
}

function ChoiceRow({ label, options, value, onPick }: { label: string; options: string[]; value: string; onPick: (v: string) => void }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-slate-600">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onPick(o)}
            className={`min-h-10 rounded-lg px-3 text-xs font-medium capitalize ${
              value === o ? "bg-accent text-white" : "border border-slate-300 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

function CustomProblemModal({ onAdd, onClose }: { onAdd: (title: string, category: string) => void; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>(PROBLEM_CATEGORIES[0]);
  return (
    <Modal title="Add custom problem" onClose={onClose}>
      <div className="space-y-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">Problem title</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">Category</span>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm">
            {PROBLEM_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
        <button
          onClick={() => title.trim() && onAdd(title.trim(), category)}
          disabled={!title.trim()}
          className="min-h-11 w-full rounded-xl bg-accent text-sm font-semibold text-white disabled:opacity-40"
        >
          Add problem
        </button>
      </div>
    </Modal>
  );
}
