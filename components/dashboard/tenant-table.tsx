/* ────────────────────────────────────────────────────────────────
 *  TenantTable - triage-oriented tenant summary with attention model
 *
 *  Compact, high-density table optimized for quick scanning.
 *  Tenants are sorted attention-first: suspended, then those
 *  with enforcement events, then by descending request volume.
 *  Each row includes an explicit attention reason so operators
 *  can tell at a glance why a tenant appears near the top.
 * ──────────────────────────────────────────────────────────── */

import Link from "next/link";
import type { TenantSummary } from "@/lib/dashboard-client";
import { StatusChip } from "@/components/dashboard/status-chip";
import { EmptyState } from "@/components/dashboard/empty-state";
import {
  deriveTenantAttentionReason,
  attentionDot,
  attentionBorder,
} from "@/lib/attention";
import type { AttentionSignal } from "@/lib/attention";
import type { TrendDirection } from "@/lib/trend";
import { trendText, trendIndicator } from "@/lib/trend";
import { SectionInvestigationHeader } from "@/components/dashboard/section-investigation-header";
import type { InvestigationState } from "@/components/dashboard/section-investigation-header";

function compactNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function relativeTime(iso: string | null): string {
  if (!iso) return "Never";
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch {
    return iso;
  }
}

/** Determine if a tenant warrants an attention badge and why. */
function getAttention(t: TenantSummary): AttentionSignal | null {
  return deriveTenantAttentionReason(t);
}

/** Derive a directional trend label for a tenant row. */
function deriveTenantTrend(t: TenantSummary): {
  direction: TrendDirection;
  label: string;
} | null {
  // Suspended tenants get no trend, the status speaks for itself.
  if (t.status === "suspended") return null;

  const seenMs = t.last_seen ? Date.now() - new Date(t.last_seen).getTime() : Infinity;
  const isRecentlySeen = seenMs < 3_600_000; // within 1 hour
  const isActiveSeen = seenMs < 86_400_000;   // within 24 hours

  if (t.status === "inactive" || (!t.last_seen && t.requests_24h === 0)) {
    return { direction: "unchanged", label: "Inactive" };
  }

  if (t.enforcements_24h > 0 && isRecentlySeen) {
    return { direction: "persistent", label: "Active enforcement" };
  }

  if (t.enforcements_24h > 0 && !isRecentlySeen) {
    return { direction: "decreasing", label: "Enforcement receding" };
  }

  if (t.requests_24h > 0 && isRecentlySeen) {
    return { direction: "persistent", label: "Steady request traffic" };
  }

  if (t.requests_24h > 0 && isActiveSeen && !isRecentlySeen) {
    return { direction: "unchanged", label: "No recent request activity" };
  }

  if (t.requests_24h === 0 && t.last_seen) {
    return { direction: "unchanged", label: "Idle" };
  }

  return null;
}

/** Sort tenants for triage: suspended first, then enforcement activity, then inactive, then volume. */
function triageSort(tenants: TenantSummary[]): TenantSummary[] {
  return [...tenants].sort((a, b) => {
    // Suspended always first
    if (a.status === "suspended" && b.status !== "suspended") return -1;
    if (b.status === "suspended" && a.status !== "suspended") return 1;
    // Then by enforcement events (descending)
    if (a.enforcements_24h !== b.enforcements_24h)
      return b.enforcements_24h - a.enforcements_24h;
    // Active before inactive
    if (a.status === "active" && b.status === "inactive") return -1;
    if (b.status === "active" && a.status === "inactive") return 1;
    // Then by request volume (descending)
    return b.requests_24h - a.requests_24h;
  });
}

type TenantTableProps = {
  tenants: TenantSummary[];
  total: number;
};

