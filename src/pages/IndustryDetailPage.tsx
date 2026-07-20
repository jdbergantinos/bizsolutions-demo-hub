import { Link, useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Calculator, ClipboardList, GitCompareArrows, Package, Play, ScanSearch, Star } from "lucide-react";
import { getIndustry } from "../data/catalog";
import { Icon } from "../components/common/Icon";
import { ServiceCard } from "../components/catalog/ServiceCard";
import { FavoriteButton } from "../components/catalog/FavoriteButton";
import { EmptyState } from "../components/common/EmptyState";

export function IndustryDetailPage() {
  const { industryId } = useParams();
  const navigate = useNavigate();
  const industry = getIndustry(industryId);

  if (!industry) {
    return (
      <EmptyState
        icon="Building2"
        title="Industry not found"
        action={
          <Link to="/industries" className="text-sm font-medium text-accent hover:underline">
            Back to catalog
          </Link>
        }
      />
    );
  }

  // The workflow demo we recommend opening first for this industry.
  const recommended =
    industry.services.find((s) => ["crm", "booking", "projects", "quotation", "ordering"].includes(s.demoModule)) ??
    industry.services[0];

  return (
    <div className="space-y-5">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex min-h-10 items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-accent-soft p-3 text-accent">
            <Icon name={industry.icon} className="h-8 w-8" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between">
              <h1 className="text-xl font-bold text-slate-900">{industry.name}</h1>
              <FavoriteButton kind="industries" id={industry.id} />
            </div>
            <p className="mt-1 text-sm text-slate-500">{industry.description}</p>
          </div>
        </div>

        <div className="mt-4 space-y-3 text-sm">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Example businesses</h2>
            <p className="mt-1 text-slate-600">{industry.examples.join(" · ")}</p>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Common operational problems</h2>
            <ul className="mt-1 list-inside list-disc space-y-0.5 text-slate-600">
              <li>Records scattered across notebooks, spreadsheets, and group chats</li>
              <li>No clear status visibility for {industry.vocab.jobs} and {industry.vocab.clients}</li>
              <li>Missed follow-ups, schedules, and replenishment because nothing sends reminders</li>
              <li>Management reports assembled manually, days or weeks late</li>
            </ul>
          </div>

          {industry.initialMarketRating && (
            <div className="flex items-start gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-emerald-800">
              <Star className="mt-0.5 h-4 w-4 shrink-0 fill-current" />
              <p className="text-sm">{industry.initialMarketRating}</p>
            </div>
          )}

          {industry.cautions?.map((c) => (
            <div key={c} className="flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 text-amber-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p className="text-sm">{c}</p>
            </div>
          ))}
        </div>

        {recommended && (
          <button
            onClick={() => navigate(`/demo/${recommended.id}`)}
            className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent text-sm font-semibold text-white hover:opacity-90"
          >
            <Play className="h-4 w-4" /> Launch recommended workflow: {recommended.name}
          </button>
        )}
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            onClick={() => navigate(`/pricing/new?industry=${industry.id}`)}
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Calculator className="h-4 w-4" /> Create estimate
          </button>
          <button
            onClick={() => navigate(`/pricing/new?industry=${industry.id}&quick=1`)}
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Package className="h-4 w-4" /> View recommended package
          </button>
          <button
            onClick={() => navigate(`/discovery?industry=${industry.id}`)}
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ClipboardList className="h-4 w-4" /> Start industry discovery
          </button>
          <button
            onClick={() => navigate(`/problem-scanner?industry=${industry.id}`)}
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ScanSearch className="h-4 w-4" /> View common problems
          </button>
          <button
            onClick={() => navigate(`/workflow-comparison?industry=${industry.id}&template=1`)}
            className="col-span-2 flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <GitCompareArrows className="h-4 w-4" /> Generate recommended workflow
          </button>
        </div>
      </header>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-800">
          Recommended service offers ({industry.services.length})
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {industry.services.map((s) => (
            <ServiceCard key={s.id} service={s} />
          ))}
        </div>
      </section>
    </div>
  );
}
