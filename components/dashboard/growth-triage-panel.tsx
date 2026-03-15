/* ────────────────────────────────────────────────────────────────
 *  GrowthTriagePanel — operator-only follow-up prioritization
 *
 *  Surfaces triaged tenants sorted by follow-up priority so the
 *  operator can quickly identify who to reach out to, who is
 *  stuck, and who is converting well.
 *
 *  Deterministic, rule-based. Derived entirely from existing
 *  adoption data. Operator-only — never shown to tenant users.
 * ──────────────────────────────────────────────────────────── */

"use client";

import { useState } from "react";
import Link from "next/link";
import type { AdoptionFunnel } from "@/lib/dashboard-client";
import {
  triageAllTenants,
  computeSegmentSummary,
  SEGMENT_CONFIG,
  PRIORITY_CONFIG,
  type TriagedTenant,
  type FollowUpPriority,
  type TriageSegment,
} from "@/lib/growth-triage";

type Props = { data: AdoptionFunnel };

function compactNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function relativeTime(iso: string | null | undefined): string {
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

function PriorityDot({ priority }: { priority: FollowUpPriority }) {
  const cfg = PRIORITY_CONFIG[priority];
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`inline-block h-2 w-2 rounded-full ${cfg.dot}`}
        aria-hidden="true"
      />
      <span className={`text-[10px] font-semibold uppercase tracking-wider ${cfg.color}`}>
        {cfg.label}
      </span>
    </span>
  );
}

function SegmentBadge({ segment }: { segment: TriageSegment }) {
  const cfg = SEGMENT_CONFIG[segment];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${cfg.color}`}
      title={cfg.description}
    >
      {cfg.label}
    </span>
  );
}

function SourceBadge({ source }: { source: string }) {
  const colors: Record<string, string> = {
    cli: "bg-cyan-500/20 text-cyan-400",
    http: "bg-blue-500/20 text-blue-400",
    python: "bg-yellow-500/20 text-yellow-400",
    typescript: "bg-indigo-500/20 text-indigo-400",
    openclaw: "bg-purple-500/20 text-purple-400",
    unknown: "bg-white/5 text-slate-500",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${colors[source] ?? colors.unknown}`}
    >
      {source}
    </span>
  );
}

type FilterState = {
  priority: FollowUpPriority | "all";
  segment: TriageSegment | "all";
};

function TriagedTenantRow({ t }: { t: TriagedTenant }) {
  return (
    <tr
      className={`border-b border-white/5 text-xs transition-colors hover:bg-white/[0.02] ${
        t.triage.priority === "high" ? "bg-red-500/[0.04]" : ""
      }`}
    >
      <td className="py-2 pr-3">
        <PriorityDot priority={t.triage.priority} />
      </td>
      <td className="py-2 pr-3 font-medium text-slate-300">
        <Link
          href={`/dashboard/tenants/${encodeURIComponent(t.tenant_id)}`}
          className="underline decoration-slate-700 underline-offset-2 transition-colors hover:text-primary-300 hover:decoration-primary-400/40"
        >
          {t.display_name || t.tenant_id}
        </Link>
      </td>
      <td className="py-2 pr-3">
        <SegmentBadge segment={t.triage.segment} />
      </td>
      <td className="py-2 pr-3">
        <SourceBadge source={t.dominant_source ?? "unknown"} />
      </td>
      <td className="py-2 pr-3 text-right font-mono text-slate-400">
        {compactNum(t.protect_count ?? t.requests_total)}
      </td>
      <td className="py-2 pr-3 text-right font-mono text-slate-400">
        {compactNum(t.receipt_count ?? t.receipts_written_total)}
      </td>
      <td className="py-2 pr-3 text-right font-mono text-slate-400">
        {compactNum(t.verify_count ?? t.receipts_verified_total)}
      </td>
      <td className="py-2 text-right text-slate-500">
        {relativeTime(t.last_seen_at ?? t.last_activity_ts)}
      </td>
      <td className="py-2 pl-3 text-[10px] text-slate-500 max-w-[200px] truncate">
        {t.triage.reason}
      </td>
    </tr>
  );
}

