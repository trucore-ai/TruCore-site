/* ────────────────────────────────────────────────────────────────
 *  HeroKpis - primary KPI cards
 *
 *  Top-of-page summary cards showing the most critical ATF
 *  metrics. Designed for instant comprehension: big numbers,
 *  clear labels, subtle context lines.
 *
 *  When TrendSnapshot data is available, each card shows a
 *  small rolling-hour delta badge for request momentum.
 * ──────────────────────────────────────────────────────────── */

import type { KpiSummary, TrendSnapshot, TrendBucket } from "@/lib/dashboard-client";

type KpiDef = {
  key: keyof KpiSummary;
  label: string;
  format: (v: number) => string;
  detail: (v: KpiSummary) => string;
  accent?: string;
  /** Field in TrendBucket to compute the rolling-hour delta for this KPI */
  trendKey?: keyof TrendBucket;
};

const kpis: KpiDef[] = [
  {
    key: "total_requests_24h",
    label: "Requests (24h)",
    format: compactNum,
    detail: (d) => `${compactNum(d.total_enforcements_24h)} enforced`,
    trendKey: "requests",
  },
  {
    key: "active_tenants",
    label: "Active Tenants",
    format: (v) => v.toLocaleString(),
    detail: () => "Currently active",
  },
  {
    key: "avg_latency_ms",
    label: "Avg Latency",
    format: (v) => `${v.toFixed(1)}ms`,
    detail: (d) => `p99 ${d.p99_latency_ms.toFixed(0)}ms`,
    accent: "text-primary-300",
    trendKey: "avg_latency_ms",
  },
  {
    key: "uptime_pct",
    label: "Uptime",
    format: (v) => `${v.toFixed(2)}%`,
    detail: (d) => `${d.error_rate_pct.toFixed(2)}% error rate`,
    accent: "text-emerald-300",
  },
];

function compactNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

/** Compute percentage change between two values. Returns null if base is zero. */
function pctDelta(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return ((current - previous) / previous) * 100;
}

type HeroKpisProps = {
  data: KpiSummary;
  trend?: TrendSnapshot;
};

export function HeroKpis({ data, trend }: HeroKpisProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => {
        const delta =
          trend && kpi.trendKey
            ? pctDelta(
                trend.rolling_hour[kpi.trendKey],
                trend.rolling_hour_prev[kpi.trendKey],
              )
            : null;

        /* For latency, lower is better, so flip the sentiment */
        const invertSentiment = kpi.trendKey === "avg_latency_ms";

        return (
          <div
            key={kpi.key}
            className="group relative overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.025] p-5 shadow-sm shadow-black/10 transition-all duration-200 hover:border-white/[0.12] hover:bg-white/[0.04] hover:shadow-md hover:shadow-black/15 focus-within:ring-2 focus-within:ring-primary-400/30"
          >
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
              {delta != null && (
                <TrendBadge delta={delta} invert={invertSentiment} />
              )}
            </div>
            <p
              className={`mt-2.5 text-[1.625rem] font-bold tabular-nums tracking-tight leading-none ${kpi.accent ?? "text-slate-50"}`}
            >
              {kpi.format(data[kpi.key])}
            </p>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
              {kpi.detail(data)}
            </p>
          </div>
        );
      })}
    </div>
  );
}

/* ── Rolling-hour trend badge ─────────────────────────────── */

function TrendBadge({
  delta,
  invert = false,
}: {
  delta: number;
  invert?: boolean;
}) {
  const isPositive = invert ? delta < 0 : delta > 0;
  const isNeutral = Math.abs(delta) < 0.5;

  if (isNeutral) {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-slate-500">
        &ndash;
      </span>
    );
  }

  const color = isPositive
    ? "text-emerald-400 bg-emerald-400/10"
    : "text-amber-400 bg-amber-400/10";
  const arrow = delta > 0 ? "\u2191" : "\u2193";

  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium tabular-nums ${color}`}
      title={`Rolling-hour change: ${delta > 0 ? "+" : ""}${delta.toFixed(1)}%`}
    >
      {arrow} {Math.abs(delta).toFixed(0)}%
    </span>
  );
}
