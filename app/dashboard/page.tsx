import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { fetchFullDashboard } from "@/lib/dashboard-client";
import {
  DashboardShell,
  type DashboardData,
} from "@/components/dashboard/dashboard-shell";

/* ────────────────────────────────────────────────────────────────
 *  /dashboard - ATF Operator Dashboard
 *
 *  Server-side initial data fetch with 5 s ISR revalidation.
 *  Uses the consolidated /dashboard/summary + /dashboard/tenants
 *  endpoints to derive all panel data.
 *  The DashboardShell client component takes over with live
 *  polling after hydration.
 * ──────────────────────────────────────────────────────────── */

export const metadata: Metadata = {
  title: "Operator Dashboard",
  description:
    "Real-time view of ATF system health, enforcement posture, and tenant activity.",
};

export const revalidate = 5;

export default async function DashboardPage() {
  const bundle = await fetchFullDashboard();

  const initial: DashboardData = {
    health: bundle.health,
    kpis: bundle.kpis,
    enforcement: bundle.enforcement,
    activity: bundle.activity,
    tenants: bundle.tenants,
    summary: bundle.summary,
    trend: bundle.trend,
  };

  return (
    <Container>
      <Section className="fade-in-up">
        <div className="mx-auto max-w-7xl">
          <DashboardShell initial={initial} />
        </div>
      </Section>
    </Container>
  );
}
