/* ────────────────────────────────────────────────────────────────
 *  EnforcementOverview - policy enforcement posture with priority
 *
 *  Shows the enforcement counters from the live ATF summary
 *  with concise interpretive text. Classifies enforcement
 *  intensity (idle, background, elevated, concentrated) and
 *  communicates whether auth failures appear isolated, sustained,
 *  or dominant. Panel header includes a secondary status badge.
 * ──────────────────────────────────────────────────────────── */

import type { LiveEnforcement } from "@/lib/dashboard-client";
import {
  classifyEnforcementIntensity,
  deriveEnforcementPanelStatus,
  panelStatusBadge,
  intensityLabel,
} from "@/lib/attention";
import type { TrendDirection } from "@/lib/trend";
import { trendText, trendIndicator, trendDeltaLabel } from "@/lib/trend";
import { SectionInvestigationHeader } from "@/components/dashboard/section-investigation-header";
import type { InvestigationState } from "@/components/dashboard/section-investigation-header";
import { EvidenceRow } from "@/components/dashboard/evidence-row";

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
  idleNote: string;
  activeNote: string;
}[] = [
  {
    key: "auth_failures_total",
    label: "Auth Failures",
    color: "text-red-300",
    idleNote: "No credential failures",
    activeNote: "Invalid or missing credentials detected",
  },
  {
    key: "rate_limit_rejections_total",
    label: "Rate Limit",
    color: "text-amber-300",
    idleNote: "No rate limiting activity",
    activeNote: "Throttling applied to request volume",
  },
  {
    key: "quota_violations_total",
    label: "Quota Violations",
    color: "text-orange-300",
    idleNote: "No quota activity",
    activeNote: "Tenants exceeding allocation limits",
  },
  {
    key: "reprovision_operations_total",
    label: "Reprovisions",
    color: "text-primary-300",
    idleNote: "No reprovision activity",
    activeNote: "Tenant configuration reloads occurring",
  },
];

/** Derive a compact interpretation of the enforcement posture. */
function interpretPosture(data: LiveEnforcement): string {
  const total =
    data.auth_failures_total +
    data.rate_limit_rejections_total +
    data.quota_violations_total +
    data.reprovision_operations_total;

  if (total === 0) {
    return "No enforcement activity in current interval. All traffic within policy bounds.";
  }

  const parts: string[] = [];
  const categories = [
    { count: data.auth_failures_total, label: "auth failures", kind: "credential pressure" },
    { count: data.rate_limit_rejections_total, label: "rate limiting", kind: "volume friction" },
    { count: data.quota_violations_total, label: "quota violations", kind: "allocation pressure" },
    { count: data.reprovision_operations_total, label: "reprovisions", kind: "configuration churn" },
  ];

  const active = categories.filter((c) => c.count > 0);
  const dominant = active.reduce((a, b) => (a.count >= b.count ? a : b));
  const intensity = classifyEnforcementIntensity(total, active.length);

  if (active.length === 1) {
    parts.push(`${dominant.label} is the only active signal, indicating ${dominant.kind}.`);
  } else {
    parts.push(`${dominant.label} dominant across ${active.length} active categories.`);
  }

  // Classify auth failure pattern
  if (data.auth_failures_total > 0) {
    const authPct = data.auth_failures_total / total;
    if (authPct >= 0.8) {
      parts.push("Auth failures are the dominant signal. Review API key validity and client configuration.");
    } else if (authPct >= 0.5) {
      parts.push("Auth failures account for the majority of enforcement. Check credential rotation.");
    } else if (data.auth_failures_total > 10) {
      parts.push("Auth failures present alongside other enforcement types.");
    }
  }

  // Add intensity classification
  if (intensity === "concentrated") {
    parts.push("Activity is concentrated. Review distribution across tenants.");
  } else if (intensity === "background") {
    parts.push("Volume at background level, no immediate action required.");
  }

  return parts.join(" ");
}

/** Derive a directional context label for each enforcement category. */
function categoryTrend(
  value: number,
  total: number,
): { direction: TrendDirection; note: string } {
  if (total === 0) return { direction: "unchanged", note: "" };
  if (value === 0) return { direction: "unchanged", note: "" };
  const pct = value / total;
  if (pct >= 0.8) return { direction: "increasing", note: "Dominant signal" };
  if (pct >= 0.5) return { direction: "persistent", note: "Majority of enforcement" };
  if (pct >= 0.2) return { direction: "persistent", note: "Sustained presence" };
  return { direction: "unchanged", note: "Background level" };
}

