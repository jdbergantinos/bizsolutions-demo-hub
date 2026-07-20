import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MessageCircleQuestion } from "lucide-react";
import { Pill } from "../../components/common/Badge";
import { SearchInput } from "../../components/common/SearchInput";
import { OBJECTION_DISCLAIMER, OBJECTION_GUIDE } from "../config/objectionGuide";

export function ObjectionGuidePage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const visible = OBJECTION_GUIDE.filter((o) => {
    const q = search.trim().toLowerCase();
    return !q || o.question.toLowerCase().includes(q) || o.recommendedResponse.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <button onClick={() => navigate("/discovery")} className="inline-flex min-h-10 items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Discovery
      </button>
      <header>
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <MessageCircleQuestion className="h-5 w-5 text-accent" /> Objection & Question Guide
        </h1>
        <p className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-medium text-white">{OBJECTION_DISCLAIMER}</p>
      </header>

      <SearchInput value={search} onChange={setSearch} placeholder="Search questions…" />

      <div className="space-y-2">
        {visible.map((o) => {
          const open = openId === o.id;
          return (
            <div key={o.id} className={`rounded-2xl border bg-white p-4 shadow-sm ${open ? "border-accent" : "border-slate-200"}`}>
              <button onClick={() => setOpenId(open ? null : o.id)} className="flex w-full items-center justify-between gap-2 text-left">
                <p className="text-sm font-semibold text-slate-900">"{o.question}"</p>
                <span className="shrink-0 text-xs text-slate-400">{open ? "Hide" : "Open"}</span>
              </button>
              {open && (
                <div className="mt-3 space-y-2.5 border-t border-slate-100 pt-3 text-xs text-slate-600">
                  <div>
                    <p className="font-semibold uppercase tracking-wide text-slate-400">Recommended response</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-slate-700">{o.recommendedResponse}</p>
                  </div>
                  <div>
                    <p className="font-semibold uppercase tracking-wide text-slate-400">Ask the client</p>
                    <ul className="mt-0.5 list-inside list-disc space-y-0.5">
                      {o.askTheClient.map((q) => (
                        <li key={q}>{q}</li>
                      ))}
                    </ul>
                  </div>
                  <p><span className="font-semibold text-slate-500">Verify technically:</span> {o.verifyTechnically}</p>
                  <p className="rounded-lg bg-red-50 px-2.5 py-1.5 text-red-700">
                    <span className="font-semibold">Overpromise risk:</span> {o.overpromiseRisk}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <Pill tone="blue">{o.commercialModel}</Pill>
                    <Pill tone="gray">{o.scopeDisclaimer}</Pill>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
