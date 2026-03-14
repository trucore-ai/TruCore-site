/* ────────────────────────────────────────────────────────────────
 *  Agent Observability Serializer
 *
 *  Converts existing dashboard-derived state into stable,
 *  machine-readable JSON objects for consumption by OpenClaw
 *  and other AI agents.
 *
 *  This module depends only on shared lib utilities (attention,
 *  trend, freshness, dashboard-queue, dashboard-client types).
 *  It never imports presentation components.
 *
 *  Schema version is bumped when breaking changes are made to
 *  the agent-facing contract. Additive fields are non-breaking.
 * ──────────────────────────────────────────────────────────── */

import type {
  SystemHealth,
  LiveEnforcement,
  LiveTrend,
  TenantsResponse,
  TenantDetail,
  DashboardResult,
  DashboardSummary,
  LiveKpiItem,
} from "@/lib/dashboard-client";
import type { AttentionLevel, PanelStatus, EnforcementIntensity } from "@/lib/attention";
import {
  classifyEnforcementIntensity,
  intensityLabel,
  deriveHealthPanelStatus,
  deriveEnforcementPanelStatus,
  deriveTenantAttentionReason,
  classifyRecency,
  recencyLabel,
} from "@/lib/attention";
import type { TrendDirection } from "@/lib/trend";
import {
  deriveTrendSummary,
  deriveUsageDelta,
  trendLabel,
  trendDeltaLabel,
} from "@/lib/trend";
import type { SignalFreshness, SignalProvenance } from "@/lib/freshness";
import { classifyFreshness, provenanceLabel } from "@/lib/freshness";
import type { QueueItem, ChangeItem } from "@/lib/dashboard-queue";
import { deriveAttentionQueue, deriveTopChanges } from "@/lib/dashboard-queue";

/* ── Constants ────────────────────────────────────────────── */

export const AGENT_SCHEMA_VERSION = "1.1.0";
export const POLLING_INTERVAL_SECONDS = 5;

/* ── Shared envelope types ────────────────────────────────── */

export type AgentFreshnessMeta = {
  freshness: SignalFreshness;
  provenance: SignalProvenance;
  provenance_label: string;
  generated_at: string;
  polling_interval_seconds: number;
};

export type AgentCapabilityBoundary = {
  available: boolean;
  reason: string;
};

/* ── Automation decision helpers ───────────────────────────── */

/**
 * Top-level boolean decision helpers for bot consumption.
 * These are deterministically derived from the same grounded data
 * that produces the rest of the snapshot. Bots should prefer
 * these over parsing display strings.
 */
export type AgentDashboardAutomation = {
  /** True when summary.priority_level is "attention" or "critical". */
  requires_review: boolean;
  /** True when all signals are normal/informational and queue is empty. */
  is_idle: boolean;
  /** True when health panel_status is "degraded" or "reduced". */
  is_degraded: boolean;
  /** True when health panel_status is "offline". */
  is_offline: boolean;
  /** True when enforcement total > 0 in current interval. */
  has_enforcement_activity: boolean;
  /** True when requests_last_hour > 0 in trend counters. */
  has_recent_activity: boolean;
  /** True when any attention_queue item is "attention" or "critical". */
  has_persistent_warning: boolean;
};

/** Tenant-level automation decision helpers for bot consumption. */
export type AgentTenantAutomation = {
  /** True when operator_summary.priority_level is "attention" or "critical". */
  requires_review: boolean;
  /** True when tenant status is "suspended". */
  is_suspended: boolean;
  /** True when any quota entry shows pressure_pct >= 80. */
  has_quota_pressure: boolean;
  /** True when posture has any warnings. */
  has_posture_warnings: boolean;
  /** True when enforcement events > 0 in 24h. */
  has_enforcement_activity: boolean;
  /** True when requests == 0 in 24h. */
  is_idle: boolean;
};

/* ── Signal shape used across summary and tenant endpoints ── */

