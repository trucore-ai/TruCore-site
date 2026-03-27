import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { fetchFullDashboard } from "@/lib/dashboard-client";
import {
  DashboardShell,
  type DashboardData,
} from "@/components/dashboard/dashboard-shell";
import { getAdminSessionFromCookies } from "@/lib/admin-auth";
import { AcquisitionStrip } from "@/components/dashboard/acquisition-strip";

/* ────────────────────────────────────────────────────────────────
 *  /dashboard - ATF Operator Dashboard (platform_operator only)
 *
 *  Gated behind admin session cookie. Unauthenticated visitors
 *  are redirected to /admin/login.
 *
 *  This is a platform-scoped operator view. It shows data across
 *  ALL tenants for adoption measurement and system health
 *  monitoring. Normal tenant users should use /portal instead.
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
    "Platform-wide view of ATF system health, enforcement posture, and tenant activity. Operator access only.",
  robots: { index: false, follow: false },
};

export const revalidate = 5;

export default async function DashboardPage() {
  const isValid = await getAdminSessionFromCookies();
  if (!isValid) redirect("/admin/login");

  const bundle = await fetchFullDashboard();

  const initial: DashboardData = {
    health: bundle.health,
    kpis: bundle.kpis,
    enforcement: bundle.enforcement,
    activity: bundle.activity,
    tenants: bundle.tenants,
    summary: bundle.summary,
    trend: bundle.trend,
    adoption: bundle.adoption,
  };

  return (
    <Container>
      <Section className="fade-in-up">
        <div className="mx-auto max-w-5xl space-y-8">
          {/* Server-rendered acquisition funnel (site DB, not ATF) */}
          <section
            id="acquisition"
            className="scroll-mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-6 shadow-sm transition-all duration-150 hover:shadow-md"
            aria-label="Acquisition funnel"
          >
            <AcquisitionStrip />
          </section>

          {/* ATF-sourced dashboard with client-side polling */}
          <DashboardShell initial={initial} />
        </div>
      </Section>
    </Container>
  );
}
