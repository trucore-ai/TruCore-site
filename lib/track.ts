/**
 * Lightweight internal event tracker.
 *
 * Fire-and-forget POST to /api/track.
 * No external dependencies. No PII. Fails silently.
 */
export function trackEvent(
  name: string,
  meta?: Record<string, string | number | boolean>,
) {
  try {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, meta, ts: Date.now() }),
    }).catch(() => {
      // Swallow async rejection — analytics must never surface errors.
    });
  } catch {
    // Never break the UI for analytics.
  }
}