export type AgentSignal = {
  label: string;
  value: string;
  level: AttentionLevel;
  hint?: string;
  delta?: { direction: TrendDirection; label: string };
  evidence?: string;
};

/* ── Queue / change item serialization ────────────────────── */

export type AgentQueueItem = QueueItem;
export type AgentChangeItem = ChangeItem;

/* ── Dashboard snapshot shape ─────────────────────────────── */

export type AgentDashboardSnapshot = {
  schema_version: string;
  generated_at: string;
  polling_interval_seconds: number;
  freshness: AgentFreshnessMeta;
  summary: {
    priority_level: AttentionLevel;
    priority_label: string;
    signals: AgentSignal[];
  };
  attention_queue: AgentQueueItem[];
  top_changes: AgentChangeItem[];
  health: {
    status: string;
    panel_status: PanelStatus;
    checks_total: number;
    checks_passing: number;
    checks_warning: number;
    checks_failing: number;
    version: string;
    uptime_seconds: number;
    freshness: AgentFreshnessMeta;
  } | AgentCapabilityBoundary;
  enforcement: {
    total: number;
    intensity: EnforcementIntensity;
    intensity_label: string;
    panel_status: PanelStatus;
    categories: Record<string, number>;
    freshness: AgentFreshnessMeta;
  } | AgentCapabilityBoundary;
  trends: {
    request_pace: TrendDirection;
    request_pace_label: string;
    enforcement_presence: TrendDirection;
    enforcement_presence_label: string;
    receipt_pace: TrendDirection;
    receipt_pace_label: string;
    counters: {
      requests_last_hour: number;
      requests_today: number;
      receipts_written_last_hour: number;
      receipts_written_today: number;
      enforcement_last_hour: number;
    };
    freshness: AgentFreshnessMeta;
  } | AgentCapabilityBoundary;
  kpis: LiveKpiItem[] | AgentCapabilityBoundary;
  tenants_overview: {
    total: number;
    active: number;
    inactive: number;
    suspended: number;
    with_enforcement: number;
    requires_review: string[];
    freshness: AgentFreshnessMeta;
  } | AgentCapabilityBoundary;
  /** Deterministic boolean decision helpers for bot consumption. */
  automation: AgentDashboardAutomation;
};

/* ── Tenant detail snapshot shape ─────────────────────────── */

export type AgentTenantSnapshot = {
  schema_version: string;
  generated_at: string;
  polling_interval_seconds: number;
  freshness: AgentFreshnessMeta;
  tenant: {
    id: string;
    name: string;
    status: string;
    plan_tier: string;
    created_at: string;
    last_seen: string | null;
    key_count: number;
    recency: string;
    recency_label: string;
  };
  operator_summary: {
    priority_level: AttentionLevel;
    priority_label: string;
    signals: AgentSignal[];
  };
  usage: {
    period_24h: {
      requests: number;
      enforcements: number;
      blocks: number;
      avg_latency_ms: number;
    };
    period_7d: {
      requests: number;
      enforcements: number;
      blocks: number;
      avg_latency_ms: number;
    };
    request_delta: TrendDirection;
    request_delta_label: string;
    enforcement_delta: TrendDirection;
    enforcement_delta_label: string;
  };
  quotas: {
    entries: Array<{
      key: string;
      effective: number;
      source: string;
      default_value: number;
      pressure_pct: number | null;
    }>;
    any_pressure: boolean;
  };
  posture: {
    score: number;
    label: string;
    panel_status: PanelStatus;
    warnings: Array<{
      code: string;
      severity: string;
      message: string;
      since: string | null;
    }>;
    critical_count: number;
    warn_count: number;
    evidence?: string;
  };
  metadata: Record<string, string> | null;
  /** Deterministic boolean decision helpers for bot consumption. */
  automation: AgentTenantAutomation;
};

/* ── Helpers ──────────────────────────────────────────────── */

const PRIORITY_LABELS: Record<AttentionLevel, string> = {
  critical: "Action Required",
  attention: "Review Recommended",
  informational: "Informational",
  normal: "All Clear",
};

