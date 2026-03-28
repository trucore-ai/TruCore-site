import { NextRequest, NextResponse } from "next/server";
import {
  getRecentRouteFailureStats,
  getCustomerRouteFailureCounts,
} from "@/lib/security-log";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

/**
 * Internal ops endpoint — returns aggregated customer-route failure stats.
 *
 * Protected by a static ops key header (x-ops-key).
 * NEVER returns request bodies, user identifiers, API keys, or raw logs.
 */
export async function GET(request: NextRequest) {
  const opsKey = process.env.ATF_OPS_KEY;
  if (!opsKey) {
    return NextResponse.json(
      { status: "error", error: "endpoint_not_configured" },
      { status: 503, headers: NO_STORE_HEADERS },
    );
  }

  const provided = request.headers.get("x-ops-key");
  if (!provided || provided !== opsKey) {
    return NextResponse.json(
      { status: "error", error: "forbidden" },
      { status: 403, headers: NO_STORE_HEADERS },
    );
  }

  try {
    const alertStats = getRecentRouteFailureStats();
    const totalCounts = getCustomerRouteFailureCounts();

    const routes = Object.entries(alertStats).map(([route, state]) => ({
      route,
      count: state.failuresInWindow,
      total_count: totalCounts[route] ?? 0,
      last_failure_ts: state.lastFailureTs || null,
      last_alert_ts: state.lastAlertTs || null,
    }));

    return NextResponse.json(
      { status: "ok", data: { routes } },
      { status: 200, headers: NO_STORE_HEADERS },
    );
  } catch {
    return NextResponse.json(
      { status: "error", error: "internal" },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}
