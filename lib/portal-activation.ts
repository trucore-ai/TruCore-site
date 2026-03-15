/* ────────────────────────────────────────────────────────────────
 *  Portal Activation State — lightweight, deterministic model
 *
 *  Derives a portal activation state from tenant key-usage data.
 *  Used to tailor the portal guidance for zero-use, early-stage,
 *  and sustained-use partners.
 *
 *  IMPORTANT — proxy-based activation buckets:
 *
 *  These states are derived entirely from aggregate request volume.
 *  No receipt-verification signal, on-chain proof confirmation,
 *  or explicit "user completed step X" flag currently exists in
 *  the database. The states are therefore **activity proxies**,
 *  not proof of any specific user action.
 *
 *  Derivation:
 *      zero_activity   — 0 total requests across all keys
 *      early_activity  — 1–9 total requests (partner has started)
 *      active_usage    — 10+ total requests (sustained integration)
 *
 *  Why request-volume proxy:
 *  The portal DB stores per-key usage counts but does not record
 *  whether the partner has ever verified a receipt or completed a
 *  specific onboarding milestone. Request volume is the strongest
 *  signal available without adding new DB columns or backend work.
 *
 *  Where to swap in a real signal later:
 *  When the DB gains a `first_verified_at` column on api_keys or
 *  a dedicated onboarding_events table, update the derivation
 *  logic in `derivePortalActivationState()` below. Consumers
 *  (PortalActivationGuide, portal page) read only the summary
 *  struct and do not need to change.
 *
 *  This module is evaluated server-side on page load — no client
 *  JS, no persistence, no feature flags.
 * ──────────────────────────────────────────────────────────── */

import type { PartnerKeyUsageRow } from "./db";

/**
 * Portal activation states — proxy buckets based on request volume.
 * These do NOT represent verified user actions; see module header.
 */
export type PortalActivationState =
  | "zero_activity"
  | "early_activity"
  | "active_usage";

/**
 * Minimum aggregate requests to consider a partner in "active_usage".
 * Threshold is intentionally low: a partner with 10+ requests has
 * meaningfully integrated and does not need onboarding prompts.
 */
const ACTIVE_USAGE_THRESHOLD = 10;

export interface PortalActivationSummary {
  state: PortalActivationState;
  totalRequests: number;
  hasKeys: boolean;
  activeKeyCount: number;
}

export function derivePortalActivationState(
  keyRows: PartnerKeyUsageRow[],
): PortalActivationSummary {
  const totalRequests = keyRows.reduce(
    (sum, row) => sum + row.total_requests,
    0,
  );
  const activeKeyCount = keyRows.filter((row) => !row.revoked_at).length;
  const hasKeys = keyRows.length > 0;

  let state: PortalActivationState;

  if (totalRequests === 0) {
    state = "zero_activity";
  } else if (totalRequests < ACTIVE_USAGE_THRESHOLD) {
    state = "early_activity";
  } else {
    state = "active_usage";
  }

  return { state, totalRequests, hasKeys, activeKeyCount };
}
