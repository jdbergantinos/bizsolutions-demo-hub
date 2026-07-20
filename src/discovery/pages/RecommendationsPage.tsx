import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Calculator, ExternalLink, Lightbulb, ListPlus, RefreshCcw, Save, Sparkles } from "lucide-react";
import { getIndustry, getService } from "../../data/catalog";
import { useApp } from "../../store/AppStore";
import { useToast } from "../../store/ToastContext";
import { EmptyState } from "../../components/common/EmptyState";
import { Pill } from "../../components/common/Badge";
import type { DiscoveryRecord, Recommendation, RecommendationSet, RecommendationTier } from "../types";
import { generateRecommendations } from "../engine/recommend";
import { getActiveDiscovery, upsertDiscovery } from "../store/discoveryStorage";

const TIER_META: Record<RecommendationTier, { label: string; tone: "green" | "blue" | "violet" | "amber" | "red"; note: string }> = {
  recommended: { label: "Recommended", tone: "green", note: "Directly addresses the client's confirmed problems." },
  optional: { label: "Optional", tone: "blue", note: "Useful additions once the core is in place." },
  "future-phase": { label: "Future phase", tone: "violet", note: "Consider after the initial implementation succeeds." },
  "technical-review": { label: "Needs technical review", tone: "amber", note: "Cautions apply — review before including." },
  "not-initially": { label: "Not initially", tone: "red", note: "Deliberately excluded from a first phase." },
};

const TIER_ORDER: RecommendationTier[] = ["recommended", "optional", "future-phase", "technical-review", "not-initially"];

