import { Link } from "react-router-dom";
import { ChevronRight, Star } from "lucide-react";
import type { Industry } from "../../types";
import { Icon } from "../common/Icon";
import { FavoriteButton } from "./FavoriteButton";

export function IndustryCard({ industry }: { industry: Industry }) {
  const demoCount = industry.services.filter((s) => s.demoStatus !== "coming-soon").length;
  return (
    <div className="relative rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-accent-soft p-2.5 text-accent">
          <Icon name={industry.icon} className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-1">
            <h3 className="text-sm font-semibold text-slate-900">{industry.name}</h3>
            <FavoriteButton kind="industries" id={industry.id} className="-mr-2 -mt-2" />
          </div>
          <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{industry.description}</p>
        </div>
      </div>

      <p className="mt-2 line-clamp-1 text-xs text-slate-400">
        e.g. {industry.examples.slice(0, 3).join(", ")}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px]">
        <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
          {industry.services.length} offers
        </span>
        <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
          {demoCount} working demos
        </span>
        {industry.priority && (
          <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-700">
            <Star className="h-3 w-3 fill-current" /> Priority market
          </span>
        )}
      </div>

      <Link
        to={`/industries/${industry.id}`}
        className="mt-3 flex min-h-11 items-center justify-center gap-1 rounded-xl bg-accent text-sm font-semibold text-white hover:opacity-90"
      >
        Open industry <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
