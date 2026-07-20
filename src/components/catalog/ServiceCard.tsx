import { Link, useNavigate } from "react-router-dom";
import { ListPlus, Play } from "lucide-react";
import type { ServiceOffer } from "../../types";
import { MODULE_TEMPLATES } from "../../data/serviceTemplates";
import { Icon, MODULE_ICONS } from "../common/Icon";
import { Pill } from "../common/Badge";
import { FavoriteButton } from "./FavoriteButton";
import { useApp } from "../../store/AppStore";
import { useToast } from "../../store/ToastContext";

export function ServiceCard({ service }: { service: ServiceOffer }) {
  const navigate = useNavigate();
  const { addSolution } = useApp();
  const toast = useToast();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
          <Icon name={MODULE_ICONS[service.demoModule]} className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between">
            <h3 className="text-sm font-semibold text-slate-900">{service.name}</h3>
            <FavoriteButton kind="services" id={service.id} className="-mr-2 -mt-2" />
          </div>
          <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{service.description}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Pill tone="blue">{MODULE_TEMPLATES[service.demoModule].label}</Pill>
            <Pill tone={service.demoStatus === "available" ? "green" : "gray"}>
              {service.demoStatus === "available" ? "Demo available" : service.demoStatus}
            </Pill>
            {service.riskLevel !== "low" && (
              <Pill tone={service.riskLevel === "high" ? "red" : "amber"}>
                {service.riskLevel} risk
              </Pill>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Link
          to={`/services/${service.id}`}
          className="flex min-h-11 items-center justify-center rounded-xl border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          View details
        </Link>
        <button
          onClick={() => navigate(`/demo/${service.id}`)}
          className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-accent text-sm font-semibold text-white hover:opacity-90"
        >
          <Play className="h-4 w-4" /> Launch demo
        </button>
      </div>
      <button
        onClick={() => {
          const added = addSolution(service.id, service.industryId);
          toast(added ? "Added to selected client solutions." : "Already in selected solutions.", added ? "success" : "info");
        }}
        className="mt-2 flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 text-sm font-medium text-slate-600 hover:bg-slate-50"
      >
        <ListPlus className="h-4 w-4" /> Add to client solution
      </button>
    </div>
  );
}
