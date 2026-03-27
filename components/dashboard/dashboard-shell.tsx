/* ────────────────────────────────────────────────────────────────
 *  DashboardShell - client orchestrator for the dashboard
 *
 *  Manages 5 s polling, loading/error/empty state composition,
 *  and the complete dashboard layout. Server-rendered initially
 *  via the page.tsx data pass, then refreshes on an interval.
 *
 *  The top of the page answers "What is happening right now?"
 *  via the OperatorSummary strip. Each unavailable section
 *  renders a context-specific fallback explaining capability
 *  status and prerequisites.
 * ──────────────────────────────────────────────────────────── */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  SystemHealth,
  LiveKpiItem,
  LiveEnforcement,
  LiveTrend,
  ActivityTrends,
  TenantsResponse,
  DashboardSummary,
  DashboardResult,
  AdoptionFunnel,
} from "@/lib/dashboard-client";
import { HeroKpis } from "@/components/dashboard/hero-kpis";
import { HealthStrip } from "@/components/dashboard/health-strip";
import { EnforcementOverview } from "@/components/dashboard/enforcement-overview";
import { ActivityChart } from "@/components/dashboard/activity-chart";
import { TenantTable } from "@/components/dashboard/tenant-table";
import { ErrorPanel } from "@/components/dashboard/error-panel";
import { UnavailablePanel } from "@/components/dashboard/unavailable-panel";
import { SectionExplainer } from "@/components/dashboard/section-explainer";
import { OperatorSummary } from "@/components/dashboard/operator-summary";
import { AdoptionFunnelPanel } from "@/components/dashboard/adoption-funnel";
import { GrowthTriagePanel } from "@/components/dashboard/growth-triage-panel";
import { SourceConversionRollups } from "@/components/dashboard/source-conversion-rollups";
import {
  KpiGridSkeleton,
  HealthStripSkeleton,
  EnforcementSkeleton,
  ActivityChartSkeleton,
  TenantTableSkeleton,
} from "@/components/dashboard/loading-skeletons";
import { AttentionQueue } from "@/components/dashboard/attention-queue";
import { TopChanges } from "@/components/dashboard/top-changes";
import {
  deriveAttentionQueue,
  deriveTopChanges,
} from "@/lib/dashboard-queue";
import { formatSecondsAgo } from "@/lib/freshness";

/* ── Types ────────────────────────────────────────────────── */

