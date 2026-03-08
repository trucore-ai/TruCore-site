/* ────────────────────────────────────────────────────────────────
 *  TenantPosturePanel - operational posture and warnings
 *
 *  Surfaces the tenant's computed posture score and label,
 *  followed by any active operational warnings. Warnings use
 *  severity-coded chips so operators can triage at a glance.
 * ──────────────────────────────────────────────────────────── */

import type { TenantDetail } from "@/lib/dashboard-client";
import { EmptyState } from "@/components/dashboard/empty-state";

function relativeTime(iso: string | null): string {
  if (!iso) return "";
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

const scoreRanges: { min: number; label: string; color: string; bg: string }[] =
  [
    {
      min: 80,
      label: "Strong",
      color: "text-emerald-300",
      bg: "bg-emerald-500/15",
    },
    {
      min: 60,
      label: "Moderate",
      color: "text-amber-300",
      bg: "bg-amber-500/15",
    },
    {
      min: 0,
      label: "Needs Attention",
      color: "text-red-300",
      bg: "bg-red-500/15",
    },
  ];

function getScoreVisual(score: number) {
  return (
    scoreRanges.find((r) => score >= r.min) ??
    scoreRanges[scoreRanges.length - 1]
  );
}

const severityStyles: Record<
  string,
  { dot: string; text: string; bg: string; border: string }
> = {
  critical: {
    dot: "bg-red-400",
    text: "text-red-300",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
  },
  warn: {
    dot: "bg-amber-400",
    text: "text-amber-300",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
  info: {
    dot: "bg-sky-400",
    text: "text-sky-300",
    bg: "bg-sky-500/10",
    border: "border-sky-500/20",
  },
};

type TenantPosturePanelProps = {
  posture: TenantDetail["posture_summary"];
};

export function TenantPosturePanel({ posture }: TenantPosturePanelProps) {
  const visual = getScoreVisual(posture.score);

  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-5 shadow-sm shadow-black/10 sm:p-6">
      <h2 className="text-sm font-semibold text-slate-100">
        Operational Posture
      </h2>

      {/* Score + label */}
      <div className="mt-5 flex items-center gap-5">
        <div
          className={`flex h-[4.5rem] w-[4.5rem] flex-shrink-0 items-center justify-center rounded-2xl ${visual.bg}`}
        >
          <span
            className={`text-[1.75rem] font-bold tabular-nums tracking-tight ${visual.color}`}
          >
            {posture.score}
          </span>
        </div>
        <div>
          <p className={`text-sm font-semibold ${visual.color}`}>
            {posture.label}
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
            Composite score from enforcement activity, quota utilization, and
            key hygiene.
          </p>
        </div>
      </div>

      {/* Score bar */}
      <div className="mt-5">
        <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              posture.score >= 80
                ? "bg-gradient-to-r from-emerald-500/80 to-emerald-400/60"
                : posture.score >= 60
                  ? "bg-gradient-to-r from-amber-500/80 to-amber-400/60"
                  : "bg-gradient-to-r from-red-500/80 to-red-400/60"
            }`}
            style={{ width: `${Math.min(posture.score, 100)}%` }}
          />
        </div>
      </div>

      {/* Separator */}
      <div className="mt-6 h-px bg-white/[0.05]" />

      {/* Warnings */}
      <div className="mt-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
          Active Warnings
        </p>

        {posture.warnings.length === 0 ? (
          <div className="mt-3">
            <EmptyState
              icon="✓"
              title="No active warnings"
              description="This tenant has a clean operational record with no current advisories."
            />
          </div>
        ) : (
          <div className="mt-3 space-y-1.5">
            {posture.warnings.map((w) => {
              const style = severityStyles[w.severity] ?? severityStyles.info;

              return (
                <div
                  key={w.code}
                  className={`rounded-lg border px-4 py-3 transition-colors duration-150 hover:bg-white/[0.01] ${style.border} ${style.bg}`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-1 inline-block h-2 w-2 flex-shrink-0 rounded-full ${style.dot}`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm font-medium ${style.text}`}>
                          {w.code}
                        </p>
                        {w.since && (
                          <span className="flex-shrink-0 text-[10px] text-slate-600">
                            Since {relativeTime(w.since)}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs leading-relaxed text-slate-400">
                        {w.message}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