const LEVEL_ORDER: Record<AttentionLevel, number> = {
  critical: 0,
  attention: 1,
  informational: 2,
  normal: 3,
};

function now(): string {
  return new Date().toISOString();
}

function makeFreshness(
  provenance: SignalProvenance,
  ageSeconds = 0,
): AgentFreshnessMeta {
  return {
    freshness: classifyFreshness(ageSeconds),
    provenance,
    provenance_label: provenanceLabel[provenance],
    generated_at: now(),
    polling_interval_seconds: POLLING_INTERVAL_SECONDS,
  };
}

function capabilityBoundary(reason: string): AgentCapabilityBoundary {
  return { available: false, reason };
}

/* ── Operator summary signal derivation (shared with UI) ──── */

function deriveOperatorSignals(
  health: DashboardResult<SystemHealth>,
  enforcement: DashboardResult<LiveEnforcement>,
  trend: DashboardResult<LiveTrend> | undefined,
  tenants: DashboardResult<TenantsResponse>,
): AgentSignal[] {
  const signals: AgentSignal[] = [];
  const trendSummary = trend?.ok ? deriveTrendSummary(trend.data) : null;

  /* System state */
  if (health.ok) {
    const warnCount = health.data.checks.filter((c) => c.status === "warn").length;
    const failCount = health.data.checks.filter((c) => c.status === "fail").length;
    if (failCount > 0) {
      signals.push({
        label: "System", value: `${failCount} backing ${failCount === 1 ? "service" : "services"} failing`,
        level: "critical", hint: "Review backend connectivity",
        evidence: `${failCount} fail, ${warnCount} warn of ${health.data.checks.length} checks`,
      });
    } else if (warnCount > 0) {
      signals.push({
        label: "System", value: `Core path stable, ${warnCount} optional ${warnCount === 1 ? "backend" : "backends"} reduced`,
        level: "informational", hint: "Non-blocking, reduced mode",
        evidence: `${health.data.checks.length - warnCount} of ${health.data.checks.length} checks passing`,
      });
    } else if (health.data.status === "healthy") {
      signals.push({
        label: "System", value: "All services operational", level: "normal",
        evidence: `${health.data.checks.length} of ${health.data.checks.length} checks passing`,
      });
    } else {
      signals.push({
        label: "System",
        value: health.data.status === "degraded" ? "Operating in reduced mode" : "Service offline",
        level: health.data.status === "degraded" ? "attention" : "critical",
        hint: health.data.status === "degraded" ? "Persistence backends not connected" : "Immediate review required",
        evidence: `status: ${health.data.status} \u00b7 ${health.data.checks.length} checks evaluated`,
      });
    }
  } else {
    signals.push({ label: "System", value: "Health data unavailable", level: "informational", hint: "Endpoint not reachable" });
  }

  /* Enforcement pressure */
  if (enforcement.ok) {
    const e = enforcement.data;
    const total = e.auth_failures_total + e.rate_limit_rejections_total + e.quota_violations_total + e.reprovision_operations_total;
    const categories = [
      { key: "auth_failures_total" as const, label: "auth failures" },
      { key: "rate_limit_rejections_total" as const, label: "rate limiting" },
      { key: "quota_violations_total" as const, label: "quota violations" },
      { key: "reprovision_operations_total" as const, label: "reprovisions" },
    ];
    const activeCategories = categories.filter((c) => e[c.key] > 0).length;
    const intensity = classifyEnforcementIntensity(total, activeCategories);
    const authPct = total > 0 ? e.auth_failures_total / total : 0;

    if (total === 0) {
      signals.push({ label: "Enforcement", value: "No enforcement activity in current interval", level: "normal", hint: "All traffic within policy bounds" });
    } else {
      const dominant = categories.reduce((a, b) => e[a.key] >= e[b.key] ? a : b);
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
      const suffix = activeCategories === 1 ? `${dominant.label} only` : `${dominant.label} dominant`;
      const enfDelta = trendSummary ? { direction: trendSummary.enforcementPresence, label: trendDeltaLabel[trendSummary.enforcementPresence] } : undefined;
      const evidenceParts = categories.filter((c) => e[c.key] > 0).map((c) => `${c.label}: ${e[c.key]}`);
      evidenceParts.push("current interval");
      signals.push({
        label: "Enforcement", value: `${total} total, ${suffix}`, level, hint,
        delta: enfDelta?.label ? enfDelta : undefined,
        evidence: evidenceParts.join(" \u00b7 "),
      });
    }
  } else {
    signals.push({ label: "Enforcement", value: "Enforcement data unavailable", level: "informational", hint: "Endpoint not reachable" });
  }

  /* Receipt flow */
  if (trend?.ok) {
    const t = trend.data;
    const receiptDelta = trendSummary ? { direction: trendSummary.receiptPace, label: trendDeltaLabel[trendSummary.receiptPace] } : undefined;
    if (t.receipts_written_last_hour > 0) {
      signals.push({
        label: "Receipts", value: `${t.receipts_written_last_hour} written in current hour`, level: "normal",
        hint: "Receipt throughput active",
        delta: receiptDelta?.label ? receiptDelta : undefined,
        evidence: `${t.receipts_written_last_hour} last hour \u00b7 ${t.receipts_written_today} today`,
      });
    } else if (t.receipts_written_today > 0) {
      signals.push({ label: "Receipts", value: "Idle in current hour, active earlier today", level: "informational", hint: "No recent receipt activity", evidence: `0 last hour \u00b7 ${t.receipts_written_today} today` });
    } else {
      signals.push({ label: "Receipts", value: "No receipt activity in current interval", level: "informational", hint: "Signal idle in current interval", evidence: "0 receipts in current hour" });
    }
  }

  /* Tenant attention */
  if (tenants.ok) {
    const ts = tenants.data.tenants;
    const total = tenants.data.total;
    const activeCount = ts.filter((t) => t.status === "active").length;
    const suspendedCount = ts.filter((t) => t.status === "suspended").length;
    const withEnforcement = ts.filter((t) => t.enforcements_24h > 0).length;
    const recentlyActive = ts.filter(
      (t) => t.last_seen && (Date.now() - new Date(t.last_seen).getTime()) < 3_600_000,
    ).length;
    let tenantDelta: AgentSignal["delta"] | undefined;
    if (withEnforcement > 0 && recentlyActive > 0) {
      tenantDelta = { direction: "persistent", label: "Active enforcement in current interval" };
    } else if (withEnforcement > 0 && recentlyActive === 0) {
      tenantDelta = { direction: "unchanged", label: "Enforcement recorded, no recent requests" };
    }
    if (suspendedCount > 0) {
      signals.push({
        label: "Tenants", value: `${total} registered, ${suspendedCount} suspended`, level: "attention",
        hint: "Suspended tenants require review", delta: tenantDelta,
        evidence: `${suspendedCount} suspended \u00b7 ${withEnforcement} with enforcement \u00b7 ${recentlyActive} seen last hour`,
      });
    } else if (withEnforcement > 0) {
      signals.push({
        label: "Tenants", value: `${activeCount} active, ${withEnforcement} with enforcement events`, level: "informational",
        hint: "Enforcement activity recorded", delta: tenantDelta,
        evidence: `${withEnforcement} with enforcement \u00b7 ${recentlyActive} seen last hour`,
      });
    } else {
      signals.push({ label: "Tenants", value: `${activeCount} active of ${total} registered`, level: "normal", evidence: `${recentlyActive} seen last hour \u00b7 0 enforcement events` });
    }
  }

  return signals.sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level]);
}

