import { NextRequest, NextResponse } from "next/server";
import {
  recordJourneyEvent,
  isValidJourneyEvent,
  JOURNEY_EVENTS,
  type JourneyEventInput,
} from "@/lib/journey-telemetry";
import { sha256 } from "@/lib/hash";
import { consumeRateLimit } from "@/lib/rate-limit";

const NO_STORE = { "Cache-Control": "no-store" };
const RATE_LIMIT_MAX = 100; // per IP per minute - generous for telemetry

interface JourneyPayload {
  event_name: string;
  session_id?: string;
  user_id?: string;
  status?: "success" | "failure";
}

/**
 * POST /api/telemetry/journey
 *
 * Record a journey event for first-trade funnel tracking.
 * Accepts only canonical event names. Fails silently for unknown events.
 *
 * No PII accepted. Session ID generated server-side if not provided.
 * Stored in rolling in-memory buffer.
 */
export async function POST(req: NextRequest) {
  // Rate limit by IP
  const ip = getRequestIp(req);
  const rl = consumeRateLimit(`journey:${sha256(ip)}`, {
    max: RATE_LIMIT_MAX,
    windowMs: 60_000,
  });

  if (rl.exceeded) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: NO_STORE },
    );
  }

  // Parse body
  let body: JourneyPayload;
  try {
    body = (await req.json()) as JourneyPayload;
  } catch {
    return NextResponse.json(
      { error: "invalid_json" },
      { status: 400, headers: NO_STORE },
    );
  }

  // Validate event_name exists
  if (!body.event_name || typeof body.event_name !== "string") {
    return NextResponse.json(
      { error: "missing_event_name" },
      { status: 400, headers: NO_STORE },
    );
  }

  // Silently accept unknown events (no error to caller) but don't record
  if (!isValidJourneyEvent(body.event_name)) {
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  }

  // Validate session_id format if provided
  if (body.session_id && !/^[a-f0-9]{32}$/i.test(body.session_id)) {
    return NextResponse.json(
      { error: "invalid_session_id", message: "Session ID must be 32 hex characters." },
      { status: 400, headers: NO_STORE },
    );
  }

  // Validate status if provided
  if (body.status && !["success", "failure"].includes(body.status)) {
    return NextResponse.json(
      { error: "invalid_status", message: "Status must be 'success' or 'failure'." },
      { status: 400, headers: NO_STORE },
    );
  }

  // Validate user_id length if provided
  if (body.user_id && body.user_id.length > 64) {
    return NextResponse.json(
      { error: "user_id_too_long", message: "User ID exceeds 64 character limit." },
      { status: 400, headers: NO_STORE },
    );
  }

  // Record the event
  const input: JourneyEventInput = {
    event_name: body.event_name,
    session_id: body.session_id,
    user_id: body.user_id,
    status: body.status,
  };

  const result = recordJourneyEvent(input);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: 400, headers: NO_STORE },
    );
  }

  // Log for Vercel log drain visibility
  console.log(
    JSON.stringify({
      type: "journey_event",
      event_name: body.event_name,
      session_id: result.session_id,
      ts: Date.now(),
    }),
  );

  return NextResponse.json(
    { ok: true, session_id: result.session_id },
    { headers: NO_STORE },
  );
}

/**
 * GET /api/telemetry/journey
 *
 * Returns the list of valid journey event names.
 * Useful for documentation/debugging.
 */
export async function GET() {
  return NextResponse.json(
    { events: JOURNEY_EVENTS },
    { headers: NO_STORE },
  );
}

/**
 * Extract client IP from request.
 */
function getRequestIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}
