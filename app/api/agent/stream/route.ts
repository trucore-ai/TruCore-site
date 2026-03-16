import { NextRequest } from "next/server";
import { fetchFullDashboard } from "@/lib/dashboard-client";
import {
  serializeDashboardSnapshot,
  POLLING_INTERVAL_SECONDS,
} from "@/lib/agent-serializer";
import type { AgentDashboardSnapshot } from "@/lib/agent-serializer";
import { diffSnapshots, formatSSE } from "@/lib/agent-stream";
import { consumeRateLimit } from "@/lib/rate-limit";
import { logSecurityEvent } from "@/lib/security-log";
import { getRequestIp } from "@/lib/security/origin";
import { sha256 } from "@/lib/hash";

/* ────────────────────────────────────────────────────────────────
 *  GET /api/agent/stream
 *
 *  Server-Sent Events endpoint for real-time agent observability.
 *  Streams structured events whenever the dashboard state changes,
 *  using the same serializer pipeline as /api/agent/dashboard.
 *
 *  Clients connect with:
 *    const es = new EventSource("/api/agent/stream");
 *    es.addEventListener("dashboard_snapshot", (e) => { ... });
 *
 *  Event types:
 *    dashboard_snapshot         - full summary on connect or priority change
 *    attention_queue_update     - queue ordering changed
 *    top_changes_update         - top changes list changed
 *    tenant_review_required     - requires_review flipped to true
 *    system_degraded            - is_degraded or is_offline flipped to true
 *    receipt_pipeline_idle      - receipt throughput dropped to zero
 *
 *  Polling cadence matches the existing 5 s contract.
 *  No new dependencies.
 *
 *  Rate-limited: 10 new connections / 60 s per IP (hashed).
 * ──────────────────────────────────────────────────────────── */

export const dynamic = "force-dynamic";

const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;

export async function GET(req: NextRequest) {
  /* ── Rate limiting (connection initiation) ── */
  const ip = getRequestIp(req);
  const key = `agent_stream:${sha256(ip).slice(0, 12)}`;
  const rl = consumeRateLimit(key, {
    max: RATE_LIMIT_MAX,
    windowMs: RATE_LIMIT_WINDOW_MS,
  });

  if (rl.exceeded) {
    logSecurityEvent("agent_route_rate_limited", {
      ip,
      meta: { route: "agent/stream" },
    });
    return new Response(null, {
      status: 429,
      headers: {
        "Retry-After": String(Math.max(1, rl.resetEpochSeconds - Math.ceil(Date.now() / 1000))),
        "Cache-Control": "no-store, max-age=0",
      },
    });
  }

  const encoder = new TextEncoder();
  let cancelled = false;
  let intervalId: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream({
    async start(controller) {
      let prev: AgentDashboardSnapshot | null = null;

      const tick = async () => {
        if (cancelled) return;
        try {
          const bundle = await fetchFullDashboard();
          const snapshot = serializeDashboardSnapshot(bundle);
          const events = diffSnapshots(prev, snapshot);

          for (const evt of events) {
            controller.enqueue(encoder.encode(formatSSE(evt)));
          }

          prev = snapshot;
        } catch {
          // On transient errors, send a comment keep-alive and retry next tick
          try {
            controller.enqueue(encoder.encode(": error, retrying\n\n"));
          } catch {
            // Controller already closed
          }
        }
      };

      // Initial snapshot immediately
      await tick();

      intervalId = setInterval(
        () => void tick(),
        POLLING_INTERVAL_SECONDS * 1000,
      );
    },
    cancel() {
      // Client disconnected
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
