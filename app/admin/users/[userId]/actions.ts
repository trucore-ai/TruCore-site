"use server";

import { adminUserAction } from "@/lib/dashboard-client";
import { logSecurityEvent } from "@/lib/security-log";
import { withAdminAction } from "@/lib/admin-action-auth";

export async function resendVerification(formData: FormData) {
  return withAdminAction(async () => {
    const userId = formData.get("userId") as string;
    if (!userId) return { ok: false, error: "Missing user ID" };

    const result = await adminUserAction(userId, "verification/resend");
    await logSecurityEvent("admin_verification_resend", {
      meta: { userId },
    });
    return result;
  }, { action: "resend_verification" });
}

export async function revokeVerification(formData: FormData) {
  return withAdminAction(async () => {
    const userId = formData.get("userId") as string;
    if (!userId) return { ok: false, error: "Missing user ID" };

    const result = await adminUserAction(userId, "verification/revoke-pending");
    await logSecurityEvent("admin_verification_revoke", {
      meta: { userId },
    });
    return result;
  }, { action: "revoke_verification" });
}

export async function revokePasswordReset(formData: FormData) {
  return withAdminAction(async () => {
    const userId = formData.get("userId") as string;
    if (!userId) return { ok: false, error: "Missing user ID" };

    const result = await adminUserAction(userId, "password-reset/revoke-pending");
    await logSecurityEvent("admin_password_reset_revoke", {
      meta: { userId },
    });
    return result;
  }, { action: "revoke_password_reset" });
}