/** Derive a compact investigation header state for the enforcement section. */
function deriveEnforcementInvestigation(data: LiveEnforcement): InvestigationState & { evidence?: string } {
  const total =
    data.auth_failures_total +
    data.rate_limit_rejections_total +
    data.quota_violations_total +
    data.reprovision_operations_total;

  const cats = [
    { count: data.auth_failures_total, label: "auth failures" },
    { count: data.rate_limit_rejections_total, label: "rate limiting" },
    { count: data.quota_violations_total, label: "quota violations" },
    { count: data.reprovision_operations_total, label: "reprovisions" },
  ];
  const activeCats = cats.filter((c) => c.count > 0);
  const activeCount = activeCats.length;
  const intensity = classifyEnforcementIntensity(total, activeCount);
  const authPct = total > 0 ? data.auth_failures_total / total : 0;
  const panelStatus = deriveEnforcementPanelStatus(total, authPct);

  /* Build compact evidence string from category counts. */
  const evidenceParts = activeCats.map(
    (c) => `${c.count.toLocaleString()} ${c.label}`,
  );
  if (total > 0 && activeCount > 1) {
    const dominant = activeCats.reduce((a, b) => (a.count >= b.count ? a : b));
    const dominantPct = ((dominant.count / total) * 100).toFixed(0);
    evidenceParts.push(`${dominant.label} ${dominantPct}% of total`);
  }

  if (total === 0) {
    return {
      status: panelStatus,
      summary: "No enforcement activity in current interval.",
    };
  }

  const dominant = activeCats.reduce((a, b) => (a.count >= b.count ? a : b));
  const intensityDesc = intensityLabel[intensity].toLowerCase();

  if (activeCount === 1) {
    return {
      status: panelStatus,
      summary: `${intensityDesc}. ${dominant.label} is the only active signal.`,
      detail: intensity === "concentrated" ? "Review distribution across tenants." : undefined,
      evidence: `${total.toLocaleString()} total \u00b7 ${dominant.label} only`,
    };
  }

  const summaryParts = [`${intensityDesc} across ${activeCount} categories`];
  if (authPct >= 0.5) {
    summaryParts.push("auth failures dominant");
  } else {
    summaryParts.push(`${dominant.label} leading`);
  }

  return {
    status: panelStatus,
    summary: summaryParts.join(", ") + ".",
    detail: intensity === "concentrated"
      ? "Review enforcement distribution before escalation."
      : undefined,
    evidence: evidenceParts.join(" \u00b7 "),
  };
}

export function EnforcementOverview({ data }: EnforcementOverviewProps) {
  const total =
    data.auth_failures_total +
    data.rate_limit_rejections_total +
    data.quota_violations_total +
    data.reprovision_operations_total;

  const categories = [
    data.auth_failures_total,
    data.rate_limit_rejections_total,
    data.quota_violations_total,
    data.reprovision_operations_total,
  ];
  const activeCount = categories.filter((c) => c > 0).length;
  const intensity = classifyEnforcementIntensity(total, activeCount);
  const authPct = total > 0 ? data.auth_failures_total / total : 0;
  const panelStatus = deriveEnforcementPanelStatus(total, authPct);
  const badge = panelStatusBadge[panelStatus];
  const investigation = deriveEnforcementInvestigation(data);

  return (
    <div className="dashboard-panel p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h2 className="text-sm font-semibold text-slate-100">
            Enforcement Posture
          </h2>
          {panelStatus !== "stable" && panelStatus !== "idle" && (
            <span
              className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium ${badge.bg} ${badge.text} ${badge.border}`}
            >
              {badge.label}
            </span>
          )}
        </div>
        <span className="text-[11px] font-semibold tabular-nums text-slate-400">
          {compactNum(total)} total
        </span>
      </div>

      {/* Investigation header - local section summary */}
      <SectionInvestigationHeader state={investigation} />
      {investigation.evidence && (
        <EvidenceRow basis={investigation.evidence} className="mt-0.5" />
      )}

      <p className="mt-1.5 text-[10px] text-slate-600">
        Current interval counters &middot; Computed from enforcement summary
      </p>

      {/* Interpretation */}
      <p className="mt-2 text-[12px] leading-relaxed text-slate-500">
        {interpretPosture(data)}
      </p>

      {/* Intensity indicator */}
      <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-slate-600">
        {intensityLabel[intensity]}
      </p>

      {/* Directional context */}
      {total > 0 && (() => {
        const authTrend = categoryTrend(data.auth_failures_total, total);
        const note = authPct >= 0.5
          ? "Auth failures are the primary enforcement driver in this interval"
          : data.auth_failures_total > 0
            ? "Auth failures present alongside other enforcement types"
            : null;
        const direction: TrendDirection = total > 10 ? "persistent" : "newly-active";
        return (
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
            <span className={`text-[10px] leading-snug ${trendText[direction]}`}>
              <span aria-hidden="true">{trendIndicator[direction]} </span>
              {trendDeltaLabel[direction]} in current interval
            </span>
            {note && authTrend.direction !== "unchanged" && (
              <span className={`text-[10px] leading-snug ${trendText[authTrend.direction]}`}>
                {note}
              </span>
            )}
          </div>
        );
      })()}

      {/* Summary metrics row */}
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {summaryItems.map((item) => {
          const isActive = data[item.key] > 0;
          const pct = total > 0 ? ((data[item.key] / total) * 100) : 0;
          return (
            <div key={item.key} className="flex flex-col">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                {item.label}
              </p>
              <p
                className={`mt-auto pt-1 text-lg font-bold tabular-nums tracking-tight ${isActive ? item.color : "text-slate-600"}`}
              >
                {compactNum(data[item.key])}
              </p>
              <p className="mt-0.5 text-[10px] leading-snug text-slate-600">
                {isActive ? item.activeNote : item.idleNote}
              </p>
              {isActive && total > 0 && (
                <p className="text-[10px] tabular-nums text-slate-600">
                  {pct.toFixed(0)}% of total
                </p>
              )}
              {isActive && (() => {
                const ct = categoryTrend(data[item.key], total);
                return ct.note ? (
                  <p className={`text-[10px] leading-snug ${trendText[ct.direction]}`}>
                    <span aria-hidden="true">{trendIndicator[ct.direction]} </span>
                    {ct.note}
                  </p>
                ) : null;
              })()}
            </div>
          );
        })}
      </div>

      {/* Enforcement bar (total as context) */}
      {total > 0 && (
        <div className="mt-5">
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
      <div className="gradient-divider mt-4" />

      {/* Info note */}
      <p className="mt-3 text-[11px] leading-relaxed text-slate-600">
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
