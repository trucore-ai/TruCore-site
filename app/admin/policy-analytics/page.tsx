import React from "react";
import {
  summarise,
  type PolicyAnalyticsSummary,
  getLatestSnapshotMeta,
  getSnapshotPair,
  computeSnapshotDiff,
  type SnapshotDiff,
  type MetricDelta,
  type DimensionDelta,
} from "@/lib/server/policy-analytics-store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/* ── tiny helpers ─────────────────────────────────────────────────── */

interface BucketCounts {
  total: number;
  last_7d: number;
  last_30d: number;
}

function pct(n: number | null): string {
  if (n === null || n === undefined) return "—";
  return `${(n * 100).toFixed(1)}%`;
}

function num(n: number): string {
  return n.toLocaleString("en-US");
}

function fmtIso(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });
}

/* ── metric card ──────────────────────────────────────────────────── */

function MetricCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className="text-xl font-semibold tabular-nums">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </div>
  );
}

/* ── teaser performance table ─────────────────────────────────────── */

/**
 * Side-by-side views / clicks / CTR table for a given dimension.
 * Both maps share the same key space (e.g. dominant gated source name).
 */
function TeaserCompareTable({
  title,
  viewsMap,
  clicksMap,
}: {
  title: string;
  viewsMap: Record<string, BucketCounts>;
  clicksMap: Record<string, BucketCounts>;
}) {
  // Union of all keys, sorted by views descending then clicks descending
  const keys = Array.from(
    new Set([...Object.keys(viewsMap), ...Object.keys(clicksMap)]),
  ).sort((a, b) => {
    const vDiff = (viewsMap[b]?.total ?? 0) - (viewsMap[a]?.total ?? 0);
    return vDiff !== 0
      ? vDiff
      : (clicksMap[b]?.total ?? 0) - (clicksMap[a]?.total ?? 0);
  });

  if (keys.length === 0) {
    return (
      <div className="mb-4">
        <h4 className="text-xs font-semibold text-slate-400 mb-1.5">{title}</h4>
        <p className="text-xs text-slate-500 italic">No data yet.</p>
      </div>
    );
  }

  return (
    <div className="mb-4 overflow-x-auto">
      <h4 className="text-xs font-semibold text-slate-400 mb-1.5">{title}</h4>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-slate-500 border-b border-white/10">
            <th className="text-left py-1.5 pr-4 font-medium">Key</th>
            <th className="text-right py-1.5 px-3 font-medium">Views</th>
            <th className="text-right py-1.5 px-3 font-medium">Clicks</th>
            <th className="text-right py-1.5 pl-3 font-medium">CTR</th>
          </tr>
        </thead>
        <tbody>
          {keys.map((k) => {
            const v = viewsMap[k]?.total ?? 0;
            const c = clicksMap[k]?.total ?? 0;
            const ctr = v > 0 ? pct(c / v) : "—";
            return (
              <tr key={k} className="border-b border-white/5 hover:bg-white/5">
                <td className="py-1.5 pr-4 text-slate-300 font-mono">{k}</td>
                <td className="py-1.5 px-3 text-right tabular-nums">
                  {num(v)}
                </td>
                <td className="py-1.5 px-3 text-right tabular-nums">
                  {num(c)}
                </td>
                <td className="py-1.5 pl-3 text-right tabular-nums text-slate-300 font-semibold">
                  {ctr}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ── bucket table ─────────────────────────────────────────────────── */

function BucketTable({
  title,
  data,
}: {
  title: string;
  data: Record<string, BucketCounts>;
}) {
  const keys = Object.keys(data).sort(
    (a, b) => (data[b]?.total ?? 0) - (data[a]?.total ?? 0),
  );
  if (keys.length === 0) {
    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-slate-300 mb-2">{title}</h3>
        <p className="text-xs text-slate-500 italic">No data yet.</p>
      </div>
    );
  }
  return (
    <div className="mb-6 overflow-x-auto">
      <h3 className="text-sm font-semibold text-slate-300 mb-2">{title}</h3>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-slate-500 border-b border-white/10">
            <th className="text-left py-1.5 pr-4 font-medium">Key</th>
            <th className="text-right py-1.5 px-3 font-medium">Total</th>
            <th className="text-right py-1.5 px-3 font-medium">7d</th>
            <th className="text-right py-1.5 pl-3 font-medium">30d</th>
          </tr>
        </thead>
        <tbody>
          {keys.map((k) => (
            <tr key={k} className="border-b border-white/5 hover:bg-white/5">
              <td className="py-1.5 pr-4 text-slate-300 font-mono">{k}</td>
              <td className="py-1.5 px-3 text-right tabular-nums">
                {num(data[k].total)}
              </td>
              <td className="py-1.5 px-3 text-right tabular-nums text-slate-400">
                {num(data[k].last_7d)}
              </td>
              <td className="py-1.5 pl-3 text-right tabular-nums text-slate-400">
                {num(data[k].last_30d)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── engagement section ───────────────────────────────────────────── */

function EngagementRow({
  label,
  bucket,
}: {
  label: string;
  bucket: BucketCounts;
}) {
  return (
    <tr className="border-b border-white/5">
      <td className="py-1.5 pr-4 text-slate-300 text-xs">{label}</td>
      <td className="py-1.5 px-3 text-right tabular-nums text-xs">
        {num(bucket.total)}
      </td>
      <td className="py-1.5 px-3 text-right tabular-nums text-xs text-slate-400">
        {num(bucket.last_7d)}
      </td>
      <td className="py-1.5 pl-3 text-right tabular-nums text-xs text-slate-400">
        {num(bucket.last_30d)}
      </td>
    </tr>
  );
}

/* ── empty state ──────────────────────────────────────────────────── */

function EmptyState() {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-8 text-center">
      <p className="text-slate-400 text-sm mb-1">No analytics events recorded yet.</p>
      <p className="text-slate-500 text-xs">
        Events are collected when customers interact with policy recommendations.
      </p>
    </div>
  );
}

/* ── trend / diff panel ───────────────────────────────────────────── */

function directionBadge(dir: MetricDelta["direction"]): React.ReactNode {
  if (dir === "up") return <span className="text-emerald-400">▲</span>;
  if (dir === "down") return <span className="text-red-400">▼</span>;
  if (dir === "new") return <span className="text-sky-400">new</span>;
  return <span className="text-slate-500">–</span>;
}

function fmtDelta(d: MetricDelta): string {
  if (d.delta === null) return "—";
  const sign = d.delta > 0 ? "+" : "";
  const abs =
    d.label.includes("Rate")
      ? `${sign}${(d.delta * 100).toFixed(1)}pp`
      : `${sign}${d.delta.toLocaleString("en-US")}`;
  if (d.pct_delta !== null) {
    const pctSign = d.pct_delta > 0 ? "+" : "";
    return `${abs} (${pctSign}${(d.pct_delta * 100).toFixed(1)}%)`;
  }
  return abs;
}

function fmtVal(d: MetricDelta): string {
  if (d.latest === null) return "—";
  if (d.label.includes("Rate")) return pct(d.latest);
  return num(d.latest);
}

function DeltaCard({ d }: { d: MetricDelta }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
      <p className="text-xs text-slate-400 mb-1">{d.label}</p>
      <p className="text-lg font-semibold tabular-nums">
        {directionBadge(d.direction)}{" "}
        {fmtVal(d)}
      </p>
      <p className="text-xs text-slate-500 mt-0.5 tabular-nums">{fmtDelta(d)}</p>
    </div>
  );
}

function DimensionDeltaTable({
  title,
  rows,
}: {
  title: string;
  rows: DimensionDelta[];
}) {
  if (rows.length === 0) {
    return (
      <div className="mb-4">
        <h4 className="text-xs font-semibold text-slate-400 mb-1.5">{title}</h4>
        <p className="text-xs text-slate-500 italic">No data yet.</p>
      </div>
    );
  }
  return (
    <div className="mb-4 overflow-x-auto">
      <h4 className="text-xs font-semibold text-slate-400 mb-1.5">{title}</h4>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-slate-500 border-b border-white/10">
            <th className="text-left py-1.5 pr-4 font-medium">Key</th>
            <th className="text-right py-1.5 px-3 font-medium">Latest</th>
            <th className="text-right py-1.5 px-3 font-medium">Previous</th>
            <th className="text-right py-1.5 pl-3 font-medium">Delta</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className="border-b border-white/5 hover:bg-white/5">
              <td className="py-1.5 pr-4 text-slate-300 font-mono">{r.key}</td>
              <td className="py-1.5 px-3 text-right tabular-nums">{num(r.latest)}</td>
              <td className="py-1.5 px-3 text-right tabular-nums text-slate-400">{num(r.previous)}</td>
              <td
                className={[
                  "py-1.5 pl-3 text-right tabular-nums font-semibold",
                  r.delta > 0
                    ? "text-emerald-400"
                    : r.delta < 0
                      ? "text-red-400"
                      : "text-slate-500",
                ].join(" ")}
              >
                {r.delta > 0 ? "+" : ""}{num(r.delta)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TrendDiffPanel({ diff }: { diff: SnapshotDiff }) {
  return (
    <div
      className="rounded-lg border border-violet-500/30 bg-violet-500/5 px-5 py-4 mb-6"
      data-testid="trend-diff-panel"
    >
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-semibold text-violet-200">
          Trend Since Last Snapshot
        </h2>
        <div className="text-xs text-slate-500 tabular-nums text-right">
          <span className="text-slate-400">Latest:</span>{" "}
          <span className="font-mono">{fmtIso(diff.latest_captured_at)}</span>
          {" "}UTC
          <span className="mx-2 text-slate-600">·</span>
          <span className="text-slate-400">Previous:</span>{" "}
          <span className="font-mono">{fmtIso(diff.previous_captured_at)}</span>
          {" "}UTC
        </div>
      </div>
      <p className="text-xs text-slate-500 mb-4">
        Aggregated-only. Deltas are latest snapshot minus previous snapshot.
      </p>

      {/* headline delta cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {diff.headline.map((d) => (
          <DeltaCard key={d.label} d={d} />
        ))}
      </div>

      {/* dimension tables */}
      <div className="grid md:grid-cols-3 gap-6">
        <DimensionDeltaTable
          title="By Source — top deltas (total events)"
          rows={diff.by_source_top_deltas}
        />
        <DimensionDeltaTable
          title="Teaser Views by Gated Source — top deltas"
          rows={diff.teaser_by_source_deltas}
        />
        <DimensionDeltaTable
          title="Teaser Views by Tier — top deltas"
          rows={diff.teaser_by_tier_deltas}
        />
      </div>
    </div>
  );
}

function TrendDiffEmptyState() {
  return (
    <div
      className="rounded border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-500 mb-6"
      data-testid="trend-diff-empty"
    >
      <strong className="text-slate-400">Trend view unavailable.</strong>{" "}
      Capture at least two snapshots to see a comparison.
    </div>
  );
}

/* ── page ─────────────────────────────────────────────────────────── */

export default async function PolicyAnalyticsPage() {
  const summary: PolicyAnalyticsSummary = summarise();
  const isEmpty = summary.total_events === 0;

  // Fetch latest persisted snapshot metadata (null if none yet / DB unavailable).
  let snapshotMeta: { id: string; captured_at: string; summary_version: string } | null = null;
  // Fetch pair for diff view
  let diff: SnapshotDiff | null = null;
  try {
    snapshotMeta = await getLatestSnapshotMeta();
    const pair = await getSnapshotPair();
    if (pair.latest && pair.previous) {
      diff = computeSnapshotDiff(pair.latest, pair.previous);
    }
  } catch {
    // DB unavailable or not configured — degrade gracefully
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-slate-100 p-6 md:p-10">
      {/* header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          Policy Analytics Summary
        </h1>
        <div className="flex items-center gap-3">
          <a
            href="/admin/waitlist"
            className="rounded bg-white/10 border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/20 transition"
          >
            Waitlist
          </a>
          <a
            href="/admin/audit"
            className="rounded bg-white/10 border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/20 transition"
          >
            Audit Log
          </a>
          <form method="POST" action="/admin/logout">
            <button
              type="submit"
              className="rounded bg-white/10 border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/20 transition"
            >
              Logout
            </button>
          </form>
        </div>
      </div>

      {/* instance note */}
      <div className="rounded border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-300/90 mb-4">
        <strong>Instance-local snapshot.</strong> Counts are in-memory for this
        serverless instance only and may reset on deployment or cold start.
        Not suitable for billing or compliance.
      </div>

      {/* durable snapshot status */}
      <div className="rounded border border-sky-500/30 bg-sky-500/10 px-4 py-2.5 text-xs text-sky-300/90 mb-4 flex items-center justify-between gap-4">
        <span>
          <strong>Durable snapshot:</strong>{" "}
          {snapshotMeta
            ? <>Last persisted <span className="font-mono">{fmtIso(snapshotMeta.captured_at)}</span> UTC &nbsp;·&nbsp; v{snapshotMeta.summary_version}</>
            : "No snapshot persisted yet — use the export link to capture one."}
        </span>
        <a
          href="/api/internal/policy-analytics-snapshot"
          className="rounded bg-sky-500/20 border border-sky-500/40 px-3 py-1 text-xs font-medium text-sky-200 hover:bg-sky-500/30 transition whitespace-nowrap"
          data-testid="snapshot-export-link"
        >
          Export snapshot ↗
        </a>
      </div>

      {/* trend / diff panel */}
      {diff ? <TrendDiffPanel diff={diff} /> : <TrendDiffEmptyState />}

      {isEmpty ? (
        <EmptyState />
      ) : (
        <>
          {/* headline metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            <MetricCard
              label="Total Events"
              value={num(summary.total_events)}
              sub={`since ${fmtIso(summary.instance_started_at)}`}
            />
            <MetricCard
              label="Expand Rate"
              value={pct(summary.derived.expand_rate)}
              sub="expands / impressions"
            />
            <MetricCard
              label="View-Setting Rate"
              value={pct(summary.derived.view_setting_click_rate)}
              sub="view-setting clicks / impressions"
            />
            <MetricCard
              label="Teaser Click Rate"
              value={pct(summary.derived.upgrade_teaser_click_rate)}
              sub="teaser clicks / teaser views"
            />
          </div>

          {/* featured + more engagement */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="text-sm font-semibold text-slate-300 mb-2">
                Featured Engagement
              </h3>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-500 border-b border-white/10">
                    <th className="text-left py-1.5 pr-4 font-medium">Metric</th>
                    <th className="text-right py-1.5 px-3 font-medium">Total</th>
                    <th className="text-right py-1.5 px-3 font-medium">7d</th>
                    <th className="text-right py-1.5 pl-3 font-medium">30d</th>
                  </tr>
                </thead>
                <tbody>
                  <EngagementRow
                    label="Impressions"
                    bucket={summary.derived.featured_impressions}
                  />
                  <EngagementRow
                    label="Expands"
                    bucket={summary.derived.featured_expands}
                  />
                  <EngagementRow
                    label="View-Setting Clicks"
                    bucket={summary.derived.featured_view_setting_clicks}
                  />
                </tbody>
              </table>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-300 mb-2">
                More-Suggestions Engagement
              </h3>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-500 border-b border-white/10">
                    <th className="text-left py-1.5 pr-4 font-medium">Metric</th>
                    <th className="text-right py-1.5 px-3 font-medium">Total</th>
                    <th className="text-right py-1.5 px-3 font-medium">7d</th>
                    <th className="text-right py-1.5 pl-3 font-medium">30d</th>
                  </tr>
                </thead>
                <tbody>
                  <EngagementRow
                    label="All Events (more section)"
                    bucket={summary.derived.more_engagement}
                  />
                </tbody>
              </table>
            </div>
          </div>

          {/* teaser performance */}
          <div className="mb-8 rounded-lg border border-white/10 bg-white/5 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-200 mb-4">
              Gated-Source Teaser Performance
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <TeaserCompareTable
                title="By Dominant Gated Source — Views / Clicks / CTR"
                viewsMap={summary.teaser_performance.views_by_dominant_source}
                clicksMap={summary.teaser_performance.clicks_by_dominant_source}
              />
              <TeaserCompareTable
                title="By Target Upgrade Tier — Views / Clicks / CTR"
                viewsMap={summary.teaser_performance.views_by_tier}
                clicksMap={summary.teaser_performance.clicks_by_tier}
              />
            </div>
            <BucketTable
              title="Clicks by Source Mix (single · few · many)"
              data={summary.teaser_performance.clicks_by_mix}
            />
            <TeaserCompareTable
              title="Views by Source Mix vs Clicks by Source Mix — CTR"
              viewsMap={summary.teaser_performance.views_by_mix}
              clicksMap={summary.teaser_performance.clicks_by_mix}
            />
            <p className="text-xs text-slate-600 mt-1">
              Source mix is now captured on both view and click events. Single = 1 gated source · Few = 2–3 · Many = 4+.
            </p>
          </div>

          {/* aggregate tables */}
          <BucketTable title="By Event Type" data={summary.by_event_type} />
          <BucketTable title="By Source" data={summary.by_source} />
          <BucketTable
            title="By Display Section"
            data={summary.by_display_section}
          />
          <BucketTable
            title="Source × Section Cross-Tab"
            data={summary.by_source_and_section}
          />

          {/* timestamp footer */}
          <p className="text-xs text-slate-600 mt-6">
            Generated {fmtIso(summary.generated_at)} UTC · Instance up since{" "}
            {fmtIso(summary.instance_started_at)} UTC
          </p>
        </>
      )}
    </div>
  );
}
