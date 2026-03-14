import { NextRequest, NextResponse } from "next/server";
import { fetchTenantDetail } from "@/lib/dashboard-client";
import { serializeTenantSnapshot, AGENT_SCHEMA_VERSION } from "@/lib/agent-serializer";

/* ────────────────────────────────────────────────────────────────
 *  GET /api/agent/tenant?id=<tenantId>
 *
 *  Agent-facing tenant detail endpoint.  Returns a versioned
 *  JSON snapshot of a single tenant's operational state for
 *  consumption by OpenClaw and other AI bots.
 *
 *  Reuses the same tenant data source and derivation logic
 *  as the human-facing /dashboard/tenants/[id] page.
 *
 *  Capability boundaries:
 *  - Missing id parameter: 400 with structured error
 *  - Tenant not found:      404 with structured not-found
 *  - Upstream failure:       502 with structured error
 * ──────────────────────────────────────────────────────────── */

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const tenantId = req.nextUrl.searchParams.get("id");

  if (!tenantId) {
    return NextResponse.json(
      {
        schema_version: AGENT_SCHEMA_VERSION,
        available: false,
        reason: "Missing required query parameter: id",
      },
      { status: 400 },
    );
  }

  const result = await fetchTenantDetail(tenantId);

  if (!result.ok) {
    /* Distinguish not-found from upstream errors by inspecting
       the error message from the dashboard client. */
    const isNotFound =
      result.error.includes("404") || result.error.includes("not found");

    return NextResponse.json(
      {
        schema_version: AGENT_SCHEMA_VERSION,
        available: false,
        reason: isNotFound
          ? `Tenant "${tenantId}" not found`
          : `Upstream error: ${result.error}`,
      },
      { status: isNotFound ? 404 : 502 },
    );
  }

  const snapshot = serializeTenantSnapshot(result.data);

  return NextResponse.json(snapshot, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}
