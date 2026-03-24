"use server";

import { headers, cookies } from "next/headers";
import { ensureWaitlistTable, upsertWaitlistSignup } from "@/lib/waitlist-store";
import { sha256 } from "@/lib/hash";
import { sendAdminNotification, sendUserConfirmation } from "@/lib/email";
import { parseUtmCookieValue, UTM_COOKIE_NAME } from "@/lib/utm";
import { getWaitlistConfigStatus } from "@/lib/waitlist-config";

/* ---------- constants ---------- */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_ROLES = ["Builder", "Founder", "Researcher", "Security", "Other"] as const;
const MAX_ROLE_LEN = 32;
const MAX_USE_CASE_LEN = 500;
const COOLDOWN_SECONDS = 30;
const COOLDOWN_COOKIE = "wl_ts";

const VALID_INTEGRATIONS = ["jupiter", "orca", "raydium", "solend", "marginfi", "kamino", "drift", "mango", "hyperliquid"] as const;
const VALID_TX_BUCKETS = ["lt_10k", "10k_100k", "100k_1m", "gt_1m"] as const;
const VALID_BUILD_STAGES = ["idea", "prototype", "prod"] as const;
const MAX_PROJECT_NAME_LEN = 80;
const MIN_PROJECT_NAME_LEN = 2;
const MAX_TX_BUCKET_LEN = 24;
const MAX_BUILD_STAGE_LEN = 24;

/* ---------- types ---------- */

export type WaitlistIntent = "standard" | "design_partner";

export type WaitlistResult = {
  ok: boolean;
  message: string;
  /** Always set on success; determines variant-specific rendering. */
  intent?: WaitlistIntent;
  /** Design-partner scheduling link when configured. */
  schedulingUrl?: string;
  /** True when confirmation-email pipeline is active. */
  emailEnabled?: boolean;
};

/* ---------- action ---------- */

