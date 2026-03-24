import { NextRequest, NextResponse } from "next/server";

/**
 * Lightweight internal event ingest for try-ATF funnel telemetry.
 *
 * Accepts only a small allowlisted set of event names.
 * No PII, no cookies, no identity tracking.
 */

const ALLOWED_EVENTS = new Set([
  "try_page_viewed",
  "try_sample_clicked",
  "try_sample_loaded",
  "try_protect_clicked",
  "try_protect_succeeded",
  "try_protect_failed",
  "try_signup_cta_clicked",
]);

const ALLOWED_DECISIONS = new Set(["ALLOW", "DENY"]);

type EventPayload = {
  event: string;
  page?: string;
  decision?: string;
  ts?: number;
};

export async function POST(request: NextRequest) {
  let body: EventPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const { event, page, decision } = body;

  if (typeof event !== "string" || !ALLOWED_EVENTS.has(event)) {
    return NextResponse.json({ error: "unknown event" }, { status: 400 });
  }

  // Sanitise optional fields
  const safePage =
    typeof page === "string" ? page.slice(0, 100) : undefined;
  const safeDecision =
    typeof decision === "string" && ALLOWED_DECISIONS.has(decision)
      ? decision
      : undefined;

  // Structured log — easily parsed by Vercel log drains / grep
  console.log(
    JSON.stringify({
      type: "funnel_event",
      event,
      page: safePage,
      decision: safeDecision,
      ts: Date.now(),
    }),
  );

  return NextResponse.json({ ok: true });
}
