import { NextRequest, NextResponse } from "next/server";
import { getFunnelSummary, type FunnelSummary } from "@/lib/journey-telemetry";

const NO_STORE = { "Cache-Control": "no-store" };

/**
 * GET /api/ops/journey-funnel
 *
 * Returns first-trade journey funnel summary.
 * Protected by x-ops-key header.
 *
 * Response:
 * {
 *   totals: { dashboard_viewed: N, ... },
 *   conversion: { dashboard_to_sample: %, ... },
 *   biggest_dropoff: "Stage Name (X%)",
 *   event_count: N,
 *   oldest_event_age_ms: N | null
 * }
 */
export async function GET(request: NextRequest) {
  const opsKey = process.env.ATF_OPS_KEY;
  if (!opsKey) {
    return NextResponse.json(
      { status: "error", error: "endpoint_not_configured" },
      { status: 503, headers: NO_STORE },
    );
  }

  const provided = request.headers.get("x-ops-key");
  if (!provided || provided !== opsKey) {
    return NextResponse.json(
      { status: "error", error: "forbidden" },
      { status: 403, headers: NO_STORE },
    );
  }

  try {
    const summary: FunnelSummary = getFunnelSummary();

    return NextResponse.json(
      {
        status: "ok",
        data: summary,
      },
      { headers: NO_STORE },
    );
  } catch {
    return NextResponse.json(
      { status: "error", error: "internal" },
      { status: 500, headers: NO_STORE },
    );
  }
}
