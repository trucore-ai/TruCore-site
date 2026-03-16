/**
 * Admin security telemetry endpoint.
 *
 * Returns aggregate session and security-event counters.
 * Protected by withAdminApiAuth — unauthenticated requests get a
 * generic 404 (no detail leakage).
 *
 * Never returns tokens, IPs, cookies, or any secret material.
 */

import { NextResponse } from "next/server";
import { withAdminApiAuth } from "@/lib/admin-api-auth";
import { _getSessionStore } from "@/lib/admin-auth";
import {
  getSecurityEventCounters,
  getAdminPageDegradedCounts,
  getAdminActionDegradedCounts,
  getAdminApiDegradedCounts,
  getAgentRouteRateLimitedCounts,
  getPublicRouteRateLimitedCounts,
} from "@/lib/security-log";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Process start time — used to compute uptime. */
const startedAt = Date.now();

export const GET = withAdminApiAuth(async () => {
  try {
    const store = _getSessionStore();
    let revokedCount = 0;
    for (const record of store.values()) {
      if (record.revokedAt !== undefined) revokedCount++;
    }

    const counters = getSecurityEventCounters();
    const degradedByPage = getAdminPageDegradedCounts();
    const degradedByAction = getAdminActionDegradedCounts();
    const degradedByRoute = getAdminApiDegradedCounts();
    const agentRateLimitedByRoute = getAgentRouteRateLimitedCounts();
    const publicRateLimitedByRoute = getPublicRouteRateLimitedCounts();

    return NextResponse.json({
      uptime_seconds: Math.floor((Date.now() - startedAt) / 1000),
      session_store_size: store.size,
      revoked_session_count: revokedCount,
      security_event_counters: counters,
      admin_page_degraded_total: counters["admin_page_degraded"] ?? 0,
      admin_page_degraded_by_page: degradedByPage,
      admin_action_degraded_total: counters["admin_action_degraded"] ?? 0,
      admin_action_degraded_by_action: degradedByAction,
      admin_api_degraded_total: counters["admin_api_degraded"] ?? 0,
      admin_api_degraded_by_route: degradedByRoute,
      agent_route_rate_limited_total: counters["agent_route_rate_limited"] ?? 0,
      agent_route_rate_limited_by_route: agentRateLimitedByRoute,
      public_route_rate_limited_total: counters["public_route_rate_limited"] ?? 0,
      public_route_rate_limited_by_route: publicRateLimitedByRoute,
    });
  } catch {
    return NextResponse.json(
      { error: "telemetry_unavailable" },
      { status: 500 },
    );
  }
}, { csrf: false });
