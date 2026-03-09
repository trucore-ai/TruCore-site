import { NextResponse } from "next/server";
import { fetchPublicMetrics } from "@/lib/public-metrics";

/* ────────────────────────────────────────────────────────────────
 *  GET /api/metrics/public-summary
 *
 *  Lightweight proxy for the ATF public metrics endpoint.
 *  Adds a 60 s s-maxage so the Vercel edge caches the response,
 *  keeping the marketing site snappy without hammering ATF.
 *  stale-while-revalidate lets visitors see slightly stale data
 *  while the cache refreshes in the background.
 * ──────────────────────────────────────────────────────────── */

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await fetchPublicMetrics();

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      {
        status: 502,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  }

  return NextResponse.json(result.data, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
    },
  });
}
