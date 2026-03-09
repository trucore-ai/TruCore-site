/* ────────────────────────────────────────────────────────────────
 *  TenantUsageSummary - 24h and 7d usage comparison
 *
 *  Side-by-side usage cards for the two canonical ATF reporting
 *  windows. Each card shows requests, enforcements, blocks, and
 *  average latency. Designed for instant comparative reads.
 * ──────────────────────────────────────────────────────────── */

import type { UsageBucket } from "@/lib/dashboard-client";

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

export function TenantUsageSummary({
  usage24h,
  usage7d,
}: TenantUsageSummaryProps) {
  return (
    <div className="dashboard-panel p-5 sm:p-6">
      <h2 className="text-sm font-semibold text-slate-100">Usage Summary</h2>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <UsagePeriodCard label="Last 24 Hours" bucket={usage24h} />
        <UsagePeriodCard label="Last 7 Days" bucket={usage7d} />
      </div>
    </div>
  );
}

/* ── Single period card ───────────────────────────────────── */

function UsagePeriodCard({
  label,
  bucket,
}: {
  label: string;
  bucket: UsageBucket;
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

      <div className="mt-3.5 grid grid-cols-2 gap-y-3.5 gap-x-4">
        {metrics.map((m) => (
          <div key={m.key}>
            <p className="text-[10px] text-slate-500">{m.label}</p>
            <p
              className={`mt-0.5 text-lg font-bold tabular-nums tracking-tight ${m.color}`}
            >
              {m.format(bucket[m.key])}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
