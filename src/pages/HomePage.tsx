import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, ChevronRight, Clock, Heart, ListChecks, MonitorPlay, RotateCcw, Star } from "lucide-react";
import { getIndustry, getService, INDUSTRIES } from "../data/catalog";
import { useApp } from "../store/AppStore";
import { useToast } from "../store/ToastContext";
import { SearchInput } from "../components/common/SearchInput";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { Icon } from "../components/common/Icon";

export function HomePage() {
  const toast = useToast();
  const { recents, favorites, solutions, resetDemos } = useApp();
  const [search, setSearch] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);

  const priority = INDUSTRIES.filter((i) => i.priority).slice(0, 6);
  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    const inds = INDUSTRIES.filter((i) => i.name.toLowerCase().includes(q)).map((i) => ({
      label: i.name,
      sub: "Industry",
      to: `/industries/${i.id}`,
      icon: i.icon,
    }));
    const svcs = INDUSTRIES.flatMap((i) =>
      i.services
        .filter((s) => s.name.toLowerCase().includes(q))
        .map((s) => ({ label: s.name, sub: i.name, to: `/services/${s.id}`, icon: i.icon })),
    );
    return [...inds, ...svcs].slice(0, 8);
  }, [search]);

  const favServices = favorites.services.slice(0, 4).map(getService).filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="rounded-2xl bg-accent p-6 text-white">
        <div className="flex items-center gap-3">
          <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="BizSolutions logo placeholder" className="h-12 w-12 rounded-xl bg-white/10 p-1" />
          <div>
            <h1 className="text-lg font-bold leading-tight">BizSolutions Demo Hub</h1>
            <p className="text-sm text-white/70">Interactive sales &amp; presentation tool</p>
          </div>
        </div>
        <p className="mt-4 text-base font-medium">What type of business are you meeting today?</p>
        <div className="mt-3 [&_input]:border-transparent">
          <SearchInput value={search} onChange={setSearch} placeholder="Search industries or services…" />
        </div>
        {results.length > 0 && (
          <ul className="mt-2 divide-y divide-white/10 rounded-xl bg-white/10">
            {results.map((r) => (
              <li key={r.to + r.label}>
                <Link to={r.to} className="flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-white/10">
                  <Icon name={r.icon} className="h-4 w-4 shrink-0 text-white/70" />
                  <span className="flex-1 truncate">{r.label}</span>
                  <span className="shrink-0 text-xs text-white/60">{r.sub}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link
            to="/industries"
            className="flex min-h-12 items-center justify-center gap-1.5 rounded-xl bg-white text-sm font-semibold text-accent hover:bg-white/90"
          >
            <Building2 className="h-4 w-4" /> Browse industries
          </Link>
          <Link
            to="/present"
            className="flex min-h-12 items-center justify-center gap-1.5 rounded-xl border border-white/40 text-sm font-semibold text-white hover:bg-white/10"
          >
            <MonitorPlay className="h-4 w-4" /> Start presentation
          </Link>
        </div>
      </section>

      {/* Priority industries */}
      <section>
        <SectionHeader title="Priority industries" to="/industries" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {priority.map((i) => (
            <Link
              key={i.id}
              to={`/industries/${i.id}`}
              className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-3 shadow-sm hover:shadow"
            >
              <span className="rounded-lg bg-accent-soft p-2 text-accent">
                <Icon name={i.icon} className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-xs font-semibold text-slate-900">{i.name}</span>
                <span className="flex items-center gap-0.5 text-[10px] text-amber-600">
                  <Star className="h-3 w-3 fill-current" /> Priority
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Recently opened demos */}
      <section>
        <SectionHeader title="Recently opened demos" icon={<Clock className="h-4 w-4" />} />
        {recents.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-5 text-center text-sm text-slate-400">
            Demos you open will appear here for quick access.
          </p>
        ) : (
          <ul className="space-y-2">
            {recents.slice(0, 4).map((r) => {
              const svc = getService(r.serviceId);
              const ind = getIndustry(r.industryId);
              if (!svc || !ind) return null;
              return (
                <li key={r.serviceId}>
                  <Link
                    to={`/demo/${svc.id}`}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm hover:shadow"
                  >
                    <Icon name={ind.icon} className="h-5 w-5 shrink-0 text-accent" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-slate-900">{svc.name}</span>
                      <span className="block text-xs text-slate-500">{ind.name}</span>
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-300" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Favorites */}
      {favServices.length > 0 && (
        <section>
          <SectionHeader title="Favorite demos" to="/favorites" icon={<Heart className="h-4 w-4" />} />
          <ul className="space-y-2">
            {favServices.map((svc) => (
              <li key={svc!.id}>
                <Link
                  to={`/demo/${svc!.id}`}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm hover:shadow"
                >
                  <Heart className="h-4 w-4 shrink-0 fill-red-500 text-red-500" />
                  <span className="flex-1 truncate text-sm font-medium text-slate-900">{svc!.name}</span>
                  <ChevronRight className="h-4 w-4 text-slate-300" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Selected solutions */}
      <section>
        <SectionHeader title="Selected client solutions" to="/solutions" icon={<ListChecks className="h-4 w-4" />} />
        {solutions.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-5 text-center text-sm text-slate-400">
            Add service offers to build a recommendation for your client.
          </p>
        ) : (
          <Link
            to="/solutions"
            className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow"
          >
            <span className="text-sm font-medium text-slate-900">
              {solutions.length} service{solutions.length > 1 ? "s" : ""} selected
            </span>
            <ChevronRight className="h-4 w-4 text-slate-300" />
          </Link>
        )}
      </section>

      {/* Reset */}
      <button
        onClick={() => setConfirmReset(true)}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 text-sm font-medium text-slate-600 hover:bg-white"
      >
        <RotateCcw className="h-4 w-4" /> Reset all demo data
      </button>

      {confirmReset && (
        <ConfirmDialog
          title="Reset all demo data?"
          message="All demo records in every module will be restored to their original sample data. Client profiles, favorites, and selected solutions are kept."
          confirmLabel="Reset demos"
          onConfirm={() => {
            resetDemos();
            setConfirmReset(false);
            toast("Demo data restored.");
          }}
          onCancel={() => setConfirmReset(false)}
        />
      )}
    </div>
  );
}

function SectionHeader({ title, to, icon }: { title: string; to?: string; icon?: React.ReactNode }) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <h2 className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
        {icon}
        {title}
      </h2>
      {to && (
        <Link to={to} className="text-xs font-medium text-accent hover:underline">
          See all
        </Link>
      )}
    </div>
  );
}
