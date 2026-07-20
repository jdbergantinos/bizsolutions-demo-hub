import { useNavigate } from "react-router-dom";
import { UserRound } from "lucide-react";
import { getIndustry } from "../../data/catalog";
import { loadDiscoveries } from "../store/discoveryStorage";

/**
 * The "Working on: [Client]" bar shown above every client-workspace tool, so
 * the presenter always knows — and can switch — which client the ROI, scope,
 * workflow, roadmap, packages, meetings, and summary are for.
 */
export function WorkspaceBar({ activeId, onChange }: { activeId: string | null; onChange: (id: string | null) => void }) {
  const navigate = useNavigate();
  const discoveries = loadDiscoveries().slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const active = discoveries.find((d) => d.id === activeId) ?? null;

  if (discoveries.length === 0) {
    return (
      <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
        No client selected —{" "}
        <button onClick={() => navigate("/discovery")} className="font-semibold underline">
          start a discovery
        </button>{" "}
        so these tools know who you're working on.
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 border-b border-slate-200 bg-accent-soft/50 px-4 py-2">
      <UserRound className="h-4 w-4 shrink-0 text-accent" />
      <span className="shrink-0 text-xs font-medium text-slate-500">Working on:</span>
      <select
        value={active?.id ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        aria-label="Active client"
        className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm font-semibold text-slate-900"
      >
        {!active && <option value="">— Select a client —</option>}
        {discoveries.map((d) => {
          const ind = getIndustry(d.business.industryId);
          return (
            <option key={d.id} value={d.id}>
              {d.business.businessName || "Unnamed client"}
              {ind ? ` · ${ind.name}` : ""}
            </option>
          );
        })}
      </select>
    </div>
  );
}
