/* ────────────────────────────────────────────────────────────────
 *  EnforcementOverview - policy enforcement posture
 *
 *  Shows totals (evaluated, blocked, allowed, flagged) as a
 *  summary row, a visual block-rate bar, and the top enforcement
 *  rules in a compact list.
 * ──────────────────────────────────────────────────────────── */

import type { EnforcementOverview as EnforcementData } from "@/lib/dashboard-client";
import { StatusChip } from "@/components/dashboard/status-chip";
import { EmptyState } from "@/components/dashboard/empty-state";

function compactNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

type EnforcementOverviewProps = { data: EnforcementData };

const summaryItems: {
  key: keyof Pick<
    EnforcementData,
    "total_evaluated" | "total_blocked" | "total_allowed" | "total_flagged"
  >;
  label: string;
  color: string;
}[] = [
  { key: "total_evaluated", label: "Evaluated", color: "text-slate-100" },
  { key: "total_blocked", label: "Blocked", color: "text-red-300" },
  { key: "total_allowed", label: "Allowed", color: "text-emerald-300" },
  { key: "total_flagged", label: "Flagged", color: "text-amber-300" },
];

export function EnforcementOverview({ data }: EnforcementOverviewProps) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-5 shadow-sm shadow-black/10 sm:p-6">
      <h2 className="text-sm font-semibold text-slate-100">
        Enforcement Posture
      </h2>

      {/* Summary metrics row */}
      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {summaryItems.map((item) => (
          <div key={item.key}>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
              {item.label}
            </p>
            <p
              className={`mt-1.5 text-xl font-bold tabular-nums tracking-tight ${item.color}`}
            >
              {compactNum(data[item.key])}
            </p>
          </div>
        ))}
      </div>

      {/* Block rate bar */}
      <div className="mt-6">
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span>Block rate</span>
          <span className="font-semibold tabular-nums text-slate-300">
            {data.block_rate_pct.toFixed(1)}%
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-red-500/80 to-red-400/60 transition-all duration-700"
            style={{ width: `${Math.min(data.block_rate_pct, 100)}%` }}
          />
        </div>
      </div>

      {/* Separator */}
      <div className="mt-5 h-px bg-white/[0.05]" />

      {/* Top rules */}
      {data.top_rules.length === 0 ? (
        <div className="mt-5">
          <EmptyState
            title="No enforcement rules triggered"
            description="No policy rules have been activated in the current reporting window."
          />
        </div>
      ) : (
        <div className="mt-5 space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
            Top Rules
          </p>
          {data.top_rules.map((rule) => (
            <div
              key={rule.rule}
              className="flex items-center justify-between rounded-lg border border-white/[0.04] bg-white/[0.015] px-4 py-3 transition-all duration-200 hover:border-white/[0.08] hover:bg-white/[0.03]"
            >
              <span className="truncate text-sm font-medium text-slate-200">
                {rule.rule}
              </span>
              <div className="ml-3 flex flex-shrink-0 items-center gap-3">
                <span className="text-xs font-mono tabular-nums text-slate-400">
                  {compactNum(rule.hits)}
                </span>
                <StatusChip status={rule.action} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