/** Derive a compact investigation header state for the tenant section. */
function deriveTenantInvestigation(
  tenants: TenantSummary[],
  total: number,
): InvestigationState {
  const activeCount = tenants.filter((t) => t.status === "active").length;
  const suspendedCount = tenants.filter((t) => t.status === "suspended").length;
  const withEnforcement = tenants.filter((t) => t.enforcements_24h > 0).length;
  const needsReview = suspendedCount + withEnforcement;

  if (suspendedCount > 0 && withEnforcement > 0) {
    return {
      status: "review",
      summary: `${total} tenants. ${suspendedCount} suspended, ${withEnforcement} with enforcement events. Triage queue active.`,
      detail: "Suspended tenants are sorted first for review.",
    };
  }

  if (suspendedCount > 0) {
    return {
      status: "review",
      summary: `${total} tenants. ${suspendedCount} suspended, requires review.`,
    };
  }

  if (withEnforcement > 0) {
    return {
      status: needsReview > 3 ? "review" : "stable",
      summary: `${total} tenants. ${withEnforcement} with recent enforcement events, ${activeCount} active.`,
    };
  }

  if (activeCount === 0 && tenants.length > 0) {
    return {
      status: "idle",
      summary: `${total} tenants registered. No active tenants in current interval.`,
    };
  }

  // All clear
  return {
    status: "stable",
    summary: `No tenants require review in current interval. ${activeCount} active, ${total} total.`,
  };
}