export async function joinWaitlist(formData: FormData): Promise<WaitlistResult> {
  /* ---- honeypot ---- */
  const honeypot = formData.get("company");
  if (honeypot && typeof honeypot === "string" && honeypot.length > 0) {
    // Silently accept to not reveal the trap
    return { ok: true, message: "You're on the list.", intent: "standard", emailEnabled: false };
  }

  /* ---- extract common fields ---- */
  const rawEmail = (formData.get("email") as string | null) ?? "";
  const rawRole = (formData.get("role") as string | null) ?? "";
  const rawUseCase = (formData.get("useCase") as string | null) ?? "";
  const rawIntent = (formData.get("intent") as string | null) ?? "standard";
  const rawSource = (formData.get("source") as string | null) ?? "homepage";

  const email = rawEmail.trim().toLowerCase();
  const role = rawRole.trim() || null;
  const useCase = rawUseCase.trim() || null;
  const intent: WaitlistIntent = rawIntent === "design_partner" ? "design_partner" : "standard";
  const source = rawSource.trim().slice(0, 64) || "homepage";

  /* ---- extract design-partner fields ---- */
  const rawProjectName = (formData.get("projectName") as string | null) ?? "";
  const rawTxVolumeBucket = (formData.get("txVolumeBucket") as string | null) ?? "";
  const rawBuildStage = (formData.get("buildStage") as string | null) ?? "";
  const rawIntegrations = formData.getAll("integrationsInterest") as string[];

  const projectName = rawProjectName.trim() || null;
  const txVolumeBucket = rawTxVolumeBucket.trim() || null;
  const buildStage = rawBuildStage.trim() || null;
  const integrationsInterest = rawIntegrations
    .map((v) => v.trim().toLowerCase())
    .filter((v) => (VALID_INTEGRATIONS as readonly string[]).includes(v));

  /* ---- validate common ---- */
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
    return { ok: false, message: "Use case must be under 500 characters." };
  }

  /* ---- validate design-partner specific ---- */
  if (intent === "design_partner") {
    if (!projectName || projectName.length < MIN_PROJECT_NAME_LEN) {
      return { ok: false, message: "Please enter a project or company name (at least 2 characters)." };
    }
    if (projectName.length > MAX_PROJECT_NAME_LEN) {
      return { ok: false, message: `Project name must be under ${MAX_PROJECT_NAME_LEN} characters.` };
    }
    if (integrationsInterest.length < 1) {
      return { ok: false, message: "Please select at least one integration." };
    }
    if (!txVolumeBucket) {
      return { ok: false, message: "Please select an expected transaction volume." };
    }
    if (txVolumeBucket.length > MAX_TX_BUCKET_LEN || !(VALID_TX_BUCKETS as readonly string[]).includes(txVolumeBucket)) {
      return { ok: false, message: "Please select a valid transaction volume." };
    }
    if (!buildStage) {
      return { ok: false, message: "Please select your current build stage." };
    }
    if (buildStage.length > MAX_BUILD_STAGE_LEN || !(VALID_BUILD_STAGES as readonly string[]).includes(buildStage)) {
      return { ok: false, message: "Please select a valid build stage." };
    }
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
  const utm = parseUtmCookieValue(cookieStore.get(UTM_COOKIE_NAME)?.value);

  /* ---- pre-flight config diagnostics (server log only) ---- */
  const cfg = getWaitlistConfigStatus();
  if (!cfg.database) {
    console.error(
      "[waitlist] database_missing: POSTGRES_URL / DATABASE_URL not configured. Submission will fail.",
    );
  }
  if (!cfg.email) {
    console.warn("[waitlist] email_disabled: RESEND_API_KEY not configured. Confirmation emails will be skipped.");
  }
  if (!cfg.scheduling) {
    console.warn("[waitlist] scheduling_link_missing: DESIGN_PARTNER_SCHEDULING_URL not configured. Scheduling CTA hidden.");
  }

  /* ---- persist ---- */
  try {
    await ensureWaitlistTable();
    const { isNew } = await upsertWaitlistSignup({
      email,
      role,
      useCase,
      source,
      userAgent,
      ipHash,
      intent,
      projectName: intent === "design_partner" ? projectName : null,
      integrationsInterest: intent === "design_partner" && integrationsInterest.length > 0 ? integrationsInterest : null,
      txVolumeBucket: intent === "design_partner" ? txVolumeBucket : null,
      buildStage: intent === "design_partner" ? buildStage : null,
      utmSource: utm?.utm_source ?? null,
      utmMedium: utm?.utm_medium ?? null,
      utmCampaign: utm?.utm_campaign ?? null,
      utmTerm: utm?.utm_term ?? null,
      utmContent: utm?.utm_content ?? null,
    });

    /* ---- set cooldown cookie ---- */
    cookieStore.set(COOLDOWN_COOKIE, String(Date.now()), {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: COOLDOWN_SECONDS,
      path: "/",
    });

    /* ---- structured log for design-partner submissions ---- */
    if (intent === "design_partner") {
      console.log(
        `[waitlist] design_partner_submission: source=${source} isNew=${isNew}`,
      );
    }

    /* ---- emails (fire-and-forget, never block success) ---- */
    if (isNew) {
      try {
        await Promise.allSettled([
          sendAdminNotification({
            email,
            role,
            useCase,
            intent,
            projectName: intent === "design_partner" ? projectName : null,
            integrationsInterest: intent === "design_partner" ? integrationsInterest : null,
            txVolumeBucket: intent === "design_partner" ? txVolumeBucket : null,
            buildStage: intent === "design_partner" ? buildStage : null,
          }),
          sendUserConfirmation(email, intent),
        ]);
      } catch (err) {
        // No PII in logs - only the error name/type
        const errName = err instanceof Error ? err.name : "unknown";
        console.error(`[waitlist] email_send_failed: ${errName}`);
      }
    }

    const successMessage =
      intent === "design_partner"
        ? "Application received. We'll follow up shortly."
        : "You're on the list. We'll share early-access updates soon.";

    return {
      ok: true,
      message: successMessage,
      intent,
      schedulingUrl:
        intent === "design_partner"
          ? (process.env.DESIGN_PARTNER_SCHEDULING_URL ?? undefined)
          : undefined,
      emailEnabled: cfg.email,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "unknown";
    const isConfigError = msg.includes("not configured");
    // Always log the actual error for server-side debugging.
    // Config errors: log full message (contains no secrets, only env var names).
    // DB errors: log the error name + first 120 chars to avoid leaking query details.
    console.error(
      `[waitlist] submission_failed: ${
        isConfigError
          ? msg
          : `DB error: ${(error instanceof Error ? error.name : "Error")}: ${msg.slice(0, 120)}`
      }`,
    );
    // Log config snapshot alongside failures for faster triage
    console.error(
      `[waitlist] config_snapshot: database=${cfg.database} email=${cfg.email} scheduling=${cfg.scheduling}`,
    );
    return {
      ok: false,
      message: isConfigError
        ? "Waitlist is temporarily unavailable. Please try again later or contact us directly."
        : "Something went wrong. Please try again shortly.",
    };
  }
}
