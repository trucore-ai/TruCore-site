import { NextResponse } from "next/server";

/**
 * Internal health monitor — checks ATF backend availability.
 *
 * Designed to be called by Vercel cron (every minute).  Tracks
 * consecutive failures in-memory and sends alert/recovery emails
 * via Resend when thresholds are crossed.
 *
 * Environment variables:
 *   ATF_HEALTH_URL          — URL to check  (default: https://api.trucore.xyz/health)
 *   ALERT_EMAIL_TO          — recipient for alert emails
 *   HEALTH_CHECK_TIMEOUT_MS — fetch timeout (default: 5000)
 *   FAILURE_THRESHOLD       — consecutive failures before alert (default: 3)
 *   RESEND_API_KEY          — Resend API key
 *   ALERT_EMAIL_FROM        — sender address (default: TruCore Monitor <alerts@trucore.xyz>)
 */

const RESEND_API_URL = "https://api.resend.com/emails";

// ---------------------------------------------------------------------------
// In-memory state (persists across warm invocations on Vercel)
// ---------------------------------------------------------------------------

let consecutiveFailures = 0;
let lastSuccess = 0;
let alertSent = false;
let lastError = "";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

function getConfig() {
  return {
    url: process.env.ATF_HEALTH_URL ?? "https://api.trucore.xyz/health",
    emailTo: process.env.ALERT_EMAIL_TO ?? "",
    emailFrom:
      process.env.ALERT_EMAIL_FROM ??
      "TruCore Monitor <alerts@trucore.xyz>",
    resendApiKey: process.env.RESEND_API_KEY ?? "",
    timeoutMs: parseInt(process.env.HEALTH_CHECK_TIMEOUT_MS ?? "5000", 10),
    threshold: parseInt(process.env.FAILURE_THRESHOLD ?? "3", 10),
  };
}

// ---------------------------------------------------------------------------
// Email
// ---------------------------------------------------------------------------

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function sendAlertEmail(params: {
  subject: string;
  html: string;
  config: ReturnType<typeof getConfig>;
}): Promise<boolean> {
  const { config } = params;
  if (!config.resendApiKey || !config.emailTo) {
    console.warn(
      "[health-monitor] Cannot send alert — RESEND_API_KEY or ALERT_EMAIL_TO not configured",
    );
    return false;
  }

  try {
    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: config.emailFrom,
        to: [config.emailTo],
        subject: params.subject,
        html: params.html,
      }),
    });

    if (!res.ok) {
      console.error(
        `[health-monitor] Resend API returned ${res.status}`,
      );
      return false;
    }

    console.log(`[health-monitor] Alert email sent: ${params.subject}`);
    return true;
  } catch {
    console.error("[health-monitor] Failed to send alert email");
    return false;
  }
}

// ---------------------------------------------------------------------------
// Check logic
// ---------------------------------------------------------------------------

export async function GET() {
  const config = getConfig();

  if (!config.emailTo) {
    return NextResponse.json(
      {
        ok: true,
        status: "disabled",
        reason: "ALERT_EMAIL_TO not configured",
      },
      { status: 200 },
    );
  }

  const now = Date.now();
  let checkOk = false;
  let error = "";

  try {
    const controller = new AbortController();
    const timer = setTimeout(
      () => controller.abort(),
      config.timeoutMs,
    );

    const resp = await fetch(config.url, {
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}`);
    }

    checkOk = true;
  } catch (err) {
    error =
      err instanceof Error ? err.message : String(err);
    error = error.slice(0, 300);
  }

  if (checkOk) {
    // --- Success path ---
    const prevFailures = consecutiveFailures;
    const wasAlerting = alertSent;

    consecutiveFailures = 0;
    lastSuccess = now;
    lastError = "";

    if (wasAlerting) {
      alertSent = false;
      const ts = new Date(now).toISOString();
      await sendAlertEmail({
        subject: "[TruCore RECOVERY] ATF backend back up",
        html:
          '<div style="font-family:system-ui,sans-serif;color:#1a1a2e;">' +
          '<h2 style="color:#27ae60;">Service Recovery</h2>' +
          "<table>" +
          `<tr><td><b>Endpoint</b></td><td>${escapeHtml(config.url)}</td></tr>` +
          `<tr><td><b>Recovered at</b></td><td>${ts}</td></tr>` +
          `<tr><td><b>Failures before recovery</b></td><td>${prevFailures}</td></tr>` +
          "</table>" +
          '<p style="color:#666;font-size:13px;margin-top:16px;">' +
          "Sent by TruCore internal health monitor.</p></div>",
        config,
      });
    }
  } else {
    // --- Failure path ---
    consecutiveFailures += 1;
    lastError = error;

    if (consecutiveFailures >= config.threshold && !alertSent) {
      const ts = new Date(now).toISOString();
      const sent = await sendAlertEmail({
        subject: "[TruCore ALERT] ATF backend down",
        html:
          '<div style="font-family:system-ui,sans-serif;color:#1a1a2e;">' +
          '<h2 style="color:#c0392b;">Service Down Alert</h2>' +
          "<table>" +
          `<tr><td><b>Endpoint</b></td><td>${escapeHtml(config.url)}</td></tr>` +
          `<tr><td><b>Timestamp</b></td><td>${ts}</td></tr>` +
          `<tr><td><b>Error</b></td><td>${escapeHtml(error)}</td></tr>` +
          `<tr><td><b>Consecutive failures</b></td><td>${consecutiveFailures}</td></tr>` +
          "</table>" +
          '<p style="color:#666;font-size:13px;margin-top:16px;">' +
          "Sent by TruCore internal health monitor.</p></div>",
        config,
      });
      if (sent) {
        alertSent = true;
      }
    }
  }

  return NextResponse.json(
    {
      ok: checkOk,
      consecutiveFailures,
      lastSuccess: lastSuccess ? new Date(lastSuccess).toISOString() : null,
      alertSent,
      lastError: lastError || null,
    },
    {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
