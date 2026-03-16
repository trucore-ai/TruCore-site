import { NextRequest, NextResponse } from "next/server";
import { fetchTenantDetail } from "@/lib/dashboard-client";
import { serializeTenantSnapshot, AGENT_SCHEMA_VERSION } from "@/lib/agent-serializer";
import { consumeRateLimit } from "@/lib/rate-limit";
import { logSecurityEvent } from "@/lib/security-log";
import { getRequestIp } from "@/lib/security/origin";
import { sha256 } from "@/lib/hash";

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
 *
 *  Rate-limited: 60 requests / 60 s per IP (hashed).
 * ──────────────────────────────────────────────────────────── */

export const dynamic = "force-dynamic";

const RATE_LIMIT_MAX = 60;
const RATE_LIMIT_WINDOW_MS = 60_000;

export async function GET(req: NextRequest) {
  /* ── Rate limiting ── */
  const ip = getRequestIp(req);
  const key = `agent_tenant:${sha256(ip).slice(0, 12)}`;
  const rl = consumeRateLimit(key, {
    max: RATE_LIMIT_MAX,
    windowMs: RATE_LIMIT_WINDOW_MS,
  });

  if (rl.exceeded) {
    logSecurityEvent("agent_route_rate_limited", {
      ip,
      meta: { route: "agent/tenant" },
    });
    return new Response(null, {
      status: 429,
      headers: {
        "Retry-After": String(Math.max(1, rl.resetEpochSeconds - Math.ceil(Date.now() / 1000))),
        "Cache-Control": "no-store, max-age=0",
      },
    });
  }

  const tenantId = req.nextUrl.searchParams.get("id");

  if (!tenantId) {
    return NextResponse.json(
      {
        schema_version: AGENT_SCHEMA_VERSION,
        available: false,
        reason: "missing_required_parameter",
      },
      { status: 400 },
    );
  }

  try {
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
          reason: isNotFound ? "tenant_not_found" : "upstream_unavailable",
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
  } catch {
    return NextResponse.json(
      {
        schema_version: AGENT_SCHEMA_VERSION,
        available: false,
        reason: "temporarily_unavailable",
      },
      { status: 502 },
    );
  }
}
