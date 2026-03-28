/**
 * Journey Telemetry Store
 *
 * In-memory rolling buffer for first-trade journey events.
 * No external dependencies, no PII, minimal footprint.
 *
 * Events are stored with:
 * - event_name (canonical journey stage)
 * - timestamp
 * - session_id (anonymous, generated or provided)
 * - user_id (optional, if authenticated)
 * - status (optional, success/failure)
 */

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export const JOURNEY_EVENTS = [
  "dashboard_viewed",
  "sample_intent_loaded",
  "protect_dry_run_started",
  "protect_dry_run_completed",
  "execute_sample_started",
  "execute_sample_completed",
  "receipt_viewed",
  "receipt_verified",
] as const;

export type JourneyEventName = (typeof JOURNEY_EVENTS)[number];

export interface JourneyEvent {
  event_name: JourneyEventName;
  timestamp: number;
  session_id: string;
  user_id?: string;
  status?: "success" | "failure";
}

export interface JourneyEventInput {
  event_name: string;
  session_id?: string;
  user_id?: string;
  status?: "success" | "failure";
}

export interface FunnelTotals {
  dashboard_viewed: number;
  sample_intent_loaded: number;
  protect_dry_run_started: number;
  protect_dry_run_completed: number;
  execute_sample_started: number;
  execute_sample_completed: number;
  receipt_viewed: number;
  receipt_verified: number;
}

export interface FunnelConversion {
  dashboard_to_sample: number;
  sample_to_protect_start: number;
  protect_start_to_complete: number;
  protect_to_execute_start: number;
  execute_start_to_complete: number;
  execute_to_receipt: number;
  receipt_to_verify: number;
}

export interface FunnelSummary {
  totals: FunnelTotals;
  conversion: FunnelConversion;
  biggest_dropoff: string;
  event_count: number;
  oldest_event_age_ms: number | null;
}

// ─────────────────────────────────────────────────────────────
// Store Configuration
// ─────────────────────────────────────────────────────────────

const MAX_EVENTS = 10_000; // Rolling buffer cap
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days retention

// ─────────────────────────────────────────────────────────────
// In-Memory Store
// ─────────────────────────────────────────────────────────────

const eventBuffer: JourneyEvent[] = [];

/**
 * Validate event name is in allowed list.
 */
export function isValidJourneyEvent(name: string): name is JourneyEventName {
  return JOURNEY_EVENTS.includes(name as JourneyEventName);
}

/**
 * Generate a random anonymous session ID.
 */
export function generateSessionId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Record a journey event.
 * Validates input, generates session_id if not provided.
 * Returns false if event_name is invalid.
 */
export function recordJourneyEvent(input: JourneyEventInput): {
  ok: boolean;
  session_id?: string;
  error?: string;
} {
  if (!isValidJourneyEvent(input.event_name)) {
    return { ok: false, error: "invalid_event_name" };
  }

  const session_id = input.session_id || generateSessionId();

  // Validate session_id format (hex string, 32 chars)
  if (!/^[a-f0-9]{32}$/i.test(session_id)) {
    return { ok: false, error: "invalid_session_id" };
  }

  // Validate user_id if provided (no PII - should be opaque ID)
  if (input.user_id && input.user_id.length > 64) {
    return { ok: false, error: "user_id_too_long" };
  }

  const event: JourneyEvent = {
    event_name: input.event_name,
    timestamp: Date.now(),
    session_id,
    ...(input.user_id && { user_id: input.user_id }),
    ...(input.status && { status: input.status }),
  };

  // Prune old events before adding
  pruneOldEvents();

  // Add to buffer
  eventBuffer.push(event);

  // Enforce max size (FIFO)
  while (eventBuffer.length > MAX_EVENTS) {
    eventBuffer.shift();
  }

  return { ok: true, session_id };
}

/**
 * Remove events older than MAX_AGE_MS.
 */
function pruneOldEvents(): void {
  const cutoff = Date.now() - MAX_AGE_MS;
  while (eventBuffer.length > 0 && eventBuffer[0].timestamp < cutoff) {
    eventBuffer.shift();
  }
}

