/* ────────────────────────────────────────────────────────────────
 *  TenantUsageSummary - 24h and 7d usage comparison
 *
 *  Side-by-side usage cards for the two canonical ATF reporting
 *  windows. Each card shows requests, enforcements, blocks, and
 *  average latency with operator-grade interpretation headers.
 *  Designed for instant comparative reads.
 * ──────────────────────────────────────────────────────────── */

import type { UsageBucket } from "@/lib/dashboard-client";
import {
  deriveUsageDelta,
  trendText,
  trendIndicator,
  trendDeltaLabel,
} from "@/lib/trend";
import type { TrendDirection } from "@/lib/trend";
import type { PanelStatus } from "@/lib/attention";
import {
  SectionInvestigationHeader,
  type InvestigationState,
} from "@/components/dashboard/section-investigation-header";
import { EvidenceRow } from "@/components/dashboard/evidence-row";

function compactNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

type TenantUsageSummaryProps = {
  usage24h: UsageBucket;
  usage7d: UsageBucket;
};

const metrics: {
  key: keyof Omit<UsageBucket, "period">;
  label: string;
  format: (v: number) => string;
  color: string;
}[] = [
  {
    key: "requests",
    label: "Requests",
    format: compactNum,
    color: "text-slate-100",
  },
  {
    key: "enforcements",
    label: "Enforcements",
    format: compactNum,
    color: "text-sky-300",
  },
  {
    key: "blocks",
    label: "Blocks",
    format: compactNum,
    color: "text-red-300",
  },
  {
    key: "avg_latency_ms",
    label: "Avg Latency",
    format: (v) => `${v.toFixed(1)}ms`,
    color: "text-primary-300",
  },
];

/* ── Investigation derivation ─────────────────────────────── */

function deriveUsageInvestigation(
  usage24h: UsageBucket,
  usage7d: UsageBucket,
): InvestigationState & { evidence?: string } {
  const reqDelta = deriveUsageDelta(usage24h.requests, usage7d.requests);
  const enfDelta = deriveUsageDelta(
    usage24h.enforcements,
    usage7d.enforcements,
  );

  const dailyAvg7dReq = usage7d.requests > 0 ? Math.round(usage7d.requests / 7) : 0;

  let status: PanelStatus = "stable";
  let summary: string;
  let detail: string | undefined;
  let evidence: string | undefined;

  if (usage24h.requests === 0 && usage24h.enforcements === 0) {
    status = "idle";
    summary = "No request or enforcement activity in 24h window.";
    evidence = "0 requests, 0 enforcements in 24h";
  } else if (enfDelta === "increasing" || usage24h.enforcements > 50) {
    status = "review";
    summary = "Elevated enforcement activity detected.";
    detail = activityDetail(reqDelta, enfDelta);
    evidence = `${usage24h.enforcements.toLocaleString()} enforcements 24h \u00b7 ${usage24h.requests.toLocaleString()} requests 24h \u00b7 7d daily avg: ${dailyAvg7dReq.toLocaleString()}`;
  } else if (reqDelta === "increasing") {
    status = "stable";
    summary = "Elevated request activity vs baseline, enforcement within norms.";
    detail = activityDetail(reqDelta, enfDelta);
    evidence = `${usage24h.requests.toLocaleString()} requests 24h vs ${dailyAvg7dReq.toLocaleString()} daily avg`;
  } else if (reqDelta === "decreasing") {
    status = "stable";
    summary = "Reduced request activity vs baseline, enforcement within norms.";
    evidence = `${usage24h.requests.toLocaleString()} requests 24h vs ${dailyAvg7dReq.toLocaleString()} daily avg`;
  } else {
    summary = "Request and enforcement activity at baseline levels.";
    detail = activityDetail(reqDelta, enfDelta);
    evidence = `${usage24h.requests.toLocaleString()} requests 24h \u00b7 ${usage24h.enforcements.toLocaleString()} enforcements 24h`;
  }

  return { status, summary, detail, evidence };
}

function activityDetail(
  reqDelta: TrendDirection,
  enfDelta: TrendDirection,
): string | undefined {
  const parts: string[] = [];
  if (reqDelta === "increasing") parts.push("request pace elevated vs 7d avg");
  else if (reqDelta === "decreasing")
    parts.push("request pace reduced vs 7d avg");
  else if (reqDelta === "newly-active")
    parts.push("new request activity in current window");

  if (enfDelta === "increasing")
    parts.push("enforcement pace elevated vs 7d avg");
  else if (enfDelta === "newly-active")
    parts.push("new enforcement activity in current window");

  return parts.length > 0 ? parts.join(", ") : undefined;
}

export function TenantUsageSummary({
  usage24h,
  usage7d,
}: TenantUsageSummaryProps) {
  /* Derive directional delta between 24 h and 7 d daily average. */
  const deltas = metrics.map((m) => ({
    key: m.key,
    direction: deriveUsageDelta(usage24h[m.key], usage7d[m.key]),
  }));

  const investigation = deriveUsageInvestigation(usage24h, usage7d);

  return (
    <div className="dashboard-panel p-5 sm:p-6">
      <h2 className="text-sm font-semibold text-slate-100">Usage Summary</h2>
      <SectionInvestigationHeader state={investigation} />
      {investigation.evidence && (
        <EvidenceRow basis={investigation.evidence} className="mt-0.5" />
      )}

      <p className="mt-1.5 text-[10px] text-slate-600">
        24h usage vs 7d daily average &middot; Derived from usage counters
      </p>

      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <UsagePeriodCard label="Last 24 Hours" bucket={usage24h} deltas={deltas} />
        <UsagePeriodCard label="Last 7 Days" bucket={usage7d} />
      </div>
    </div>
  );
}

/* ── Single period card ───────────────────────────────────── */

function UsagePeriodCard({
  label,
  bucket,
  deltas,
}: {
  label: string;
  bucket: UsageBucket;
  deltas?: { key: string; direction: ReturnType<typeof deriveUsageDelta> }[];
}) {
  const blockRate =
    bucket.enforcements > 0
      ? ((bucket.blocks / bucket.enforcements) * 100).toFixed(1)
      : "0.0";

  return (
    <div className="dashboard-sub-panel p-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
          {label}
        </p>
        <span className="text-[10px] font-medium tabular-nums text-slate-600">
          {blockRate}% block rate
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-y-3 gap-x-4">
        {metrics.map((m) => {
          const delta = deltas?.find((d) => d.key === m.key);
          return (
            <div key={m.key} className="flex flex-col">
              <p className="text-[10px] font-medium text-slate-500">{m.label}</p>
              <p
                className={`mt-auto pt-0.5 text-lg font-bold tabular-nums tracking-tight ${m.color}`}
              >
                {m.format(bucket[m.key])}
              </p>
              {delta && delta.direction !== "unchanged" && delta.direction !== "unavailable" && (
                <p className={`text-[10px] leading-snug ${trendText[delta.direction]}`}>
                  <span aria-hidden="true">{trendIndicator[delta.direction]} </span>
                  {trendDeltaLabel[delta.direction]} vs 7d avg
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
