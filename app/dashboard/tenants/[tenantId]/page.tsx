import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { fetchTenantDetail, fetchAdoption } from "@/lib/dashboard-client";
import { TenantDetailShell } from "@/components/dashboard/tenant-detail-shell";
import { getAdminSessionFromCookies } from "@/lib/admin-auth";

/* ────────────────────────────────────────────────────────────────
 *  /dashboard/tenants/[tenantId] - Tenant Drill-Down
 *  (platform_operator only)
 *
 *  Gated behind admin session cookie. This is a platform-scoped
 *  operator view for inspecting individual tenant activity.
 *  Normal tenant users should use /portal for their own data.
 *
 *  Server-fetches the full tenant profile from the ATF
 *  /dashboard/tenants/:id endpoint plus adoption snapshot,
 *  then hands off to TenantDetailShell for client-side polling.
 *  Adoption data provides growth context (activation stage,
 *  source attribution, triage segment, follow-up priority).
 * ──────────────────────────────────────────────────────────── */

type PageProps = {
  params: Promise<{ tenantId: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { tenantId } = await params;
  return {
    title: `Tenant ${tenantId}`,
    description: `Operator detail view for tenant ${tenantId}.`,
  };
}

export const revalidate = 5;

export default async function TenantDetailPage({ params }: PageProps) {
  const isValid = await getAdminSessionFromCookies();
  if (!isValid) redirect("/admin/login");

  const { tenantId } = await params;
  const [result, adoptionResult] = await Promise.all([
    fetchTenantDetail(tenantId),
    fetchAdoption(),
  ]);

  if (!result.ok) {
    // If the ATF endpoint returns 404-style data, show Next.js not-found
    if (result.error.includes("404")) {
      notFound();
    }
  }

  // Extract matching adoption snapshot for this tenant (if available)
  const adoptionSnapshot =
    adoptionResult.ok
      ? adoptionResult.data.tenant_snapshots.find(
          (s) => s.tenant_id === tenantId,
        ) ?? null
      : null;

  return (
    <Container>
      <Section className="fade-in-up">
        <div className="mx-auto max-w-7xl">
          {/* Navigation links */}
          <div className="mb-8 flex flex-wrap items-center gap-4">
            <Link
              href="/dashboard"
              className="group inline-flex items-center gap-1.5 rounded-md px-1 py-0.5 text-sm text-slate-500 transition-colors duration-200 hover:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/40"
            >
              <span
                className="transition-transform duration-200 group-hover:-translate-x-1"
                aria-hidden="true"
              >
                &larr;
              </span>
              Dashboard
            </Link>
            <span className="text-slate-700" aria-hidden="true">
              /
            </span>
            <Link
              href="/dashboard#growth-triage"
              className="group inline-flex items-center gap-1.5 rounded-md px-1 py-0.5 text-sm text-slate-500 transition-colors duration-200 hover:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/40"
            >
              <span
                className="transition-transform duration-200 group-hover:-translate-x-1"
                aria-hidden="true"
              >
                &larr;
              </span>
              Triage Queue
            </Link>
          </div>

          <TenantDetailShell
            tenantId={tenantId}
            initial={result}
            adoptionSnapshot={adoptionSnapshot}
          />
        </div>
      </Section>
    </Container>
  );
}
