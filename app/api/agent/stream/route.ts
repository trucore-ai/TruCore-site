import { fetchFullDashboard } from "@/lib/dashboard-client";
import {
  serializeDashboardSnapshot,
  POLLING_INTERVAL_SECONDS,
} from "@/lib/agent-serializer";
import type { AgentDashboardSnapshot } from "@/lib/agent-serializer";
import { diffSnapshots, formatSSE } from "@/lib/agent-stream";

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
 * ──────────────────────────────────────────────────────────── */

export const dynamic = "force-dynamic";

export async function GET() {
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
