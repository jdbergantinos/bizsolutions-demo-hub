import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import type { ScenarioConfig } from "../types";

const COLORS = ["#0f4c81", "#38bdf8", "#f59e0b", "#ef4444", "#8b5cf6"];

/** Recharts-based management dashboard driven by the scenario's config. */
export function DashboardEngine({ config }: { config: ScenarioConfig }) {
  const d = config.dashboard;
  if (!d) return null;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {d.cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">{c.label}</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{c.value}</p>
            {c.sub && <p className="mt-0.5 text-[11px] text-slate-400">{c.sub}</p>}
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title={d.barTitle}>
          <BarChart data={d.bar.map((p) => ({ name: p.label, "This period": p.value, "Last period": p.value2 }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} width={36} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="This period" fill="#0f4c81" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Last period" fill="#94c4e8" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartCard>

        <ChartCard title={d.lineTitle}>
          <LineChart data={d.line.map((p) => ({ name: p.label, Value: p.value }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} width={36} />
            <Tooltip />
            <Line type="monotone" dataKey="Value" stroke="#0f4c81" strokeWidth={2.5} dot={{ r: 3 }} />
          </LineChart>
        </ChartCard>
      </div>

      <ChartCard title={d.pieTitle}>
        <PieChart>
          <Pie
            data={d.pie.map((p) => ({ name: p.label, value: p.value }))}
            dataKey="value"
            nameKey="name"
            innerRadius="45%"
            outerRadius="75%"
            paddingAngle={2}
          >
            {d.pie.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ChartCard>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactElement }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-slate-800">{title}</h3>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