export function RecommendationsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { solutions, addSolution } = useApp();

  const [discovery, setDiscovery] = useState<DiscoveryRecord | null>(getActiveDiscovery);
  const [addOpen, setAddOpen] = useState(false);

  const recSet: RecommendationSet | null = useMemo(() => discovery?.recommendationSet ?? null, [discovery]);

  if (!discovery) {
    return (
      <EmptyState
        icon="Lightbulb"
        title="No active discovery"
        message="Recommendations are generated from a discovery's problems and profile."
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

  const regenerate = () => {
    const set = generateRecommendations(discovery, solutions.map((s) => s.serviceId));
    persist({ ...discovery, recommendationSet: set });
    toast("Recommendations generated from the discovery.");
  };

  const updateRec = (serviceOfferId: string, patch: Partial<Recommendation>) => {
    if (!recSet) return;
    persist({
      ...discovery,
      recommendationSet: {
        ...recSet,
        recommendations: recSet.recommendations.map((r) => (r.serviceOfferId === serviceOfferId ? { ...r, ...patch } : r)),
      },
    });
  };

  const accepted = recSet?.recommendations.filter((r) => r.decision === "accepted") ?? [];

  return (
    <div className="space-y-4">
      <button onClick={() => navigate("/discovery")} className="inline-flex min-h-10 items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Discovery
      </button>
      <header>
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <Lightbulb className="h-5 w-5 text-accent" /> Recommended Solution
        </h1>
        <p className="text-sm text-slate-500">
          {discovery.business.businessName || "Unnamed client"} · {industry?.name ?? "No industry"} · {discovery.problems.length} problem(s) selected
        </p>
      </header>

      {!recSet ? (
        <EmptyState
          icon="Lightbulb"
          title="No recommendations yet"
          message={
            discovery.problems.length === 0
              ? "Select the client's problems in the Problem Scanner first — recommendations are built from them."
              : "Generate recommendations from the discovery's problems, outcomes, and business profile."
          }
          action={
            discovery.problems.length === 0 ? (
              <Link to="/problem-scanner" className="text-sm font-semibold text-accent hover:underline">
                Open Problem Scanner
              </Link>
            ) : (
              <button onClick={regenerate} className="min-h-11 rounded-xl bg-accent px-5 text-sm font-semibold text-white hover:opacity-90">
                Generate recommendations
              </button>
            )
          }
        />
      ) : (
        <>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="flex items-start gap-2 text-xs text-slate-500">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <span>
                <strong className="text-slate-700">Automated suggestion</strong> — {recSet.notes} Generated{" "}
                {new Date(recSet.generatedAt).toLocaleString()}.
              </span>
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Suggested commercial model: <strong>{recSet.suggestedDeliveryModel.replace(/-/g, " ")}</strong> · Suggested
              configuration level: <strong>{recSet.suggestedConfigurationLevel}</strong>
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={regenerate} className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-slate-300 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50">
                <RefreshCcw className="h-3.5 w-3.5" /> Regenerate
              </button>
              <button onClick={() => setAddOpen((v) => !v)} className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-slate-300 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50">
                <ListPlus className="h-3.5 w-3.5" /> Add another service
              </button>
              <button
                onClick={() => {
                  persist({ ...discovery, status: "ready-for-recommendation" });
                  toast("Recommendation set saved with the discovery.");
                }}
                className="inline-flex min-h-10 items-center gap-1 rounded-lg bg-accent px-3 text-xs font-semibold text-white hover:opacity-90"
              >
                <Save className="h-3.5 w-3.5" /> Save set
              </button>
              <button
                onClick={() => {
                  accepted.forEach((r) => addSolution(r.serviceOfferId, discovery.business.industryId));
                  toast(`${accepted.length || "No"} accepted service(s) added to Selected Solutions.`, accepted.length ? "success" : "info");
                }}
                className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-slate-300 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                <ListPlus className="h-3.5 w-3.5" /> Accepted → Solutions
              </button>
              <button
                onClick={() => navigate("/pricing/new?discovery=1")}
                className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-slate-300 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                <Calculator className="h-3.5 w-3.5" /> Send to Pricing
              </button>
            </div>
          </div>

          {addOpen && industry && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="mb-2 text-xs font-medium text-slate-600">Add a service that wasn't auto-suggested:</p>
              <div className="flex flex-wrap gap-1.5">
                {industry.services
                  .filter((s) => !recSet.recommendations.some((r) => r.serviceOfferId === s.id && r.decision === "accepted"))
                  .map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        updateRec(s.id, { decision: "accepted" });
                        toast(`"${s.name}" accepted.`);
                      }}
                      className="min-h-10 rounded-lg border border-slate-300 px-3 text-xs text-slate-600 hover:bg-slate-50"
                    >
                      {s.name}
                    </button>
                  ))}
              </div>
            </div>
          )}

          {TIER_ORDER.map((tier) => {
            const list = recSet.recommendations.filter((r) => r.tier === tier && r.decision !== "removed");
            if (list.length === 0) return null;
            const meta = TIER_META[tier];
            return (
              <section key={tier}>
                <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-800">
                  {meta.label} ({list.length})
                </h2>
                <p className="mb-2 text-xs text-slate-400">{meta.note}</p>
                <div className="space-y-2">
                  {list.map((rec) => (
                    <RecommendationCard
                      key={rec.serviceOfferId}
                      rec={rec}
                      tone={meta.tone}
                      onDecision={(decision) => updateRec(rec.serviceOfferId, { decision })}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </>
      )}
    </div>
  );
}

function RecommendationCard({
  rec,
  tone,
  onDecision,
}: {
  rec: Recommendation;
  tone: "green" | "blue" | "violet" | "amber" | "red";
  onDecision: (d: Recommendation["decision"]) => void;
}) {
  const service = getService(rec.serviceOfferId);
  const [open, setOpen] = useState(false);
  if (!service) return null;
  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${rec.decision === "accepted" ? "border-accent bg-accent-soft/40" : "border-slate-200 bg-white"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">{service.name}</p>
          <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{service.description}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <Pill tone={tone}>Score {rec.score}</Pill>
          {rec.decision !== "pending" && <Pill tone="gray">{rec.decision.replace(/-/g, " ")}</Pill>}
        </div>
      </div>

      <button onClick={() => setOpen((v) => !v)} className="mt-1.5 text-xs font-medium text-accent hover:underline">
        {open ? "Hide reasons" : "Why recommended?"}
      </button>
      {open && (
        <div className="mt-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
          <ul className="list-inside list-disc space-y-0.5">
            {rec.reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          {rec.expectedBenefits.length > 0 && (
            <p className="mt-1.5"><span className="font-semibold">Expected benefits:</span> {rec.expectedBenefits.join("; ")}</p>
          )}
          {rec.caution && <p className="mt-1.5 text-amber-700">⚠ {rec.caution}</p>}
          <p className="mt-1.5 italic text-slate-400">
            Automated, rule-based suggestion — verify with the client; results are not guaranteed.
          </p>
        </div>
      )}

      <div className="mt-2 flex flex-wrap gap-1.5">
        {rec.decision !== "accepted" ? (
          <button onClick={() => onDecision("accepted")} className="min-h-10 rounded-lg bg-accent px-3 text-xs font-semibold text-white hover:opacity-90">
            Accept
          </button>
        ) : (
          <button onClick={() => onDecision("pending")} className="min-h-10 rounded-lg border border-slate-300 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50">
            Unaccept
          </button>
        )}
        <button onClick={() => onDecision("later-phase")} className="min-h-10 rounded-lg border border-slate-300 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50">
          Later phase
        </button>
        <button onClick={() => onDecision("removed")} className="min-h-10 rounded-lg border border-red-200 px-3 text-xs font-medium text-red-600 hover:bg-red-50">
          Remove
        </button>
        <a
          href={`#/demo/${service.id}`}
          target="_blank"
          rel="noreferrer"
          className="ml-auto inline-flex min-h-10 items-center gap-1 rounded-lg border border-slate-300 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50"
        >
          <ExternalLink className="h-3.5 w-3.5" /> Demo
        </a>
      </div>
    </div>
  );
}
