/* ────────────────────────────────────────────────────────────────
 *  LatencyDashboard - ATF latency & mode performance surface.
 *
 *  Client component that owns the useLatencyMetrics hook and
 *  renders: overall latency percentiles, mode comparison,
 *  cache effectiveness, and rolling-window context.
 *
 *  Designed for admin/operator use only.
 * ──────────────────────────────────────────────────────────── */

"use client";

import { useLatencyMetrics } from "./use-latency-metrics";
import { AdminDegradedState } from "./admin-degraded-state";
import type {
  Percentile,
  LatencyOverall,
  LatencyModeBreakdown,
  LatencyCacheSummary,
} from "@/lib/dashboard-client";

/* ── Formatting helpers ───────────────────────────────────── */

function fmtMs(v: number): string {
  if (v >= 1000) return `${(v / 1000).toFixed(2)} s`;
  return `${v.toFixed(1)} ms`;
}

function fmtCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function pctLabel(hits: number, total: number): string {
  if (total === 0) return "-";
  return `${((hits / total) * 100).toFixed(1)}%`;
}

/* ── Sub-components ───────────────────────────────────────── */

function PercentileRow({
  label,
  pct,
}: {
  label: string;
  pct: Percentile;
}) {
  return (
    <tr className="border-b border-white/5 last:border-b-0">
      <td className="px-4 py-2.5 text-sm text-slate-300">{label}</td>
      <td className="px-4 py-2.5 text-right text-sm font-semibold tabular-nums text-slate-100">
        {fmtMs(pct.p50)}
      </td>
      <td className="px-4 py-2.5 text-right text-sm font-semibold tabular-nums text-amber-300">
        {fmtMs(pct.p95)}
      </td>
      <td className="px-4 py-2.5 text-right text-sm font-semibold tabular-nums text-red-400">
        {fmtMs(pct.p99)}
      </td>
    </tr>
  );
}

function OverallLatencySection({ overall }: { overall: LatencyOverall }) {
  const primary: Array<{ label: string; pct: Percentile }> = [
    { label: "Total", pct: overall.total_ms },
    { label: "Policy Eval", pct: overall.policy_eval_ms },
    { label: "RPC Total", pct: overall.rpc_total_time_ms },
  ];

  const secondary: Array<{ label: string; pct: Percentile }> = [];
  if (overall.cache_lookup_ms)
    secondary.push({ label: "Cache Lookup", pct: overall.cache_lookup_ms });
  if (overall.eval_cache_lookup_ms)
    secondary.push({
      label: "Eval Cache Lookup",
      pct: overall.eval_cache_lookup_ms,
    });
  if (overall.parallel_read_group_ms)
    secondary.push({
      label: "Parallel Read Group",
      pct: overall.parallel_read_group_ms,
    });
  if (overall.policy_package_build_ms)
    secondary.push({
      label: "Package Build",
      pct: overall.policy_package_build_ms,
    });
  if (overall.policy_package_validate_ms)
    secondary.push({
      label: "Package Validate",
      pct: overall.policy_package_validate_ms,
    });

  const rows = [...primary, ...secondary];

  return (
    <div
      data-testid="latency-overall"
      className="overflow-hidden rounded-lg border border-white/10"
    >
      <div className="border-b border-white/10 bg-white/5 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-200">
          Overall Latency Percentiles
        </h3>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 bg-white/5 text-left text-xs uppercase tracking-wider text-slate-400">
            <th className="px-4 py-2.5">Metric</th>
            <th className="px-4 py-2.5 text-right">p50</th>
            <th className="px-4 py-2.5 text-right">p95</th>
            <th className="px-4 py-2.5 text-right">p99</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <PercentileRow key={r.label} label={r.label} pct={r.pct} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ModeCard({
  mode,
  breakdown,
}: {
  mode: string;
  breakdown: LatencyModeBreakdown;
}) {
  const modeLabel = mode.charAt(0).toUpperCase() + mode.slice(1);
  const modeColor =
    mode === "turbo"
      ? "text-emerald-400"
      : mode === "strict"
        ? "text-red-400"
        : "text-primary-400";

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className={`text-sm font-bold uppercase tracking-wide ${modeColor}`}>
          {modeLabel}
        </h4>
        <span className="text-xs text-slate-500">
          {fmtCount(breakdown.observation_count)} obs
        </span>
      </div>

      <div className="mb-3 grid grid-cols-3 gap-2">
        <div className="rounded border border-white/5 bg-white/[0.02] px-2 py-1.5 text-center">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">
            p50
          </p>
          <p className="text-sm font-semibold tabular-nums text-slate-100">
            {fmtMs(breakdown.total_ms.p50)}
          </p>
        </div>
        <div className="rounded border border-white/5 bg-white/[0.02] px-2 py-1.5 text-center">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">
            p95
          </p>
          <p className="text-sm font-semibold tabular-nums text-amber-300">
            {fmtMs(breakdown.total_ms.p95)}
          </p>
        </div>
        <div className="rounded border border-white/5 bg-white/[0.02] px-2 py-1.5 text-center">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">
            p99
          </p>
          <p className="text-sm font-semibold tabular-nums text-red-400">
            {fmtMs(breakdown.total_ms.p99)}
          </p>
        </div>
      </div>

      <div className="space-y-1 text-xs text-slate-400">
        <div className="flex justify-between">
          <span>Cache Hits</span>
          <span className="font-semibold text-slate-200">
            {fmtCount(breakdown.cache_hits)}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Eval Cache Hits</span>
          <span className="font-semibold text-slate-200">
            {fmtCount(breakdown.eval_cache_hits)}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Turbo Fast-Path</span>
          <span className="font-semibold text-slate-200">
            {fmtCount(breakdown.turbo_fast_path_hits)}
          </span>
        </div>
      </div>
    </div>
  );
}

function ModeComparisonSection({
  byMode,
}: {
  byMode: Record<string, LatencyModeBreakdown>;
}) {
  const modes = Object.entries(byMode);
  if (modes.length === 0) return null;

  // Canonical mode order
  const order = ["strict", "balanced", "turbo"];
  modes.sort(
    ([a], [b]) =>
      (order.indexOf(a) === -1 ? 99 : order.indexOf(a)) -
      (order.indexOf(b) === -1 ? 99 : order.indexOf(b)),
  );

  return (
    <div data-testid="latency-mode-comparison">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-300">
        Mode Comparison
      </h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modes.map(([mode, breakdown]) => (
          <ModeCard key={mode} mode={mode} breakdown={breakdown} />
        ))}
      </div>
    </div>
  );
}

