/**
 * Centralized server-only auth wrapper for admin server actions.
 *
 * Validates the current admin session via the hardened session lifecycle
 * in admin-auth.ts. On denial, emits a sanitized security log and returns
 * a generic { error: "unauthorized" } — no detail leakage.
 *
 * On inner function failure (e.g. DB errors), catches the exception,
 * emits a sanitized `admin_action_degraded` security event, and returns
 * a generic { error: "temporarily_unavailable" } — no raw backend
 * details, stack traces, SQL, or DSNs are surfaced.
 *
 * Usage:
 *   export async function myAction(formData: FormData) {
 *     return withAdminAction(async () => {
 *       // action body — session is already validated
 *       return { ok: true };
 *     }, { action: "my_action" });
 *   }
 */

import { assertAdminSession } from "./admin-auth";
import { logSecurityEvent } from "./security-log";

export interface AdminActionOptions {
  /** Safe action label for logging (no PII, no secrets). */
  action?: string;
}

/**
 * Wrap the core logic of an admin server action with centralized auth
 * and backend-failure safety.
 *
 * On valid session, executes `fn` and returns its result.
 * On invalid/missing/expired/revoked session, returns { error: "unauthorized" }.
 * On inner function failure, returns { error: "temporarily_unavailable" }
 * with a sanitized security log event.
 *
 * The error sentinel includes `ok?: undefined` so consumers can safely
 * check `result?.ok` without narrowing first (TypeScript union compat).
 */
export async function withAdminAction<T>(
  fn: () => Promise<T>,
  options?: AdminActionOptions,
): Promise<T | { error: string; ok?: undefined }> {
  try {
    await assertAdminSession();
  } catch {
    logSecurityEvent("admin_action_denied");
    return { error: "unauthorized" };
  }

  try {
    return await fn();
  } catch (err) {
    const actionLabel = options?.action ?? "unknown";
    const errName = err instanceof Error ? err.name : "Error";
    logSecurityEvent("admin_action_degraded", {
      meta: {
        action: actionLabel,
        failure: errName,
      },
    });
    return { error: "temporarily_unavailable" };
  }
}
