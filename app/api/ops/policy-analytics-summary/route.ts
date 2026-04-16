import { NextRequest, NextResponse } from "next/server";
import { summarise } from "@/lib/server/policy-analytics-store";

const NO_STORE = { "Cache-Control": "no-store" };

/**
 * Internal ops endpoint — aggregated policy recommendation analytics summary.
 *
 * Protected by ATF_OPS_KEY (same pattern as /api/ops/route-failures).
 *
 * Returns only aggregated counts — no raw event payloads, no policy values,
 * no customer identifiers, no PII.
 *
 * Limitations:
 *   - Data is in-memory and per-serverless-instance.
 *   - Counts reset when the instance recycles.
 *   - Intended for trend/signal inspection, not billing or compliance.
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

  const summary = summarise();

  return NextResponse.json(
    { status: "ok", summary },
    { headers: NO_STORE },
  );
}
