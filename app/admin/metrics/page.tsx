import { headers } from "next/headers";
import type { WaitlistMetricsSnapshot } from "@/lib/db";
import { MetricsSummaryCard } from "@/components/metrics-summary-card";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function fetchMetrics(): Promise<WaitlistMetricsSnapshot> {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";
  const cookie = headerStore.get("cookie") ?? "";

  if (!host) {
    throw new Error("missing_host_header");
  }

  const response = await fetch(`${protocol}://${host}/api/metrics`, {
    method: "GET",
    headers: {
      cookie,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`metrics_fetch_failed_${response.status}`);
  }

  return (await response.json()) as WaitlistMetricsSnapshot;
}

export default async function AdminMetricsPage() {
  const metrics = await fetchMetrics();

  return (
    <div className="min-h-screen bg-neutral-950 p-6 text-slate-100 md:p-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Metrics</h1>
        <div className="flex items-center gap-3">
          <a
            href="/admin/waitlist"
            className="rounded border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
          >
            Back to Waitlist
          </a>
          <a
            href="/admin/acquisition"
            className="rounded border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
          >
            Acquisition
          </a>
          <a
            href="/admin/audit"
            className="rounded border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
          >
            Audit Log
          </a>
          <form method="POST" action="/admin/logout">
            <button
              type="submit"
              className="rounded border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
            >
              Logout
            </button>
          </form>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricsSummaryCard label="Total Signups" value={metrics.total_signups} />
        <MetricsSummaryCard
          label="Design Partners"
          value={metrics.design_partner_count}
        />
        <MetricsSummaryCard label="Qualified" value={metrics.by_status.qualified} />
        <MetricsSummaryCard label="Closed" value={metrics.by_status.closed} />
      </div>

      <div className="mb-8 rounded-lg border border-white/10 bg-white/5 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
          Pipeline Snapshot
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <SnapshotCell label="New" value={metrics.by_status.new} />
          <SnapshotCell label="Contacted" value={metrics.by_status.contacted} />
          <SnapshotCell label="Qualified" value={metrics.by_status.qualified} />
          <SnapshotCell label="Closed" value={metrics.by_status.closed} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TopTable
          title="Top UTM Sources"
          emptyLabel="No attributed source data yet."
          rows={metrics.top_utm_sources.map((row) => ({ key: row.source, count: row.count }))}
        />
        <TopTable
          title="Top Campaigns"
          emptyLabel="No campaign data yet."
          rows={metrics.top_campaigns.map((row) => ({ key: row.campaign, count: row.count }))}
        />
      </div>
    </div>
  );
}

function SnapshotCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border border-white/10 bg-neutral-900/60 px-3 py-2">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-lg font-semibold text-slate-100">{value}</p>
    </div>
  );
}

function TopTable({
  title,
  rows,
  emptyLabel,
}: {
  title: string;
  rows: Array<{ key: string; count: number }>;
  emptyLabel: string;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-white/10">
      <div className="border-b border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200">
        {title}
      </div>

      {rows.length === 0 ? (
        <p className="px-4 py-5 text-sm text-slate-400">{emptyLabel}</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5 text-left text-xs uppercase tracking-wider text-slate-400">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3 text-right">Count</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-b border-white/5 last:border-b-0">
                <td className="px-4 py-3 text-slate-200">{row.key}</td>
                <td className="px-4 py-3 text-right font-semibold text-slate-100">
                  {row.count}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
