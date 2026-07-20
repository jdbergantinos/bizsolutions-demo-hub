import type { StatusDef } from "../../types";

const TONES: Record<StatusDef["tone"], string> = {
  gray: "bg-slate-100 text-slate-700",
  blue: "bg-sky-100 text-sky-800",
  amber: "bg-amber-100 text-amber-800",
  green: "bg-emerald-100 text-emerald-800",
  red: "bg-red-100 text-red-700",
  violet: "bg-violet-100 text-violet-800",
};

export function StatusBadge({ status }: { status: StatusDef }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TONES[status.tone]}`}>
      {status.label}
    </span>
  );
}

export function Pill({ children, tone = "gray" }: { children: React.ReactNode; tone?: StatusDef["tone"] }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TONES[tone]}`}>
      {children}
    </span>
  );
}
