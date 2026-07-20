import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, LayoutDashboard, MonitorPlay } from "lucide-react";
import { useToast } from "../../store/ToastContext";
import { Pill } from "../../components/common/Badge";
import { DEFAULT_ROLES } from "../../discovery/config/roleConfigs";
import { loadPresentations, upsertPresentation } from "../../discovery/store/discoveryStorage";
import type { DashboardPreference } from "../types";
import { DASHBOARD_CARDS } from "../config/dashboardCards";
import { dashboardPrefRepo } from "../store/toolkitStorage";
import { uid } from "../../utils/storage";

const inputCls = "min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm";

function newPref(): DashboardPreference {
  const now = new Date().toISOString();
  return {
    schemaVersion: 1, id: uid(), name: "Client dashboard preference", cardIds: [],
    roleVisibility: {}, branchVisibility: "All branches", customReportsRequired: [],
    createdAt: now, updatedAt: now,
  };
}

export function DashboardSelectorPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [pref, setPref] = useState<DashboardPreference>(() => dashboardPrefRepo.loadAll()[0] ?? newPref());

  useEffect(() => {
    const t = setTimeout(() => dashboardPrefRepo.upsert({ ...pref, updatedAt: new Date().toISOString() }), 400);
    return () => clearTimeout(t);
  }, [pref]);

  const toggle = (id: string) =>
    setPref((p) => ({ ...p, cardIds: p.cardIds.includes(id) ? p.cardIds.filter((x) => x !== id) : [...p.cardIds, id] }));

  const move = (id: string, dir: -1 | 1) => {
    const i = pref.cardIds.indexOf(id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= pref.cardIds.length) return;
    const copy = [...pref.cardIds];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    setPref((p) => ({ ...p, cardIds: copy }));
  };

  const toggleRole = (cardId: string, roleId: string) =>
    setPref((p) => {
      const cur = p.roleVisibility[cardId] ?? [];
      return {
        ...p,
        roleVisibility: { ...p.roleVisibility, [cardId]: cur.includes(roleId) ? cur.filter((x) => x !== roleId) : [...cur, roleId] },
      };
    });

  const toggleCustom = (cardId: string) =>
    setPref((p) => ({
      ...p,
      customReportsRequired: p.customReportsRequired.includes(cardId)
        ? p.customReportsRequired.filter((x) => x !== cardId)
        : [...p.customReportsRequired, cardId],
    }));

  return (
    <div className="space-y-4">
      <button onClick={() => navigate("/discovery")} className="inline-flex min-h-10 items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Discovery
      </button>
      <header>
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <LayoutDashboard className="h-5 w-5 text-accent" /> Dashboard & Report Selector
        </h1>
        <p className="text-sm text-slate-500">
          Choose the cards this client cares about. Selections are preferences for discussion — not final requirements until reviewed.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <input value={pref.name} onChange={(e) => setPref((p) => ({ ...p, name: e.target.value }))} aria-label="Preference name" className={`${inputCls} flex-1 sm:max-w-xs`} />
        <select value={pref.branchVisibility} onChange={(e) => setPref((p) => ({ ...p, branchVisibility: e.target.value }))} aria-label="Branch visibility" className={`${inputCls} sm:max-w-44`}>
          <option>All branches</option>
          <option>Per branch only</option>
          <option>Own branch + totals</option>
        </select>
        <button
          onClick={() => {
            const p = loadPresentations()[0];
            if (!p) {
              toast("No presentation exists yet — create one in the Presentation Builder first.", "info");
              return;
            }
            upsertPresentation({ ...p, presenterNotes: `${p.presenterNotes}\nDashboard cards chosen: ${pref.cardIds.map((id) => DASHBOARD_CARDS.find((c) => c.id === id)?.label).join(", ")}`.trim(), updatedAt: new Date().toISOString() });
            toast(`Dashboard choices noted in "${p.title}" presenter notes.`);
          }}
          className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-slate-300 px-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          <MonitorPlay className="h-4 w-4" /> Add to presentation
        </button>
      </div>

      {/* Selected order */}
      {pref.cardIds.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-2 text-sm font-semibold text-slate-900">Selected order ({pref.cardIds.length})</h2>
          <ul className="space-y-1">
            {pref.cardIds.map((id, i) => (
              <li key={id} className="flex items-center gap-2 text-sm text-slate-700">
                <span className="w-5 text-xs text-slate-400">{i + 1}.</span>
                <span className="flex-1">{DASHBOARD_CARDS.find((c) => c.id === id)?.label}</span>
                {pref.customReportsRequired.includes(id) && <Pill tone="violet">Custom report</Pill>}
                <button aria-label="Move up" disabled={i === 0} onClick={() => move(id, -1)} className="rounded border border-slate-200 px-1.5 py-0.5 text-xs disabled:opacity-30">↑</button>
                <button aria-label="Move down" disabled={i === pref.cardIds.length - 1} onClick={() => move(id, 1)} className="rounded border border-slate-200 px-1.5 py-0.5 text-xs disabled:opacity-30">↓</button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Card gallery */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {DASHBOARD_CARDS.map((c) => {
          const selected = pref.cardIds.includes(c.id);
          return (
            <div key={c.id} className={`rounded-2xl border p-3 shadow-sm ${selected ? "border-accent bg-accent-soft/40" : "border-slate-200 bg-white"}`}>
              <button onClick={() => toggle(c.id)} className="w-full text-left">
                <p className="text-lg font-bold text-slate-900">{c.sampleValue}</p>
                <p className="text-xs text-slate-500">{c.label}</p>
              </button>
              {selected && (
                <div className="mt-2 space-y-1.5 border-t border-slate-200/70 pt-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Visible to</p>
                  <div className="flex flex-wrap gap-1">
                    {DEFAULT_ROLES.slice(0, 5).map((r) => {
                      const on = (pref.roleVisibility[c.id] ?? []).includes(r.id);
                      return (
                        <button
                          key={r.id}
                          onClick={() => toggleRole(c.id, r.id)}
                          className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${on ? "bg-accent text-white" : "border border-slate-300 text-slate-500"}`}
                        >
                          {r.name}
                        </button>
                      );
                    })}
                  </div>
                  <label className="flex items-center gap-1.5 text-[11px] text-slate-600">
                    <input type="checkbox" checked={pref.customReportsRequired.includes(c.id)} onChange={() => toggleCustom(c.id)} className="h-3.5 w-3.5 accent-[var(--app-accent)]" />
                    Custom report required
                  </label>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-xs italic text-slate-400">
        Preferences are saved on this device and revisited during requirements confirmation — selecting a card here is not a committed requirement.
      </p>
    </div>
  );
}
