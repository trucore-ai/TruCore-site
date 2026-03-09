/* ────────────────────────────────────────────────────────────────
 *  HeroKpis - primary KPI cards
 *
 *  Top-of-page summary cards showing the most critical ATF
 *  metrics.  Designed for instant comprehension: big numbers,
 *  clear labels, subtle context lines.
 *
 *  Renders directly from the live ATF kpis array (each item is
 *  { label, value, unit, trend }) and an optional flat trend
 *  snapshot for the supplementary "last hour / today" strip.
 * ──────────────────────────────────────────────────────────── */

import type { LiveKpiItem, LiveTrend } from "@/lib/dashboard-client";

function compactNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

/** Format a KPI value for display. Handles both string and number values. */
function formatValue(value: string | number, unit: string): string {
  if (typeof value === "number") {
    const formatted = compactNum(value);
    return unit ? `${formatted} ${unit}` : formatted;
  }
  return unit ? `${value} ${unit}` : value;
}

type HeroKpisProps = {
  kpis: LiveKpiItem[];
  trend?: LiveTrend;
};

export function HeroKpis({ kpis, trend }: HeroKpisProps) {
  const gridCols =
    kpis.length <= 2
      ? "sm:grid-cols-2"
      : kpis.length === 3
        ? "sm:grid-cols-3"
        : "sm:grid-cols-2 lg:grid-cols-4";

  return (
    <div className="space-y-4">
      <div className={`grid gap-4 ${gridCols}`}>
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} kpi={kpi} />
        ))}
      </div>
      {trend && <TrendStrip trend={trend} />}
    </div>
  );
}

/* ── Individual KPI card ──────────────────────────────────── */

function KpiCard({ kpi }: { kpi: LiveKpiItem }) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.025] p-5 shadow-sm shadow-black/10 transition-all duration-200 hover:border-white/[0.12] hover:bg-white/[0.04] hover:shadow-md hover:shadow-black/15 focus-within:ring-2 focus-within:ring-primary-400/30">
      {/* subtle top highlight */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(180,220,248,0.08) 30%, rgba(200,235,255,0.14) 50%, rgba(180,220,248,0.08) 70%, transparent 100%)",
        }}
      />

      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 transition-colors duration-200 group-hover:text-slate-400">
          {kpi.label}
        </p>
        {kpi.trend && <TrendBadge direction={kpi.trend} />}
      </div>
      <p className="mt-2.5 text-[1.625rem] font-bold tabular-nums tracking-tight leading-none text-slate-50">
        {formatValue(kpi.value, kpi.unit ?? "")}
      </p>
    </div>
  );
}

/* ── KPI-level trend badge ────────────────────────────────── */

function TrendBadge({ direction }: { direction: string }) {
  const lower = direction.toLowerCase();
  const isUp = lower === "up" || lower === "rising";
  const isDown = lower === "down" || lower === "falling";
  const isStable = lower === "stable" || lower === "flat" || lower === "";

  if (isStable || (!isUp && !isDown)) {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-slate-500">
        &ndash;
      </span>
    );
  }

  const color = isUp
    ? "text-emerald-400 bg-emerald-400/10"
    : "text-amber-400 bg-amber-400/10";
  const arrow = isUp ? "\u2191" : "\u2193";

  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium tabular-nums ${color}`}
      title={`Trend: ${direction}`}
    >
      {arrow} {direction}
    </span>
  );
}

/* ── Trend summary strip ──────────────────────────────────── */

function TrendStrip({ trend }: { trend: LiveTrend }) {
  const items = [
    { label: "Requests (1h)", value: trend.requests_last_hour },
    { label: "Receipts (1h)", value: trend.receipts_written_last_hour },
    { label: "Enforcements (1h)", value: trend.enforcement_last_hour },
    { label: "Requests today", value: trend.requests_today },
    { label: "Receipts today", value: trend.receipts_written_today },
  ];

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 rounded-lg border border-white/[0.05] bg-white/[0.015] px-4 py-2.5">
      {items.map((item) => (
        <span key={item.label} className="text-[11px] text-slate-500">
          {item.label}{" "}
          <span className="font-semibold tabular-nums text-slate-300">
            {compactNum(item.value)}
          </span>
        </span>
      ))}
    </div>
  );
}