export function GrowthTriagePanel({ data }: Props) {
  const triaged = triageAllTenants(data.tenant_snapshots);
  const segments = computeSegmentSummary(triaged);

  const [filter, setFilter] = useState<FilterState>({
    priority: "all",
    segment: "all",
  });

  const filtered = triaged.filter((t) => {
    if (filter.priority !== "all" && t.triage.priority !== filter.priority) {
      return false;
    }
    if (filter.segment !== "all" && t.triage.segment !== filter.segment) {
      return false;
    }
    return true;
  });

  const highCount = triaged.filter((t) => t.triage.priority === "high").length;
  const medCount = triaged.filter(
    (t) => t.triage.priority === "medium",
  ).length;
  const lowCount = triaged.filter((t) => t.triage.priority === "low").length;

  return (
    <div className="space-y-5">
      {/* ── Priority summary strip ─────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "High Priority", count: highCount, priority: "high" as const },
          { label: "Medium Priority", count: medCount, priority: "medium" as const },
          { label: "Low Priority", count: lowCount, priority: "low" as const },
        ].map((card) => (
          <button
            key={card.priority}
            type="button"
            onClick={() =>
              setFilter((f) => ({
                ...f,
                priority: f.priority === card.priority ? "all" : card.priority,
              }))
            }
            className={`rounded-lg border p-3 text-left transition-colors ${
              filter.priority === card.priority
                ? "border-primary-500/40 bg-primary-500/[0.06]"
                : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]"
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`inline-block h-2 w-2 rounded-full ${PRIORITY_CONFIG[card.priority].dot}`}
              />
              <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                {card.label}
              </span>
            </div>
            <p className="mt-1 text-xl font-semibold tabular-nums text-slate-100">
              {card.count}
            </p>
          </button>
        ))}
      </div>

      {/* ── Segment distribution ───────────────────────────── */}
      {segments.length > 0 && (
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Triage Segments
          </h3>
          <div className="flex flex-wrap gap-2">
            {segments.map((seg) => {
              const cfg = SEGMENT_CONFIG[seg.segment];
              const isActive = filter.segment === seg.segment;
              return (
                <button
                  key={seg.segment}
                  type="button"
                  onClick={() =>
                    setFilter((f) => ({
                      ...f,
                      segment: f.segment === seg.segment ? "all" : seg.segment,
                    }))
                  }
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors ${
                    isActive
                      ? "ring-1 ring-primary-500/50 " + cfg.color
                      : cfg.color + " hover:brightness-125"
                  }`}
                >
                  {cfg.label}
                  <span className="font-mono opacity-70">{seg.count}</span>
                  {seg.highCount > 0 && (
                    <span className="text-red-400 font-mono">
                      ({seg.highCount}!)
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {filter.segment !== "all" && (
            <p className="mt-2 text-[9px] text-slate-600">
              {SEGMENT_CONFIG[filter.segment].description}
            </p>
          )}
        </div>
      )}

      {/* ── Active filter indicator ────────────────────────── */}
      {(filter.priority !== "all" || filter.segment !== "all") && (
        <div className="flex items-center gap-2 text-[10px] text-slate-500">
          <span>Filtering:</span>
          {filter.priority !== "all" && (
            <span className={PRIORITY_CONFIG[filter.priority].color}>
              {PRIORITY_CONFIG[filter.priority].label} priority
            </span>
          )}
          {filter.segment !== "all" && (
            <span>{SEGMENT_CONFIG[filter.segment].label}</span>
          )}
          <button
            type="button"
            onClick={() => setFilter({ priority: "all", segment: "all" })}
            className="underline hover:text-slate-300"
          >
            Clear
          </button>
          <span className="text-slate-600">
            Showing {filtered.length} of {triaged.length}
          </span>
        </div>
      )}

      {/* ── Triaged tenant table ───────────────────────────── */}
      {filtered.length > 0 ? (
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Follow-Up Queue
            <span className="ml-2 font-mono text-slate-600">
              {filtered.length} {filtered.length === 1 ? "tenant" : "tenants"}
            </span>
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-slate-500">
                  <th className="pb-2 pr-3 font-medium">Priority</th>
                  <th className="pb-2 pr-3 font-medium">Tenant</th>
                  <th className="pb-2 pr-3 font-medium">Segment</th>
                  <th className="pb-2 pr-3 font-medium">Source</th>
                  <th className="pb-2 pr-3 text-right font-medium">Protects</th>
                  <th className="pb-2 pr-3 text-right font-medium">Receipts</th>
                  <th className="pb-2 pr-3 text-right font-medium">Verifies</th>
                  <th className="pb-2 text-right font-medium">Last Seen</th>
                  <th className="pb-2 pl-3 font-medium">Reason</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <TriagedTenantRow key={t.tenant_id} t={t} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4 text-center text-xs text-slate-500">
          No tenants match the current filter
        </div>
      )}

      {/* ── Triage logic disclaimer ────────────────────────── */}
      <p className="text-[9px] leading-relaxed text-slate-600">
        Priority is derived from deterministic rules using activation stage,
        stall duration, receipt/verify completion, and source attribution.
        Segments are mutually exclusive. See triage documentation for full
        rule definitions and limitations.
      </p>
    </div>
  );
}
