/* ────────────────────────────────────────────────────────────────
 *  LiveStatusStrip - compact homepage status preview
 *
 *  Surfaces a few high-signal ATF metrics and links to the full
 *  /dashboard page. Polls /api/dashboard/refresh on a relaxed
 *  30 s cadence (the marketing page does not need 5 s latency).
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
import type {
  SystemHealth,
  KpiSummary,
  EnforcementOverview,
  DashboardResult,
} from "@/lib/dashboard-client";

/* ── Types ────────────────────────────────────────────────── */

type StripData = {
  health: DashboardResult<SystemHealth>;
  kpis: DashboardResult<KpiSummary>;
  enforcement: DashboardResult<EnforcementOverview>;
};

/* ── Constants ────────────────────────────────────────────── */

const POLL_MS = 30_000;

/* ── Helpers ──────────────────────────────────────────────── */

function compactNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
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
  const [data, setData] = useState<StripData | null>(null);
  const [error, setError] = useState(false);
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/refresh", {
        cache: "no-store",
      });
      if (!res.ok) {
        if (mountedRef.current) setError(true);
        return;
      }
      const json = (await res.json()) as StripData;
      if (mountedRef.current) {
        setData(json);
        setError(false);
      }
    } catch {
      if (mountedRef.current) setError(true);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    const start = async () => {
      try {
        const res = await fetch("/api/dashboard/refresh", {
          cache: "no-store",
        });
        if (!res.ok) {
          if (mountedRef.current) setError(true);
          return;
        }
        const json = (await res.json()) as StripData;
        if (mountedRef.current) {
          setData(json);
          setError(false);
        }
      } catch {
        if (mountedRef.current) setError(true);
      }
    };

    start();
    const id = setInterval(refresh, POLL_MS);
    return () => {
      mountedRef.current = false;
      clearInterval(id);
    };
  }, [refresh]);

  /* ── Loading state ─────────────────────────────────────── */
  if (!data && !error) {
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
  if (error && !data) {
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

  /* ── Resolve values ────────────────────────────────────── */
  const healthStatus =
    data?.health?.ok ? data.health.data.status : "unknown";
  const passedChecks =
    data?.health?.ok
      ? data.health.data.checks.filter((c) => c.status === "pass").length
      : 0;
  const totalChecks =
    data?.health?.ok ? data.health.data.checks.length : 0;
  const requests24h =
    data?.kpis?.ok ? data.kpis.data.total_requests_24h : null;
  const enforcements24h =
    data?.kpis?.ok ? data.kpis.data.total_enforcements_24h : null;
  const blockedCount =
    data?.enforcement?.ok ? data.enforcement.data.total_blocked : null;
  const uptimePct =
    data?.kpis?.ok ? data.kpis.data.uptime_pct : null;

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
            {totalChecks > 0 && (
              <p className="mt-0.5 text-[11px] text-slate-500">
                {passedChecks}/{totalChecks} checks passing
              </p>
            )}
          </div>
        </div>

        {/* ── Metric pills ────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 sm:gap-x-7">
          {requests24h !== null && (
            <MetricPill label="Requests (24h)" value={compactNum(requests24h)} />
          )}
          {enforcements24h !== null && (
            <MetricPill
              label="Enforced"
              value={compactNum(enforcements24h)}
            />
          )}
          {blockedCount !== null && (
            <MetricPill label="Blocked" value={compactNum(blockedCount)} />
          )}
          {uptimePct !== null && (
            <MetricPill
              label="Uptime"
              value={`${uptimePct.toFixed(2)}%`}
              accent="text-emerald-300"
            />
          )}
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
    </div>
  );
}

/* ── MetricPill ───────────────────────────────────────────── */

type MetricPillProps = {
  label: string;
  value: string;
  accent?: string;
};

function MetricPill({ label, value, accent }: MetricPillProps) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p
        className={`mt-0.5 text-base font-semibold tabular-nums tracking-tight ${accent ?? "text-slate-100"}`}
      >
        {value}
      </p>
    </div>
  );
}
