/* ────────────────────────────────────────────────────────────────
 *  TenantTable - scannable tenant summary
 *
 *  Compact, high-density table optimized for quick scanning.
 *  Each row is a drill-down entry point. Designed for desktop
 *  first with a graceful mobile card fallback.
 * ──────────────────────────────────────────────────────────── */

import Link from "next/link";
import type { TenantSummary } from "@/lib/dashboard-client";
import { StatusChip } from "@/components/dashboard/status-chip";
import { EmptyState } from "@/components/dashboard/empty-state";

function compactNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function relativeTime(iso: string | null): string {
  if (!iso) return "Never";
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

type TenantTableProps = {
  tenants: TenantSummary[];
  total: number;
};

export function TenantTable({ tenants, total }: TenantTableProps) {
  if (tenants.length === 0) {
    return (
      <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-5 shadow-sm shadow-black/10 sm:p-6">
        <h2 className="text-sm font-semibold text-slate-100">Tenants</h2>
        <div className="mt-4">
          <EmptyState
            title="No tenants found"
            description="No tenant data is available from ATF at this time."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-5 shadow-sm shadow-black/10 sm:p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-100">Tenants</h2>
        <span className="text-[11px] font-medium tabular-nums text-slate-500">
          {total.toLocaleString()} total
        </span>
      </div>

      {/* Separator */}
      <div className="mt-4 h-px bg-white/[0.05]" />

      {/* Desktop table */}
      <div className="mt-4 hidden sm:block overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/[0.06] text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              <th className="pb-3 pr-4 font-semibold">Tenant</th>
              <th className="pb-3 pr-4 font-semibold">Status</th>
              <th className="pb-3 pr-4 text-right font-semibold">Requests</th>
              <th className="pb-3 pr-4 text-right font-semibold">Enforced</th>
              <th className="pb-3 pr-4 text-right font-semibold">Latency</th>
              <th className="pb-3 text-right font-semibold">Last Seen</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((t) => (
              <tr
                key={t.id}
                className="group border-b border-white/[0.03] transition-all duration-200 hover:bg-white/[0.025] cursor-pointer"
              >
                <td className="py-3.5 pr-4">
                  <Link
                    href={`/dashboard/tenants/${encodeURIComponent(t.id)}`}
                    className="block min-w-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/40"
                  >
                    <p className="truncate text-sm font-medium text-slate-200 group-hover:text-primary-200 transition-colors duration-200">
                      {t.name}
                    </p>
                    <p className="mt-0.5 truncate text-[10px] font-mono text-slate-600">
                      {t.id}
                    </p>
                  </Link>
                </td>
                <td className="py-3.5 pr-4">
                  <StatusChip status={t.status} />
                </td>
                <td className="py-3.5 pr-4 text-right text-sm tabular-nums text-slate-300">
                  {compactNum(t.requests_24h)}
                </td>
                <td className="py-3.5 pr-4 text-right text-sm tabular-nums text-slate-300">
                  {compactNum(t.enforcements_24h)}
                </td>
                <td className="py-3.5 pr-4 text-right text-sm tabular-nums text-slate-300">
                  {t.avg_latency_ms.toFixed(1)}ms
                </td>
                <td className="py-3.5 text-right text-[11px] text-slate-500">
                  {relativeTime(t.last_seen)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="mt-4 space-y-2.5 sm:hidden">
        {tenants.map((t) => (
          <Link
            key={t.id}
            href={`/dashboard/tenants/${encodeURIComponent(t.id)}`}
            className="block rounded-lg border border-white/[0.05] bg-white/[0.015] p-4 transition-all duration-200 hover:border-white/[0.08] hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/40"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="truncate text-sm font-medium text-slate-200">
                {t.name}
              </p>
              <StatusChip status={t.status} />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3 text-[11px]">
              <div>
                <p className="text-slate-500">Requests</p>
                <p className="mt-0.5 font-semibold tabular-nums text-slate-300">
                  {compactNum(t.requests_24h)}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Enforced</p>
                <p className="mt-0.5 font-semibold tabular-nums text-slate-300">
                  {compactNum(t.enforcements_24h)}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Latency</p>
                <p className="mt-0.5 font-semibold tabular-nums text-slate-300">
                  {t.avg_latency_ms.toFixed(1)}ms
                </p>
              </div>
            </div>
            <p className="mt-2.5 text-[10px] text-slate-600">
              Last seen {relativeTime(t.last_seen)}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
