/* ────────────────────────────────────────────────────────────────
 *  QuotaBreakdownCard - effective quotas with source provenance
 *
 *  Displays each quota key, its effective value, the resolving
 *  source (override / env / default), and the default fallback.
 *  Operators can instantly see which quotas are customized and
 *  which are running at baseline.
 * ──────────────────────────────────────────────────────────── */

import type { QuotaEntry } from "@/lib/dashboard-client";
import { EmptyState } from "@/components/dashboard/empty-state";

const sourceBadge: Record<
  QuotaEntry["source"],
  { bg: string; text: string; border: string }
> = {
  override: {
    bg: "bg-amber-500/10",
    text: "text-amber-300",
    border: "border-amber-500/25",
  },
  env: {
    bg: "bg-sky-500/10",
    text: "text-sky-300",
    border: "border-sky-500/25",
  },
  default: {
    bg: "bg-slate-500/10",
    text: "text-slate-400",
    border: "border-slate-500/25",
  },
};

function formatQuotaKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

type QuotaBreakdownCardProps = {
  quotas: QuotaEntry[];
};

export function QuotaBreakdownCard({ quotas }: QuotaBreakdownCardProps) {
  if (quotas.length === 0) {
    return (
      <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-5 shadow-sm shadow-black/10 sm:p-6">
        <h2 className="text-sm font-semibold text-slate-100">
          Effective Quotas
        </h2>
        <div className="mt-4">
          <EmptyState
            title="No quotas configured"
            description="This tenant has no explicitly configured quotas. ATF defaults are in effect."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-5 shadow-sm shadow-black/10 sm:p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-100">
          Effective Quotas
        </h2>
        <span className="text-[11px] font-medium tabular-nums text-slate-500">
          {quotas.length} {quotas.length === 1 ? "quota" : "quotas"}
        </span>
      </div>

      {/* Separator */}
      <div className="mt-4 h-px bg-white/[0.05]" />

      {/* Quota rows */}
      <div className="mt-4 space-y-2">
        {quotas.map((q) => {
          const badge = sourceBadge[q.source];
          const isCustomized = q.source !== "default";

          return (
            <div
              key={q.key}
              className="flex items-center justify-between rounded-lg border border-white/[0.04] bg-white/[0.015] px-4 py-3.5 transition-all duration-200 hover:border-white/[0.08] hover:bg-white/[0.03]"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-200">
                  {formatQuotaKey(q.key)}
                </p>
                {isCustomized && (
                  <p className="mt-0.5 text-[10px] text-slate-600">
                    Default: {q.default_value.toLocaleString()}
                  </p>
                )}
              </div>

              <div className="ml-3 flex flex-shrink-0 items-center gap-3">
                <span className="text-sm font-semibold tabular-nums text-slate-100">
                  {q.effective.toLocaleString()}
                </span>
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${badge.bg} ${badge.text} ${badge.border}`}
                >
                  {q.source}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 border-t border-white/[0.05] pt-3">
        {(["override", "env", "default"] as const).map((src) => {
          const badge = sourceBadge[src];
          return (
            <div key={src} className="flex items-center gap-1.5">
              <span
                className={`inline-block h-2 w-2 rounded-full ${badge.bg} ${badge.border} border`}
              />
              <span className="text-[10px] capitalize text-slate-500">
                {src}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
