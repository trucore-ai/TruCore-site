/* ────────────────────────────────────────────────────────────────
 *  Dashboard Queue - page-level prioritization and change detection
 *
 *  Derives two compact ranked outputs from existing grounded data:
 *
 *  1. Attention Queue: the highest-priority actionable items ranked
 *     so the operator can identify the next inspection target fast.
 *
 *  2. Top Changes: the most meaningful directional changes in the
 *     current interval, summarized for quick scanning.
 *
 *  All derivations use existing attention + trend utilities and
 *  only reference grounded data: timestamps, counters, status
 *  fields, health checks, tenant records, and deterministic rules.
 *  No external APIs. No fabricated metrics.
 * ──────────────────────────────────────────────────────────── */

import type {
  SystemHealth,
  LiveEnforcement,
  LiveTrend,
  TenantsResponse,
  DashboardResult,
} from "@/lib/dashboard-client";
import type { AttentionLevel } from "@/lib/attention";
import {
  classifyEnforcementIntensity,
  classifyRecency,
} from "@/lib/attention";
import type { TrendDirection } from "@/lib/trend";
import {
  deriveTrendSummary,
  trendDeltaLabel,
} from "@/lib/trend";

/* ── Attention Queue ──────────────────────────────────────── */

export type QueueItem = {
  title: string;
  reason: string;
  level: AttentionLevel;
  /** Optional recency or trend note. */
  note?: string;
  /** Compact supporting evidence for the queue ranking. */
  basis?: string;
  /** Suggested dashboard section to inspect. */
  target?: "health" | "enforcement" | "tenants" | "activity";
};

/** Priority ordering for queue items. Lower = higher priority. */
const LEVEL_ORDER: Record<AttentionLevel, number> = {
  critical: 0,
  attention: 1,
  informational: 2,
  normal: 3,
};

/**
 * Derive a compact ranked attention queue from current dashboard data.
 * Returns up to `limit` items sorted by priority (critical first).
 */
