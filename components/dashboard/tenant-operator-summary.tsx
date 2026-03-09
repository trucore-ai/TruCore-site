/* ────────────────────────────────────────────────────────────────
 *  TenantOperatorSummary - compact tenant-level investigation strip
 *
 *  A priority-aware operator summary derived from existing tenant
 *  detail data. Answers "what is the current state of this tenant?"
 *  in a single, scan-friendly strip beneath the hero card.
 *
 *  Signals are derived from: status, usage buckets, posture score,
 *  warnings, activity timestamps, and quota utilization.
 *  No external APIs. No fabricated metrics.
 * ──────────────────────────────────────────────────────────── */

import type { TenantDetail } from "@/lib/dashboard-client";
import type { AttentionLevel } from "@/lib/attention";
import {
  attentionDot,
  attentionText,
  classifyRecency,
  recencyLabel,
} from "@/lib/attention";
import { deriveUsageDelta, trendText, trendIndicator } from "@/lib/trend";
import type { TrendDirection } from "@/lib/trend";
import { EvidenceRow } from "@/components/dashboard/evidence-row";

/* ── Signal type ──────────────────────────────────────────── */

type Signal = {
  label: string;
  value: string;
  level: AttentionLevel;
  hint?: string;
  delta?: { direction: TrendDirection; label: string };
  /** Compact supporting evidence for the interpretation. */
  evidence?: string;
};

/* ── Signal derivation ────────────────────────────────────── */

function deriveSignals(tenant: TenantDetail): Signal[] {
  const signals: Signal[] = [];

  /* ── Operational state ────────────────────────────────── */
  if (tenant.status === "suspended") {
    signals.push({
      label: "State",
      value: "Suspended",
      level: "critical",
      hint: "Review suspension cause",
      evidence: `status: suspended \u00b7 ${tenant.usage_24h.enforcements > 0 ? `${tenant.usage_24h.enforcements} enforcement events` : "no recent enforcement"}`,
    });
  } else if (tenant.status === "inactive") {
    signals.push({
      label: "State",
      value: "Inactive",
      level: "informational",
      hint: "No recent activity recorded",
      evidence: `${tenant.usage_24h.requests} requests in 24h \u00b7 status: inactive`,
    });
  } else {
    const recency = classifyRecency(
      tenant.last_activity_ts ?? tenant.last_seen,
    );
    if (recency === "current" || recency === "recent") {
      signals.push({
        label: "State",
        value: "Active",
        level: "normal",
        hint: recencyLabel(tenant.last_activity_ts ?? tenant.last_seen),
      });
    } else if (recency === "stale") {
      signals.push({
        label: "State",
        value: "Active, no recent requests",
        level: "informational",
        hint: recencyLabel(tenant.last_activity_ts ?? tenant.last_seen),
      });
    } else {
      signals.push({
        label: "State",
        value: "Active, idle",
        level: "informational",
        hint: "No activity detected",
      });
    }
  }

  /* ── Activity level ───────────────────────────────────── */
  const reqDelta = deriveUsageDelta(
    tenant.usage_24h.requests,
    tenant.usage_7d.requests,
  );

  if (tenant.usage_24h.requests === 0) {
    signals.push({
      label: "Activity",
      value: "No request activity in 24h window",
      level: "informational",
      evidence: "0 requests \u00b7 0 enforcements in 24h",
    });
  } else {
    const activityLabels: Partial<Record<TrendDirection, string>> = {
      increasing: "Elevated request activity vs baseline",
      decreasing: "Reduced request activity vs baseline",
      unchanged: "Request activity at baseline level",
      "newly-active": "New request activity in current window",
    };
    const label = activityLabels[reqDelta] ?? "Request activity recorded";
    const level: AttentionLevel =
      reqDelta === "increasing" ? "informational" : "normal";
    signals.push({
      label: "Activity",
      value: label,
      level,
      delta:
        reqDelta !== "unchanged" && reqDelta !== "unavailable"
          ? { direction: reqDelta, label: `${tenant.usage_24h.requests.toLocaleString()} requests in 24h` }
          : undefined,
      evidence: `${tenant.usage_24h.requests.toLocaleString()} requests 24h \u00b7 ${tenant.usage_7d.requests.toLocaleString()} requests 7d`,
    });
  }

  /* ── Enforcement presence ─────────────────────────────── */
  if (tenant.usage_24h.enforcements > 0) {
    const enfDelta = deriveUsageDelta(
      tenant.usage_24h.enforcements,
      tenant.usage_7d.enforcements,
    );
    const isElevated =
      enfDelta === "increasing" || tenant.usage_24h.enforcements > 50;
    signals.push({
      label: "Enforcement",
      value: `${tenant.usage_24h.enforcements.toLocaleString()} enforcement events in 24h`,
      level: isElevated ? "attention" : "informational",
      hint: isElevated
        ? "Review policy pressure"
        : "Enforcement activity recorded",
      delta:
        enfDelta !== "unchanged" && enfDelta !== "unavailable"
          ? { direction: enfDelta, label: enfDelta === "increasing" ? "Up vs baseline" : enfDelta === "decreasing" ? "Down vs baseline" : "New" }
          : undefined,
      evidence: `${tenant.usage_24h.enforcements.toLocaleString()} enforcements 24h \u00b7 ${tenant.usage_7d.enforcements.toLocaleString()} enforcements 7d`,
    });
  } else {
    signals.push({
      label: "Enforcement",
      value: "No enforcement activity recorded",
      level: "normal",
    });
  }

  /* ── Posture ──────────────────────────────────────────── */
  const { score, warnings } = tenant.posture_summary;
  const criticalWarnings = warnings.filter(
    (w) => w.severity === "critical",
  ).length;
  const warnCount = warnings.filter((w) => w.severity === "warn").length;

  if (criticalWarnings > 0) {
    signals.push({
      label: "Posture",
      value: `Score ${score}, ${criticalWarnings} critical ${criticalWarnings === 1 ? "warning" : "warnings"}`,
      level: "critical",
      hint: "Immediate review recommended",
      evidence: `score ${score} \u00b7 ${criticalWarnings} critical, ${warnCount} warn of ${warnings.length} total`,
    });
  } else if (warnCount > 0) {
    signals.push({
      label: "Posture",
      value: `Score ${score}, ${warnCount} ${warnCount === 1 ? "warning" : "warnings"} recorded`,
      level: "attention",
      hint: "Review posture warnings",
      evidence: `score ${score} \u00b7 ${warnCount} warning${warnCount !== 1 ? "s" : ""} of ${warnings.length} total`,
    });
  } else if (score < 60) {
    signals.push({
      label: "Posture",
      value: `Score ${score}, needs attention`,
      level: "attention",
      hint: "Low posture score without explicit warnings",
      evidence: `score ${score} \u00b7 0 warnings \u00b7 threshold: 60`,
    });
  } else {
    signals.push({
      label: "Posture",
      value: `Score ${score}, no warnings`,
      level: "normal",
    });
  }

  return signals;
}

