/**
 * Premium Analytics Entitlement — gating utility.
 *
 * Server-side helper for checking whether a tenant has premium
 * analytics enabled.  Used by portal and dashboard pages to
 * conditionally render premium analytics sections.
 *
 * States:
 *   inactive  — no entitlement (default)
 *   preview   — free early-access for approved tenants
 *   paid      — activated after USDC payment
 *   bundled   — included with advanced/enterprise plans
 *   expired   — was active but past expiry
 *
 * Gating rule: premium analytics features are shown when
 * state is one of: preview, paid, bundled.
 *
 * This module does NOT expose pricing, upgrade prompts, or
 * payment flows.  It is internal readiness plumbing only.
 */

/** Valid premium analytics entitlement states. */
export type PremiumAnalyticsState =
  | "inactive"
  | "preview"
  | "paid"
  | "bundled"
  | "expired";

/** Shape returned by ATF /dashboard/tenants/{id}/summary → premium_analytics */
export interface PremiumAnalyticsEntitlement {
  enabled: boolean;
  state: PremiumAnalyticsState;
  source: string;
  expires_at?: number;
}

/** States that grant access to premium analytics features. */
const ENABLED_STATES: ReadonlySet<PremiumAnalyticsState> = new Set<PremiumAnalyticsState>([
  "preview",
  "paid",
  "bundled",
]);

/**
 * Check whether a tenant has premium analytics access.
 *
 * @param entitlement - The premium_analytics object from the
 *   tenant summary response.  May be undefined if the ATF
 *   response didn't include it (backward compat).
 * @returns true if premium analytics features should be shown.
 */
export function hasPremiumAnalytics(
  entitlement: PremiumAnalyticsEntitlement | undefined | null,
): boolean {
  if (!entitlement) return false;
  return entitlement.enabled && ENABLED_STATES.has(entitlement.state);
}

/**
 * Return a human-readable label for the entitlement state.
 * Suitable for internal/admin display only — not for public UX.
 */
export function premiumAnalyticsLabel(
  state: PremiumAnalyticsState | string | undefined,
): string {
  switch (state) {
    case "preview":
      return "Preview (free)";
    case "paid":
      return "Active (paid)";
    case "bundled":
      return "Included";
    case "expired":
      return "Expired";
    case "inactive":
    default:
      return "—";
  }
}
