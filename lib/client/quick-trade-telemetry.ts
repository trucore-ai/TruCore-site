/**
 * Quick Trade Telemetry - Lightweight fire-and-forget telemetry for one-click flow
 *
 * Events:
 *   - quick_trade_started
 *   - quick_trade_completed
 *   - quick_trade_failed
 */

export type QuickTradeEventName =
  | "quick_trade_started"
  | "quick_trade_completed"
  | "quick_trade_failed";

interface QuickTradeEvent {
  event_name: QuickTradeEventName;
  timestamp: string;
  failed_step?: string;
  total_duration_ms?: number;
}

/**
 * Fire-and-forget telemetry event posting.
 * Does not block or throw - failures are silently ignored.
 */
export function trackQuickTradeEvent(
  eventName: QuickTradeEventName,
  details?: { failed_step?: string; total_duration_ms?: number }
): void {
  const event: QuickTradeEvent = {
    event_name: eventName,
    timestamp: new Date().toISOString(),
    ...details,
  };

  // Console log for log drain / observability
  // eslint-disable-next-line no-console
  console.log("[quick-trade-telemetry]", JSON.stringify(event));

  // Fire-and-forget POST (optional - if telemetry endpoint exists)
  if (typeof window !== "undefined") {
    fetch("/api/telemetry/quick-trade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    }).catch(() => {
      // Intentionally swallow - telemetry is non-critical
    });
  }
}

export function trackQuickTradeStarted(): void {
  trackQuickTradeEvent("quick_trade_started");
}

export function trackQuickTradeCompleted(durationMs: number): void {
  trackQuickTradeEvent("quick_trade_completed", { total_duration_ms: durationMs });
}

export function trackQuickTradeFailed(failedStep: string): void {
  trackQuickTradeEvent("quick_trade_failed", { failed_step: failedStep });
}
