"use server";

import { headers, cookies } from "next/headers";
import { ensureWaitlistTable, upsertWaitlistSignup } from "@/lib/db";
import { sha256 } from "@/lib/hash";
import { sendAdminNotification, sendUserConfirmation } from "@/lib/email";

/* ---------- constants ---------- */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_ROLES = ["Builder", "Founder", "Researcher", "Security", "Other"] as const;
const MAX_ROLE_LEN = 32;
const MAX_USE_CASE_LEN = 200;
const COOLDOWN_SECONDS = 30;
const COOLDOWN_COOKIE = "wl_ts";

/* ---------- types ---------- */

export type WaitlistResult = {
  ok: boolean;
  message: string;
};

/* ---------- action ---------- */

export async function joinWaitlist(formData: FormData): Promise<WaitlistResult> {
  /* ---- honeypot ---- */
  const honeypot = formData.get("company");
  if (honeypot && typeof honeypot === "string" && honeypot.length > 0) {
    // Silently accept to not reveal the trap
    return { ok: true, message: "You're on the list. We'll share early-access updates soon." };
  }

  /* ---- extract ---- */
  const rawEmail = (formData.get("email") as string | null) ?? "";
  const rawRole = (formData.get("role") as string | null) ?? "";
  const rawUseCase = (formData.get("useCase") as string | null) ?? "";

  const email = rawEmail.trim().toLowerCase();
  const role = rawRole.trim() || null;
  const useCase = rawUseCase.trim() || null;

  /* ---- validate ---- */
  if (!email || !EMAIL_RE.test(email)) {
    return { ok: false, message: "Please enter a valid email address." };
  }

  if (role && role.length > MAX_ROLE_LEN) {
    return { ok: false, message: "Role is too long." };
  }

  if (role && !VALID_ROLES.includes(role as (typeof VALID_ROLES)[number])) {
    return { ok: false, message: "Please select a valid role." };
  }

  if (useCase && useCase.length > MAX_USE_CASE_LEN) {
    return { ok: false, message: "Use case must be under 200 characters." };
  }

  /* ---- cooldown (cookie-based soft limit) ---- */
  const cookieStore = await cookies();
  const lastTs = cookieStore.get(COOLDOWN_COOKIE)?.value;
  if (lastTs) {
    const elapsed = Date.now() - Number(lastTs);
    if (elapsed < COOLDOWN_SECONDS * 1000) {
      return {
        ok: false,
        message: "Please wait a moment before submitting again.",
      };
    }
  }

  /* ---- derive metadata ---- */
  const hdrs = await headers();
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    hdrs.get("x-real-ip") ??
    "unknown";
  const ipHash = ip !== "unknown" ? sha256(ip) : null;
  const userAgent = (hdrs.get("user-agent") ?? "").slice(0, 256) || null;

  /* ---- persist ---- */
  try {
    await ensureWaitlistTable();
    const { isNew } = await upsertWaitlistSignup({
      email,
      role,
      useCase,
      source: "homepage",
      userAgent,
      ipHash,
    });

    /* ---- set cooldown cookie ---- */
    cookieStore.set(COOLDOWN_COOKIE, String(Date.now()), {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: COOLDOWN_SECONDS,
      path: "/",
    });

    /* ---- emails (fire-and-forget, fail silently) ---- */
    if (isNew) {
      // Do not await sequentially — fire both in parallel
      Promise.allSettled([
        sendAdminNotification({ email, role, useCase }),
        sendUserConfirmation(email),
      ]).catch(() => {
        // No PII in logs
        console.error("[waitlist] Email dispatch failed");
      });
    }

    return {
      ok: true,
      message: "You're on the list. We'll share early-access updates soon.",
    };
  } catch (error) {
    // Log generic error, no PII
    console.error("[waitlist] Submission failed:", error instanceof Error ? error.message : "unknown");
    return {
      ok: false,
      message: "Something went wrong. Please try again shortly.",
    };
  }
}
