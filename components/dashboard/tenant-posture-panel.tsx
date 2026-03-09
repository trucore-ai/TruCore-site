/* ────────────────────────────────────────────────────────────────
 *  TenantPosturePanel - operational posture and warnings
 *
 *  Surfaces the tenant's computed posture score and label,
 *  followed by any active operational warnings. Warnings use
 *  severity-coded chips so operators can triage at a glance.
 *  Includes an investigation header for quick posture assessment.
 * ──────────────────────────────────────────────────────────── */

import type { TenantDetail } from "@/lib/dashboard-client";
import { EmptyState } from "@/components/dashboard/empty-state";
import type { TrendDirection } from "@/lib/trend";
import { trendText, trendIndicator } from "@/lib/trend";
import type { PanelStatus } from "@/lib/attention";
import {
  SectionInvestigationHeader,
  type InvestigationState,
} from "@/components/dashboard/section-investigation-header";
import { EvidenceRow } from "@/components/dashboard/evidence-row";

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

/** Derive persistence context for a posture warning. */
function warningPersistence(since: string | null): {
  direction: TrendDirection;
  label: string;
} | null {
  if (!since) return null;
  try {
    const diffMs = Date.now() - new Date(since).getTime();
    const hours = diffMs / 3_600_000;
    if (hours < 1) return { direction: "newly-active", label: "New in current interval" };
    if (hours < 24) return { direction: "persistent", label: "Persistent in current session" };
    return { direction: "persistent", label: "Persistent across recent intervals" };
  } catch {
    return null;
  }
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

/* ── Posture investigation derivation ──────────────────────── */

function derivePostureInvestigation(
  posture: TenantDetail["posture_summary"],
): InvestigationState & { evidence?: string } {
  const { score, warnings } = posture;
  const criticalCount = warnings.filter(
    (w) => w.severity === "critical",
  ).length;
  const warnCount = warnings.filter((w) => w.severity === "warn").length;
  const totalWarnings = warnings.length;

  /* Classify warning freshness. */
  const newWarnings = warnings.filter((w) => {
    if (!w.since) return false;
    try {
      return (Date.now() - new Date(w.since).getTime()) / 3_600_000 < 1;
    } catch {
      return false;
    }
  }).length;

  const persistentWarnings = totalWarnings - newWarnings;

  let status: PanelStatus;
  let summary: string;
  let detail: string | undefined;
  let evidence: string | undefined;

  if (criticalCount > 0) {
    status = "degraded";
    summary = `${criticalCount} critical ${criticalCount === 1 ? "warning" : "warnings"} requiring operator review.`;
    if (newWarnings > 0)
      detail = `${newWarnings} new in current interval, ${persistentWarnings} persistent`;
    evidence = `score ${score} \u00b7 ${criticalCount} critical, ${warnCount} warn of ${totalWarnings} total`;
  } else if (warnCount > 0) {
    status = "review";
    summary = `${warnCount} ${warnCount === 1 ? "warning" : "warnings"} recorded, operator review recommended.`;
    if (newWarnings > 0)
      detail = `${newWarnings} new in current interval`;
    else if (persistentWarnings > 0)
      detail = `${persistentWarnings} persistent ${persistentWarnings === 1 ? "warning" : "warnings"}`;
    evidence = `score ${score} \u00b7 ${warnCount} warn of ${totalWarnings} total${newWarnings > 0 ? ` \u00b7 ${newWarnings} new` : ""}`;
  } else if (score < 60) {
    status = "review";
    summary = `Low posture score (${score}), review posture composition.`;
    evidence = `score ${score} \u00b7 0 warnings \u00b7 threshold: 60`;
  } else if (score < 80) {
    status = "stable";
    summary = `Moderate posture (${score}), no active warnings.`;
    evidence = `score ${score} \u00b7 0 warnings`;
  } else {
    status = "stable";
    summary = `Strong posture (${score}), no warnings recorded.`;
  }

  return { status, summary, detail, evidence };
}

export function TenantPosturePanel({ posture }: TenantPosturePanelProps) {
  const visual = getScoreVisual(posture.score);
  const investigation = derivePostureInvestigation(posture);

  return (
    <div className="dashboard-panel p-5 sm:p-6">
      <h2 className="text-sm font-semibold text-slate-100">
        Operational Posture
      </h2>
      <SectionInvestigationHeader state={investigation} />
      {investigation.evidence && (
        <EvidenceRow basis={investigation.evidence} className="mt-0.5" />
      )}

      <p className="mt-1.5 text-[10px] text-slate-600">
        Derived assessment &middot; Computed from enforcement, quota, and key hygiene signals
      </p>

      {/* Score + label */}
      <div className="mt-4 flex items-center gap-4">
        <div
          className={`flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl ${visual.bg}`}
        >
          <span
            className={`text-2xl font-bold tabular-nums tracking-tight ${visual.color}`}
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
      <div className="mt-4">
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
      <div className="gradient-divider mt-5" />

      {/* Warnings */}
      <div className="mt-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
          Active Warnings
        </p>

        {posture.warnings.length === 0 ? (
          <div className="mt-3">
            <EmptyState
              icon="✓"
              title="No active warnings"
              description="No operational warnings recorded for this tenant."
            />
          </div>
        ) : (
          <div className="mt-3 space-y-1.5">
            {posture.warnings.map((w) => {
              const style = severityStyles[w.severity] ?? severityStyles.info;
              const persistence = warningPersistence(w.since);

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
                      {persistence && (
                        <p className={`mt-0.5 text-[10px] leading-snug ${trendText[persistence.direction]}`}>
                          <span aria-hidden="true">{trendIndicator[persistence.direction]} </span>
                          {persistence.label}
                        </p>
                      )}
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
