/* ────────────────────────────────────────────────────────────────
 *  AdminTelemetrySection — client wrapper that owns the shared
 *  useAdminSecurityTelemetry hook and distributes data to the
 *  PublicSurfaceHealth and AdminDegradedTelemetry panels.
 *
 *  Also renders the manual refresh button and last-updated stamp.
 * ──────────────────────────────────────────────────────────── */

"use client";

import { PublicSurfaceHealth } from "./public-surface-health";
import { AdminDegradedTelemetry } from "./admin-degraded-telemetry";
import { useAdminSecurityTelemetry } from "./use-admin-security-telemetry";

export function AdminTelemetrySection() {
  const { data, loading, refreshing, error, lastUpdated, refresh } =
    useAdminSecurityTelemetry();

  return (
    <div>
      {/* ── header row with refresh control ── */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
          Security Telemetry
        </h2>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span
              data-testid="telemetry-last-updated"
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
            <span
              data-testid="telemetry-refresh-warning"
              className="text-[10px] text-amber-400/70"
            >
              Telemetry refresh unavailable
            </span>
          )}
          <button
            type="button"
            data-testid="telemetry-refresh-btn"
            disabled={refreshing || loading}
            onClick={refresh}
            aria-label="Refresh telemetry"
            className="rounded border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {refreshing ? "Refreshing\u2026" : "Refresh"}
          </button>
        </div>
      </div>

      {/* ── panels ── */}
      <div className="mb-6">
        <PublicSurfaceHealth data={data} loading={loading} error={error} />
      </div>
      <div className="mb-6">
        <AdminDegradedTelemetry data={data} loading={loading} error={error} />
      </div>
    </div>
  );
}