export function deriveAttentionQueue(
  health: DashboardResult<SystemHealth>,
  enforcement: DashboardResult<LiveEnforcement>,
  trend: DashboardResult<LiveTrend> | undefined,
  tenants: DashboardResult<TenantsResponse>,
  limit = 5,
): QueueItem[] {
  const items: QueueItem[] = [];

  /* ── Health conditions ──────────────────────────────────── */
  if (health.ok) {
    const failCount = health.data.checks.filter(
      (c) => c.status === "fail",
    ).length;
    const warnCount = health.data.checks.filter(
      (c) => c.status === "warn",
    ).length;

    if (health.data.status === "down") {
      items.push({
        title: "Service reporting down",
        reason: "Immediate review required",
        level: "critical",
        basis: `status: down \u00b7 ${health.data.checks.length} checks evaluated`,
        target: "health",
      });
    } else if (failCount > 0) {
      items.push({
        title: `${failCount} backing ${failCount === 1 ? "service" : "services"} failing`,
        reason: "Review backend connectivity",
        level: "critical",
        basis: `${failCount} fail, ${warnCount} warn of ${health.data.checks.length} checks`,
        target: "health",
      });
    } else if (health.data.status === "degraded") {
      items.push({
        title: "Persistence backends degraded",
        reason: "Core path stable, reduced mode active",
        level: "attention",
        basis: `optional backends reduced \u00b7 core path stable`,
        target: "health",
      });
    } else if (warnCount > 0) {
      items.push({
        title: `${warnCount} optional ${warnCount === 1 ? "backend" : "backends"} warning`,
        reason: "Non-blocking, reduced mode",
        level: "informational",
        basis: `${health.data.checks.length - warnCount} of ${health.data.checks.length} checks passing`,
        target: "health",
      });
    }
  } else {
    items.push({
      title: "Health data unavailable",
      reason: "Endpoint not reachable",
      level: "informational",
      basis: "health endpoint returned no data",
      target: "health",
    });
  }

  /* ── Enforcement conditions ─────────────────────────────── */
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
    const authPct = total > 0 ? e.auth_failures_total / total : 0;

    if (intensity === "concentrated" || (authPct >= 0.5 && total > 50)) {
      const dominant = categories.reduce((a, b) =>
        e[a.key] >= e[b.key] ? a : b,
      );
      const basisParts = categories
        .filter((c) => e[c.key] > 0)
        .map((c) => `${e[c.key].toLocaleString()} ${c.label}`);
      items.push({
        title: `Enforcement concentrated in ${dominant.label}`,
        reason: authPct >= 0.5
          ? "Review API key validity"
          : "Review enforcement distribution",
        level: "attention",
        note: `${total.toLocaleString()} total events`,
        basis: basisParts.join(" \u00b7 "),
        target: "enforcement",
      });
    } else if (intensity === "elevated") {
      const basisParts = categories
        .filter((c) => e[c.key] > 0)
        .map((c) => `${e[c.key].toLocaleString()} ${c.label}`);
      items.push({
        title: "Elevated enforcement activity",
        reason: "Warrants review, non-blocking",
        level: "informational",
        note: `${total.toLocaleString()} total events`,
        basis: basisParts.join(" \u00b7 "),
        target: "enforcement",
      });
    }
  }

  /* ── Tenant conditions ──────────────────────────────────── */
  if (tenants.ok) {
    const ts = tenants.data.tenants;
    const suspended = ts.filter((t) => t.status === "suspended");
    const withHighEnf = ts.filter((t) => t.enforcements_24h > 50);
    const withEnf = ts.filter((t) => t.enforcements_24h > 0);

    for (const t of suspended) {
      const recency = classifyRecency(t.last_seen);
      items.push({
        title: `Tenant "${t.name}" suspended`,
        reason: "Review suspension cause",
        level: "critical",
        note: recency === "idle" ? "No recent activity" : undefined,
        basis: `suspended tenant \u00b7 ${t.enforcements_24h > 0 ? `${t.enforcements_24h} enforcement events` : "no recent enforcement"}`,
        target: "tenants",
      });
    }

    for (const t of withHighEnf) {
      if (t.status === "suspended") continue; // Already surfaced
      items.push({
        title: `Tenant "${t.name}" high enforcement volume`,
        reason: `${t.enforcements_24h} enforcement events in 24h`,
        level: "attention",
        basis: `${t.enforcements_24h} enforcements \u00b7 ${t.requests_24h.toLocaleString()} requests in 24h`,
        target: "tenants",
      });
    }

    /* Only note general enforcement presence if not already covered above. */
    const uncoveredEnf = withEnf.filter(
      (t) => t.status !== "suspended" && t.enforcements_24h <= 50,
    );
    if (uncoveredEnf.length > 2) {
      items.push({
        title: `${uncoveredEnf.length} tenants with enforcement events`,
        reason: "Review individual tenant posture",
        level: "informational",
        basis: `${uncoveredEnf.length} tenants \u00b7 background-level enforcement`,
        target: "tenants",
      });
    }
  }

  /* ── Receipt flow idle ──────────────────────────────────── */
  if (trend?.ok) {
    const t = trend.data;
    if (
      t.receipts_written_last_hour === 0 &&
      t.receipts_written_today === 0 &&
      t.requests_today > 0
    ) {
      items.push({
        title: "No receipts written, requests active",
        reason: "Receipt pipeline may require review",
        level: "attention",
        basis: `${t.requests_today.toLocaleString()} requests today \u00b7 0 receipts`,
        target: "activity",
      });
    }
  }

  /* ── Sort by priority and return ────────────────────────── */
  items.sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level]);
  return items.slice(0, limit);
}

/* ── Top Changes ──────────────────────────────────────────── */

export type ChangeItem = {
  title: string;
  direction: TrendDirection;
  detail: string;
  /** Suggested dashboard section for context. */
  target?: "health" | "enforcement" | "tenants" | "activity";
};

