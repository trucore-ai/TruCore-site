import { NextResponse } from "next/server";
import {
  fetchHealth,
  fetchKpis,
  fetchEnforcement,
  fetchActivity,
  fetchTenants,
  fetchDashboardSummary,
} from "@/lib/dashboard-client";

/* ────────────────────────────────────────────────────────────────
 *  GET /api/dashboard/refresh
 *
 *  Internal polling endpoint used by the DashboardShell client
 *  component to fetch fresh data. Proxies all ATF dashboard
 *  calls in parallel and returns them as a single JSON bundle.
 *
 *  Cache-Control is set to no-store so the client always gets
 *  the latest snapshot rather than a stale edge-cached response.
 * ──────────────────────────────────────────────────────────── */

export const dynamic = "force-dynamic";

export async function GET() {
  const [health, kpis, enforcement, activity, tenants, summary] =
    await Promise.all([
      fetchHealth(),
      fetchKpis(),
      fetchEnforcement(),
      fetchActivity(),
      fetchTenants(),
      fetchDashboardSummary(),
    ]);

  return NextResponse.json(
    { health, kpis, enforcement, activity, tenants, summary },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
