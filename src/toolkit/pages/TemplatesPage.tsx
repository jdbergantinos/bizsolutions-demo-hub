import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, LayoutTemplate, Play } from "lucide-react";
import { useToast } from "../../store/ToastContext";
import { Pill } from "../../components/common/Badge";
import { getProblem } from "../../discovery/config/problemCatalog";
import { MODULE_TEMPLATES } from "../../data/serviceTemplates";
import { NEXT_STEPS } from "../../value/engine/nextStep";
import { DASHBOARD_CARDS } from "../config/dashboardCards";
import { INTEGRATION_CATALOG } from "../config/integrationCatalog";
import { INDUSTRY_TEMPLATES } from "../config/industryTemplates";
import { applyIndustryTemplate } from "../engine/applyTemplate";
import { getIndustry } from "../../data/catalog";

export function TemplatesPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <button onClick={() => navigate("/discovery")} className="inline-flex min-h-10 items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Discovery
      </button>
      <header>
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <LayoutTemplate className="h-5 w-5 text-accent" /> Industry Presentation Templates
        </h1>
        <p className="text-sm text-slate-500">
          Ready-made starting points per industry. Applying a template creates a <strong>new</strong> presentation — your saved custom presentations are never overwritten.
        </p>
      </header>

      <div className="space-y-2">
        {INDUSTRY_TEMPLATES.map((t) => {
          const industry = getIndustry(t.industryId);
          const open = openId === t.industryId;
          return (
            <div key={t.industryId} className={`rounded-2xl border bg-white p-4 shadow-sm ${open ? "border-accent" : "border-slate-200"}`}>
              <button onClick={() => setOpenId(open ? null : t.industryId)} className="w-full text-left">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                  <span className="text-xs text-slate-400">{open ? "Hide" : "View"}</span>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">
                  {t.recommendedModules.map((m) => MODULE_TEMPLATES[m].label).join(" · ")}
                </p>
              </button>

              {open && (
                <div className="mt-3 space-y-3 border-t border-slate-100 pt-3 text-xs text-slate-600">
                  <Block title="Common client problems">
                    <div className="flex flex-wrap gap-1">
                      {t.commonProblems.map((id) => (
                        <Pill key={id} tone="amber">{getProblem(id)?.title ?? id}</Pill>
                      ))}
                    </div>
                  </Block>
                  <Block title="Recommended discovery questions">
                    <ul className="list-inside list-disc space-y-0.5">
                      {t.discoveryQuestions.map((q) => (
                        <li key={q}>{q}</li>
                      ))}
                    </ul>
                  </Block>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Block title="Default current workflow">
                      <p>{t.defaultCurrentWorkflow.join(" → ")}</p>
                    </Block>
                    <Block title="Default proposed workflow">
                      <p>{t.defaultProposedWorkflow.join(" → ")}</p>
                    </Block>
                  </div>
                  <Block title="Suggested dashboards">
                    <p>{t.suggestedDashboards.map((id) => DASHBOARD_CARDS.find((c) => c.id === id)?.label).filter(Boolean).join(" · ")}</p>
                  </Block>
                  <Block title="Typical integrations">
                    <p>{t.typicalIntegrations.map((id) => INTEGRATION_CATALOG.find((x) => x.id === id)?.name).filter(Boolean).join(" · ")}</p>
                  </Block>
                  <Block title="Role views">
                    <p>Industry role names load automatically in the presentation's role-views section.</p>
                  </Block>
                  {industry?.cautions && industry.cautions.length > 0 && (
                    <Block title="Caution notices">
                      <ul className="list-inside list-disc space-y-0.5 text-amber-700">
                        {industry.cautions.map((c) => (
                          <li key={c}>{c}</li>
                        ))}
                      </ul>
                    </Block>
                  )}
                  <Block title="Suggested next step">
                    <p>{NEXT_STEPS[t.suggestedNextStep].label}</p>
                  </Block>
                  <button
                    onClick={() => {
                      const p = applyIndustryTemplate(t);
                      toast(`New presentation "${p.title}" created from the template.`);
                      navigate("/presentation-builder");
                    }}
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-accent text-sm font-semibold text-white hover:opacity-90"
                  >
                    <Play className="h-4 w-4" /> Use this template (creates a new presentation)
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 font-semibold uppercase tracking-wide text-slate-400">{title}</p>
      {children}
    </div>
  );
}
