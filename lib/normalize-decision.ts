/**
 * Canonical customer-facing decision labels.
 *
 * The public glossary defines three UI-layer terms:
 *   ALLOWED — transaction passed all policy checks
 *   DENIED  — transaction was rejected by one or more policy checks
 *   UNKNOWN — decision could not be determined (timeout, error, missing data)
 *
 * Backend / API / spec layers may produce different variants:
 *   allow, ALLOW, approved, approve          → ALLOWED
 *   deny, DENY, denied, blocked, BLOCKED     → DENIED
 *   unknown, error, (empty/undefined)         → UNKNOWN
 *
 * This helper normalises any variant to the canonical UI label.
 * Internal logic (simulator status, API mapping) is unaffected —
 * this is strictly for customer-visible rendered text.
 */

export type DecisionLabel = "ALLOWED" | "DENIED" | "UNKNOWN";

const ALLOW_VARIANTS = new Set([
  "allow",
  "allowed",
  "approve",
  "approved",
]);

const DENY_VARIANTS = new Set([
  "deny",
  "denied",
  "block",
  "blocked",
]);

export function normalizeDecision(raw: string | undefined | null): DecisionLabel {
  if (!raw || typeof raw !== "string") return "UNKNOWN";

  const lower = raw.trim().toLowerCase();
  if (lower === "" || lower === "unknown" || lower === "error") return "UNKNOWN";
  if (ALLOW_VARIANTS.has(lower)) return "ALLOWED";
  if (DENY_VARIANTS.has(lower)) return "DENIED";

  // Fallback: unknown inputs surface as UNKNOWN rather than silently
  // mapping to ALLOWED or DENIED.
  return "UNKNOWN";
}

export function isAllowedDecision(raw: string | undefined | null): boolean {
  return normalizeDecision(raw) === "ALLOWED";
}
