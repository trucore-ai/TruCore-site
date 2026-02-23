interface MetricsSummaryCardProps {
  label: string;
  value: number;
}

export function MetricsSummaryCard({ label, value }: MetricsSummaryCardProps) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-100">{value}</p>
    </div>
  );
}
