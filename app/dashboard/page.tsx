import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import {
  fetchHealth,
  fetchKpis,
  fetchEnforcement,
  fetchActivity,
  fetchTenants,
} from "@/lib/dashboard-client";
import {
  DashboardShell,
  type DashboardData,
} from "@/components/dashboard/dashboard-shell";

/* ────────────────────────────────────────────────────────────────
 *  /dashboard - ATF Operator Dashboard
 *
 *  Server-side initial data fetch with 5 s ISR revalidation.
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
  const [health, kpis, enforcement, activity, tenants] = await Promise.all([
    fetchHealth(),
    fetchKpis(),
    fetchEnforcement(),
    fetchActivity(),
    fetchTenants(),
  ]);

  const initial: DashboardData = {
    health,
    kpis,
    enforcement,
    activity,
    tenants,
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
