import { Info } from "lucide-react";

/** Required on every interactive demo screen. */
export function DemoDisclaimer() {
  return (
    <p className="flex items-center gap-1.5 text-[11px] leading-tight text-slate-400">
      <Info className="h-3.5 w-3.5 shrink-0" />
      Demonstration only — no real data is stored or transmitted. All names and records are fictional sample data.
    </p>
  );
}
