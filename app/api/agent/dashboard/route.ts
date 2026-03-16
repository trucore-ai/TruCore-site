import { NextRequest, NextResponse } from "next/server";
import { fetchFullDashboard } from "@/lib/dashboard-client";
import { serializeDashboardSnapshot } from "@/lib/agent-serializer";
import { consumeRateLimit } from "@/lib/rate-limit";
import { logSecurityEvent } from "@/lib/security-log";
import { getRequestIp } from "@/lib/security/origin";
import { sha256 } from "@/lib/hash";

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
 *
 *  Rate-limited: 60 requests / 60 s per IP (hashed).
 * ──────────────────────────────────────────────────────────── */

export const dynamic = "force-dynamic";

const RATE_LIMIT_MAX = 60;
const RATE_LIMIT_WINDOW_MS = 60_000;

export async function GET(req: NextRequest) {
  /* ── Rate limiting ── */
  const ip = getRequestIp(req);
  const key = `agent_dashboard:${sha256(ip).slice(0, 12)}`;
  const rl = consumeRateLimit(key, {
    max: RATE_LIMIT_MAX,
    windowMs: RATE_LIMIT_WINDOW_MS,
  });

  if (rl.exceeded) {
    logSecurityEvent("agent_route_rate_limited", {
      ip,
      meta: { route: "agent/dashboard" },
    });
    return new Response(null, {
      status: 429,
      headers: {
        "Retry-After": String(Math.max(1, rl.resetEpochSeconds - Math.ceil(Date.now() / 1000))),
        "Cache-Control": "no-store, max-age=0",
      },
    });
  }

  try {
    const bundle = await fetchFullDashboard();
    const snapshot = serializeDashboardSnapshot(bundle);

    return NextResponse.json(snapshot, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "Content-Type": "application/json; charset=utf-8",
      },
    });
  } catch {
    return NextResponse.json(
      { available: false, reason: "temporarily_unavailable" },
      {
        status: 502,
        headers: {
          "Cache-Control": "no-store, max-age=0",
          "Content-Type": "application/json; charset=utf-8",
        },
      },
    );
  }
}
