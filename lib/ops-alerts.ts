/**
 * Operator alerting for customer-facing route failures.
 *
 * Uses the existing Resend email utility (lib/email.ts sendEmail path).
 * Rate-limiting is handled upstream by shouldTriggerRouteFailureAlert().
 *
 * NEVER includes secrets, tokens, API keys, or full URLs with query params.
 */

const RESEND_API_URL = "https://api.resend.com/emails";

interface RouteFailureAlertPayload {
  route: string;
  failureClass: string;
  timestamp: string;
  environment: string;
  countInWindow: number;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Send an operator alert email for repeated route failures.
 * Returns true on success, false on failure. Never throws.
 */
export async function sendRouteFailureAlert(
  route: string,
  failureClass: string,
  meta: { countInWindow: number },
): Promise<boolean> {
  const to = process.env.ATF_ALERT_EMAIL_TO;
  if (!to) {
    console.error("[ops-alert] ATF_ALERT_EMAIL_TO is not configured — skipping alert");
    return false;
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[ops-alert] RESEND_API_KEY is not configured — skipping alert");
    return false;
  }

  const environment =
    process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown";
  const now = new Date().toISOString();

  const payload: RouteFailureAlertPayload = {
    route,
    failureClass,
    timestamp: now,
    environment,
    countInWindow: meta.countInWindow,
  };

  const subject = `[ATF ALERT] Repeated failures on /api/${escapeHtml(route)}`;

  const row = (label: string, value: string) =>
    `<tr><td style="padding:4px 12px 4px 0;color:#888;white-space:nowrap;">${label}</td><td style="padding:4px 0;">${escapeHtml(value)}</td></tr>`;

  const html = `
    <div style="font-family: system-ui, sans-serif; color: #1a1a2e; max-width: 540px;">
      <h2 style="color: #c0392b;">Route Failure Alert</h2>
      <p>Repeated customer-facing failures detected.</p>
      <table style="border-collapse:collapse;font-size:14px;">
        ${row("Route", `/api/${payload.route}`)}
        ${row("Failure class", payload.failureClass)}
        ${row("Failures in window", String(payload.countInWindow))}
        ${row("Environment", payload.environment)}
        ${row("Triggered at", payload.timestamp)}
      </table>
      <hr style="border: none; border-top: 1px solid #ddd; margin: 24px 0;" />
      <p style="color: #666; font-size: 13px;">Sent by TruCore ATF operator alerting. This is rate-limited to one alert per route per window.</p>
    </div>
  `;

  try {
    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.WAITLIST_FROM ?? "TruCore Ops <ops@trucore.xyz>",
        to: [to],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      console.error(`[ops-alert] Resend API returned ${res.status}`);
      return false;
    }

    console.warn(`[ops-alert] Route failure alert sent for ${route}`);
    return true;
  } catch {
    console.error("[ops-alert] Failed to send route failure alert");
    return false;
  }
}
