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
  // API key onboarding
  "view_api_key_section",
  "copy_api_key",
  "copy_request",
  // Proof bundle export
  "proof_bundle_exported",
  "proof_share_card_opened",
  // Policy recommendation engagement
  "policy_recommendation_impression",
  "policy_recommendation_expand",
  "policy_recommendation_collapse",
  "policy_recommendation_view_setting",
  "policy_signal_refresh_click",
  "policy_signal_refresh_complete",
  "policy_upgrade_teaser_view",
  "policy_upgrade_teaser_click",
]);

type TrackPayload = {
  name: string;
  meta?: Record<string, string | number | boolean>;
  ts?: number;
};

export async function POST(req: NextRequest) {
  let body: TrackPayload;
  try {
    body = (await req.json()) as TrackPayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const { name, meta, ts } = body;

  if (!name || typeof name !== "string" || !ALLOWED_EVENTS.has(name)) {
    // Silently drop unknown events - no error to callers
    return NextResponse.json({ ok: true });
  }

  // Sanitize meta values: allow only primitives, drop anything else
  const safeMeta: Record<string, string | number | boolean> = {};
  if (meta && typeof meta === "object") {
    for (const [k, v] of Object.entries(meta)) {
      if (
        typeof v === "string" ||
        typeof v === "number" ||
        typeof v === "boolean"
      ) {
        safeMeta[k] = v;
      }
    }
  }

  console.log(
    JSON.stringify({
      type: "track_event",
      name,
      meta: safeMeta,
      ts: ts ?? Date.now(),
    }),
  );

  return NextResponse.json({ ok: true });
}
