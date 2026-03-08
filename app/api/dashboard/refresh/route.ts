import { NextResponse } from "next/server";
import {
  fetchHealth,
  fetchKpis,
  fetchEnforcement,
  fetchActivity,
  fetchTenants,
} from "@/lib/dashboard-client";

/* ────────────────────────────────────────────────────────────────
 *  GET /api/dashboard/refresh
 *
 *  Internal polling endpoint used by the DashboardShell client
 *  component to fetch fresh data. Proxies all five ATF dashboard
 *  calls in parallel and returns them as a single JSON bundle.
 *
 *  Cache-Control is set to no-store so the client always gets
 *  the latest snapshot rather than a stale edge-cached response.
 * ──────────────────────────────────────────────────────────── */

export const dynamic = "force-dynamic";

export async function GET() {
  const [health, kpis, enforcement, activity, tenants] = await Promise.all([
    fetchHealth(),
    fetchKpis(),
    fetchEnforcement(),
    fetchActivity(),
    fetchTenants(),
  ]);

  return NextResponse.json(
    { health, kpis, enforcement, activity, tenants },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
