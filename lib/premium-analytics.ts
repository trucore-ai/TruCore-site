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

/* ────────────────────────────────────────────────────────────────
 *  Portal-level premium analytics resolution
 *
 *  The portal does not directly query ATF for entitlement state.
 *  Instead we derive the entitlement from a server-side resolution
 *  that defaults to "preview" for all current portal sessions
 *  (all current tenants are approved design partners).
 *
 *  Future rollout switch:
 *    When monetization activates, this function should resolve
 *    against the ATF tenant detail endpoint or a local entitlement
 *    column, returning "inactive" for tenants without premium.
 *    No portal UX changes required — the gating wrappers will
 *    silently omit premium sections for inactive tenants.
 *
 *  Internal only. No pricing or upgrade copy is surfaced.
 * ──────────────────────────────────────────────────────────── */

/**
 * Resolve the premium analytics entitlement for a portal session.
 *
 * Currently all portal sessions are design-partner preview tenants,
 * so this returns an enabled preview entitlement for any authenticated
 * session.  Returns an inactive entitlement for unauthenticated calls.
 *
 * @param sessionEmail - The ownerEmail from the portal session cookie.
 *   Pass null/undefined if no session is active.
 */
export function resolvePortalPremium(
  sessionEmail: string | null | undefined,
): PremiumAnalyticsEntitlement {
  if (!sessionEmail) {
    return { enabled: false, state: "inactive", source: "none" };
  }

  // ROLLOUT NOTE: When monetization is live, replace this with
  // a lookup against ATF /dashboard/tenants/:id or a local
  // entitlement column.  The return shape stays the same; the
  // PremiumSection wrapper and hasPremiumAnalytics() gate
  // handle rendering decisions automatically.
  return { enabled: true, state: "preview", source: "preview" };
}

/* ────────────────────────────────────────────────────────────────
 *  Premium section classification — internal reference
 *
 *  Documents which portal sections are core (always shown) vs
 *  future-premium (gated by entitlement).
 *
 *  Core (always shown):
 *  - API Keys table
 *  - Basic usage snapshot (request counts per key)
 *  - Simulator request examples
 *  - Receipt verification panel
 *
 *  Future premium (gated, currently visible for preview tenants):
 *  - Enhanced usage trends (time-series charts)
 *  - Source attribution insight (SDK / integration path)
 *  - Advanced posture context (warnings, score)
 *  - Extended history windows (30d+)
 *
 *  The boundary is: core = essential first-value experience;
 *  premium = deeper analytics context for power users.
 * ──────────────────────────────────────────────────────────── */