/* ── Tenant-level signal derivation (shared with UI) ──────── */

function deriveTenantSignals(tenant: TenantDetail): AgentSignal[] {
  const signals: AgentSignal[] = [];

  /* Operational state */
  if (tenant.status === "suspended") {
    signals.push({ label: "State", value: "Suspended", level: "critical", hint: "Review suspension cause", evidence: `status: suspended \u00b7 ${tenant.usage_24h.enforcements > 0 ? `${tenant.usage_24h.enforcements} enforcement events` : "no recent enforcement"}` });
  } else if (tenant.status === "inactive") {
    signals.push({ label: "State", value: "Inactive", level: "informational", hint: "No recent activity recorded", evidence: `${tenant.usage_24h.requests} requests in 24h \u00b7 status: inactive` });
  } else {
    const recency = classifyRecency(tenant.last_activity_ts ?? tenant.last_seen);
    if (recency === "current" || recency === "recent") {
      signals.push({ label: "State", value: "Active", level: "normal", hint: recencyLabel(tenant.last_activity_ts ?? tenant.last_seen) });
    } else if (recency === "stale") {
      signals.push({ label: "State", value: "Active, no recent requests", level: "informational", hint: recencyLabel(tenant.last_activity_ts ?? tenant.last_seen) });
    } else {
      signals.push({ label: "State", value: "Active, idle", level: "informational", hint: "No activity detected" });
    }
  }

  /* Activity level */
  const reqDelta = deriveUsageDelta(tenant.usage_24h.requests, tenant.usage_7d.requests);
  if (tenant.usage_24h.requests === 0) {
    signals.push({ label: "Activity", value: "No request activity in 24h window", level: "informational", evidence: "0 requests \u00b7 0 enforcements in 24h" });
  } else {
    const activityLabels: Partial<Record<TrendDirection, string>> = {
      increasing: "Elevated request activity vs baseline", decreasing: "Reduced request activity vs baseline",
      unchanged: "Request activity at baseline level", "newly-active": "New request activity in current window",
    };
    const label = activityLabels[reqDelta] ?? "Request activity recorded";
    const level: AttentionLevel = reqDelta === "increasing" ? "informational" : "normal";
    signals.push({
      label: "Activity", value: label, level,
      delta: reqDelta !== "unchanged" && reqDelta !== "unavailable" ? { direction: reqDelta, label: `${tenant.usage_24h.requests} requests in 24h` } : undefined,
      evidence: `${tenant.usage_24h.requests} requests 24h \u00b7 ${tenant.usage_7d.requests} requests 7d`,
    });
  }

  /* Enforcement presence */
  if (tenant.usage_24h.enforcements > 0) {
    const enfDelta = deriveUsageDelta(tenant.usage_24h.enforcements, tenant.usage_7d.enforcements);
    const isElevated = enfDelta === "increasing" || tenant.usage_24h.enforcements > 50;
    signals.push({
      label: "Enforcement", value: `${tenant.usage_24h.enforcements} enforcement events in 24h`,
      level: isElevated ? "attention" : "informational",
      hint: isElevated ? "Review policy pressure" : "Enforcement activity recorded",
      delta: enfDelta !== "unchanged" && enfDelta !== "unavailable" ? { direction: enfDelta, label: enfDelta === "increasing" ? "Up vs baseline" : enfDelta === "decreasing" ? "Down vs baseline" : "New" } : undefined,
      evidence: `${tenant.usage_24h.enforcements} enforcements 24h \u00b7 ${tenant.usage_7d.enforcements} enforcements 7d`,
    });
  } else {
    signals.push({ label: "Enforcement", value: "No enforcement activity recorded", level: "normal" });
  }

  /* Posture */
  const { score, warnings } = tenant.posture_summary;
  const criticalWarnings = warnings.filter((w) => w.severity === "critical").length;
  const warnCount = warnings.filter((w) => w.severity === "warn").length;
  if (criticalWarnings > 0) {
    signals.push({ label: "Posture", value: `Score ${score}, ${criticalWarnings} critical ${criticalWarnings === 1 ? "warning" : "warnings"}`, level: "critical", hint: "Immediate review recommended", evidence: `score ${score} \u00b7 ${criticalWarnings} critical, ${warnCount} warn of ${warnings.length} total` });
  } else if (warnCount > 0) {
    signals.push({ label: "Posture", value: `Score ${score}, ${warnCount} ${warnCount === 1 ? "warning" : "warnings"} recorded`, level: "attention", hint: "Review posture warnings", evidence: `score ${score} \u00b7 ${warnCount} warning${warnCount !== 1 ? "s" : ""} of ${warnings.length} total` });
  } else if (score < 60) {
    signals.push({ label: "Posture", value: `Score ${score}, needs attention`, level: "attention", hint: "Low posture score without explicit warnings", evidence: `score ${score} \u00b7 0 warnings \u00b7 threshold: 60` });
  } else {
    signals.push({ label: "Posture", value: `Score ${score}, no warnings`, level: "normal" });
  }

  return signals.sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level]);
}

