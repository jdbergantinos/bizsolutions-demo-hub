import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowDown, ArrowUp, Calculator, Copy, GitCompareArrows, Lightbulb, MonitorPlay, Play, Share2, Trash2 } from "lucide-react";
import { getIndustry, getService } from "../data/catalog";
import { MODULE_TEMPLATES } from "../data/serviceTemplates";
import { useApp } from "../store/AppStore";
import { useToast } from "../store/ToastContext";
import { EmptyState } from "../components/common/EmptyState";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { Pill } from "../components/common/Badge";

export function SolutionsPage() {
  const { solutions, removeSolution, moveSolution, updateSolutionNote, resetSolutions, activeProfile } = useApp();
  const toast = useToast();
  const navigate = useNavigate();
  const [confirmClear, setConfirmClear] = useState(false);

  const items = solutions
    .map((sol) => ({ sol, service: getService(sol.serviceId), industry: getIndustry(sol.industryId) }))
    .filter((x) => x.service && x.industry);

  const clientName = activeProfile?.businessName || "your client";

  const summary = useMemo(() => {
    if (items.length === 0) return "";
    const names = items.map((x) => x.service!.name).join(", ");
    const problems = [...new Set(items.map((x) => MODULE_TEMPLATES[x.service!.demoModule].label.toLowerCase()))].join(", ");
    const functions = [...new Set(items.flatMap((x) => x.service!.functions.slice(0, 2)))]
      .slice(0, 5)
      .map((f) => f.toLowerCase())
      .join("; ");
    return (
      `Based on the discovery discussion, the recommended solution for ${clientName} includes: ${names}. ` +
      `These modules are intended to improve ${problems} through ${functions}. ` +
      `Final requirements, integrations, security controls, implementation cost, and timeline require a separate discovery and technical assessment.`
    );
  }, [items, clientName]);

  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      toast("Summary copied to clipboard.");
    } catch {
      toast("Could not copy — your browser blocked clipboard access.", "info");
    }
  };

  const shareSummary = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Recommended solution", text: summary });
      } catch {
        // user cancelled the share sheet — nothing to do
      }
    } else {
      toast("Sharing is not supported on this device — use Copy instead.", "info");
    }
  };

  if (items.length === 0) {
    return (
      <div className="space-y-4">
        <Header clientName={activeProfile?.businessName} />
        <EmptyState
          icon="ListChecks"
          title="No solutions selected yet"
          message="Browse an industry and tap “Add to client solution” on the offers your client needs."
          action={
            <Link to="/industries" className="text-sm font-semibold text-accent hover:underline">
              Browse industries
            </Link>
          }
        />
      </div>
    );
  }

  const cautionSet = [...new Set(items.flatMap((x) => x.industry!.cautions ?? []))];

  return (
    <div className="space-y-4">
      <Header clientName={activeProfile?.businessName} />

      <button
        onClick={() => navigate("/pricing/new?fromSolutions=1")}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent text-sm font-semibold text-white hover:opacity-90"
      >
        <Calculator className="h-4 w-4" /> Estimate selected solutions
      </button>
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => navigate("/solution-recommendations")}
          className="inline-flex min-h-11 items-center justify-center gap-1 rounded-xl border border-slate-300 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50"
        >
          <Lightbulb className="h-3.5 w-3.5" /> Why recommended
        </button>
        <button
          onClick={() => navigate("/presentation-builder?fromSolutions=1")}
          className="inline-flex min-h-11 items-center justify-center gap-1 rounded-xl border border-slate-300 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50"
        >
          <MonitorPlay className="h-3.5 w-3.5" /> To presentation
        </button>
        <button
          onClick={() => navigate("/workflow-comparison")}
          className="inline-flex min-h-11 items-center justify-center gap-1 rounded-xl border border-slate-300 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50"
        >
          <GitCompareArrows className="h-3.5 w-3.5" /> Workflow
        </button>
      </div>

      <ul className="space-y-2">
        {items.map(({ sol, service, industry }, idx) => (
          <li key={sol.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">{service!.name}</p>
                <p className="text-xs text-slate-500">{industry!.name}</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <Pill tone="blue">{MODULE_TEMPLATES[service!.demoModule].label}</Pill>
                  {service!.riskLevel !== "low" && (
                    <Pill tone={service!.riskLevel === "high" ? "red" : "amber"}>{service!.riskLevel} risk</Pill>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 flex-col gap-1">
                <button
                  aria-label="Move up"
                  disabled={idx === 0}
                  onClick={() => moveSolution(sol.id, -1)}
                  className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 disabled:opacity-30"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  aria-label="Move down"
                  disabled={idx === items.length - 1}
                  onClick={() => moveSolution(sol.id, 1)}
                  className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 disabled:opacity-30"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
              </div>
            </div>
            <p className="mt-2 line-clamp-2 text-xs text-slate-500">
              <span className="font-medium text-slate-600">Problem addressed:</span> {service!.problem}
            </p>
            <input
              value={sol.note}
              onChange={(e) => updateSolutionNote(sol.id, e.target.value)}
              placeholder="Add a note for this client…"
              className="mt-2 min-h-10 w-full rounded-lg border border-slate-200 px-3 text-xs"
            />
            <div className="mt-2 flex gap-2">
              <Link
                to={`/demo/${service!.id}`}
                className="inline-flex min-h-10 flex-1 items-center justify-center gap-1 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <Play className="h-3.5 w-3.5" /> Demo
              </Link>
              <button
                onClick={() => {
                  removeSolution(sol.id);
                  toast("Removed from selected solutions.");
                }}
                className="inline-flex min-h-10 items-center justify-center gap-1 rounded-lg border border-red-200 px-3 text-xs font-medium text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5" /> Remove
              </button>
            </div>
          </li>
        ))}
      </ul>

      {cautionSet.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-semibold">Implementation cautions</p>
          <ul className="mt-1 list-inside list-disc space-y-1 text-xs">
            {cautionSet.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Solution summary</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{summary}</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            onClick={copySummary}
            className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Copy className="h-4 w-4" /> Copy summary
          </button>
          <button
            onClick={shareSummary}
            className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-accent text-sm font-semibold text-white hover:opacity-90"
          >
            <Share2 className="h-4 w-4" /> Share
          </button>
        </div>
      </section>

      <button
        onClick={() => setConfirmClear(true)}
        className="min-h-11 w-full rounded-xl border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50"
      >
        Clear all selected solutions
      </button>

      {confirmClear && (
        <ConfirmDialog
          title="Clear selected solutions?"
          message="All services in this recommendation list will be removed."
          confirmLabel="Clear all"
          onConfirm={() => {
            resetSolutions();
            setConfirmClear(false);
            toast("Selected solutions cleared.");
          }}
          onCancel={() => setConfirmClear(false)}
        />
      )}
    </div>
  );
}

function Header({ clientName }: { clientName?: string }) {
  return (
    <header>
      <h1 className="text-xl font-bold text-slate-900">Selected Solutions</h1>
      <p className="text-sm text-slate-500">
        {clientName ? (
          <>
            Recommendation for <span className="font-semibold text-slate-700">{clientName}</span>
          </>
        ) : (
          <>
            No active client profile — <Link to="/profiles" className="text-accent hover:underline">select one</Link> to personalize the summary.
          </>
        )}
      </p>
    </header>
  );
}
