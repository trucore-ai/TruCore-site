/**
 * Waitlist / design-partner configuration diagnostics.
 *
 * Server-side only. Never exposes raw env values.
 *
 * Capability requirements:
 *   - Submission persistence: POSTGRES_URL or DATABASE_URL (required)
 *   - Confirmation email:    RESEND_API_KEY (optional, graceful degrade)
 *   - Scheduling CTA:        DESIGN_PARTNER_SCHEDULING_URL (optional)
 *
 * Production verification after deploy:
 *   1. Submit a test waitlist entry → confirm DB row appears
 *   2. Check Resend dashboard for delivered event
 *   3. Verify design-partner success state shows scheduling link
 */

/* ---------- individual checks ---------- */

/** True when a Postgres connection string is available. */
export function hasDatabaseConfig(): boolean {
  return !!(process.env.POSTGRES_URL ?? process.env.DATABASE_URL);
}

/** True when the Resend API key is configured. */
export function hasResendConfig(): boolean {
  return !!process.env.RESEND_API_KEY;
}

/** True when a design-partner scheduling URL is configured. */
export function hasSchedulingConfig(): boolean {
  return !!process.env.DESIGN_PARTNER_SCHEDULING_URL;
}

/* ---------- aggregate status ---------- */

export type WaitlistConfigStatus = {
  /** Can persist signups to the database */
  database: boolean;
  /** Can send confirmation / admin emails */
  email: boolean;
  /** Can show scheduling CTA to design partners */
  scheduling: boolean;
};

/**
 * Return a safe, boolean-only summary of waitlist pipeline readiness.
 * Intended for server-side diagnostics and tests — never expose to clients.
 */
export function getWaitlistConfigStatus(): WaitlistConfigStatus {
  return {
    database: hasDatabaseConfig(),
    email: hasResendConfig(),
    scheduling: hasSchedulingConfig(),
  };
}
