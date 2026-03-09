/* ────────────────────────────────────────────────────────────────
 *  HealthStrip - system health with severity differentiation
 *
 *  Shows overall status with individual dependency checks,
 *  grouped by severity. Distinguishes core path health from
 *  optional backend degradation, missing persistence, and
 *  actual failure conditions. Provides concise operator action
 *  hints when grounded by current data.
 *
 *  Panel header includes a secondary status badge so operators
 *  can read priority at a glance without scanning all checks.
 * ──────────────────────────────────────────────────────────── */

import type { SystemHealth } from "@/lib/dashboard-client";
import { StatusChip } from "@/components/dashboard/status-chip";
import { EmptyState } from "@/components/dashboard/empty-state";
import {
  deriveHealthPanelStatus,
  panelStatusBadge,
} from "@/lib/attention";
import type { PanelStatus } from "@/lib/attention";
import { trendText, trendIndicator } from "@/lib/trend";
import type { TrendDirection } from "@/lib/trend";
import { SectionInvestigationHeader } from "@/components/dashboard/section-investigation-header";
import type { InvestigationState } from "@/components/dashboard/section-investigation-header";

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  const mins = Math.floor((seconds % 3_600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

/** Derive a short interpretive line for the overall health state. */
function interpretOverall(data: SystemHealth): string {
  const warnCount = data.checks.filter((c) => c.status === "warn").length;
  const failCount = data.checks.filter((c) => c.status === "fail").length;
  const passCount = data.checks.filter((c) => c.status === "pass").length;

  if (data.status === "healthy" && warnCount === 0 && failCount === 0) {
    return "All dependency checks passing. Core path stable.";
  }
  if (data.status === "healthy" && warnCount > 0) {
    return `Core path stable. ${warnCount} optional ${warnCount === 1 ? "backend" : "backends"} reporting warnings. Operating in reduced mode.`;
  }
  if (data.status === "degraded") {
    if (failCount > 0) {
      return `${failCount} ${failCount === 1 ? "service" : "services"} failing. System operational but degraded. Persistence backends may require attention.`;
    }
    return "System operating in degraded mode. Persistence backends not connected.";
  }
  if (data.status === "down") {
    return "Service reporting offline. Immediate attention required.";
  }
  if (passCount === 0 && data.checks.length > 0) {
    return "No dependency checks passing. Operating in reduced mode.";
  }
  return "Health state reported by the active ATF instance.";
}

/** Derive a concise operator action hint for the current health state. */
function operatorHint(data: SystemHealth): string | null {
  const failCount = data.checks.filter((c) => c.status === "fail").length;
  const warnCount = data.checks.filter((c) => c.status === "warn").length;

  if (data.status === "down") {
    return "Immediate review required. Service is non-operational.";
  }
  if (failCount > 0) {
    return "Review backend connectivity before production use.";
  }
  if (data.status === "degraded") {
    return "Reduced mode active. Persistence backends unavailable.";
  }
  if (warnCount > 0 && data.status === "healthy") {
    return "Core path stable. Optional backends reduced, non-blocking.";
  }
  return null;
}

/** Assign an operator-readable category to a check name. */
function categorizeCheck(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("db") || lower.includes("postgres") || lower.includes("sql") || lower.includes("redis") || lower.includes("store")) {
    return "Persistence";
  }
  if (lower.includes("queue") || lower.includes("kafka") || lower.includes("nats") || lower.includes("pubsub")) {
    return "Messaging";
  }
  if (lower.includes("auth") || lower.includes("token") || lower.includes("key")) {
    return "Credentials";
  }
  return "Infrastructure";
}

/** Derive a short supporting note for a warning-state check. */
function checkNote(
  name: string,
  status: "pass" | "warn" | "fail",
  message?: string,
): string | null {
  if (status === "pass") return null;
  if (message) return message;
  const lower = name.toLowerCase();
  if (lower.includes("db") || lower.includes("postgres") || lower.includes("sql")) {
    return "Persistent storage not connected";
  }
  if (lower.includes("redis") || lower.includes("cache")) {
    return "Cache backend not available";
  }
  if (lower.includes("queue") || lower.includes("kafka")) {
    return "Message queue not connected";
  }
  return status === "fail" ? "Service check failing" : "Operating in reduced mode";
}

/** Derive a compact investigation header state for the health section. */
function deriveHealthInvestigation(data: SystemHealth): InvestigationState {
  const warnCount = data.checks.filter((c) => c.status === "warn").length;
  const failCount = data.checks.filter((c) => c.status === "fail").length;
  const panelStatus = deriveHealthPanelStatus(data.status, warnCount, failCount);

  if (data.status === "down") {
    return {
      status: panelStatus,
      summary: "Service reporting offline. Immediate investigation required.",
      detail: "All dependency checks should be reviewed.",
    };
  }

  if (failCount > 0 && warnCount > 0) {
    return {
      status: panelStatus,
      summary: `${failCount} backing ${failCount === 1 ? "service" : "services"} failing, ${warnCount} warning. Core path may be affected.`,
      detail: "Review backend connectivity before production use.",
    };
  }

  if (failCount > 0) {
    return {
      status: panelStatus,
      summary: `${failCount} backing ${failCount === 1 ? "service" : "services"} failing. Review backend connectivity.`,
    };
  }

  if (data.status === "degraded") {
    return {
      status: panelStatus,
      summary: "Operating in reduced mode. Persistence backends unavailable.",
      detail: data.uptime_seconds > 86_400 ? "Degraded for over 24 hours." : undefined,
    };
  }

  if (warnCount > 0) {
    return {
      status: panelStatus,
      summary: `Core path stable. ${warnCount} optional ${warnCount === 1 ? "backend" : "backends"} reduced, non-blocking.`,
    };
  }

  // All clear
  return {
    status: panelStatus,
    summary: "All checks passing. No regressions in current interval.",
    detail: data.uptime_seconds > 86_400 ? `Stable for ${Math.floor(data.uptime_seconds / 86_400)}d+.` : undefined,
  };
}

/** Derive health persistence context from uptime and status. */
function healthPersistence(data: SystemHealth): {
  direction: TrendDirection;
  label: string;
} | null {
  const warnCount = data.checks.filter((c) => c.status === "warn").length;
  const failCount = data.checks.filter((c) => c.status === "fail").length;

  if (data.status === "healthy" && warnCount === 0 && failCount === 0) {
    if (data.uptime_seconds > 86_400) {
      return { direction: "persistent", label: "Stable for over 24 hours" };
    }
    return null;
  }

  if (data.status === "down") {
    return { direction: "increasing", label: "Service offline, immediate attention required" };
  }

  // Degraded or warning states - distinguish newly degraded vs persistent.
  if (failCount > 0 || data.status === "degraded") {
    if (data.uptime_seconds < 600) {
      return { direction: "newly-active", label: "Recently degraded, within startup window" };
    }
    if (data.uptime_seconds > 86_400) {
      return { direction: "persistent", label: "Degraded for over 24 hours" };
    }
    return { direction: "persistent", label: "Operating in reduced mode" };
  }

  if (warnCount > 0) {
    if (data.uptime_seconds > 86_400) {
      return { direction: "unchanged", label: "Optional backends persistently unavailable" };
    }
    return { direction: "newly-active", label: "Warnings detected in current session" };
  }

  return null;
}

type HealthStripProps = { data: SystemHealth };

export function HealthStrip({ data }: HealthStripProps) {
  const passing = data.checks.filter((c) => c.status === "pass");
  const warnings = data.checks.filter((c) => c.status === "warn");
  const failures = data.checks.filter((c) => c.status === "fail");
  const panelStatus: PanelStatus = deriveHealthPanelStatus(
    data.status,
    warnings.length,
    failures.length,
  );
  const badge = panelStatusBadge[panelStatus];
  const hint = operatorHint(data);
  const persistence = healthPersistence(data);
  const investigation = deriveHealthInvestigation(data);

  return (
    <div className="dashboard-panel p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-slate-100">
            System Health
          </h2>
          <StatusChip status={data.status} pulse={data.status === "healthy"} />
          {panelStatus !== "stable" && (
            <span
              className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium ${badge.bg} ${badge.text} ${badge.border}`}
            >
              {badge.label}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 text-[11px] text-slate-500">
          {data.uptime_seconds > 0 && (
            <span>
              Uptime{" "}
              <span className="font-medium text-slate-300">
                {formatUptime(data.uptime_seconds)}
              </span>
            </span>
          )}
          <span>
            Version{" "}
            <span className="font-mono font-medium text-slate-300">
              {data.version}
            </span>
          </span>
        </div>
      </div>

      {/* Investigation header - local section summary */}
      <SectionInvestigationHeader state={investigation} />

      <p className="mt-1.5 text-[10px] text-slate-600">
        Direct system status &middot; Current interval
      </p>

      {/* Interpretive summary */}
      <p className="mt-2 text-[12px] leading-relaxed text-slate-500">
        {interpretOverall(data)}
      </p>

      {/* Operator action hint */}
      {hint && (
        <p className="mt-1.5 text-[11px] leading-relaxed text-slate-600 italic">
          {hint}
        </p>
      )}

      {/* Persistence context */}
      {persistence && (
        <p className={`mt-1 text-[10px] leading-snug ${trendText[persistence.direction]}`}>
          <span aria-hidden="true">{trendIndicator[persistence.direction]} </span>
          {persistence.label}
        </p>
      )}

      {/* Separator */}
      <div className="gradient-divider mt-4" />

      {/* Dependency checks */}
      {data.checks.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title="No health checks reported"
            description="The ATF instance did not return dependency check data. This may indicate a minimal deployment or startup in progress."
          />
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {/* Failures first */}
          {failures.length > 0 && (
            <HealthGroup
              label={`Failing (${failures.length})`}
              checks={failures}
              accentBorder="border-red-500/20"
              groupHint="Action required. Services non-operational."
            />
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <HealthGroup
              label={`Warnings (${warnings.length})`}
              checks={warnings}
              accentBorder="border-amber-500/15"
              groupHint="Optional backends. Non-blocking for core path."
            />
          )}

          {/* Passing */}
          {passing.length > 0 && (
            <HealthGroup
              label={`Passing (${passing.length})`}
              checks={passing}
              accentBorder="border-emerald-500/10"
            />
          )}
        </div>
      )}
    </div>
  );
}

/* ── Grouped check list ───────────────────────────────────── */

function HealthGroup({
  label,
  checks,
  accentBorder,
  groupHint,
}: {
  label: string;
  checks: SystemHealth["checks"];
  accentBorder: string;
  groupHint?: string;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600">
          {label}
        </p>
        {groupHint && (
          <p className="text-[10px] leading-snug text-slate-600">
            {groupHint}
          </p>
        )}
      </div>
      <div className={`grid gap-2 sm:grid-cols-2 lg:grid-cols-3`}>
        {checks.map((check) => {
          const note = checkNote(check.name, check.status, check.message);
          const category = categorizeCheck(check.name);
          return (
            <div
              key={check.name}
              className={`dashboard-sub-panel flex items-start justify-between gap-2 border-l-2 ${accentBorder} px-4 py-3`}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-200">
                  {check.name}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="text-[10px] text-slate-600">{category}</span>
                  {note && (
                    <>
                      <span className="text-[10px] text-slate-700" aria-hidden="true">&middot;</span>
                      <span className="text-[10px] leading-relaxed text-slate-500">
                        {note}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="ml-2 flex flex-shrink-0 items-center gap-2">
                {check.latency_ms > 0 && (
                  <span className="text-[10px] font-mono tabular-nums text-slate-600">
                    {check.latency_ms.toFixed(0)}ms
                  </span>
                )}
                <StatusChip status={check.status} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
