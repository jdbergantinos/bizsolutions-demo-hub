import { useEffect, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Info } from "lucide-react";
import type { DemoModuleType } from "../types";
import { getIndustry, getService } from "../data/catalog";
import { getModuleSampleScenario, getScenarioForService } from "../data/scenarios";
import { MODULE_TEMPLATES } from "../data/serviceTemplates";
import { DemoHost } from "../demos/DemoHost";
import { EmptyState } from "../components/common/EmptyState";
import { useApp } from "../store/AppStore";

/** Runs a demo for a specific service offer (industry-configured scenario). */
export function ServiceDemoPage() {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { addRecent } = useApp();

  const service = getService(serviceId);
  const industry = service ? getIndustry(service.industryId) : undefined;

  const scenario = useMemo(
    () => (service && industry ? getScenarioForService(service, industry) : null),
    [service, industry],
  );

  useEffect(() => {
    if (service) addRecent(service.id, service.industryId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service?.id]);

  if (!service || !industry || !scenario) {
    return (
      <EmptyState
        icon="Workflow"
        title="Demo not found"
        action={
          <Link to="/industries" className="text-sm font-medium text-accent hover:underline">
            Back to catalog
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <button
        onClick={() => navigate(`/services/${service.id}`)}
        className="inline-flex min-h-10 items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" /> Offer details
      </button>
      <header>
        <h1 className="text-xl font-bold text-slate-900">{service.name}</h1>
        <p className="flex items-center gap-1 text-sm text-slate-500">
          {industry.name} · {MODULE_TEMPLATES[service.demoModule].label}
        </p>
      </header>
      <DemoHost config={scenario} cautions={industry.cautions} />
    </div>
  );
}

/** Runs a module's neutral sample scenario (from the Demo Modules gallery). */
export function ModuleDemoPage() {
  const { moduleType } = useParams();
  const navigate = useNavigate();
  const valid = moduleType && moduleType in MODULE_TEMPLATES;
  const scenario = useMemo(
    () => (valid ? getModuleSampleScenario(moduleType as DemoModuleType) : null),
    [valid, moduleType],
  );

  if (!scenario) {
    return (
      <EmptyState
        icon="Workflow"
        title="Demo module not found"
        action={
          <Link to="/demos" className="text-sm font-medium text-accent hover:underline">
            Back to demo modules
          </Link>
        }
      />
    );
  }

  const template = MODULE_TEMPLATES[moduleType as DemoModuleType];
  return (
    <div className="space-y-4">
      <button
        onClick={() => navigate("/demos")}
        className="inline-flex min-h-10 items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" /> Demo modules
      </button>
      <header>
        <h1 className="text-xl font-bold text-slate-900">{template.label}</h1>
        <p className="flex items-center gap-1.5 text-sm text-slate-500">
          <Info className="h-4 w-4" /> Generic sample — industry offers load this engine with their own labels and data.
        </p>
      </header>
      <DemoHost config={scenario} />
    </div>
  );
}
