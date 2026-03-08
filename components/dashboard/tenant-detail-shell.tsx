/* ────────────────────────────────────────────────────────────────
 *  TenantDetailShell - client orchestrator for tenant drill-down
 *
 *  Mirrors the DashboardShell pattern: server-rendered initially,
 *  then polls /api/dashboard/tenant?id=<id> every 5 s for live
 *  data. Composes the hero, quotas, usage, and posture panels.
 * ──────────────────────────────────────────────────────────── */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TenantDetail, DashboardResult } from "@/lib/dashboard-client";
import { TenantDetailHero } from "@/components/dashboard/tenant-detail-hero";
import { QuotaBreakdownCard } from "@/components/dashboard/quota-breakdown-card";
import { TenantUsageSummary } from "@/components/dashboard/tenant-usage-summary";
import { TenantPosturePanel } from "@/components/dashboard/tenant-posture-panel";
import { ErrorPanel } from "@/components/dashboard/error-panel";
import {
  TenantDetailHeroSkeleton,
  QuotaBreakdownSkeleton,
  UsageSummarySkeleton,
  PosturePanelSkeleton,
} from "@/components/dashboard/loading-skeletons";

/* ── Types ────────────────────────────────────────────────── */

type Props = {
  tenantId: string;
  initial: DashboardResult<TenantDetail>;
};

const POLL_MS = 5_000;

/* ── Component ────────────────────────────────────────────── */

export function TenantDetailShell({ tenantId, initial }: Props) {
  const [result, setResult] = useState<DashboardResult<TenantDetail>>(initial);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/dashboard/tenant?id=${encodeURIComponent(tenantId)}`,
        { cache: "no-store" },
      );
      if (!res.ok) return;
      const json = (await res.json()) as DashboardResult<TenantDetail>;
      if (mountedRef.current) {
        setResult(json);
        setLastRefresh(new Date());
      }
    } catch {
      // Silently continue with stale data
    }
  }, [tenantId]);

  useEffect(() => {
    mountedRef.current = true;
    const id = setInterval(refresh, POLL_MS);
    return () => {
      mountedRef.current = false;
      clearInterval(id);
    };
  }, [refresh]);

  /* ── Error state ──────────────────────────────────────── */
  if (!result.ok) {
    return (
      <div className="space-y-8">
        <ErrorPanel
          title="Unable to load tenant details"
          message={result.error}
        />

        {/* Skeleton placeholder to maintain visual structure */}
        <TenantDetailHeroSkeleton />
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
          <QuotaBreakdownSkeleton />
          <UsageSummarySkeleton />
        </div>
        <PosturePanelSkeleton />
      </div>
    );
  }

  const tenant = result.data;

  /* ── Loaded state ─────────────────────────────────────── */
  return (
    <div className="space-y-8">
      {/* Live indicator */}
      <div className="flex items-center justify-end gap-2 rounded-full border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 self-end w-fit ml-auto">
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

      {/* Hero identity card */}
      <section aria-label="Tenant identity">
        <TenantDetailHero tenant={tenant} />
      </section>

      {/* Quotas + Usage (2-col on lg) */}
      <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
        <section aria-label="Effective quotas">
          <QuotaBreakdownCard quotas={tenant.quotas} />
        </section>
        <section aria-label="Usage summary">
          <TenantUsageSummary
            usage24h={tenant.usage_24h}
            usage7d={tenant.usage_7d}
          />
        </section>
      </div>

      {/* Posture panel */}
      <section aria-label="Operational posture">
        <TenantPosturePanel posture={tenant.posture_summary} />
      </section>

      {/* Metadata (if present) */}
      {tenant.metadata && Object.keys(tenant.metadata).length > 0 && (
        <section aria-label="Control-plane metadata">
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-5 shadow-sm shadow-black/10 sm:p-6">
            <h2 className="text-sm font-semibold text-slate-100">
              Control-Plane Metadata
            </h2>
            <div className="mt-4 h-px bg-white/[0.05]" />
            <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(tenant.metadata).map(([key, value]) => (
                <div
                  key={key}
                  className="rounded-lg border border-white/[0.04] bg-white/[0.015] px-4 py-3.5 transition-all duration-200 hover:border-white/[0.08] hover:bg-white/[0.03]"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    {key.replace(/_/g, " ")}
                  </p>
                  <p className="mt-1.5 truncate text-sm font-mono text-slate-300">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
