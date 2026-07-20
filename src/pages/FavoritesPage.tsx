import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Clock } from "lucide-react";
import { getIndustry, getService, INDUSTRIES } from "../data/catalog";
import { GUIDED_SCENARIOS } from "../data/guidedScenarios";
import { useApp } from "../store/AppStore";
import { useToast } from "../store/ToastContext";
import { Icon } from "../components/common/Icon";
import { EmptyState } from "../components/common/EmptyState";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { FavoriteButton } from "../components/catalog/FavoriteButton";

type Tab = "industries" | "services" | "scenarios";

export function FavoritesPage() {
  const { favorites, recents, clearRecents } = useApp();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("industries");
  const [confirmClear, setConfirmClear] = useState(false);

  const favIndustries = INDUSTRIES.filter((i) => favorites.industries.includes(i.id));
  const favServices = favorites.services.map(getService).filter(Boolean);
  const favScenarios = GUIDED_SCENARIOS.filter((g) => favorites.scenarios.includes(g.id));

  const counts: Record<Tab, number> = {
    industries: favIndustries.length,
    services: favServices.length,
    scenarios: favScenarios.length,
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-900">Favorites</h1>

      <div className="flex gap-2">
        {(["industries", "services", "scenarios"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            aria-pressed={tab === t}
            className={`min-h-11 flex-1 rounded-xl text-sm font-medium capitalize ${
              tab === t ? "bg-accent text-white" : "border border-slate-300 bg-white text-slate-600"
            }`}
          >
            {t} ({counts[t]})
          </button>
        ))}
      </div>

      {tab === "industries" &&
        (favIndustries.length === 0 ? (
          <Empty what="industries" />
        ) : (
          <ul className="space-y-2">
            {favIndustries.map((i) => (
              <li key={i.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                <Icon name={i.icon} className="h-5 w-5 shrink-0 text-accent" />
                <Link to={`/industries/${i.id}`} className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-slate-900">{i.name}</span>
                  <span className="text-xs text-slate-500">{i.services.length} offers</span>
                </Link>
                <FavoriteButton kind="industries" id={i.id} />
              </li>
            ))}
          </ul>
        ))}

      {tab === "services" &&
        (favServices.length === 0 ? (
          <Empty what="service offers" />
        ) : (
          <ul className="space-y-2">
            {favServices.map((s) => {
              const ind = getIndustry(s!.industryId);
              return (
                <li key={s!.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                  <Link to={`/services/${s!.id}`} className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-900">{s!.name}</span>
                    <span className="text-xs text-slate-500">{ind?.name}</span>
                  </Link>
                  <Link to={`/demo/${s!.id}`} className="shrink-0 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white">
                    Demo
                  </Link>
                  <FavoriteButton kind="services" id={s!.id} />
                </li>
              );
            })}
          </ul>
        ))}

      {tab === "scenarios" &&
        (favScenarios.length === 0 ? (
          <Empty what="guided scenarios" hint="Favorite a guided scenario from Presentation Mode." />
        ) : (
          <ul className="space-y-2">
            {favScenarios.map((g) => (
              <li key={g.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                <Link to="/present" className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-slate-900">{g.name}</span>
                  <span className="text-xs text-slate-500">{g.steps.length} steps</span>
                </Link>
                <FavoriteButton kind="scenarios" id={g.id} />
              </li>
            ))}
          </ul>
        ))}

      {/* Recently viewed */}
      <section className="pt-2">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
            <Clock className="h-4 w-4" /> Recently opened demos
          </h2>
          {recents.length > 0 && (
            <button onClick={() => setConfirmClear(true)} className="text-xs font-medium text-red-600 hover:underline">
              Clear recent activity
            </button>
          )}
        </div>
        {recents.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-5 text-center text-sm text-slate-400">
            Nothing opened recently.
          </p>
        ) : (
          <ul className="space-y-2">
            {recents.map((r) => {
              const svc = getService(r.serviceId);
              if (!svc) return null;
              return (
                <li key={r.serviceId}>
                  <Link
                    to={`/demo/${svc.id}`}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm hover:shadow"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-slate-900">{svc.name}</span>
                      <span className="text-xs text-slate-400">{new Date(r.at).toLocaleString()}</span>
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-300" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {confirmClear && (
        <ConfirmDialog
          title="Clear recent activity?"
          message="The list of recently opened demos will be emptied."
          confirmLabel="Clear"
          onConfirm={() => {
            clearRecents();
            setConfirmClear(false);
            toast("Recent activity cleared.");
          }}
          onCancel={() => setConfirmClear(false)}
        />
      )}
    </div>
  );
}

function Empty({ what, hint }: { what: string; hint?: string }) {
  return (
    <EmptyState
      icon="Heart"
      title={`No favorite ${what} yet`}
      message={hint ?? `Tap the heart icon on any ${what.replace(/s$/, "")} to pin it here.`}
    />
  );
}