/* ── Priority sort ────────────────────────────────────────── */

const levelOrder: Record<AttentionLevel, number> = {
  critical: 0,
  attention: 1,
  informational: 2,
  normal: 3,
};

/* ── Priority labels ──────────────────────────────────────── */

const priorityLabels: Record<AttentionLevel, string> = {
  critical: "Action Required",
  attention: "Review Recommended",
  informational: "Informational",
  normal: "All Clear",
};

/* ── Component ────────────────────────────────────────────── */

type TenantOperatorSummaryProps = {
  tenant: TenantDetail;
};

export function TenantOperatorSummary({
  tenant,
}: TenantOperatorSummaryProps) {
  const signals = deriveSignals(tenant);
  if (signals.length === 0) return null;

  const sorted = [...signals].sort(
    (a, b) => levelOrder[a.level] - levelOrder[b.level],
  );
  const topLevel = sorted[0]?.level ?? "normal";

  return (
    <div
      className="dashboard-panel p-4 sm:p-5"
      role="status"
      aria-label="Tenant operator summary"
    >
      <div className="flex flex-wrap items-start gap-x-6 gap-y-3">
        {/* Priority label */}
        <div className="flex items-center gap-2 pt-0.5 shrink-0">
          <span
            className={`inline-block h-2 w-2 rounded-full ${attentionDot[topLevel]}`}
            aria-hidden="true"
          />
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">
            {priorityLabels[topLevel]}
          </p>
        </div>

        {/* Signal strip */}
        <div className="flex flex-wrap items-start gap-x-5 gap-y-2.5">
          {sorted.map((s) => (
            <div key={s.label} className="flex items-start gap-2">
              <span
                className={`mt-1 inline-block h-1.5 w-1.5 rounded-full shrink-0 ${attentionDot[s.level]}`}
                aria-hidden="true"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-500">
                    {s.label}
                  </span>
                  <span
                    className={`text-[11px] font-medium ${attentionText[s.level]}`}
                  >
                    {s.value}
                  </span>
                </div>
                {s.hint && (
                  <p className="text-[10px] leading-snug text-slate-600 mt-0.5">
                    {s.hint}
                  </p>
                )}
                {s.delta && s.delta.label && (
                  <p
                    className={`text-[10px] leading-snug mt-0.5 ${trendText[s.delta.direction]}`}
                  >
                    <span aria-hidden="true">
                      {trendIndicator[s.delta.direction]}{" "}
                    </span>
                    {s.delta.label}
                  </p>
                )}
                {s.evidence && (
                  <EvidenceRow basis={s.evidence} />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <p className="mt-2 text-[10px] text-slate-600">
        Derived from current tenant state and activity signals
      </p>
    </div>
  );
}
