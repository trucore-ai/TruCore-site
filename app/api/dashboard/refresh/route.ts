import { NextResponse } from "next/server";
import { fetchFullDashboard } from "@/lib/dashboard-client";
import { withAdminApiAuth } from "@/lib/admin-api-auth";
import { logSecurityEvent } from "@/lib/security-log";

/* ────────────────────────────────────────────────────────────────
 *  GET /api/dashboard/refresh
 *
 *  Internal polling endpoint used by the DashboardShell client
 *  component to fetch fresh data. Gated behind admin session
 *  cookie — only platform_operator role can access.
 *
 *  Calls the consolidated /dashboard/summary + /dashboard/tenants
 *  endpoints and derives all panel data from the summary result.
 *
 *  Cache-Control is set to no-store so the client always gets
 *  the latest snapshot rather than a stale edge-cached response.
 * ──────────────────────────────────────────────────────────── */

export const dynamic = "force-dynamic";

export const GET = withAdminApiAuth(async () => {
  try {
    const bundle = await fetchFullDashboard();
    return NextResponse.json(bundle);
  } catch {
    logSecurityEvent("admin_api_degraded", {
      meta: { route: "dashboard/refresh", reason: "query_failed" },
    });
    return NextResponse.json(
      { error: "temporarily_unavailable" },
      { status: 500 },
    );
  }
}, { csrf: false });
