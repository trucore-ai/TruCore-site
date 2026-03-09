import { NextResponse } from "next/server";
import { fetchFullDashboard } from "@/lib/dashboard-client";
import { serializeDashboardSnapshot } from "@/lib/agent-serializer";

/* ────────────────────────────────────────────────────────────────
 *  GET /api/agent/dashboard
 *
 *  Agent-facing observability endpoint.  Returns a stable,
 *  versioned JSON snapshot of the full operator dashboard state
 *  for consumption by OpenClaw and other AI bots.
 *
 *  The response is derived from the same shared logic that
 *  powers the human-facing dashboard UI.  No HTML scraping.
 *  No presentation-coupled fields.
 *
 *  Cache-Control: no-store so bots always get the freshest
 *  snapshot. Matches the 5 s polling contract of the live UI.
 * ──────────────────────────────────────────────────────────── */

export const dynamic = "force-dynamic";

export async function GET() {
  const bundle = await fetchFullDashboard();
  const snapshot = serializeDashboardSnapshot(bundle);

  return NextResponse.json(snapshot, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}
