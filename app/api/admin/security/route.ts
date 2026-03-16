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

    return NextResponse.json({
      uptime_seconds: Math.floor((Date.now() - startedAt) / 1000),
      session_store_size: store.size,
      revoked_session_count: revokedCount,
      security_event_counters: counters,
      admin_page_degraded_total: counters["admin_page_degraded"] ?? 0,
      admin_page_degraded_by_page: degradedByPage,
    });
  } catch {
    return NextResponse.json(
      { error: "telemetry_unavailable" },
      { status: 500 },
    );
  }
}, { csrf: false });
