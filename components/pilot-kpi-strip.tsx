import { Card } from "@/components/ui/card";

const kpis = [
  {
    label: "Prevented violations",
    value: "Example: 0 events",
  },
  {
    label: "Avg decision latency",
    value: "Example: 0.00ms",
  },
  {
    label: "Deterministic receipt coverage",
    value: "Example: 0.0%",
  },
];

export function PilotKpiStrip() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
        Pilot Metrics (example format)
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="border-white/10 bg-neutral-950/60">
            <p className="text-sm text-slate-300">{kpi.label}</p>
            <p className="mt-2 text-xl font-semibold text-primary-100">{kpi.value}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
