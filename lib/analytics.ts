import { track } from "@vercel/analytics";

/**
 * Fire a privacy-safe custom event to Vercel Analytics.
 *
 * Rules:
 * - Never send PII (emails, IPs, user-agents).
 * - Props must be plain primitives only.
 */
export function trackEvent(
  name: string,
  props?: Record<string, string | number | boolean>,
) {
  try {
    track(name, props);
  } catch {
    // Silently swallow — analytics must never break the UI.
  }
}
