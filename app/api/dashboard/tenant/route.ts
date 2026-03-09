import { NextRequest, NextResponse } from "next/server";
import { fetchTenantDetail } from "@/lib/dashboard-client";

/* ────────────────────────────────────────────────────────────────
 *  GET /api/dashboard/tenant?id=<tenantId>
 *
 *  Internal polling endpoint for the TenantDetailShell client
 *  component. Proxies the ATF /dashboard/tenants/:id call and
 *  returns the DashboardResult<TenantDetail> envelope directly.
 * ──────────────────────────────────────────────────────────── */

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
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
