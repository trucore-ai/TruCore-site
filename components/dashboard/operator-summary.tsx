/* ────────────────────────────────────────────────────────────────
 *  OperatorSummary - priority-aware operational status at a glance
 *
 *  A compact strip that interprets live dashboard data into
 *  prioritized, operator-grade status statements. Each signal
 *  communicates both current state and priority guidance:
 *  healthy, informational, needs review, or needs action.
 *
 *  Recency cues surface freshness so operators can tell whether
 *  a signal is current, stale, or idle at first glance.
 *
 *  All statements are deterministic, derived from existing data.
 *  No external APIs. No marketing copy. Infrastructure language.
 * ──────────────────────────────────────────────────────────── */

import type {
  SystemHealth,
  LiveEnforcement,
  LiveTrend,
  DashboardResult,
  TenantsResponse,
} from "@/lib/dashboard-client";
import type { AttentionLevel } from "@/lib/attention";
import {
  attentionDot,
  attentionText,
  classifyEnforcementIntensity,
  intensityLabel,
} from "@/lib/attention";
import {
  deriveTrendSummary,
  trendDeltaLabel,
  trendText,
  trendIndicator,
} from "@/lib/trend";
import type { TrendDirection } from "@/lib/trend";
import { EvidenceRow } from "@/components/dashboard/evidence-row";

type OperatorSummaryProps = {
  health: DashboardResult<SystemHealth>;
  enforcement: DashboardResult<LiveEnforcement>;
  trend: DashboardResult<LiveTrend> | undefined;
  tenants: DashboardResult<TenantsResponse>;
};

type Signal = {
  label: string;
  value: string;
  level: AttentionLevel;
  /** Optional concise operator hint, shown as secondary text. */
  hint?: string;
  /** Optional directional delta label, shown below the hint. */
  delta?: { direction: TrendDirection; label: string };
  /** Compact supporting evidence for the interpretation. */
  evidence?: string;
};

