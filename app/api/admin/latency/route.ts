/**
 * Admin latency metrics proxy endpoint.
 *
 * Fetches aggregate latency data from the ATF backend
 * (/v1/metrics/latency) and returns it to the admin UI.
 * Protected by withAdminApiAuth — unauthenticated requests
 * receive a generic 404 (no detail leakage).
 *
 * Only aggregate, non-sensitive data is forwarded.
 */

import { NextResponse } from "next/server";
import { withAdminApiAuth } from "@/lib/admin-api-auth";
import { fetchLatencyMetrics } from "@/lib/dashboard-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const GET = withAdminApiAuth(async () => {
  const result = await fetchLatencyMetrics();

  if (!result.ok) {
    return NextResponse.json(
      { error: "latency_metrics_unavailable" },
      { status: 502 },
    );
  }

  return NextResponse.json(result.data);
}, { csrf: false });