/* ── Automation derivation helpers ─────────────────────────── */

function deriveDashboardAutomation(
  topLevel: AttentionLevel,
  queue: AgentQueueItem[],
  health: AgentDashboardSnapshot["health"],
  enforcement: AgentDashboardSnapshot["enforcement"],
  trends: AgentDashboardSnapshot["trends"],
): AgentDashboardAutomation {
  const healthPanelStatus = !("available" in health) ? health.panel_status : null;
  const enfTotal = !("available" in enforcement) ? enforcement.total : 0;
  const reqLastHour = !("available" in trends) ? trends.counters.requests_last_hour : 0;

  return {
    requires_review: topLevel === "attention" || topLevel === "critical",
    is_idle:
      (topLevel === "normal" || topLevel === "informational") &&
      queue.length === 0,
    is_degraded:
      healthPanelStatus === "degraded" || healthPanelStatus === "reduced",
    is_offline: healthPanelStatus === "offline",
    has_enforcement_activity: enfTotal > 0,
    has_recent_activity: reqLastHour > 0,
    has_persistent_warning: queue.some(
      (q) => q.level === "attention" || q.level === "critical",
    ),
  };
}

/* ── Main dashboard snapshot serializer ───────────────────── */

export function serializeDashboardSnapshot(bundle: {
  health: DashboardResult<SystemHealth>;
  kpis: DashboardResult<LiveKpiItem[]>;
  enforcement: DashboardResult<LiveEnforcement>;
  tenants: DashboardResult<TenantsResponse>;
  summary: DashboardResult<DashboardSummary>;
  trend: DashboardResult<LiveTrend>;
}): AgentDashboardSnapshot {
  const ts = now();

  /* Derive operator signals */
  const signals = deriveOperatorSignals(bundle.health, bundle.enforcement, bundle.trend, bundle.tenants);
  const topLevel: AttentionLevel = signals[0]?.level ?? "normal";

  /* Derive queue and changes */
  const queue = deriveAttentionQueue(bundle.health, bundle.enforcement, bundle.trend, bundle.tenants);
  const changes = deriveTopChanges(bundle.health, bundle.enforcement, bundle.trend, bundle.tenants);

  /* Health section */
  const healthSection = bundle.health.ok
    ? (() => {
        const h = bundle.health.data;
        const failCount = h.checks.filter((c) => c.status === "fail").length;
        const warnCount = h.checks.filter((c) => c.status === "warn").length;
        const passCount = h.checks.filter((c) => c.status === "pass").length;
        return {
          status: h.status,
          panel_status: deriveHealthPanelStatus(h.status, warnCount, failCount),
          checks_total: h.checks.length,
          checks_passing: passCount,
          checks_warning: warnCount,
          checks_failing: failCount,
          version: h.version,
          uptime_seconds: h.uptime_seconds,
          freshness: makeFreshness("derived"),
        };
      })()
    : capabilityBoundary(bundle.health.error);

  /* Enforcement section */
  const enforcementSection = bundle.enforcement.ok
    ? (() => {
        const e = bundle.enforcement.data;
        const total = e.auth_failures_total + e.rate_limit_rejections_total + e.quota_violations_total + e.reprovision_operations_total;
        const cats = [
          { key: "auth_failures_total" as const },
          { key: "rate_limit_rejections_total" as const },
          { key: "quota_violations_total" as const },
          { key: "reprovision_operations_total" as const },
        ];
        const activeCount = cats.filter((c) => e[c.key] > 0).length;
        const intensity = classifyEnforcementIntensity(total, activeCount);
        const authPct = total > 0 ? e.auth_failures_total / total : 0;
        return {
          total,
          intensity,
          intensity_label: intensityLabel[intensity],
          panel_status: deriveEnforcementPanelStatus(total, authPct),
          categories: {
            auth_failures: e.auth_failures_total,
            rate_limit_rejections: e.rate_limit_rejections_total,
            quota_violations: e.quota_violations_total,
            reprovision_operations: e.reprovision_operations_total,
          },
          freshness: makeFreshness("direct"),
        };
      })()
    : capabilityBoundary(bundle.enforcement.error);

  /* Trends section */
  const trendsSection = bundle.trend.ok
    ? (() => {
        const t = bundle.trend.data;
        const summary = deriveTrendSummary(t);
        return {
          request_pace: summary.requestPace,
          request_pace_label: trendLabel[summary.requestPace],
          enforcement_presence: summary.enforcementPresence,
          enforcement_presence_label: trendLabel[summary.enforcementPresence],
          receipt_pace: summary.receiptPace,
          receipt_pace_label: trendLabel[summary.receiptPace],
          counters: {
            requests_last_hour: t.requests_last_hour,
            requests_today: t.requests_today,
            receipts_written_last_hour: t.receipts_written_last_hour,
            receipts_written_today: t.receipts_written_today,
            enforcement_last_hour: t.enforcement_last_hour,
          },
          freshness: makeFreshness("direct"),
        };
      })()
    : capabilityBoundary(bundle.trend.error);

  /* KPIs section */
  const kpisSection = bundle.kpis.ok
    ? bundle.kpis.data
    : capabilityBoundary(bundle.kpis.error);

  /* Tenants overview */
  const tenantsSection = bundle.tenants.ok
    ? (() => {
        const ts = bundle.tenants.data.tenants;
        const active = ts.filter((t) => t.status === "active").length;
        const inactive = ts.filter((t) => t.status === "inactive").length;
        const suspended = ts.filter((t) => t.status === "suspended").length;
        const withEnf = ts.filter((t) => t.enforcements_24h > 0).length;
        const reviewIds = ts
          .filter((t) => {
            const signal = deriveTenantAttentionReason(t);
            return signal && (signal.level === "critical" || signal.level === "attention");
          })
          .map((t) => t.id);
        return {
          total: bundle.tenants.data.total,
          active,
          inactive,
          suspended,
          with_enforcement: withEnf,
          requires_review: reviewIds,
          freshness: makeFreshness("derived"),
        };
      })()
    : capabilityBoundary(bundle.tenants.error);

  return {
    schema_version: AGENT_SCHEMA_VERSION,
    generated_at: ts,
    polling_interval_seconds: POLLING_INTERVAL_SECONDS,
    freshness: makeFreshness("derived"),
    summary: {
      priority_level: topLevel,
      priority_label: PRIORITY_LABELS[topLevel],
      signals,
    },
    attention_queue: queue,
    top_changes: changes,
    health: healthSection,
    enforcement: enforcementSection,
    trends: trendsSection,
    kpis: kpisSection,
    tenants_overview: tenantsSection,
    automation: deriveDashboardAutomation(topLevel, queue, healthSection, enforcementSection, trendsSection),
  };
}

