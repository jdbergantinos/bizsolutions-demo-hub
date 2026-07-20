import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import type { EstimateLine, PriceRange } from "../types";
import { pesoRange } from "../engine/money";
import { CLIENT_DISCLAIMER } from "../config/pricingSettings";

export function Money({ range, suffix }: { range: PriceRange; suffix?: string }) {
  return <span className="whitespace-nowrap font-semibold text-slate-900">{pesoRange(range, suffix)}</span>;
}

/** Table of estimate lines with subtotal / tax / total rows. */
export function LineTable({
  lines,
  subtotal,
  tax,
  total,
  suffix = "",
}: {
  lines: EstimateLine[];
  subtotal: PriceRange;
  tax: PriceRange | null;
  total: PriceRange;
  suffix?: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <tbody className="divide-y divide-slate-100">
          {lines.map((l) => (
            <tr key={l.id}>
              <td className="py-2 pr-3">
                <span className="text-slate-700">{l.label}</span>
                {l.note && <span className="block text-xs text-slate-400">{l.note}</span>}
              </td>
              <td className="py-2 text-right align-top">
                <Money range={l.range} suffix={suffix} />
              </td>
            </tr>
          ))}
          <tr className="border-t-2 border-slate-200">
            <td className="py-2 pr-3 font-medium text-slate-700">Estimated subtotal</td>
            <td className="py-2 text-right"><Money range={subtotal} suffix={suffix} /></td>
          </tr>
          {tax && (
            <tr>
              <td className="py-2 pr-3 text-slate-700">Estimated VAT</td>
              <td className="py-2 text-right"><Money range={tax} suffix={suffix} /></td>
            </tr>
          )}
          <tr className="bg-accent-soft/60">
            <td className="rounded-l-lg py-2.5 pl-2 pr-3 font-bold text-slate-900">Estimated total range</td>
            <td className="rounded-r-lg py-2.5 pr-2 text-right text-base font-bold text-accent">
              {pesoRange(total, suffix)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function SectionCard({ title, children, tone = "white" }: { title?: ReactNode; children: ReactNode; tone?: "white" | "amber" }) {
  return (
    <section
      className={`rounded-2xl border p-4 shadow-sm ${tone === "amber" ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white"}`}
    >
      {title && <h2 className="mb-2 text-sm font-semibold text-slate-900">{title}</h2>}
      {children}
    </section>
  );
}

export function ManualReviewBanner({ reasons }: { reasons: string[] }) {
  if (reasons.length === 0) return null;
  return (
    <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4">
      <p className="flex items-center gap-2 text-sm font-bold text-amber-900">
        <AlertTriangle className="h-4 w-4" /> Manual Technical Review Required
      </p>
      <p className="mt-1 text-xs text-amber-800">
        Parts of this selection need a technical review before pricing can be finalized. Figures
        below remain preliminary and cannot be marked approved for proposal.
      </p>
      <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-amber-800">
        {reasons.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
    </div>
  );
}

export function EstimateDisclaimer() {
  return <p className="text-xs italic leading-relaxed text-slate-400">{CLIENT_DISCLAIMER}</p>;
}

export function ComplexityDots({ level }: { level: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" title={`Complexity ${level} of 5`} aria-label={`Complexity ${level} of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={`h-1.5 w-1.5 rounded-full ${i <= level ? "bg-accent" : "bg-slate-200"}`} />
      ))}
    </span>
  );
}