function deriveSignals({
  health,
  enforcement,
  trend,
  tenants,
}: OperatorSummaryProps): Signal[] {
  const signals: Signal[] = [];

  /* ── System state ─────────────────────────────────────── */
  if (health.ok) {
    const warnCount = health.data.checks.filter(
      (c) => c.status === "warn",
    ).length;
    const failCount = health.data.checks.filter(
      (c) => c.status === "fail",
    ).length;

    if (failCount > 0) {
      signals.push({
        label: "System",
        value: `${failCount} backing ${failCount === 1 ? "service" : "services"} failing`,
        level: "critical",
        hint: "Review backend connectivity",
        evidence: `${failCount} fail, ${warnCount} warn of ${health.data.checks.length} checks`,
      });
    } else if (warnCount > 0) {
      signals.push({
        label: "System",
        value: `Core path stable, ${warnCount} optional ${warnCount === 1 ? "backend" : "backends"} reduced`,
        level: "informational",
        hint: "Non-blocking, reduced mode",
        evidence: `${health.data.checks.length - warnCount} of ${health.data.checks.length} checks passing`,
      });
    } else if (health.data.status === "healthy") {
      signals.push({
        label: "System",
        value: "All services operational",
        level: "normal",
        evidence: `${health.data.checks.length} of ${health.data.checks.length} checks passing`,
      });
    } else {
      signals.push({
        label: "System",
        value: health.data.status === "degraded" ? "Operating in reduced mode" : "Service offline",
        level: health.data.status === "degraded" ? "attention" : "critical",
        hint: health.data.status === "degraded" ? "Persistence backends not connected" : "Immediate review required",
        evidence: `status: ${health.data.status} · ${health.data.checks.length} checks evaluated`,
      });
    }
  } else {
    signals.push({
      label: "System",
      value: "Health data unavailable",
      level: "informational",
      hint: "Endpoint not reachable",
    });
  }

  /* ── Enforcement pressure ─────────────────────────────── */
  /* Derive trend context from the LiveTrend snapshot if available. */
  const trendSummary = trend?.ok ? deriveTrendSummary(trend.data) : null;

  if (enforcement.ok) {
    const e = enforcement.data;
    const total =
      e.auth_failures_total +
      e.rate_limit_rejections_total +
      e.quota_violations_total +
      e.reprovision_operations_total;

    const categories = [
      { key: "auth_failures_total" as const, label: "auth failures" },
      { key: "rate_limit_rejections_total" as const, label: "rate limiting" },
      { key: "quota_violations_total" as const, label: "quota violations" },
      { key: "reprovision_operations_total" as const, label: "reprovisions" },
    ];
    const activeCategories = categories.filter((c) => e[c.key] > 0).length;
    const intensity = classifyEnforcementIntensity(total, activeCategories);

    if (total === 0) {
      signals.push({
        label: "Enforcement",
        value: "No enforcement activity in current interval",
        level: "normal",
        hint: "All traffic within policy bounds",
      });
    } else {
      const dominant = categories.reduce((a, b) =>
        e[a.key] >= e[b.key] ? a : b,
      );
      const authPct = total > 0 ? e.auth_failures_total / total : 0;

      let level: AttentionLevel = "normal";
      let hint: string | undefined;

      if (intensity === "concentrated" || (authPct >= 0.5 && total > 50)) {
        level = "attention";
        hint = authPct >= 0.5 ? "Review API key validity" : "Review enforcement distribution";
      } else if (intensity === "elevated") {
        level = "informational";
        hint = intensityLabel.elevated;
      } else {
        hint = intensityLabel.background;
      }

      const suffix = activeCategories === 1
        ? `${dominant.label} only`
        : `${dominant.label} dominant`;

      /* Directional delta from trend data. */
      const enfDelta = trendSummary
        ? { direction: trendSummary.enforcementPresence, label: trendDeltaLabel[trendSummary.enforcementPresence] }
        : undefined;

      /* Compact evidence: category breakdown */
      const evidenceParts = categories
        .filter((c) => e[c.key] > 0)
        .map((c) => `${e[c.key].toLocaleString()} ${c.label}`);
      evidenceParts.push("current interval");

      signals.push({
        label: "Enforcement",
        value: `${total.toLocaleString()} total, ${suffix}`,
        level,
        hint,
        delta: enfDelta?.label ? enfDelta : undefined,
        evidence: evidenceParts.join(" \u00b7 "),
      });
    }
  } else {
    signals.push({
      label: "Enforcement",
      value: "Enforcement data unavailable",
      level: "informational",
      hint: "Endpoint not reachable",
    });
  }

  /* ── Receipt flow ─────────────────────────────────────── */
  if (trend?.ok) {
    const t = trend.data;
    const receiptDelta = trendSummary
      ? { direction: trendSummary.receiptPace, label: trendDeltaLabel[trendSummary.receiptPace] }
      : undefined;

    if (t.receipts_written_last_hour > 0) {
      signals.push({
        label: "Receipts",
        value: `${t.receipts_written_last_hour.toLocaleString()} written in current hour`,
        level: "normal",
        hint: "Receipt throughput active",
        delta: receiptDelta?.label ? receiptDelta : undefined,
        evidence: `${t.receipts_written_last_hour.toLocaleString()} last hour \u00b7 ${t.receipts_written_today.toLocaleString()} today`,
      });
    } else if (t.receipts_written_today > 0) {
      signals.push({
        label: "Receipts",
        value: "Idle in current hour, active earlier today",
        level: "informational",
        hint: "No recent receipt activity",
        evidence: `0 last hour \u00b7 ${t.receipts_written_today.toLocaleString()} today`,
      });
    } else {
      signals.push({
        label: "Receipts",
        value: "No receipt activity in current interval",
        level: "informational",
        hint: "Signal idle in current interval",
        evidence: "0 receipts in current hour \u00b7 polling active",
      });
    }
  }

  /* ── Tenant attention ─────────────────────────────────── */
  if (tenants.ok) {
    const ts = tenants.data.tenants;
    const total = tenants.data.total;
    const activeCount = ts.filter((t) => t.status === "active").length;
    const suspendedCount = ts.filter((t) => t.status === "suspended").length;
    const withEnforcement = ts.filter((t) => t.enforcements_24h > 0).length;
    const recentlyActive = ts.filter(
      (t) => t.last_seen && (Date.now() - new Date(t.last_seen).getTime()) < 3_600_000,
    ).length;

    /* Derive directional tenant context. */
    let tenantDelta: Signal["delta"] | undefined;
    if (withEnforcement > 0 && recentlyActive > 0) {
      tenantDelta = { direction: "persistent" as const, label: "Active enforcement in current interval" };
    } else if (withEnforcement > 0 && recentlyActive === 0) {
      tenantDelta = { direction: "unchanged" as const, label: "Enforcement recorded, no recent requests" };
    }

    if (suspendedCount > 0) {
      signals.push({
        label: "Tenants",
        value: `${total} registered, ${suspendedCount} suspended`,
        level: "attention",
        hint: "Suspended tenants require review",
        delta: tenantDelta,
        evidence: `${suspendedCount} suspended \u00b7 ${withEnforcement} with enforcement \u00b7 ${recentlyActive} seen last hour`,
      });
    } else if (withEnforcement > 0) {
      signals.push({
        label: "Tenants",
        value: `${activeCount} active, ${withEnforcement} with enforcement events`,
        level: "informational",
        hint: "Enforcement activity recorded",
        delta: tenantDelta,
        evidence: `${withEnforcement} with enforcement \u00b7 ${recentlyActive} seen last hour`,
      });
    } else {
      signals.push({
        label: "Tenants",
        value: `${activeCount} active of ${total} registered`,
        level: "normal",
        evidence: `${recentlyActive} seen last hour \u00b7 0 enforcement events`,
      });
    }
  }

  return signals;
}

