/* ────────────────────────────────────────────────────────────────
 *  EnforcementOverview - policy enforcement posture
 *
 *  Shows the enforcement counters that the live ATF summary
 *  provides: auth failures, rate-limit rejections, quota
 *  violations, and reprovision operations.
 *
 *  The component renders a clean summary of available totals
 *  and gracefully omits sub-panels (top rules, block-rate bar)
 *  that are not part of the current production contract.
 * ──────────────────────────────────────────────────────────── */

import type { LiveEnforcement } from "@/lib/dashboard-client";

function compactNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

type EnforcementOverviewProps = { data: LiveEnforcement };

const summaryItems: {
  key: keyof Pick<
    LiveEnforcement,
    | "auth_failures_total"
    | "rate_limit_rejections_total"
    | "quota_violations_total"
    | "reprovision_operations_total"
  >;
  label: string;
  color: string;
}[] = [
  {
    key: "auth_failures_total",
    label: "Auth Failures",
    color: "text-red-300",
  },
  {
    key: "rate_limit_rejections_total",
    label: "Rate Limit",
    color: "text-amber-300",
  },
  {
    key: "quota_violations_total",
    label: "Quota Violations",
    color: "text-orange-300",
  },
  {
    key: "reprovision_operations_total",
    label: "Reprovisions",
    color: "text-primary-300",
  },
];

export function EnforcementOverview({ data }: EnforcementOverviewProps) {
  const total =
    data.auth_failures_total +
    data.rate_limit_rejections_total +
    data.quota_violations_total +
    data.reprovision_operations_total;

  return (
    <div className="dashboard-panel p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-100">
          Enforcement Posture
        </h2>
        <span className="text-[11px] font-semibold tabular-nums text-slate-400">
          {compactNum(total)} total
        </span>
      </div>

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

      {/* Enforcement bar (total as context) */}
      {total > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>Breakdown</span>
          </div>
          <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-white/[0.06]">
            {summaryItems.map((item) => {
              const pct = total > 0 ? (data[item.key] / total) * 100 : 0;
              if (pct === 0) return null;
              return (
                <div
                  key={item.key}
                  className={`h-full transition-all duration-700 first:rounded-l-full last:rounded-r-full ${barColor(item.key)}`}
                  style={{ width: `${pct}%` }}
                  title={`${item.label}: ${compactNum(data[item.key])} (${pct.toFixed(1)}%)`}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Separator */}
      <div className="gradient-divider mt-5" />

      {/* Info note about extended enforcement data */}
      <p className="mt-4 text-[11px] leading-relaxed text-slate-600">
        Detailed rule-level enforcement analytics are available in the ATF
        operator CLI. Run{" "}
        <code className="rounded bg-white/[0.04] px-1 py-0.5 font-mono text-[10px] text-slate-400">
          atf enforcement report
        </code>{" "}
        for the full breakdown.
      </p>
    </div>
  );
}

/** Map enforcement keys to bar segment colors */
function barColor(key: string): string {
  switch (key) {
    case "auth_failures_total":
      return "bg-red-500/70";
    case "rate_limit_rejections_total":
      return "bg-amber-500/70";
    case "quota_violations_total":
      return "bg-orange-500/70";
    case "reprovision_operations_total":
      return "bg-primary-500/70";
    default:
      return "bg-slate-500/70";
  }
}
