/* ────────────────────────────────────────────────────────────────
 *  DashboardShell - client orchestrator for the dashboard
 *
 *  Manages 5 s polling, loading/error/empty state composition,
 *  and the complete dashboard layout. Server-rendered initially
 *  via the page.tsx data pass, then refreshes on an interval.
 * ──────────────────────────────────────────────────────────── */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  SystemHealth,
  KpiSummary,
  EnforcementOverview as EnforcementData,
  ActivityTrends,
  TenantsResponse,
  DashboardSummary,
  DashboardResult,
} from "@/lib/dashboard-client";
import { HeroKpis } from "@/components/dashboard/hero-kpis";
import { HealthStrip } from "@/components/dashboard/health-strip";
import { EnforcementOverview } from "@/components/dashboard/enforcement-overview";
import { ActivityChart } from "@/components/dashboard/activity-chart";
import { TenantTable } from "@/components/dashboard/tenant-table";
import { ErrorPanel } from "@/components/dashboard/error-panel";
import {
  KpiGridSkeleton,
  HealthStripSkeleton,
  EnforcementSkeleton,
  ActivityChartSkeleton,
  TenantTableSkeleton,
} from "@/components/dashboard/loading-skeletons";

/* ── Types ────────────────────────────────────────────────── */

export type DashboardData = {
  health: DashboardResult<SystemHealth>;
  kpis: DashboardResult<KpiSummary>;
  enforcement: DashboardResult<EnforcementData>;
  activity: DashboardResult<ActivityTrends>;
  tenants: DashboardResult<TenantsResponse>;
  summary?: DashboardResult<DashboardSummary>;
};

type Props = {
  initial: DashboardData;
};

/* ── Polling interval ─────────────────────────────────────── */

const POLL_MS = 5_000;

/* ── Component ────────────────────────────────────────────── */

export function DashboardShell({ initial }: Props) {
  const [data, setData] = useState<DashboardData>(initial);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/refresh", {
        cache: "no-store",
      });
      if (!res.ok) return;
      const json = (await res.json()) as DashboardData;
      if (mountedRef.current) {
        setData(json);
        setLastRefresh(new Date());
      }
    } catch {
      // Silently continue with stale data
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    const id = setInterval(refresh, POLL_MS);
    return () => {
      mountedRef.current = false;
      clearInterval(id);
    };
  }, [refresh]);

  return (
    <div className="space-y-8">
      {/* ── Page header ─────────────────────────────────────── */}
      <div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[1.75rem] font-bold tracking-tight text-slate-50">
              Operator Dashboard
            </h1>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
              ATF system health, enforcement posture, and tenant overview
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.02] px-3 py-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500">
              Live &middot; Updated{" "}
              {lastRefresh.toLocaleTimeString(undefined, {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false,
              })}
            </span>
          </div>
        </div>
        <div className="mt-6 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      {/* ── Hero KPIs ───────────────────────────────────────── */}
      <section aria-label="Key performance indicators">
        {renderSection(data.kpis, <KpiGridSkeleton />, (d) => (
          <HeroKpis
            data={d}
            trend={data.summary?.ok ? data.summary.data.trend : undefined}
          />
        ))}
      </section>

      {/* ── Health Strip ────────────────────────────────────── */}
      <section aria-label="System health">
        {renderSection(data.health, <HealthStripSkeleton />, (d) => (
          <HealthStrip data={d} />
        ))}
      </section>

      {/* ── Enforcement + Activity (2-col on lg) ────────────── */}
      <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
        <section aria-label="Enforcement posture">
          {renderSection(data.enforcement, <EnforcementSkeleton />, (d) => (
            <EnforcementOverview data={d} />
          ))}
        </section>
        <section aria-label="Activity trends">
          {renderSection(data.activity, <ActivityChartSkeleton />, (d) => (
            <ActivityChart data={d} />
          ))}
        </section>
      </div>

      {/* ── Tenant Table ────────────────────────────────────── */}
      <section aria-label="Tenant summary">
        {renderSection(data.tenants, <TenantTableSkeleton />, (d) => (
          <TenantTable tenants={d.tenants} total={d.total} />
        ))}
      </section>
    </div>
  );
}

/* ── Helper: render data/error/loading per section ────────── */

function renderSection<T>(
  result: DashboardResult<T>,
  skeleton: React.ReactNode,
  render: (data: T) => React.ReactNode,
): React.ReactNode {
  if (!result) return skeleton;
  if (!result.ok) {
    return <ErrorPanel message={result.error} />;
  }
  return render(result.data);
}
