import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { fetchTenantDetail } from "@/lib/dashboard-client";
import { TenantDetailShell } from "@/components/dashboard/tenant-detail-shell";

/* ────────────────────────────────────────────────────────────────
 *  /dashboard/tenants/[tenantId] - Tenant Drill-Down
 *
 *  Premium tenant detail page. Server-fetches the full tenant
 *  profile from the ATF /dashboard/tenants/:id endpoint, then
 *  hands off to TenantDetailShell for client-side polling.
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
  const { tenantId } = await params;
  const result = await fetchTenantDetail(tenantId);

  if (!result.ok) {
    // If the ATF endpoint returns 404-style data, show Next.js not-found
    if (result.error.includes("404")) {
      notFound();
    }
  }

  return (
    <Container>
      <Section className="fade-in-up">
        <div className="mx-auto max-w-7xl">
          {/* Back link */}
          <Link
            href="/dashboard"
            className="group mb-8 inline-flex items-center gap-1.5 rounded-md px-1 py-0.5 text-sm text-slate-500 transition-colors duration-200 hover:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/40"
          >
            <span
              className="transition-transform duration-200 group-hover:-translate-x-1"
              aria-hidden="true"
            >
              &larr;
            </span>
            Back to Dashboard
          </Link>

          <TenantDetailShell tenantId={tenantId} initial={result} />
        </div>
      </Section>
    </Container>
  );
}
