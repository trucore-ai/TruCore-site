import { NextResponse } from "next/server";

/**
 * POST /api/telemetry/share
 *
 * Accepts receipt sharing telemetry events for observability.
 * Events are logged server-side for log drain consumption.
 * No persistence - purely for observability.
 */

const VALID_EVENTS = [
  "receipt_copied",
  "receipt_shared",
] as const;

const VALID_PLATFORMS = [
  "twitter",
  "telegram",
  "copy",
  "native",
] as const;

type ShareEventName = (typeof VALID_EVENTS)[number];
type SharePlatform = (typeof VALID_PLATFORMS)[number];

interface SharePayload {
  event_name: ShareEventName;
  timestamp?: string;
  platform?: SharePlatform;
  receipt_id?: string;
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as SharePayload;

    // Validate event name
    if (!body.event_name || !VALID_EVENTS.includes(body.event_name)) {
      return NextResponse.json(
        { error: "invalid_event", message: "Invalid event_name" },
        { status: 400 }
      );
    }

    // Validate platform if provided
    if (body.platform && !VALID_PLATFORMS.includes(body.platform)) {
      return NextResponse.json(
        { error: "invalid_platform", message: "Invalid platform" },
        { status: 400 }
      );
    }

    // Log for observability (picked up by log drain)
    console.log(
      "[telemetry:share]",
      JSON.stringify({
        event_name: body.event_name,
        timestamp: body.timestamp || new Date().toISOString(),
        platform: body.platform,
        receipt_id: body.receipt_id,
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
    platforms: VALID_PLATFORMS,
  });
}
