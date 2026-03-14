/* ────────────────────────────────────────────────────────────────
 *  Agent Event Stream - Change Detection
 *
 *  Compares two consecutive AgentDashboardSnapshot objects and
 *  emits granular SSE event payloads when operationally relevant
 *  fields change.
 *
 *  Reuses the same serializer output consumed by /api/agent/dashboard.
 *  No new dependencies. No HTML coupling.
 * ──────────────────────────────────────────────────────────── */

import type {
  AgentDashboardSnapshot,
  AgentQueueItem,
} from "@/lib/agent-serializer";
import { AGENT_SCHEMA_VERSION } from "@/lib/agent-serializer";

/* ── Event types ──────────────────────────────────────────── */

export type AgentStreamEventType =
  | "dashboard_snapshot"
  | "attention_queue_update"
  | "top_changes_update"
  | "tenant_review_required"
  | "system_degraded"
  | "receipt_pipeline_idle";

export type AgentStreamEvent = {
  event: AgentStreamEventType;
  data: Record<string, unknown>;
};

/* ── Helpers ──────────────────────────────────────────────── */

function envelope(
  event: AgentStreamEventType,
  payload: Record<string, unknown>,
): AgentStreamEvent {
  return {
    event,
    data: {
      schema_version: AGENT_SCHEMA_VERSION,
      generated_at: new Date().toISOString(),
      ...payload,
    },
  };
}

function queueFingerprint(queue: AgentQueueItem[]): string {
  return queue
    .slice(0, 5)
    .map((q) => `${q.title}|${q.level}`)
    .join(";");
}

/* ── Diff engine ──────────────────────────────────────────── */

/**
 * Compare two snapshots and return a list of events representing
 * operationally meaningful changes.  Returns an empty array when
 * nothing changed.
 */
export function diffSnapshots(
  prev: AgentDashboardSnapshot | null,
  next: AgentDashboardSnapshot,
): AgentStreamEvent[] {
  const events: AgentStreamEvent[] = [];

  /* First snapshot: emit full dashboard_snapshot */
  if (!prev) {
    events.push(
      envelope("dashboard_snapshot", {
        summary: next.summary,
        attention_queue: next.attention_queue,
        top_changes: next.top_changes,
        automation: next.automation,
        freshness: next.freshness,
      }),
    );
    return events;
  }

  /* priority_level changed */
  if (prev.summary.priority_level !== next.summary.priority_level) {
    events.push(
      envelope("dashboard_snapshot", {
        summary: next.summary,
        attention_queue: next.attention_queue,
        top_changes: next.top_changes,
        automation: next.automation,
        freshness: next.freshness,
      }),
    );
    return events; // full snapshot subsumes granular events
  }

  /* attention_queue top item changed */
  if (queueFingerprint(prev.attention_queue) !== queueFingerprint(next.attention_queue)) {
    events.push(
      envelope("attention_queue_update", {
        queue: next.attention_queue,
      }),
    );
  }

  /* top_changes changed */
  const prevChangesFp = prev.top_changes.map((c) => `${c.title}|${c.direction}`).join(";");
  const nextChangesFp = next.top_changes.map((c) => `${c.title}|${c.direction}`).join(";");
  if (prevChangesFp !== nextChangesFp) {
    events.push(
      envelope("top_changes_update", {
        changes: next.top_changes,
      }),
    );
  }

  /* requires_review flipped to true */
  if (!prev.automation.requires_review && next.automation.requires_review) {
    events.push(
      envelope("tenant_review_required", {
        summary: next.summary,
        tenants_overview: next.tenants_overview,
      }),
    );
  }

  /* system degraded or offline flipped */
  const prevDegraded = prev.automation.is_degraded || prev.automation.is_offline;
  const nextDegraded = next.automation.is_degraded || next.automation.is_offline;
  if (!prevDegraded && nextDegraded) {
    events.push(
      envelope("system_degraded", {
        health: next.health,
        automation: {
          is_degraded: next.automation.is_degraded,
          is_offline: next.automation.is_offline,
        },
      }),
    );
  }

  /* receipt pipeline changed to idle */
  const prevReceiptIdle =
    !("available" in prev.trends)
      ? prev.trends.counters.receipts_written_last_hour === 0
      : false;
  const nextReceiptIdle =
    !("available" in next.trends)
      ? next.trends.counters.receipts_written_last_hour === 0
      : false;
  if (!prevReceiptIdle && nextReceiptIdle) {
    events.push(
      envelope("receipt_pipeline_idle", {
        trends: next.trends,
      }),
    );
  }

  return events;
}

/* ── SSE formatter ────────────────────────────────────────── */

/**
 * Format an AgentStreamEvent as an SSE text frame.
 */
export function formatSSE(evt: AgentStreamEvent): string {
  return `event: ${evt.event}\ndata: ${JSON.stringify(evt.data)}\n\n`;
}
