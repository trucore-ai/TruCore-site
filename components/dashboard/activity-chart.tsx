/* ────────────────────────────────────────────────────────────────
 *  ActivityChart - CSS-only bar chart for request/latency trends
 *
 *  Pure CSS implementation, no charting library needed.
 *  The chart is responsive and respects reduced-motion prefs.
 *  Bars animate in with a staggered transition on mount.
 * ──────────────────────────────────────────────────────────── */

"use client";

import { useMemo, useState } from "react";
import type { ActivityTrends } from "@/lib/dashboard-client";
import { EmptyState } from "@/components/dashboard/empty-state";

type Metric = "requests" | "enforcements" | "avg_latency_ms";

const metrics: { key: Metric; label: string; color: string }[] = [
  { key: "requests", label: "Requests", color: "bg-primary-400/70" },
  {
    key: "enforcements",
    label: "Enforcements",
    color: "bg-amber-400/70",
  },
  {
    key: "avg_latency_ms",
    label: "Latency (ms)",
    color: "bg-emerald-400/70",
  },
];

function formatTimestamp(ts: string): string {
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return ts;
  }
}

type ActivityChartProps = { data: ActivityTrends };

export function ActivityChart({ data }: ActivityChartProps) {
  const [activeMetric, setActiveMetric] = useState<Metric>("requests");

  const { max, points } = useMemo(() => {
    const pts = data.points;
    if (pts.length === 0) return { max: 1, points: [] };
    const mx = Math.max(...pts.map((p) => p[activeMetric]), 1);
    return { max: mx, points: pts };
  }, [data.points, activeMetric]);

  const activeColor =
    metrics.find((m) => m.key === activeMetric)?.color ?? "bg-primary-400/70";

  if (points.length === 0) {
    return (
      <div className="dashboard-panel p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-slate-100">
          Activity Trends
        </h2>
        <div className="mt-4">
          <EmptyState
            title="No activity data"
            description="Activity trend data is not yet available for this period."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-panel p-5 sm:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-100">
          Activity Trends
        </h2>
        <div className="flex gap-0.5 rounded-lg border border-white/[0.06] bg-white/[0.02] p-0.5">
          {metrics.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setActiveMetric(m.key)}
              className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/40 ${
                activeMetric === m.key
                  ? "bg-white/[0.1] text-slate-50 shadow-sm shadow-black/20"
                  : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Interval badge */}
      <p className="mt-2.5 text-[10px] uppercase tracking-[0.16em] text-slate-600">
        Interval: {data.interval}
      </p>

      {/* Chart */}
      <div className="mt-5 flex items-end gap-[2px] h-44" role="img" aria-label={`Activity chart showing ${activeMetric}`}>
        {points.map((pt, i) => {
          const pct = (pt[activeMetric] / max) * 100;
          return (
            <div
              key={pt.timestamp}
              className="group relative flex-1 flex flex-col justify-end"
              style={{ height: "100%" }}
            >
              {/* Bar */}
              <div
                className={`w-full rounded-t transition-all duration-500 ${activeColor}`}
                style={{
                  height: `${Math.max(pct, 1)}%`,
                  transitionDelay: `${i * 15}ms`,
                }}
              />
              {/* Tooltip on hover */}
              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 rounded-lg border border-white/[0.08] bg-neutral-900/95 px-3 py-2 text-[10px] leading-relaxed whitespace-nowrap opacity-0 backdrop-blur-sm transition-opacity duration-150 group-hover:opacity-100">
                <p className="font-semibold text-slate-100">
                  {pt[activeMetric].toLocaleString()}
                </p>
                <p className="mt-0.5 text-slate-500">
                  {formatTimestamp(pt.timestamp)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* X-axis labels (first, middle, last) */}
      <div className="mt-2 flex justify-between text-[10px] tabular-nums text-slate-600">
        <span>{formatTimestamp(points[0].timestamp)}</span>
        {points.length > 2 && (
          <span>
            {formatTimestamp(points[Math.floor(points.length / 2)].timestamp)}
          </span>
        )}
        <span>{formatTimestamp(points[points.length - 1].timestamp)}</span>
      </div>
    </div>
  );
}
