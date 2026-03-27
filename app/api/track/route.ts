import { NextRequest, NextResponse } from "next/server";

/**
 * Internal funnel event ingest.
 *
 * Accepts only allowlisted event names.
 * Logs to console (server-side) for Vercel log drain / grep visibility.
 * No storage, no PII, no cookies.
 */

const ALLOWED_EVENTS = new Set([
  // Page views
  "page_view",
  // CTA clicks - homepage
  "cta_home_primary",
  "cta_home_secondary",
  // CTA clicks - try page
  "cta_try_primary",
  "cta_try_verify_demo",
  // CTA clicks - verify-demo
  "cta_verify_to_trade",
  // Funnel progression
  "entered_verify_demo",
  "completed_verify_demo",
  "clicked_start_trade",
]);

type TrackPayload = {
  name: string;
  meta?: Record<string, string | number | boolean>;
  ts?: number;
};

export async function POST(request: NextRequest) {
  let body: TrackPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const { name, meta, ts } = body;

  if (typeof name !== "string" || !ALLOWED_EVENTS.has(name)) {
    return NextResponse.json({ error: "unknown event" }, { status: 400 });
  }

  // Sanitise meta: only allow plain primitives, drop anything else
  const safeMeta: Record<string, string | number | boolean> = {};
  if (meta && typeof meta === "object") {
    for (const [k, v] of Object.entries(meta)) {
      if (
        typeof v === "string" ||
        typeof v === "number" ||
        typeof v === "boolean"
      ) {
        safeMeta[k.slice(0, 64)] = typeof v === "string" ? v.slice(0, 256) : v;
      }
    }
  }

  console.log(
    JSON.stringify({
      type: "track_event",
      name,
      meta: safeMeta,
      ts: typeof ts === "number" ? ts : Date.now(),
    }),
  );

  return new Response(null, { status: 200 });
}
