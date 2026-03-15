/* ────────────────────────────────────────────────────────────────
 *  TenantDetailShell - client orchestrator for tenant drill-down
 *
 *  Mirrors the DashboardShell pattern: server-rendered initially,
 *  then polls /api/dashboard/tenant?id=<id> every 5 s for live
 *  data. Composes the hero, quotas, usage, and posture panels.
 * ──────────────────────────────────────────────────────────── */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TenantDetail, TenantActivationSnapshot, DashboardResult } from "@/lib/dashboard-client";
import { TenantDetailHero } from "@/components/dashboard/tenant-detail-hero";
import { TenantOperatorSummary } from "@/components/dashboard/tenant-operator-summary";
import { QuotaBreakdownCard } from "@/components/dashboard/quota-breakdown-card";
import { TenantUsageSummary } from "@/components/dashboard/tenant-usage-summary";
import { TenantPosturePanel } from "@/components/dashboard/tenant-posture-panel";
import { TenantGrowthContext } from "@/components/dashboard/tenant-growth-context";
import { ErrorPanel } from "@/components/dashboard/error-panel";
import {
  TenantDetailHeroSkeleton,
  QuotaBreakdownSkeleton,
  UsageSummarySkeleton,
  PosturePanelSkeleton,
} from "@/components/dashboard/loading-skeletons";
import { SectionExplainer } from "@/components/dashboard/section-explainer";
import { formatSecondsAgo } from "@/lib/freshness";

/* ── Types ────────────────────────────────────────────────── */

type Props = {
  tenantId: string;
  initial: DashboardResult<TenantDetail>;
  adoptionSnapshot?: TenantActivationSnapshot | null;
};

const POLL_MS = 5_000;

/* ── Component ────────────────────────────────────────────── */

export function TenantDetailShell({ tenantId, initial, adoptionSnapshot }: Props) {
  const [result, setResult] = useState<DashboardResult<TenantDetail>>(initial);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [secondsAgo, setSecondsAgo] = useState(0);
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

  /* ── Ticking freshness counter ──────────────────────────── */
  useEffect(() => {
    const id = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastRefresh.getTime()) / 1_000));
    }, 1_000);
    return () => clearInterval(id);
  }, [lastRefresh]);

  /* ── Error state ──────────────────────────────────────── */
  if (!result.ok) {
    return (
      <div className="space-y-6">
        <ErrorPanel
          title="Unable to load tenant details"
          message={result.error}
        />

        {/* Skeleton placeholder to maintain visual structure */}
        <TenantDetailHeroSkeleton />
        <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
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
    <div className="space-y-6">
      {/* Live indicator */}
      <div className="flex items-center justify-end gap-2 rounded-full border border-primary-300/10 bg-primary-500/[0.04] px-3.5 py-1.5 self-end w-fit ml-auto">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </span>
        <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500">
          Live &middot; Updated {formatSecondsAgo(secondsAgo)} &middot; Polling every 5s
        </span>
      </div>

      <p className="text-[10px] leading-relaxed text-slate-600 text-right">
        Tenant detail derived from current service state and activity signals
      </p>

      {/* Hero identity card */}
      <section aria-label="Tenant identity">
        <TenantDetailHero tenant={tenant} />
      </section>

      {/* Operator summary strip */}
      <section aria-label="Tenant operator summary">
        <TenantOperatorSummary tenant={tenant} />
      </section>

      {/* Quotas + Usage (2-col on lg) */}
      <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
        <section aria-label="Effective quotas">
          <QuotaBreakdownCard quotas={tenant.quotas} usage24h={tenant.usage_24h} />
          <SectionExplainer label="About quotas">
            <p>
              Effective tenant limits and the source of each value, including
              defaults, env overrides, or tenant-specific overrides.
            </p>
            <p>
              Quotas define the hard operational boundaries applied to a
              tenant.
            </p>
            <p>
              Focus on the effective value first, then use the source label to
              understand whether the limit comes from baseline policy or an
              explicit override.
            </p>
          </SectionExplainer>
        </section>
        <section aria-label="Usage summary">
          <TenantUsageSummary
            usage24h={tenant.usage_24h}
            usage7d={tenant.usage_7d}
          />
          <SectionExplainer label="About usage">
            <p>
              Request, enforcement, block, and latency activity for the
              selected tenant across current reporting windows.
            </p>
            <p>
              Usage shows whether a tenant is active, how heavily they are
              interacting with the system, and whether policy pressure is
              increasing.
            </p>
            <p>
              Compare short-window and longer-window usage to spot bursts,
              sustained load, or unusually quiet periods.
            </p>
          </SectionExplainer>
        </section>
      </div>

      {/* Posture panel */}
      <section aria-label="Operational posture">
        <TenantPosturePanel posture={tenant.posture_summary} />
        <SectionExplainer label="About posture">
          <p>
            A summarized operational posture score plus warnings that indicate
            elevated attention areas.
          </p>
          <p>
            Posture helps operators quickly judge whether a tenant appears
            stable, constrained, or risky.
          </p>
          <p>
            Use warnings as the primary signal. The score is a summary aid,
            not a replacement for the underlying activity and quota context.
          </p>
        </SectionExplainer>
      </section>

      {/* Growth / follow-up context (when adoption data available) */}
      {adoptionSnapshot && (
        <section aria-label="Growth and follow-up context">
          <TenantGrowthContext snapshot={adoptionSnapshot} />
        </section>
      )}

      {/* Metadata (if present) */}
      {tenant.metadata && Object.keys(tenant.metadata).length > 0 && (
        <section aria-label="Control-plane metadata">
          <div className="dashboard-panel p-5 sm:p-6">
            <h2 className="text-sm font-semibold text-slate-100">
              Control-Plane Metadata
            </h2>
            <div className="gradient-divider mt-3.5" />
            <div className="mt-3.5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(tenant.metadata).map(([key, value]) => (
                <div
                  key={key}
                  className="dashboard-sub-panel px-4 py-3.5"
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
