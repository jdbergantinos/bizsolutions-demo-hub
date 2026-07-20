import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, ShieldCheck, X } from "lucide-react";
import { getIndustry, INDUSTRIES } from "../../data/catalog";
import { Pill } from "../../components/common/Badge";
import { SECURITY_CONTROLS, SECURITY_DISCLAIMER, SECURITY_GROUP_ORDER } from "../config/securityControls";
import { DEMO_EXCLUDES, DEMO_INCLUDES, INDUSTRY_EXCLUSIONS } from "../config/demoBoundaries";

const GROUP_TONE = {
  "Expected production foundation": "green",
  Optional: "blue",
  "Requires technical assessment": "violet",
  "Requires third-party service": "amber",
  "Not included in the demo": "red",
  "Not yet verified": "gray",
} as const;

export function TrustCenterPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"security" | "boundaries">("security");
  const [industryId, setIndustryId] = useState("");

  return (
    <div className="space-y-4">
      <button onClick={() => navigate("/discovery")} className="inline-flex min-h-10 items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Discovery
      </button>
      <header>
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <ShieldCheck className="h-5 w-5 text-accent" /> Trust Center
        </h1>
        <p className="text-sm text-slate-500">Honest explanations of security expectations and demonstration boundaries.</p>
      </header>

      <div className="flex gap-2">
        {(["security", "boundaries"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`min-h-11 flex-1 rounded-xl text-sm font-medium ${tab === t ? "bg-accent text-white" : "border border-slate-300 bg-white text-slate-600"}`}
          >
            {t === "security" ? "Security & Privacy" : "What's Included / Not Included"}
          </button>
        ))}
      </div>

      {tab === "security" && (
        <>
          <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-800">
            {SECURITY_DISCLAIMER}
          </p>
          {SECURITY_GROUP_ORDER.map((group) => {
            const controls = SECURITY_CONTROLS.filter((c) => c.grouping === group);
            if (controls.length === 0) return null;
            return (
              <section key={group}>
                <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <Pill tone={GROUP_TONE[group]}>{group}</Pill>
                </h2>
                <div className="grid gap-2 sm:grid-cols-2">
                  {controls.map((c) => (
                    <div key={c.id} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                      <p className="text-sm font-semibold text-slate-900">{c.name}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{c.description}</p>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
          <p className="text-xs italic text-slate-400">
            No compliance with any law, standard, or certification is claimed unless explicitly verified in writing.
          </p>
        </>
      )}

      {tab === "boundaries" && (
        <>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">Industry (adds industry-specific exclusions)</span>
            <select value={industryId} onChange={(e) => setIndustryId(e.target.value)} className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm">
              <option value="">— General —</option>
              {INDUSTRIES.map((i) => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
          </label>

          <div className="grid gap-3 md:grid-cols-2">
            <section className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm">
              <h2 className="mb-2 text-sm font-semibold text-emerald-700">The demonstration includes</h2>
              <ul className="space-y-1.5 text-sm text-slate-700">
                {DEMO_INCLUDES.map((x) => (
                  <li key={x} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> {x}
                  </li>
                ))}
              </ul>
            </section>
            <section className="rounded-2xl border border-red-200 bg-white p-4 shadow-sm">
              <h2 className="mb-2 text-sm font-semibold text-red-700">The demonstration does not include</h2>
              <ul className="space-y-1.5 text-sm text-slate-700">
                {DEMO_EXCLUDES.map((x) => (
                  <li key={x} className="flex items-start gap-2">
                    <X className="mt-0.5 h-4 w-4 shrink-0 text-red-400" /> {x}
                  </li>
                ))}
                {industryId &&
                  (INDUSTRY_EXCLUSIONS[industryId] ?? []).map((x) => (
                    <li key={x} className="flex items-start gap-2 font-medium text-red-700">
                      <X className="mt-0.5 h-4 w-4 shrink-0 text-red-500" /> {x} ({getIndustry(industryId)?.name})
                    </li>
                  ))}
              </ul>
            </section>
          </div>
          <p className="text-xs italic text-slate-400">
            This boundary notice is shown automatically before opening sensitive-industry demos.
          </p>
        </>
      )}
    </div>
  );
}