/**
 * Derive the most meaningful directional changes in the current
 * interval. Returns up to `limit` items, filtering out
 * "unchanged" and "unavailable" to keep the list concise.
 */
export function deriveTopChanges(
  health: DashboardResult<SystemHealth>,
  enforcement: DashboardResult<LiveEnforcement>,
  trend: DashboardResult<LiveTrend> | undefined,
  tenants: DashboardResult<TenantsResponse>,
  limit = 4,
): ChangeItem[] {
  const items: ChangeItem[] = [];

  /* ── Trend-based changes ────────────────────────────────── */
  if (trend?.ok) {
    const summary = deriveTrendSummary(trend.data);

    if (
      summary.requestPace !== "unchanged" &&
      summary.requestPace !== "unavailable"
    ) {
      items.push({
        title: "Request pace",
        direction: summary.requestPace,
        detail: trendDeltaLabel[summary.requestPace] + " vs daily average",
        target: "activity",
      });
    }

    if (
      summary.enforcementPresence !== "unchanged" &&
      summary.enforcementPresence !== "unavailable"
    ) {
      items.push({
        title: "Enforcement activity",
        direction: summary.enforcementPresence,
        detail: trendDeltaLabel[summary.enforcementPresence] + " in current interval",
        target: "enforcement",
      });
    }

    if (
      summary.receiptPace !== "unchanged" &&
      summary.receiptPace !== "unavailable"
    ) {
      items.push({
        title: "Receipt throughput",
        direction: summary.receiptPace,
        detail: trendDeltaLabel[summary.receiptPace] + " vs daily average",
        target: "activity",
      });
    }

    /* Receipt flow idle with ongoing requests. */
    if (
      trend.data.receipts_written_last_hour === 0 &&
      trend.data.receipts_written_today > 0
    ) {
      items.push({
        title: "Receipts idle in current hour",
        direction: "decreasing",
        detail: "Active earlier today, idle in current hour",
        target: "activity",
      });
    }
  }

  /* ── Health degradation persistence ─────────────────────── */
  if (health.ok) {
    const failCount = health.data.checks.filter(
      (c) => c.status === "fail",
    ).length;
    const warnCount = health.data.checks.filter(
      (c) => c.status === "warn",
    ).length;

    if (failCount > 0) {
      items.push({
        title: "Backend failures present",
        direction: "persistent",
        detail: `${failCount} ${failCount === 1 ? "check" : "checks"} failing`,
        target: "health",
      });
    } else if (warnCount > 0 && health.data.status === "healthy") {
      items.push({
        title: "Optional backends degraded",
        direction: "persistent",
        detail: "Core path stable, reduced mode",
        target: "health",
      });
    }
  }

  /* ── Tenant activity patterns ───────────────────────────── */
  if (tenants.ok) {
    const ts = tenants.data.tenants;
    const recentlyActive = ts.filter(
      (t) =>
        t.last_seen &&
        Date.now() - new Date(t.last_seen).getTime() < 3_600_000,
    );
    const totalActive = ts.filter((t) => t.status === "active").length;

    if (recentlyActive.length > 0 && totalActive > recentlyActive.length) {
      items.push({
        title: "Tenant activity",
        direction: "persistent",
        detail: `${recentlyActive.length} of ${totalActive} active tenants seen in last hour`,
        target: "tenants",
      });
    }

    /* Suspended tenant count as persistent condition. */
    const suspendedCount = ts.filter((t) => t.status === "suspended").length;
    if (suspendedCount > 0) {
      items.push({
        title: "Suspended tenants",
        direction: "persistent",
        detail: `${suspendedCount} ${suspendedCount === 1 ? "tenant" : "tenants"} suspended`,
        target: "tenants",
      });
    }
  }

  return items.slice(0, limit);
}

/* ── Section label map ────────────────────────────────────── */

export const sectionLabel: Record<string, string> = {
  health: "Health",
  enforcement: "Enforcement",
  tenants: "Tenants",
  activity: "Activity",
};
