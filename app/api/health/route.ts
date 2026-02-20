import { NextResponse } from "next/server";

/**
 * Lightweight health/uptime endpoint.
 *
 * Returns a simple JSON payload. No DB check, no secrets, no PII.
 * Designed for external uptime monitors (e.g. Checkly, UptimeRobot).
 */
export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      ts: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