function CacheEffectivenessSection({
  cache,
  totalObs,
}: {
  cache: LatencyCacheSummary;
  totalObs: number;
}) {
  const totalCacheAttempts = cache.cache_hits + cache.cache_misses;

  return (
    <div
      data-testid="latency-cache-effectiveness"
      className="overflow-hidden rounded-lg border border-white/10"
    >
      <div className="border-b border-white/10 bg-white/5 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-200">
          Cache Effectiveness
        </h3>
      </div>
      <div className="grid grid-cols-2 gap-px bg-white/5 sm:grid-cols-4">
        <CacheStat
          label="Cache Hit Rate"
          value={pctLabel(cache.cache_hits, totalCacheAttempts)}
          sub={`${fmtCount(cache.cache_hits)} / ${fmtCount(totalCacheAttempts)}`}
        />
        <CacheStat
          label="Eval Cache Hits"
          value={fmtCount(cache.eval_cache_hits)}
          sub={`of ${fmtCount(totalObs)} obs`}
        />
        <CacheStat
          label="Turbo Fast-Path"
          value={fmtCount(cache.turbo_fast_path_hits)}
          sub={`of ${fmtCount(totalObs)} obs`}
        />
        {cache.rpc_calls_avg !== undefined && (
          <CacheStat
            label="RPC Calls Avg"
            value={cache.rpc_calls_avg.toFixed(2)}
            sub="per request"
          />
        )}
      </div>
    </div>
  );
}

function CacheStat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="bg-neutral-950 px-4 py-3">
      <p className="text-[10px] uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold tabular-nums text-slate-100">
        {value}
      </p>
      <p className="mt-0.5 text-[10px] text-slate-500">{sub}</p>
    </div>
  );
}

function WindowNote({ window: w }: { window?: string }) {
  return (
    <p
      data-testid="latency-window-note"
      className="text-[10px] leading-relaxed text-slate-500"
    >
      {w ? `Window: ${w}` : "Rolling summary"} · Per-worker in-memory
      aggregate · Resets on restart / deploy
    </p>
  );
}

function EmptyState() {
  return (
    <div
      data-testid="latency-empty"
      className="rounded-xl border border-white/10 bg-white/[0.02] px-6 py-10 text-center"
    >
      <p className="text-sm font-medium text-slate-400">
        No latency observations yet
      </p>
      <p className="mt-1 text-xs text-slate-500">
        Data will appear once ATF processes requests.
      </p>
    </div>
  );
}

/* ── Main component ───────────────────────────────────────── */

export function LatencyDashboard() {
  const { data, loading, refreshing, error, lastUpdated, refresh } =
    useLatencyMetrics();

  return (
    <div data-testid="latency-dashboard">
      {/* ── header row with refresh control ── */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
          Latency &amp; Mode Performance
        </h2>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span
              data-testid="latency-last-updated"
              className="text-[10px] text-slate-500"
            >
              Updated{" "}
              {lastUpdated.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
          )}
          {error && data && (
            <span className="text-[10px] text-amber-400/70">
              Refresh unavailable
            </span>
          )}
          <button
            type="button"
            data-testid="latency-refresh-btn"
            disabled={refreshing || loading}
            onClick={refresh}
            aria-label="Refresh latency metrics"
            className="rounded border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {refreshing ? "Refreshing\u2026" : "Refresh"}
          </button>
        </div>
      </div>

      {/* ── loading skeleton ── */}
      {loading && !data && (
        <div
          data-testid="latency-loading"
          className="space-y-4"
        >
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-lg border border-white/10 bg-white/[0.03]"
            />
          ))}
        </div>
      )}

      {/* ── error without prior data ── */}
      {error && !data && !loading && (
        <AdminDegradedState
          title="Latency Metrics"
          description="Latency data could not be loaded right now."
        />
      )}

      {/* ── empty state (data loaded but zero observations) ── */}
      {data && data.observation_count === 0 && <EmptyState />}

      {/* ── main content ── */}
      {data && data.observation_count > 0 && (
        <div className="space-y-6">
          {/* observation count header */}
          <div className="flex items-baseline gap-3">
            <span className="text-xs text-slate-500">
              {fmtCount(data.observation_count)} observations
            </span>
            <WindowNote window={data.window} />
          </div>

          {/* overall percentiles */}
          <OverallLatencySection overall={data.overall} />

          {/* mode comparison */}
          {data.by_mode && <ModeComparisonSection byMode={data.by_mode} />}

          {/* cache effectiveness */}
          {data.cache_summary && (
            <CacheEffectivenessSection
              cache={data.cache_summary}
              totalObs={data.observation_count}
            />
          )}
        </div>
      )}
    </div>
  );
}
