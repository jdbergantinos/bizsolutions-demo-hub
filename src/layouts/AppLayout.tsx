import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Building2, Calculator, ClipboardList, Heart, Home, LayoutGrid, ListChecks,
  MonitorPlay, MoreHorizontal, Settings, UserRound, Wifi, WifiOff, X,
} from "lucide-react";
import { useApp } from "../store/AppStore";
import { useOnline } from "../hooks/useOnline";
import { ReloadPrompt } from "../components/common/ReloadPrompt";
import { ErrorBoundary } from "../components/common/ErrorBoundary";
import { WorkspaceBar } from "../discovery/components/WorkspaceBar";
import { getActiveDiscoveryId, setActiveDiscoveryId } from "../discovery/store/discoveryStorage";
import { activeProfileIdForDiscovery } from "../discovery/engine/workspace";

// Client-workspace tools that operate on the active client's records — the
// "Working on: [Client]" bar appears above these so the presenter always
// knows (and can switch) which client they're on.
const WORKSPACE_ROUTES = new Set([
  "/problem-scanner",
  "/solution-recommendations",
  "/workflow-comparison",
  "/roi",
  "/scope",
  "/roadmap",
  "/meetings",
  "/packages",
  "/summary",
  "/presentation-builder",
]);

const NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/industries", label: "Industries", icon: Building2 },
  { to: "/discovery", label: "Discovery", icon: ClipboardList },
  { to: "/demos", label: "Demo Modules", icon: LayoutGrid },
  { to: "/pricing", label: "Pricing Configurator", icon: Calculator },
  { to: "/solutions", label: "Selected Solutions", icon: ListChecks },
  { to: "/present", label: "Presentation Mode", icon: MonitorPlay },
  { to: "/profiles", label: "Client Profile", icon: UserRound },
  { to: "/favorites", label: "Favorites", icon: Heart },
  { to: "/settings", label: "Settings", icon: Settings },
];

const mobilePaths = ["/", "/industries", "/discovery", "/pricing"];
const MOBILE_NAV = mobilePaths.map((p) => NAV.find((n) => n.to === p)!);
const MORE_NAV = NAV.filter((n) => !mobilePaths.includes(n.to));

export function AppLayout() {
  const online = useOnline();
  const { activeProfile, presentation, profiles, setActiveProfile } = useApp();
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();
  const [activeDiscoveryId, setActiveDiscoveryIdState] = useState<string | null>(getActiveDiscoveryId());
  const showWorkspaceBar = WORKSPACE_ROUTES.has(location.pathname);

  // Switching the active client anywhere keeps all three "active" notions in
  // sync: the active discovery, and the client profile it's saved as.
  const switchActiveClient = (id: string | null) => {
    setActiveDiscoveryId(id);
    setActiveDiscoveryIdState(id);
    setActiveProfile(activeProfileIdForDiscovery(id, profiles));
  };

  // Temporary client accent (profile or presentation) applied app-wide.
  const accent = presentation.active
    ? presentation.accentColor
    : activeProfile?.accentColor;

  return (
    <div
      className="min-h-dvh md:flex"
      style={accent ? ({ "--app-accent": accent } as React.CSSProperties) : undefined}
    >
      <ReloadPrompt />

      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white md:flex md:sticky md:top-0 md:h-dvh">
        <div className="flex items-center gap-3 px-5 py-5">
          <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" className="h-9 w-9 rounded-lg" />
          <div>
            <p className="text-sm font-bold leading-tight text-slate-900">BizSolutions</p>
            <p className="text-xs text-slate-500">Demo Hub</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {NAV.map(({ to, label, icon: IconCmp }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition ${
                  isActive ? "bg-accent-soft text-accent" : "text-slate-600 hover:bg-slate-50"
                }`
              }
            >
              <IconCmp className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-200 p-4">
          <OfflineBadge online={online} />
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex-1 pb-20 md:pb-0">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur md:hidden">
          <div className="flex items-center gap-2">
            <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" className="h-8 w-8 rounded-lg" />
            <span className="text-sm font-bold text-slate-900">BizSolutions Demo Hub</span>
          </div>
          <OfflineBadge online={online} compact />
        </header>

        {showWorkspaceBar && (
          <WorkspaceBar activeId={activeDiscoveryId} onChange={switchActiveClient} />
        )}

        <main className="mx-auto w-full max-w-5xl px-4 py-4 md:px-8 md:py-8">
          {/* Keyed on the active client so switching reloads the tool's data. */}
          <ErrorBoundary key={location.pathname + location.search + (activeDiscoveryId ?? "")}>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
        {MOBILE_NAV.map(({ to, label, icon: IconCmp }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex min-h-14 flex-col items-center justify-center gap-0.5 text-[10px] font-medium ${
                isActive ? "text-accent" : "text-slate-500"
              }`
            }
          >
            <IconCmp className="h-5 w-5" />
            {label.split(" ")[0]}
          </NavLink>
        ))}
        <button
          onClick={() => setMoreOpen(true)}
          className="flex min-h-14 flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-slate-500"
        >
          <MoreHorizontal className="h-5 w-5" />
          More
        </button>
      </nav>

      {/* Mobile "More" sheet */}
      {moreOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/50 md:hidden" onClick={() => setMoreOpen(false)}>
          <div
            className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">More</p>
              <button onClick={() => setMoreOpen(false)} aria-label="Close" className="rounded p-2 text-slate-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            {MORE_NAV.map(({ to, label, icon: IconCmp }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMoreOpen(false)}
                className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <IconCmp className="h-5 w-5 text-slate-500" />
                {label}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function OfflineBadge({ online, compact }: { online: boolean; compact?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        online ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
      }`}
      title={online ? "Online — app is also cached for offline use" : "Offline — running from device cache"}
    >
      {online ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
      {!compact && (online ? "Offline-ready" : "Offline mode")}
    </span>
  );
}