export function TenantTable({ tenants, total }: TenantTableProps) {
  if (tenants.length === 0) {
    return (
      <div className="dashboard-panel p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-slate-100">Tenants</h2>
        <div className="mt-3">
          <EmptyState
            title="No tenants registered"
            description="No tenant data available from current deployment. Tenants appear here once provisioned."
          />
        </div>
      </div>
    );
  }

  const sorted = triageSort(tenants);
  const activeCount = tenants.filter((t) => t.status === "active").length;
  const suspendedCount = tenants.filter(
    (t) => t.status === "suspended",
  ).length;
  const withEnforcement = tenants.filter(
    (t) => t.enforcements_24h > 0,
  ).length;
  const investigation = deriveTenantInvestigation(tenants, total);

  return (
    <div className="dashboard-panel p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-100">Tenants</h2>
        <span className="text-[11px] font-medium tabular-nums text-slate-500">
          {total.toLocaleString()} total
        </span>
      </div>

      {/* Investigation header - local section summary */}
      <SectionInvestigationHeader state={investigation} />

      <p className="mt-1.5 text-[10px] text-slate-600">
        24h activity window &middot; Sorted by attention priority
      </p>

      {/* Triage summary strip */}
      <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px]">
        <span className="text-slate-500">
          Active{" "}
          <span className="font-semibold tabular-nums text-emerald-300">{activeCount}</span>
        </span>
        {suspendedCount > 0 && (
          <span className="text-slate-500">
            Suspended{" "}
            <span className="font-semibold tabular-nums text-red-300">{suspendedCount}</span>
          </span>
        )}
        <span className="text-slate-500">
          With enforcement{" "}
          <span className="font-semibold tabular-nums text-amber-300">{withEnforcement}</span>
        </span>
        {tenants.filter((t) => t.status === "inactive").length > 0 && (
          <span className="text-slate-500">
            Inactive{" "}
            <span className="font-semibold tabular-nums text-slate-400">
              {tenants.filter((t) => t.status === "inactive").length}
            </span>
          </span>
        )}
      </div>

      {/* Separator */}
      <div className="gradient-divider mt-4" />

      {/* Desktop table */}
      <div className="mt-4 hidden sm:block overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/[0.06] text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              <th className="pb-3 pr-4 font-semibold">Tenant</th>
              <th className="pb-3 pr-4 font-semibold">Status</th>
              <th className="pb-3 pr-4 font-semibold">Attention</th>
              <th className="pb-3 pr-4 text-right font-semibold">Requests</th>
              <th className="pb-3 pr-4 text-right font-semibold">Enforced</th>
              <th className="pb-3 pr-4 text-right font-semibold">Latency</th>
              <th className="pb-3 text-right font-semibold">Last Seen</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((t) => {
              const signal = getAttention(t);
              const trend = deriveTenantTrend(t);
              return (
                <tr
                  key={t.id}
                  className={`group border-b border-white/[0.03] transition-all duration-200 hover:bg-white/[0.025] cursor-pointer ${signal ? "bg-white/[0.01]" : ""}`}
                >
                  <td className="py-3 pr-4">
                    <Link
                      href={`/dashboard/tenants/${encodeURIComponent(t.id)}`}
                      className="block min-w-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/40"
                    >
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium text-slate-200 group-hover:text-primary-200 transition-colors duration-200">
                          {t.name}
                        </p>
                        {signal && (
                          <span
                            className={`inline-block h-1.5 w-1.5 rounded-full flex-shrink-0 ${attentionDot[signal.level]}`}
                            title={signal.reason}
                            aria-label={signal.reason}
                          />
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-[10px] font-mono text-slate-600">
                        {t.id}
                      </p>
                    </Link>
                  </td>
                  <td className="py-3 pr-4">
                    <StatusChip status={t.status} />
                  </td>
                  <td className="py-3 pr-4">
                    {signal ? (
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium text-slate-400">
                          {signal.reason}
                        </p>
                        {signal.action && (
                          <p className="text-[10px] text-slate-600 mt-0.5">
                            {signal.action}
                          </p>
                        )}
                        {trend && (
                          <p className={`text-[10px] leading-snug mt-0.5 ${trendText[trend.direction]}`}>
                            <span aria-hidden="true">{trendIndicator[trend.direction]} </span>
                            {trend.label}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="min-w-0">
                        <span className="text-[10px] text-slate-600">
                          No action required
                        </span>
                        {trend && (
                          <p className={`text-[10px] leading-snug mt-0.5 ${trendText[trend.direction]}`}>
                            <span aria-hidden="true">{trendIndicator[trend.direction]} </span>
                            {trend.label}
                          </p>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-right text-sm tabular-nums text-slate-300">
                    {compactNum(t.requests_24h)}
                  </td>
                  <td className={`py-3 pr-4 text-right text-sm tabular-nums ${t.enforcements_24h > 0 ? "text-amber-300" : "text-slate-300"}`}>
                    {compactNum(t.enforcements_24h)}
                  </td>
                  <td className="py-3 pr-4 text-right text-sm tabular-nums text-slate-300">
                    {t.avg_latency_ms.toFixed(1)}ms
                  </td>
                  <td className="py-3 text-right text-[11px] text-slate-500">
                    {relativeTime(t.last_seen)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="mt-4 space-y-2 sm:hidden">
        {sorted.map((t) => {
          const signal = getAttention(t);
          const trend = deriveTenantTrend(t);
          return (
            <Link
              key={t.id}
              href={`/dashboard/tenants/${encodeURIComponent(t.id)}`}
              className={`block dashboard-sub-panel p-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/40 ${signal ? `border-l-2 ${attentionBorder[signal.level]}` : ""}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <p className="truncate text-sm font-medium text-slate-200">
                    {t.name}
                  </p>
                  {signal && (
                    <span
                      className={`inline-block h-1.5 w-1.5 rounded-full flex-shrink-0 ${attentionDot[signal.level]}`}
                      aria-label={signal.reason}
                    />
                  )}
                </div>
                <StatusChip status={t.status} />
              </div>
              {signal && (
                <p className="mt-1.5 text-[10px] leading-snug text-slate-500">
                  {signal.reason}{signal.action ? ` \u00B7 ${signal.action}` : ""}
                </p>
              )}
              {trend && (
                <p className={`mt-1 text-[10px] leading-snug ${trendText[trend.direction]}`}>
                  <span aria-hidden="true">{trendIndicator[trend.direction]} </span>
                  {trend.label}
                </p>
              )}
              <div className="mt-2.5 grid grid-cols-3 gap-3 text-[11px]">
                <div>
                  <p className="text-slate-500">Requests</p>
                  <p className="mt-0.5 font-semibold tabular-nums text-slate-300">
                    {compactNum(t.requests_24h)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Enforced</p>
                  <p className={`mt-0.5 font-semibold tabular-nums ${t.enforcements_24h > 0 ? "text-amber-300" : "text-slate-300"}`}>
                    {compactNum(t.enforcements_24h)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Latency</p>
                  <p className="mt-0.5 font-semibold tabular-nums text-slate-300">
                    {t.avg_latency_ms.toFixed(1)}ms
                  </p>
                </div>
              </div>
              <p className="mt-2 text-[10px] text-slate-600">
                Last seen {relativeTime(t.last_seen)}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