/* ── Tenant detail serializer ─────────────────────────────── */

export function serializeTenantSnapshot(
  tenant: TenantDetail,
): AgentTenantSnapshot {
  const signals = deriveTenantSignals(tenant);
  const topLevel: AttentionLevel = signals[0]?.level ?? "normal";

  const reqDelta = deriveUsageDelta(tenant.usage_24h.requests, tenant.usage_7d.requests);
  const enfDelta = deriveUsageDelta(tenant.usage_24h.enforcements, tenant.usage_7d.enforcements);

  /* Quota pressure: percentage of effective quota used (based on 24h requests). */
  const quotaEntries = tenant.quotas.map((q) => {
    const pressure = q.effective > 0
      ? Math.round((tenant.usage_24h.requests / q.effective) * 100)
      : null;
    return { key: q.key, effective: q.effective, source: q.source, default_value: q.default_value, pressure_pct: pressure };
  });

  /* Posture derivation */
  const { score, label: postureLabel, warnings } = tenant.posture_summary;
  const criticalCount = warnings.filter((w) => w.severity === "critical").length;
  const warnCount = warnings.filter((w) => w.severity === "warn").length;
  let postureStatus: PanelStatus;
  let postureEvidence: string | undefined;
  if (criticalCount > 0) {
    postureStatus = "degraded";
    postureEvidence = `score ${score} \u00b7 ${criticalCount} critical, ${warnCount} warn of ${warnings.length} total`;
  } else if (warnCount > 0) {
    postureStatus = "review";
    postureEvidence = `score ${score} \u00b7 ${warnCount} warn of ${warnings.length} total`;
  } else if (score < 60) {
    postureStatus = "review";
    postureEvidence = `score ${score} \u00b7 0 warnings \u00b7 threshold: 60`;
  } else {
    postureStatus = "stable";
  }

  const recency = classifyRecency(tenant.last_activity_ts ?? tenant.last_seen);

  return {
    schema_version: AGENT_SCHEMA_VERSION,
    generated_at: now(),
    polling_interval_seconds: POLLING_INTERVAL_SECONDS,
    freshness: makeFreshness("derived"),
    tenant: {
      id: tenant.id,
      name: tenant.name,
      status: tenant.status,
      plan_tier: tenant.plan_tier,
      created_at: tenant.created_at,
      last_seen: tenant.last_seen,
      key_count: tenant.key_count,
      recency,
      recency_label: recencyLabel(tenant.last_activity_ts ?? tenant.last_seen),
    },
    operator_summary: {
      priority_level: topLevel,
      priority_label: PRIORITY_LABELS[topLevel],
      signals,
    },
    usage: {
      period_24h: {
        requests: tenant.usage_24h.requests,
        enforcements: tenant.usage_24h.enforcements,
        blocks: tenant.usage_24h.blocks,
        avg_latency_ms: tenant.usage_24h.avg_latency_ms,
      },
      period_7d: {
        requests: tenant.usage_7d.requests,
        enforcements: tenant.usage_7d.enforcements,
        blocks: tenant.usage_7d.blocks,
        avg_latency_ms: tenant.usage_7d.avg_latency_ms,
      },
      request_delta: reqDelta,
      request_delta_label: trendDeltaLabel[reqDelta],
      enforcement_delta: enfDelta,
      enforcement_delta_label: trendDeltaLabel[enfDelta],
    },
    quotas: {
      entries: quotaEntries,
      any_pressure: quotaEntries.some((q) => q.pressure_pct !== null && q.pressure_pct >= 80),
    },
    posture: {
      score,
      label: postureLabel,
      panel_status: postureStatus,
      warnings: warnings.map((w) => ({
        code: w.code,
        severity: w.severity,
        message: w.message,
        since: w.since,
      })),
      critical_count: criticalCount,
      warn_count: warnCount,
      evidence: postureEvidence,
    },
    metadata: tenant.metadata ?? null,
    automation: {
      requires_review: topLevel === "attention" || topLevel === "critical",
      is_suspended: tenant.status === "suspended",
      has_quota_pressure: quotaEntries.some((q) => q.pressure_pct !== null && q.pressure_pct >= 80),
      has_posture_warnings: warnings.length > 0,
      has_enforcement_activity: tenant.usage_24h.enforcements > 0,
      is_idle: tenant.usage_24h.requests === 0,
    },
  };
}
