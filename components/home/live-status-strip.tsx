/* ────────────────────────────────────────────────────────────────
 *  LiveStatusStrip - compact homepage status + public infra metrics
 *
 *  Displays live infrastructure signals from the public ATF
 *  /metrics/public-summary endpoint. No authentication required.
 *
 *  Top row: derived health status, headline KPIs, and CTA.
 *  Bottom row: extended infrastructure metrics.
 *
 *  Polls every 30 s with a single-retry strategy on failure.
 *
 *  Design principles:
 *   - Subtle, confidence-building, not an ops console
 *   - Premium glass styling consistent with dashboard surfaces
 *   - Graceful loading / error / empty states
 *   - Responsive on all breakpoints
 * ──────────────────────────────────────────────────────────── */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TrackedLink } from "@/components/tracked-link";
import type { PublicMetrics } from "@/lib/public-metrics";

/* ── Constants ────────────────────────────────────────────── */

const POLL_MS = 30_000;
const RETRY_DELAY_MS = 500;

/* ── Helpers ──────────────────────────────────────────────── */

function compactNum(n: number): string {
  if (n == null || Number.isNaN(n)) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function friendlyUptime(seconds: number): string {
  const d = Math.floor(seconds / 86_400);
  const h = Math.floor((seconds % 86_400) / 3_600);
  const m = Math.floor((seconds % 3_600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function relativeTime(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    if (diff < 60_000) return "just now";
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
    return `${Math.floor(diff / 86_400_000)}d ago`;
  } catch {
    return "";
  }
}

/** Derive a health label from uptime percentage. */
function deriveHealth(uptime: number): "healthy" | "degraded" | "down" {
  if (uptime >= 99) return "healthy";
  if (uptime >= 95) return "degraded";
  return "down";
}

const healthLabel: Record<string, string> = {
  healthy: "All Systems Operational",
  degraded: "Degraded Performance",
  down: "Service Disruption",
};

const healthDot: Record<string, string> = {
  healthy: "bg-emerald-400",
  degraded: "bg-amber-400",
  down: "bg-red-400",
};

const healthText: Record<string, string> = {
  healthy: "text-emerald-300",
  degraded: "text-amber-300",
  down: "text-red-300",
};

/* ── Component ────────────────────────────────────────────── */

export function LiveStatusStrip() {
  const [metrics, setMetrics] = useState<PublicMetrics | null>(null);
  const [error, setError] = useState(false);
  const mountedRef = useRef(true);

  /* ── Public metrics fetch (with single retry) ──────────── */

  const fetchMetrics = useCallback(async (): Promise<PublicMetrics | null> => {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch("/api/metrics/public-summary", {
          cache: "no-store",
        });
        if (res.ok) return (await res.json()) as PublicMetrics;
      } catch {
        /* network error — fall through to retry / fail */
      }
      if (attempt === 0) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      }
    }
    return null;
  }, []);

  const refresh = useCallback(async () => {
    const json = await fetchMetrics();
    if (!mountedRef.current) return;
    if (json) {
      setMetrics(json);
      setError(false);
    } else {
      setError(true);
    }
  }, [fetchMetrics]);

  useEffect(() => {
    mountedRef.current = true;
    refresh();
    const id = setInterval(refresh, POLL_MS);
    return () => {
      mountedRef.current = false;
      clearInterval(id);
    };
  }, [refresh]);

  /* ── Loading state ─────────────────────────────────────── */
  if (!metrics && !error) {
    return (
      <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-slate-700 animate-pulse" />
            <div className="h-3 w-40 rounded bg-slate-800 animate-pulse" />
          </div>
          <div className="hidden sm:flex items-center gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="h-2.5 w-16 rounded bg-slate-800 animate-pulse" />
                <div className="h-4 w-12 rounded bg-slate-800 animate-pulse" />
              </div>
            ))}
          </div>
          <div className="h-8 w-28 rounded-lg bg-slate-800 animate-pulse" />
        </div>
      </div>
    );
  }

  /* ── Error state ───────────────────────────────────────── */
  if (error && !metrics) {
    return (
      <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-slate-600" />
            <span className="text-sm text-slate-500">
              Status temporarily unavailable
            </span>
          </div>
          <TrackedLink
            href="/dashboard"
            eventName="home_status_strip_click"
            eventProps={{ location: "home_status_strip", state: "error" }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-xs font-semibold text-slate-400 transition-colors hover:border-white/[0.12] hover:text-slate-200"
          >
            View Dashboard
            <span aria-hidden="true">&rarr;</span>
          </TrackedLink>
        </div>
      </div>
    );
  }

  /* ── Resolve values from public metrics ──────────────── */
  const pm = metrics!;
  const healthStatus = deriveHealth(pm.uptime_percent);
  const pubUpdated = pm.last_updated ? relativeTime(pm.last_updated) : "";

  return (
    <div
      className="group relative overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.025] transition-colors duration-300 hover:border-white/[0.12] hover:bg-white/[0.04]"
      role="region"
      aria-label="ATF system status"
    >
      {/* subtle top-edge highlight */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        aria-hidden="true"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(180,220,248,0.06) 30%, rgba(200,235,255,0.10) 50%, rgba(180,220,248,0.06) 70%, transparent 100%)",
        }}
      />

      {/* ── Top row: health + primary KPIs + CTA ─────────── */}
      <div className="relative flex flex-wrap items-center justify-between gap-x-6 gap-y-4 px-5 py-4 sm:px-6">
        {/* ── Health indicator ─────────────────────────────── */}
        <div className="flex items-center gap-3">
          <div
            className={`h-2 w-2 shrink-0 rounded-full ${
              healthDot[healthStatus] ?? "bg-slate-600"
            } ${healthStatus === "healthy" ? "animate-pulse" : ""}`}
          />
          <div className="min-w-0">
            <p
              className={`text-sm font-semibold ${
                healthText[healthStatus] ?? "text-slate-400"
              }`}
            >
              {healthLabel[healthStatus] ?? "Unknown"}
            </p>
          </div>
        </div>

        {/* ── Metric pills ────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 sm:gap-x-7">
          <MetricPill
            label="Protected Transactions"
            value={compactNum(pm.protected_requests_total)}
          />
          <MetricPill
            label="Receipts Verified"
            value={compactNum(pm.receipts_verified_total)}
          />
          <MetricPill
            label="Uptime"
            value={
              pm.uptime_seconds != null
                ? friendlyUptime(pm.uptime_seconds)
                : `${pm.uptime_percent.toFixed(2)}%`
            }
            accent="text-emerald-300"
          />
        </div>

        {/* ── CTA ─────────────────────────────────────────── */}
        <TrackedLink
          href="/dashboard"
          eventName="home_status_strip_click"
          eventProps={{ location: "home_status_strip", state: "live" }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-primary-300/20 bg-primary-500/10 px-4 py-2 text-xs font-semibold text-primary-200 transition-colors hover:border-primary-300/35 hover:bg-primary-500/20 hover:text-primary-100"
        >
          View Dashboard
          <span aria-hidden="true">&rarr;</span>
        </TrackedLink>
      </div>

      {/* ── Bottom row: extended infrastructure metrics ──── */}
      <>
        <div
          className="mx-5 h-px sm:mx-6"
          aria-hidden="true"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 30%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.06) 70%, transparent 100%)",
          }}
        />
        <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2 px-5 pb-3.5 pt-3 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400/50" aria-hidden="true" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Infrastructure
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 sm:gap-x-7">
            <MetricPill
              label="Enforcement Events"
              value={compactNum(pm.enforcement_events_total)}
              small
            />
            {pm.receipts_written_total != null && (
              <MetricPill
                label="Receipts Written"
                value={compactNum(pm.receipts_written_total)}
                small
              />
            )}
            {pm.requests_last_hour != null && (
              <MetricPill
                label="Requests (1h)"
                value={compactNum(pm.requests_last_hour)}
                accent="text-sky-300"
                small
              />
            )}
            <MetricPill
              label="Avg Latency"
              value={`${pm.avg_request_latency_ms.toFixed(1)}ms`}
              accent="text-primary-300"
              small
            />
          </div>

          {pubUpdated && (
            <p className="text-[10px] text-slate-600">
              {pubUpdated}
            </p>
          )}
        </div>
      </>
    </div>
  );
}

/* ── MetricPill ───────────────────────────────────────────── */

type MetricPillProps = {
  label: string;
  value: string;
  accent?: string;
  /** Optional secondary detail line */
  subtitle?: string;
  /** Render at slightly smaller size for the secondary row */
  small?: boolean;
};

function MetricPill({ label, value, accent, subtitle, small }: MetricPillProps) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p
        className={`mt-0.5 font-semibold tabular-nums tracking-tight ${
          small ? "text-sm" : "text-base"
        } ${accent ?? "text-slate-100"}`}
      >
        {value}
      </p>
      {subtitle && (
        <p className="mt-0.5 text-[9px] text-slate-600">{subtitle}</p>
      )}
    </div>
  );
}
