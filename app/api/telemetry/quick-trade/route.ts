import { NextResponse } from "next/server";

/**
 * POST /api/telemetry/quick-trade
 *
 * Accepts quick trade telemetry events for observability.
 * Events are logged server-side for log drain consumption.
 * No persistence - purely for observability.
 */

const VALID_EVENTS = [
  "quick_trade_started",
  "quick_trade_completed",
  "quick_trade_failed",
] as const;

type QuickTradeEventName = (typeof VALID_EVENTS)[number];

interface QuickTradePayload {
  event_name: QuickTradeEventName;
  timestamp?: string;
  failed_step?: string;
  total_duration_ms?: number;
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as QuickTradePayload;

    // Validate event name
    if (!body.event_name || !VALID_EVENTS.includes(body.event_name)) {
      return NextResponse.json(
        { error: "invalid_event", message: "Invalid event_name" },
        { status: 400 }
      );
    }

    // Log for observability (picked up by log drain)
    // eslint-disable-next-line no-console
    console.log(
      "[telemetry:quick-trade]",
      JSON.stringify({
        event_name: body.event_name,
        timestamp: body.timestamp || new Date().toISOString(),
        failed_step: body.failed_step,
        total_duration_ms: body.total_duration_ms,
      })
    );

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "bad_request", message: "Invalid JSON body" },
      { status: 400 }
    );
  }
}

export async function GET(): Promise<Response> {
  return NextResponse.json({
    events: VALID_EVENTS,
    description: "Quick trade telemetry endpoint",
  });
}
