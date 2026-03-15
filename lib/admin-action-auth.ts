/**
 * Centralized server-only auth wrapper for admin server actions.
 *
 * Validates the current admin session via the hardened session lifecycle
 * in admin-auth.ts. On denial, emits a sanitized security log and returns
 * a generic { error: "unauthorized" } — no detail leakage.
 *
 * Usage:
 *   export async function myAction(formData: FormData) {
 *     return withAdminAction(async () => {
 *       // action body — session is already validated
 *       return { ok: true };
 *     });
 *   }
 */

import { assertAdminSession } from "./admin-auth";
import { logSecurityEvent } from "./security-log";

/**
 * Wrap the core logic of an admin server action with centralized auth.
 * On valid session, executes `fn` and returns its result.
 * On invalid/missing/expired/revoked session, returns { error: "unauthorized" }.
 *
 * The error sentinel includes `ok?: undefined` so consumers can safely
 * check `result?.ok` without narrowing first (TypeScript union compat).
 */
export async function withAdminAction<T>(
  fn: () => Promise<T>,
): Promise<T | { error: string; ok?: undefined }> {
  try {
    await assertAdminSession();
  } catch {
    logSecurityEvent("admin_action_denied");
    return { error: "unauthorized" };
  }
  return fn();
}