/**
 * Get funnel totals by counting unique sessions per stage.
 */
export function getFunnelTotals(): FunnelTotals {
  pruneOldEvents();

  const sessionsByEvent = new Map<JourneyEventName, Set<string>>();
  for (const name of JOURNEY_EVENTS) {
    sessionsByEvent.set(name, new Set());
  }

  for (const event of eventBuffer) {
    sessionsByEvent.get(event.event_name)?.add(event.session_id);
  }

  return {
    dashboard_viewed: sessionsByEvent.get("dashboard_viewed")!.size,
    sample_intent_loaded: sessionsByEvent.get("sample_intent_loaded")!.size,
    protect_dry_run_started: sessionsByEvent.get("protect_dry_run_started")!.size,
    protect_dry_run_completed: sessionsByEvent.get("protect_dry_run_completed")!.size,
    execute_sample_started: sessionsByEvent.get("execute_sample_started")!.size,
    execute_sample_completed: sessionsByEvent.get("execute_sample_completed")!.size,
    receipt_viewed: sessionsByEvent.get("receipt_viewed")!.size,
    receipt_verified: sessionsByEvent.get("receipt_verified")!.size,
  };
}

/**
 * Calculate conversion percentages between funnel stages.
 */
export function getFunnelConversion(totals: FunnelTotals): FunnelConversion {
  const pct = (from: number, to: number): number => {
    if (from === 0) return 0;
    return Math.round((to / from) * 100 * 10) / 10; // 1 decimal
  };

  return {
    dashboard_to_sample: pct(totals.dashboard_viewed, totals.sample_intent_loaded),
    sample_to_protect_start: pct(totals.sample_intent_loaded, totals.protect_dry_run_started),
    protect_start_to_complete: pct(totals.protect_dry_run_started, totals.protect_dry_run_completed),
    protect_to_execute_start: pct(totals.protect_dry_run_completed, totals.execute_sample_started),
    execute_start_to_complete: pct(totals.execute_sample_started, totals.execute_sample_completed),
    execute_to_receipt: pct(totals.execute_sample_completed, totals.receipt_viewed),
    receipt_to_verify: pct(totals.receipt_viewed, totals.receipt_verified),
  };
}

/**
 * Find the biggest drop-off stage.
 */
export function getBiggestDropoff(conversion: FunnelConversion): string {
  const stages = Object.entries(conversion) as [keyof FunnelConversion, number][];
  let biggest = stages[0];

  for (const stage of stages) {
    // Lower conversion = bigger dropoff
    if (stage[1] < biggest[1]) {
      biggest = stage;
    }
  }

  // Human-readable stage name
  const labels: Record<keyof FunnelConversion, string> = {
    dashboard_to_sample: "Dashboard → Sample Intent",
    sample_to_protect_start: "Sample Intent → Protect Start",
    protect_start_to_complete: "Protect Start → Protect Complete",
    protect_to_execute_start: "Protect Complete → Execute Start",
    execute_start_to_complete: "Execute Start → Execute Complete",
    execute_to_receipt: "Execute Complete → Receipt View",
    receipt_to_verify: "Receipt View → Receipt Verify",
  };

  return `${labels[biggest[0]]} (${biggest[1]}%)`;
}

/**
 * Get full funnel summary for ops endpoint.
 */
export function getFunnelSummary(): FunnelSummary {
  pruneOldEvents();

  const totals = getFunnelTotals();
  const conversion = getFunnelConversion(totals);
  const biggest_dropoff = getBiggestDropoff(conversion);

  const oldest = eventBuffer.length > 0 ? eventBuffer[0].timestamp : null;
  const oldest_event_age_ms = oldest !== null ? Date.now() - oldest : null;

  return {
    totals,
    conversion,
    biggest_dropoff,
    event_count: eventBuffer.length,
    oldest_event_age_ms,
  };
}

/**
 * Get raw event count (for testing).
 */
export function getEventCount(): number {
  return eventBuffer.length;
}

/**
 * Clear all events (for testing only).
 */
export function clearAllEvents(): void {
  eventBuffer.length = 0;
}