export type DashboardData = {
  health: DashboardResult<SystemHealth>;
  kpis: DashboardResult<LiveKpiItem[]>;
  enforcement: DashboardResult<LiveEnforcement>;
  activity: DashboardResult<ActivityTrends>;
  tenants: DashboardResult<TenantsResponse>;
  summary: DashboardResult<DashboardSummary>;
  trend?: DashboardResult<LiveTrend>;
  adoption?: DashboardResult<AdoptionFunnel>;
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
  const [secondsAgo, setSecondsAgo] = useState(0);
  const mountedRef = useRef(true);

  /* ── Derived queue + changes (recomputed on each data update) ── */
  const queueItems = deriveAttentionQueue(
    data.health,
    data.enforcement,
    data.trend,
    data.tenants,
  );
  const changeItems = deriveTopChanges(
    data.health,
    data.enforcement,
    data.trend,
    data.tenants,
  );

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

  /* ── Ticking freshness counter ──────────────────────────── */
  useEffect(() => {
    const id = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastRefresh.getTime()) / 1_000));
    }, 1_000);
    return () => clearInterval(id);
  }, [lastRefresh]);

  return (
    <div className="space-y-8">
      {/* ── Page header ─────────────────────────────────────── */}
      <div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold tracking-tight text-slate-50">
              Operator Dashboard
            </h1>
            <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
              Platform-wide system health, enforcement posture, and tenant overview &mdash; operator access only
            </p>
          </div>
          <div className="flex max-w-full flex-wrap items-center gap-2 rounded-full border border-primary-300/10 bg-primary-500/[0.04] px-3.5 py-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <span className="break-words text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500">
              Live &middot; Updated {formatSecondsAgo(secondsAgo)} &middot; Polling every 5s
            </span>
          </div>
        </div>
        <p className="mt-3 text-[10px] leading-relaxed text-slate-600">
          Platform-scoped operator summaries derived from current service state. All tenants visible. Section signals refresh with each polling cycle.
        </p>
        <div className="gradient-divider mt-3" />
      </div>

      {/* ── Operator Summary ────────────────────────────────── */}
      <OperatorSummary
        health={data.health}
        enforcement={data.enforcement}
        trend={data.trend}
        tenants={data.tenants}
      />

      {/* ── Attention Queue + Top Changes ───────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <AttentionQueue items={queueItems} />
        <TopChanges items={changeItems} />
      </div>

      {/* ── Hero KPIs ───────────────────────────────────────── */}
      <section id="kpis" className="scroll-mt-6" aria-label="Key performance indicators">
        {renderSection(
          data.kpis,
          <KpiGridSkeleton />,
          (d) => (
            <HeroKpis
              kpis={d}
              trend={data.trend?.ok ? data.trend.data : undefined}
            />
          ),
          {
            title: "KPI signals not available",
            message:
              "The current deployment is not emitting KPI data. This usually means the summary endpoint does not include a kpis array. KPI cards will appear automatically when available.",
            capabilities: ["kpis", "trend counters"],
          },
        )}
        <SectionExplainer label="About KPIs &amp; trends">
          <p>
            Top-level activity, latency, and enforcement signals from the
            current ATF deployment.
          </p>
          <p>
            This is the fastest way to understand whether the system is active,
            stable, and behaving as expected.
          </p>
          <p>
            Use the KPI cards for quick status and the trend strip for recent
            request and enforcement momentum across current hour/day windows.
          </p>
        </SectionExplainer>
      </section>

      {/* ── Health Strip ────────────────────────────────────── */}
      <section id="health" className="scroll-mt-6" aria-label="System health">
        {renderSection(
          data.health,
          <HealthStripSkeleton />,
          (d) => <HealthStrip data={d} />,
          {
            title: "Health telemetry not available",
            message:
              "This environment is not reporting health check data. The ATF instance may be running without the /dashboard/health endpoint or the summary does not include overall_status fields.",
            capabilities: ["overall_status", "backends", "build version"],
          },
        )}
        <SectionExplainer label="About system health">
          <p>
            Backend mode, dependency state, startup validation, and overall
            service health for the active deployment.
          </p>
          <p>
            This tells you whether ATF is operating cleanly and whether
            supporting infrastructure is available.
          </p>
          <p>
            Healthy overall status means the service is running. Warnings
            usually indicate optional or non-critical backends are unavailable
            in the current deployment.
          </p>
        </SectionExplainer>
      </section>

      {/* ── Enforcement + Activity (2-col on lg) ────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section id="enforcement" className="scroll-mt-6" aria-label="Enforcement posture">
          {renderSection(
            data.enforcement,
            <EnforcementSkeleton />,
            (d) => <EnforcementOverview data={d} />,
            {
              title: "Enforcement data not available",
              message:
                "The current deployment is not emitting enforcement counters. This section will populate with auth failures, rate limiting, quota violations, and reprovision counts once the enforcement object is present in the summary response.",
              capabilities: [
                "auth failures",
                "rate limiting",
                "quota violations",
                "reprovisions",
              ],
            },
          )}
          <SectionExplainer label="About enforcement">
            <p>
              Current auth failures, rate-limit rejections, quota violations,
              and reprovision operations.
            </p>
            <p>
              These signals show how often the system is rejecting,
              constraining, or reconfiguring activity.
            </p>
            <p>
              Higher auth failures usually mean invalid or missing credentials.
              Quota and rate-limit values reflect active guardrail pressure
              rather than service failure.
            </p>
          </SectionExplainer>
        </section>
        <section id="activity" className="scroll-mt-6" aria-label="Activity trends">
          {renderSection(
            data.activity,
            <ActivityChartSkeleton />,
            (d) => <ActivityChart data={d} />,
            {
              title: "Activity trend data not available",
              message:
                "Time-series activity data is not included in the current deployment's summary endpoint. This section will show request, enforcement, and latency trends over time once the /dashboard/activity endpoint or equivalent is enabled.",
              capabilities: [
                "time-series requests",
                "enforcement trends",
                "latency distribution",
              ],
            },
          )}
          <SectionExplainer label="About activity">
            <p>
              Recent request and enforcement movement across the latest
              available time windows.
            </p>
            <p>
              Trend data helps distinguish steady baseline traffic from bursts,
              drops, or unusual enforcement patterns.
            </p>
            <p>
              Compare current-hour and current-day values to understand whether
              activity is concentrated, stable, or tapering.
            </p>
          </SectionExplainer>
        </section>
      </div>

      {/* ── Tenant Table ────────────────────────────────────── */}
      <section id="tenants" className="scroll-mt-6" aria-label="Tenant summary">
        {renderSection(
          data.tenants,
          <TenantTableSkeleton />,
          (d) => <TenantTable tenants={d.tenants} total={d.total} />,
          {
            title: "Tenant data not available",
            message:
              "The /dashboard/tenants endpoint is not reachable or did not return data. Tenant summaries, triage ordering, and drill-down will appear here once tenant records are present.",
            capabilities: [
              "tenant listing",
              "enforcement per tenant",
              "status tracking",
            ],
          },
        )}
        <SectionExplainer label="About tenants">
          <p>
            A summary view of tenants, their recent activity, and current
            posture within the active ATF deployment.
          </p>
          <p>
            This is the quickest operator view into who is using the system
            and where attention may be needed.
          </p>
          <p>
            Tenants are sorted by priority: suspended tenants first, then those
            with enforcement events, then by request volume. Use it to triage
            quickly and drill into detail pages.
          </p>
        </SectionExplainer>
      </section>

      {/* ── Growth Triage ───────────────────────────────────── */}
      <section id="growth-triage" className="scroll-mt-6" aria-label="Growth triage">
        {data.adoption && renderSection(
          data.adoption,
          null,
          (d) => <GrowthTriagePanel data={d} />,
          {
            title: "Growth triage not available",
            message:
              "The /dashboard/adoption endpoint is not reachable or did not return data. Follow-up prioritization, triage segments, and the operator queue will appear here once adoption data is available.",
            capabilities: [
              "follow-up priority",
              "triage segments",
              "operator queue",
            ],
          },
        )}
        <SectionExplainer label="About growth triage">
          <p>
            Deterministic follow-up prioritization for early user acquisition.
            Tenants are scored as high, medium, or low priority based on their
            activation stage, stall duration, and integration completeness.
          </p>
          <p>
            Use this to quickly identify who needs outreach, who is stuck in
            the funnel, and who is converting well. Filter by priority or
            segment to focus your review.
          </p>
          <p>
            This section is operator-only. Priority rules are transparent,
            documented, and derived from existing adoption data.
          </p>
        </SectionExplainer>
      </section>

      {/* ── Source Conversion Rollups ──────────────────────── */}
      <section id="source-rollups" className="scroll-mt-6" aria-label="Source conversion rollups">
        {data.adoption && renderSection(
          data.adoption,
          null,
          (d) => <SourceConversionRollups data={d} />,
          {
            title: "Source rollups not available",
            message:
              "Source conversion data requires the /dashboard/adoption endpoint. This section will show per-source activation metrics once adoption data is available.",
            capabilities: [
              "source conversion rates",
              "per-source activation",
              "integration path analysis",
            ],
          },
        )}
        <SectionExplainer label="About source rollups">
          <p>
            Per-source activation outcomes showing which integration paths
            (CLI, HTTP, Python SDK, TypeScript SDK, OpenClaw) are producing
            the best tenant activation rates.
          </p>
          <p>
            Conversion rate is verifies ÷ protects. Sources are inferred from
            endpoint patterns and the X-ATF-Client header.
          </p>
        </SectionExplainer>
      </section>

      {/* ── Adoption Funnel ─────────────────────────────────── */}
      <section id="adoption" className="scroll-mt-6" aria-label="Adoption metrics">
        {data.adoption && renderSection(
          data.adoption,
          null,
          (d) => <AdoptionFunnelPanel data={d} />,
          {
            title: "Adoption metrics not available",
            message:
              "The /dashboard/adoption endpoint is not reachable or did not return data. Adoption funnel, tenant activation milestones, and platform-wide usage aggregates will appear here once the endpoint is enabled.",
            capabilities: [
              "activation funnel",
              "tenant milestones",
              "platform aggregates",
            ],
          },
        )}
        <SectionExplainer label="About adoption metrics">
          <p>
            Platform-wide adoption and activation signals for early-user-acquisition
            measurement. Shows the funnel from onboarding through key milestones.
          </p>
          <p>
            Use this to understand how many tenants are reaching each activation
            stage and where the funnel drops off.
          </p>
          <p>
            This section is operator-only and shows data across all tenants.
            Tenant users never see this view.
          </p>
        </SectionExplainer>
      </section>
    </div>
  );
}

/* ── Helper: render data/error/loading per section ────────── */

/**
 * Patterns that indicate a section is simply not available in the
 * current ATF deployment, not a real operational failure. These
 * should show a calm neutral state rather than a red error card.
 */
const EXPECTED_UNAVAILABLE_RE =
  /not available|HTTP 404|not found|not supported|not yet/i;

/**
 * Context-specific props for the UnavailablePanel so each section
 * explains what it covers and why it is inactive.
 */
type UnavailableFallback = {
  title: string;
  message: string;
  capabilities?: string[];
};

function renderSection<T>(
  result: DashboardResult<T>,
  skeleton: React.ReactNode,
  render: (data: T) => React.ReactNode,
  fallback?: UnavailableFallback,
): React.ReactNode {
  if (!result) return skeleton;
  if (!result.ok) {
    if (EXPECTED_UNAVAILABLE_RE.test(result.error)) {
      return (
        <UnavailablePanel
          title={fallback?.title}
          message={fallback?.message}
          capabilities={fallback?.capabilities}
        />
      );
    }
    return <ErrorPanel message={result.error} />;
  }
  return render(result.data);
}
