/* ────────────────────────────────────────────────────────────────
 *  HealthStrip - system health at a glance
 *
 *  Shows overall status with individual dependency checks.
 *  The header row has the global status chip + uptime/version.
 *  Below: a grid of dependency health checks.
 * ──────────────────────────────────────────────────────────── */

import type { SystemHealth } from "@/lib/dashboard-client";
import { StatusChip } from "@/components/dashboard/status-chip";
import { EmptyState } from "@/components/dashboard/empty-state";

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  const mins = Math.floor((seconds % 3_600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

type HealthStripProps = { data: SystemHealth };

export function HealthStrip({ data }: HealthStripProps) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-5 shadow-sm shadow-black/10 sm:p-6">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-slate-100">
            System Health
          </h2>
          <StatusChip status={data.status} pulse={data.status === "healthy"} />
        </div>
        <div className="flex items-center gap-4 text-[11px] text-slate-500">
          <span>
            Uptime{" "}
            <span className="font-medium text-slate-300">
              {formatUptime(data.uptime_seconds)}
            </span>
          </span>
          <span>
            Version{" "}
            <span className="font-mono font-medium text-slate-300">
              {data.version}
            </span>
          </span>
        </div>
      </div>

      {/* Separator */}
      <div className="mt-4 h-px bg-white/[0.05]" />

      {/* Dependency checks */}
      {data.checks.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title="No health checks reported"
            description="The ATF instance did not return dependency check data."
          />
        </div>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.checks.map((check) => (
            <div
              key={check.name}
              className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-white/[0.015] px-4 py-3.5 transition-all duration-200 hover:border-white/[0.08] hover:bg-white/[0.03]"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-200">
                  {check.name}
                </p>
                {check.message && (
                  <p className="mt-0.5 truncate text-[11px] leading-relaxed text-slate-500">
                    {check.message}
                  </p>
                )}
              </div>
              <div className="ml-3 flex flex-shrink-0 items-center gap-2.5">
                <span className="text-[11px] font-mono tabular-nums text-slate-500">
                  {check.latency_ms.toFixed(0)}ms
                </span>
                <StatusChip status={check.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
