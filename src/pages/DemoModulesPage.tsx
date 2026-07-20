import { Link } from "react-router-dom";
import { Play } from "lucide-react";
import type { DemoModuleType } from "../types";
import { MODULE_TEMPLATES } from "../data/serviceTemplates";
import { ALL_SERVICES, MODULE_ENGINE } from "../data/catalog";
import { Icon, MODULE_ICONS } from "../components/common/Icon";
import { Pill } from "../components/common/Badge";

const ENGINE_LABEL: Record<string, string> = {
  records: "Workflow engine",
  pipeline: "Pipeline engine",
  booking: "Schedule engine",
  inventory: "Stock engine",
  lineitems: "Line-item engine",
  dashboard: "Analytics engine",
};

export function DemoModulesPage() {
  const modules = Object.keys(MODULE_TEMPLATES) as DemoModuleType[];
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-bold text-slate-900">Demo Modules</h1>
        <p className="text-sm text-slate-500">
          {modules.length} reusable engines power every industry demo. Each offer loads one of
          these with industry-specific labels, fields, and sample records.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((m) => {
          const t = MODULE_TEMPLATES[m];
          const usedBy = ALL_SERVICES.filter((s) => s.demoModule === m).length;
          return (
            <div key={m} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-accent-soft p-2.5 text-accent">
                  <Icon name={MODULE_ICONS[m]} className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-semibold text-slate-900">{t.label}</h2>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <Pill tone="blue">{ENGINE_LABEL[MODULE_ENGINE[m]]}</Pill>
                    <Pill tone="gray">{usedBy} offers</Pill>
                  </div>
                </div>
              </div>
              <p className="mt-2 flex-1 text-xs leading-relaxed text-slate-500">
                {t.problem.slice(0, 120)}…
              </p>
              <Link
                to={`/demo/module/${m}`}
                className="mt-3 flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-accent text-sm font-semibold text-white hover:opacity-90"
              >
                <Play className="h-4 w-4" /> Open sample demo
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
