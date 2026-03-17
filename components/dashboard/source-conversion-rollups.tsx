/* ────────────────────────────────────────────────────────────────
 *  SourceConversionRollups — operator-only source attribution
 *  conversion analysis
 *
 *  Shows per-source activation metrics so the operator can see
 *  which integration paths are producing the best outcomes.
 *  Derived from existing adoption data. Operator-only.
 * ──────────────────────────────────────────────────────────── */

"use client";

import type { AdoptionFunnel } from "@/lib/dashboard-client";
import { computeSourceRollups, type SourceRollup } from "@/lib/growth-triage";

type Props = { data: AdoptionFunnel };

function compactNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function pct(part: number, whole: number): string {
  if (whole <= 0) return "—";
  return `${Math.round((part / whole) * 100)}%`;
}

const SOURCE_COLORS: Record<string, string> = {
  cli: "bg-cyan-500/20 text-cyan-400",
  http: "bg-blue-500/20 text-blue-400",
  python: "bg-yellow-500/20 text-yellow-400",
  typescript: "bg-indigo-500/20 text-indigo-400",
  openclaw: "bg-purple-500/20 text-purple-400",
  unknown: "bg-white/5 text-slate-500",
};

function RollupRow({ r, maxTenants }: { r: SourceRollup; maxTenants: number }) {
  const barWidth = maxTenants > 0 ? Math.max((r.tenantCount / maxTenants) * 100, 2) : 2;
  const convRate = r.protectCount > 0
    ? pct(r.verifyCount, r.protectCount)
    : "—";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${SOURCE_COLORS[r.source] ?? SOURCE_COLORS.unknown}`}
          >
            {r.source}
          </span>
          <span className="text-[10px] text-slate-500">
            {r.tenantCount} {r.tenantCount === 1 ? "tenant" : "tenants"}
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-400">
          {convRate} conv
        </span>
      </div>
      {/* Mini bar chart */}
      <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full bg-primary-500/40 transition-all duration-500"
          style={{ width: `${barWidth}%` }}
        />
      </div>
      {/* Metric row */}
      <div className="flex gap-4 text-[10px]">
        <span className="text-slate-500">
          Protects{" "}
          <span className="font-mono text-slate-400">{compactNum(r.protectCount)}</span>
        </span>
        <span className="text-slate-500">
          Receipts{" "}
          <span className="font-mono text-slate-400">{compactNum(r.receiptCount)}</span>
        </span>
        <span className="text-slate-500">
          Verifies{" "}
          <span className="font-mono text-slate-400">{compactNum(r.verifyCount)}</span>
        </span>
        {r.stalledCount > 0 && (
          <span className="text-amber-400/70">
            Stalled{" "}
            <span className="font-mono">{r.stalledCount}</span>
          </span>
        )}
        {r.repeatActiveCount > 0 && (
          <span className="text-emerald-400/70">
            Repeat{" "}
            <span className="font-mono">{r.repeatActiveCount}</span>
          </span>
        )}
      </div>
    </div>
  );
}

export function SourceConversionRollups({ data }: Props) {
  const rollups = computeSourceRollups(data.tenant_snapshots);

  if (rollups.length === 0) {
    return null;
  }

  const maxTenants = Math.max(...rollups.map((r) => r.tenantCount), 1);

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
      <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
        Source Conversion Rollups
      </h3>
      <p className="mb-4 text-[9px] leading-relaxed text-slate-600">
        Activation outcomes by integration source. Conversion rate
        = verifies ÷ protects. Sources inferred from endpoint
        patterns and X-ATF-Client header. Not guaranteed accurate
        for tenants without explicit attribution.
      </p>
      <div className="space-y-4">
        {rollups.map((r) => (
          <RollupRow key={r.source} r={r} maxTenants={maxTenants} />
        ))}
      </div>
    </div>
  );
}
