/* ────────────────────────────────────────────────────────────────
 *  QuotaBreakdownCard - effective quotas with source provenance
 *
 *  Displays each quota key, its effective value, the resolving
 *  source (override / env / default), and the default fallback.
 *  Operators can instantly see which quotas are customized and
 *  which are running at baseline. Includes a local investigation
 *  header for at-a-glance operational status.
 * ──────────────────────────────────────────────────────────── */

import type { QuotaEntry, UsageBucket } from "@/lib/dashboard-client";
import { EmptyState } from "@/components/dashboard/empty-state";
import type { PanelStatus } from "@/lib/attention";
import {
  SectionInvestigationHeader,
  type InvestigationState,
} from "@/components/dashboard/section-investigation-header";
import { EvidenceRow } from "@/components/dashboard/evidence-row";

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
  /** Optional 24h usage bucket for quota pressure analysis. */
  usage24h?: UsageBucket;
};

/* ── Investigation derivation ─────────────────────────────── */

function deriveQuotaInvestigation(
  quotas: QuotaEntry[],
  usage24h?: UsageBucket,
): InvestigationState & { evidence?: string } {
  if (quotas.length === 0) {
    return {
      status: "idle" as PanelStatus,
      summary: "No quotas configured. ATF defaults are in effect.",
    };
  }

  const overrides = quotas.filter((q) => q.source === "override").length;
  const envOverrides = quotas.filter((q) => q.source === "env").length;
  const customized = overrides + envOverrides;

  /* Detect quota pressure: when 24h requests exceed 80% of a request quota. */
  let approachingThreshold = false;
  let utilPctDisplay: string | null = null;
  if (usage24h) {
    const requestQuota = quotas.find(
      (q) =>
        q.key.toLowerCase().includes("request") ||
        q.key.toLowerCase().includes("rate"),
    );
    if (requestQuota && requestQuota.effective > 0) {
      const utilPct = usage24h.requests / requestQuota.effective;
      utilPctDisplay = `${(utilPct * 100).toFixed(0)}% of ${requestQuota.key} limit`;
      if (utilPct >= 0.8) approachingThreshold = true;
    }
  }

  let status: PanelStatus = "stable";
  let summary: string;
  let detail: string | undefined;
  let evidence: string | undefined;

  if (approachingThreshold) {
    status = "review";
    summary = "Usage approaching a configured quota threshold.";
    detail =
      customized > 0
        ? `${customized} ${customized === 1 ? "quota" : "quotas"} customized`
        : "All quotas at default values";
    evidence = utilPctDisplay
      ? `${utilPctDisplay} \u00b7 ${quotas.length} quotas evaluated`
      : undefined;
  } else if (customized > 0) {
    summary = `Operating within limits. ${customized} ${customized === 1 ? "quota" : "quotas"} customized.`;
    detail =
      overrides > 0 && envOverrides > 0
        ? `${overrides} tenant override${overrides !== 1 ? "s" : ""}, ${envOverrides} env override${envOverrides !== 1 ? "s" : ""}`
        : undefined;
    evidence = utilPctDisplay
      ? `${utilPctDisplay} \u00b7 ${customized} customized of ${quotas.length}`
      : `${customized} customized of ${quotas.length} quotas`;
  } else {
    summary = "Operating comfortably within default limits.";
    detail = "No quota pressure detected";
    evidence = utilPctDisplay
      ? `${utilPctDisplay} \u00b7 all defaults`
      : `${quotas.length} quotas at default values`;
  }

  return { status, summary, detail, evidence };
}

export function QuotaBreakdownCard({ quotas, usage24h }: QuotaBreakdownCardProps) {
  if (quotas.length === 0) {
    return (
      <div className="dashboard-panel p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-slate-100">
          Effective Quotas
        </h2>
        <SectionInvestigationHeader
          state={deriveQuotaInvestigation(quotas, usage24h)}
        />
        <div className="mt-4">
          <EmptyState
            title="No quotas configured"
            description="This tenant has no explicitly configured quotas. ATF defaults are in effect."
          />
        </div>
      </div>
    );
  }

  const investigation = deriveQuotaInvestigation(quotas, usage24h);

  return (
    <div className="dashboard-panel p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-100">
          Effective Quotas
        </h2>
        <span className="text-[11px] font-medium tabular-nums text-slate-500">
          {quotas.length} {quotas.length === 1 ? "quota" : "quotas"}
        </span>
      </div>
      <SectionInvestigationHeader state={investigation} />
      {investigation.evidence && (
        <EvidenceRow basis={investigation.evidence} className="mt-0.5" />
      )}

      <p className="mt-1.5 text-[10px] text-slate-600">
        Effective limits from policy resolution &middot; Pressure derived from 24h usage window
      </p>

      {/* Separator */}
      <div className="gradient-divider mt-4" />

      {/* Quota rows */}
      <div className="mt-4 space-y-2">
        {quotas.map((q) => {
          const badge = sourceBadge[q.source];
          const isCustomized = q.source !== "default";

          return (
            <div
              key={q.key}
              className="dashboard-sub-panel flex items-center justify-between px-4 py-3.5"
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
      <div className="mt-4 flex flex-wrap gap-4 border-t border-white/[0.04] pt-3">
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
