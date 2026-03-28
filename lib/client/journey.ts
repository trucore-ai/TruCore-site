/**
 * Client-side Journey Telemetry
 *
 * Fire-and-forget tracking for first-trade funnel events.
 * No external dependencies. No PII. Fails silently.
 *
 * Usage:
 *   import { trackJourneyEvent, getSessionId } from "@/lib/client/journey";
 *   trackJourneyEvent("dashboard_viewed");
 *   trackJourneyEvent("protect_dry_run_completed", { status: "success" });
 */

const SESSION_KEY = "trucore_journey_session";

/**
 * Get or create a session ID for journey tracking.
 * Stored in sessionStorage (survives tab refresh, not new tabs).
 */
export function getSessionId(): string {
  if (typeof window === "undefined") {
    // SSR: generate temporary ID
    return generateSessionId();
  }

  try {
    let sessionId = sessionStorage.getItem(SESSION_KEY);
    if (!sessionId || !/^[a-f0-9]{32}$/i.test(sessionId)) {
      sessionId = generateSessionId();
      sessionStorage.setItem(SESSION_KEY, sessionId);
    }
    return sessionId;
  } catch {
    // Private browsing or storage disabled
    return generateSessionId();
  }
}

/**
 * Generate a random 32-char hex session ID.
 */
function generateSessionId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Track a journey event.
 *
 * Fire-and-forget - never throws, never blocks UI.
 *
 * @param eventName - One of the canonical journey event names
 * @param meta - Optional metadata (status, user_id)
 */
export function trackJourneyEvent(
  eventName: string,
  meta?: {
    status?: "success" | "failure";
    user_id?: string;
  },
): void {
  try {
    const sessionId = getSessionId();

    fetch("/api/telemetry/journey", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_name: eventName,
        session_id: sessionId,
        ...(meta?.status && { status: meta.status }),
        ...(meta?.user_id && { user_id: meta.user_id }),
      }),
      // Don't wait for response - fire and forget
      keepalive: true,
    }).catch(() => {
      // Silently ignore - never break UX for telemetry
    });
  } catch {
    // Never break the UI for analytics
  }
}

/**
 * Track dashboard view - convenience wrapper.
 */
export function trackDashboardViewed(): void {
  trackJourneyEvent("dashboard_viewed");
}

/**
 * Track sample intent loaded - convenience wrapper.
 */
export function trackSampleIntentLoaded(): void {
  trackJourneyEvent("sample_intent_loaded");
}

/**
 * Track protect dry run started - convenience wrapper.
 */
export function trackProtectDryRunStarted(): void {
  trackJourneyEvent("protect_dry_run_started");
}

/**
 * Track protect dry run completed - convenience wrapper.
 */
export function trackProtectDryRunCompleted(success: boolean): void {
  trackJourneyEvent("protect_dry_run_completed", {
    status: success ? "success" : "failure",
  });
}

/**
 * Track execute sample started - convenience wrapper.
 */
export function trackExecuteSampleStarted(): void {
  trackJourneyEvent("execute_sample_started");
}

/**
 * Track execute sample completed - convenience wrapper.
 */
export function trackExecuteSampleCompleted(success: boolean): void {
  trackJourneyEvent("execute_sample_completed", {
    status: success ? "success" : "failure",
  });
}

/**
 * Track receipt viewed - convenience wrapper.
 */
export function trackReceiptViewed(): void {
  trackJourneyEvent("receipt_viewed");
}

/**
 * Track receipt verified - convenience wrapper.
 */
export function trackReceiptVerified(success: boolean): void {
  trackJourneyEvent("receipt_verified", {
    status: success ? "success" : "failure",
  });
}
