import { Link, useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft, CheckCircle2, ListPlus, Play } from "lucide-react";
import { getIndustry, getService } from "../data/catalog";
import { MODULE_TEMPLATES } from "../data/serviceTemplates";
import { Icon, MODULE_ICONS } from "../components/common/Icon";
import { Pill } from "../components/common/Badge";
import { EmptyState } from "../components/common/EmptyState";
import { FavoriteButton } from "../components/catalog/FavoriteButton";
import { useApp } from "../store/AppStore";
import { useToast } from "../store/ToastContext";

export function ServiceDetailPage() {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { addSolution } = useApp();
  const toast = useToast();

  const service = getService(serviceId);
  const industry = service ? getIndustry(service.industryId) : undefined;

  if (!service || !industry) {
    return (
      <EmptyState
        icon="FileText"
        title="Service offer not found"
        action={
          <Link to="/industries" className="text-sm font-medium text-accent hover:underline">
            Back to catalog
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-5">
      <button
        onClick={() => navigate(`/industries/${industry.id}`)}
        className="inline-flex min-h-10 items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" /> {industry.name}
      </button>

      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-accent-soft p-2.5 text-accent">
            <Icon name={MODULE_ICONS[service.demoModule]} className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between">
              <h1 className="text-lg font-bold leading-tight text-slate-900">{service.name}</h1>
              <FavoriteButton kind="services" id={service.id} />
            </div>
            <p className="mt-0.5 text-sm text-slate-500">{industry.name}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Pill tone="blue">{MODULE_TEMPLATES[service.demoModule].label}</Pill>
              <Pill tone="green">Demo available</Pill>
              {service.riskLevel !== "low" && (
                <Pill tone={service.riskLevel === "high" ? "red" : "amber"}>{service.riskLevel} risk</Pill>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <button
            onClick={() => navigate(`/demo/${service.id}`)}
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-accent text-sm font-semibold text-white hover:opacity-90"
          >
            <Play className="h-4 w-4" /> Launch interactive demo
          </button>
          <button
            onClick={() => {
              const added = addSolution(service.id, service.industryId);
              toast(added ? "Added to selected client solutions." : "Already in selected solutions.", added ? "success" : "info");
            }}
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ListPlus className="h-4 w-4" /> Add to selected solutions
          </button>
        </div>
      </header>

      <Section title="The business problem">
        <p>{service.problem}</p>
      </Section>

      <Section title="Proposed digital solution">
        <p>{service.solution}</p>
      </Section>

      <Section title="Primary functions">
        <CheckList items={service.functions} />
      </Section>

      <Section title="Sample workflow">
        <ol className="space-y-2">
          {service.workflowSteps.map((step, i) => (
            <li key={step} className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-bold text-accent">
                {i + 1}
              </span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Potential business benefits">
        <CheckList items={service.benefits} />
      </Section>

      <Section title="Screens included in the demo">
        <div className="flex flex-wrap gap-1.5">
          {service.screens.map((s) => (
            <Pill key={s} tone="gray">{s}</Pill>
          ))}
        </div>
      </Section>

      {industry.cautions && industry.cautions.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-amber-800">
            <AlertTriangle className="h-4 w-4" /> Implementation cautions
          </h2>
          <ul className="mt-2 space-y-1.5 text-sm text-amber-800">
            {industry.cautions.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs text-slate-400">
        This is a sales demonstration, not a finished product. Final requirements, integrations,
        security controls, implementation cost, and timeline require a separate discovery and
        technical assessment.
      </p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-relaxed text-slate-600 shadow-sm">
      <h2 className="mb-2 text-sm font-semibold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

function CheckList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