/** Priority sort: critical first, then attention, informational, normal. */
const levelOrder: Record<AttentionLevel, number> = {
  critical: 0,
  attention: 1,
  informational: 2,
  normal: 3,
};

export function OperatorSummary(props: OperatorSummaryProps) {
  const signals = deriveSignals(props);

  if (signals.length === 0) return null;

  const sorted = [...signals].sort(
    (a, b) => levelOrder[a.level] - levelOrder[b.level],
  );

  /* Derive a top-line priority label from the highest signal. */
  const topLevel = sorted[0]?.level ?? "normal";
  const priorityLabels: Record<AttentionLevel, string> = {
    critical: "Action Required",
    attention: "Review Recommended",
    informational: "Informational",
    normal: "All Clear",
  };

  return (
    <div className="dashboard-panel p-4 sm:p-5">
      <div className="flex flex-wrap items-start gap-x-6 gap-y-3">
        <div className="flex items-center gap-2 pt-0.5 shrink-0">
          <span
            className={`inline-block h-2 w-2 rounded-full ${attentionDot[topLevel]}`}
            aria-hidden="true"
          />
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">
            {priorityLabels[topLevel]}
          </p>
        </div>
        <div className="flex flex-wrap items-start gap-x-5 gap-y-2.5">
          {sorted.map((s) => (
            <div key={s.label} className="flex items-start gap-2">
              <span
                className={`mt-1 inline-block h-1.5 w-1.5 rounded-full shrink-0 ${attentionDot[s.level]}`}
                aria-hidden="true"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-500">{s.label}</span>
                  <span className={`text-[11px] font-medium ${attentionText[s.level]}`}>
                    {s.value}
                  </span>
                </div>
                {s.hint && (
                  <p className="text-[10px] leading-snug text-slate-600 mt-0.5">
                    {s.hint}
                  </p>
                )}
                {s.delta && s.delta.label && (
                  <p className={`text-[10px] leading-snug mt-0.5 ${trendText[s.delta.direction]}`}>
                    <span aria-hidden="true">{trendIndicator[s.delta.direction]} </span>
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
        Derived from current service state
      </p>
    </div>
  );
}
