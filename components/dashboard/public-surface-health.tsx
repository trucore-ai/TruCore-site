/* ────────────────────────────────────────────────────────────────
 *  PublicSurfaceHealth — compact operator panel summarising
 *  the hardened public perimeter in one place.
 *
 *  Fetches aggregate rate-limit counters from the authenticated
 *  /api/admin/security endpoint and renders a single summary card.
 *
 *  - No secrets, IPs, stack traces, or raw backend errors displayed.
 *  - Aggregate counts only, derived from process-local in-memory state.
 *  - Fails gracefully if the telemetry endpoint is unreachable.
 * ──────────────────────────────────────────────────────────── */

"use client";

import { useEffect, useState } from "react";

interface SurfaceData {
  public_route_rate_limited_total: number;
  public_route_rate_limited_by_route: Record<string, number>;
  agent_route_rate_limited_total: number;
  agent_route_rate_limited_by_route: Record<string, number>;
}

type PerimeterStatus = "healthy" | "degraded";

function deriveStatus(d: SurfaceData): PerimeterStatus {
  return d.public_route_rate_limited_total + d.agent_route_rate_limited_total > 0
    ? "degraded"
    : "healthy";
}

export function PublicSurfaceHealth() {
  const [data, setData] = useState<SurfaceData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/admin/security", {
          credentials: "same-origin",
        });
        if (!res.ok) {
          setError(true);
          return;
        }
        const json = await res.json();
        if (!cancelled) {
          setData({
            public_route_rate_limited_total:
              json.public_route_rate_limited_total ?? 0,
            public_route_rate_limited_by_route:
              json.public_route_rate_limited_by_route ?? {},
            agent_route_rate_limited_total:
              json.agent_route_rate_limited_total ?? 0,
            agent_route_rate_limited_by_route:
              json.agent_route_rate_limited_by_route ?? {},
          });
        }
      } catch {
        if (!cancelled) setError(true);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ── loading / error states ── */

  if (error) {
    return (
      <div
        data-testid="public-surface-health"
        className="rounded-lg border border-white/10 bg-white/5 px-4 py-4"
      >
        <p className="text-xs text-slate-400">
          Public surface health unavailable.
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div
        data-testid="public-surface-health"
        className="rounded-lg border border-white/10 bg-white/5 px-4 py-4"
      >
        <p className="text-xs text-slate-400">Loading public surface health…</p>
      </div>
    );
  }

  /* ── derived values ── */

  const status = deriveStatus(data);
  const totalThrottles =
    data.public_route_rate_limited_total +
    data.agent_route_rate_limited_total;

  const publicEntries = Object.entries(
    data.public_route_rate_limited_by_route,
  ).sort(([, a], [, b]) => b - a);

  const agentEntries = Object.entries(
    data.agent_route_rate_limited_by_route,
  ).sort(([, a], [, b]) => b - a);

  const isDegraded = status === "degraded";

  return (
    <div
      data-testid="public-surface-health"
      className={`rounded-lg border px-4 py-4 ${
        isDegraded
          ? "border-amber-500/20 bg-amber-500/[0.04]"
          : "border-white/10 bg-white/5"
      }`}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
          Public Surface Health
        </h2>
        <span
          data-testid="perimeter-status"
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
            isDegraded
              ? "bg-amber-500/20 text-amber-300"
              : "bg-emerald-500/20 text-emerald-300"
          }`}
        >
          {status}
        </span>
      </div>

      {/* ── aggregate counters ── */}
      <div className="mt-3 grid grid-cols-3 gap-3">
        <div className="rounded border border-white/10 bg-neutral-900/60 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wider text-slate-500">
            Total throttles
          </p>
          <p
            data-testid="surface-total-throttles"
            className={`text-lg font-semibold ${
              totalThrottles > 0 ? "text-amber-300" : "text-slate-100"
            }`}
          >
            {totalThrottles}
          </p>
        </div>
        <div className="rounded border border-white/10 bg-neutral-900/60 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wider text-slate-500">
            Public routes
          </p>
          <p
            data-testid="surface-public-throttles"
            className={`text-lg font-semibold ${
              data.public_route_rate_limited_total > 0
                ? "text-amber-300"
                : "text-slate-100"
            }`}
          >
            {data.public_route_rate_limited_total}
          </p>
        </div>
        <div className="rounded border border-white/10 bg-neutral-900/60 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wider text-slate-500">
            Agent routes
          </p>
          <p
            data-testid="surface-agent-throttles"
            className={`text-lg font-semibold ${
              data.agent_route_rate_limited_total > 0
                ? "text-amber-300"
                : "text-slate-100"
            }`}
          >
            {data.agent_route_rate_limited_total}
          </p>
        </div>
      </div>

      {/* ── status message ── */}
      {isDegraded ? (
        <p className="mt-2 text-xs text-amber-400/80">
          Rate limiting active on public perimeter — review route
          breakdowns below.
        </p>
      ) : (
        <p className="mt-2 text-xs text-emerald-400/70">
          Public perimeter healthy — no throttles detected.
        </p>
      )}

      {/* ── route breakdowns (only when non-zero) ── */}
      {publicEntries.length > 0 && (
        <div className="mt-3">
          <p className="mb-1 text-[10px] uppercase tracking-wider text-slate-500">
            Public routes
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {publicEntries.map(([route, count]) => (
              <div
                key={route}
                className="rounded border border-white/10 bg-neutral-900/60 px-3 py-2"
              >
                <p className="text-xs text-slate-400">{route}</p>
                <p className="text-sm font-semibold text-slate-100">{count}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {agentEntries.length > 0 && (
        <div className="mt-3">
          <p className="mb-1 text-[10px] uppercase tracking-wider text-slate-500">
            Agent routes
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {agentEntries.map(([route, count]) => (
              <div
                key={route}
                className="rounded border border-white/10 bg-neutral-900/60 px-3 py-2"
              >
                <p className="text-xs text-slate-400">{route}</p>
                <p className="text-sm font-semibold text-slate-100">{count}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="mt-3 text-[10px] text-slate-500">
        Process-local aggregate counters. Resets on deploy or restart.
      </p>
    </div>
  );
}
