import { NextRequest, NextResponse } from "next/server";
import { fetchTenantDetail } from "@/lib/dashboard-client";
import { getAdminSessionFromCookies } from "@/lib/admin-auth";

/* ────────────────────────────────────────────────────────────────
 *  GET /api/dashboard/tenant?id=<tenantId>
 *
 *  Internal polling endpoint for the TenantDetailShell client
 *  component. Gated behind admin session cookie — only
 *  platform_operator role can access.
 *
 *  Proxies the ATF /dashboard/tenants/:id call and
 *  returns the DashboardResult<TenantDetail> envelope directly.
 * ──────────────────────────────────────────────────────────── */

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const isValid = await getAdminSessionFromCookies();
  if (!isValid) {
    return new NextResponse(null, { status: 404 });
  }

  const tenantId = req.nextUrl.searchParams.get("id");

  if (!tenantId) {
    return NextResponse.json(
      { ok: false, error: "Missing required query parameter: id" },
      { status: 400 },
    );
  }

  const result = await fetchTenantDetail(tenantId);

  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
