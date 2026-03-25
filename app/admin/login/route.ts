import { NextRequest, NextResponse } from "next/server";
import {
  isAdminKeyValid,
  createSessionToken,
  ADMIN_COOKIE_NAME,
  getAdminSessionCookieOptions,
} from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit-log";
import {
  checkLoginThrottle,
  recordLoginFailure,
  clearLoginFailures,
} from "@/lib/login-throttle";
import { logSecurityEvent } from "@/lib/security-log";
import { ADMIN_RESPONSE_HEADERS } from "@/lib/admin-api-auth";
import { isOriginValid, getRequestIp } from "@/lib/security/origin";

const LOGIN_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Admin Login</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{min-height:100vh;display:flex;align-items:center;justify-content:center;
      background:#0a0a0a;color:#e2e8f0;font-family:system-ui,sans-serif}
    .card{width:100%;max-width:360px;padding:2rem;border-radius:0.75rem;
      border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.03)}
    h1{font-size:1.25rem;font-weight:600;margin-bottom:1.5rem;text-align:center}
    label{display:block;font-size:0.75rem;color:#94a3b8;margin-bottom:0.25rem}
    input{width:100%;padding:0.5rem 0.75rem;border-radius:0.375rem;border:1px solid rgba(255,255,255,0.1);
      background:rgba(255,255,255,0.06);color:#e2e8f0;font-size:0.875rem;outline:none}
    input:focus{border-color:#6366f1;box-shadow:0 0 0 2px rgba(99,102,241,0.3)}
    button{margin-top:1rem;width:100%;padding:0.5rem;border:none;border-radius:0.375rem;
      background:#6366f1;color:#fff;font-size:0.875rem;font-weight:500;cursor:pointer;transition:background 0.15s}
    button:hover{background:#818cf8}
    .error{margin-top:0.75rem;padding:0.5rem 0.75rem;border-radius:0.375rem;
      background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);
      color:#fca5a5;font-size:0.8rem;text-align:center}
  </style>
</head>
<body>
  <div class="card">
    <h1>Admin Login</h1>
    <form method="POST" action="/admin/login">
      <label for="key">Dashboard Key</label>
      <input id="key" name="key" type="password" required autocomplete="current-password" />
      <button type="submit">Sign in</button>
    </form>
    %%ERROR_BLOCK%%
  </div>
</body>
</html>`;

function loginPage(error?: string) {
  const errorHtml = error
    ? `<div class="error">${error}</div>`
    : "";
  return LOGIN_HTML.replace("%%ERROR_BLOCK%%", errorHtml);
}

export async function GET(request: NextRequest) {
  const reason = request.nextUrl.searchParams.get("error");
  let errorMsg: string | undefined;
  if (reason === "invalid_key") errorMsg = "Invalid dashboard key.";
  if (reason === "rate_limited") errorMsg = "Too many attempts. Please wait.";

  return new NextResponse(loginPage(errorMsg), {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export async function POST(request: NextRequest) {
  const ip = getRequestIp(request);

  /* ── CSRF / Origin check ── */
  if (!isOriginValid(request)) {
    logSecurityEvent("csrf_origin_rejected", {
      ip,
      meta: { method: "POST", path: "/admin/login" },
    });
    return new NextResponse(null, {
      status: 404,
      headers: ADMIN_RESPONSE_HEADERS,
    });
  }

  const formData = await request.formData();
  const key = formData.get("key") as string | null;

  /* Safe debug signal - never logs the actual secret */
  const envKey = process.env.ADMIN_DASHBOARD_KEY;
  console.info(
    `[admin-login] ADMIN_DASHBOARD_KEY present: ${envKey ? "yes" : "no"}` +
      (envKey ? `, length: ${envKey.length}` : ""),
  );

  /* ── rate-limit check ── */
  const cooldownSeconds = checkLoginThrottle(ip);
  if (cooldownSeconds > 0) {
    logSecurityEvent("login_rate_limited", { ip });
    return NextResponse.redirect(
      new URL("/admin/login?error=rate_limited", request.url),
      303,
    );
  }

  if (!isAdminKeyValid(key)) {
    const locked = recordLoginFailure(ip);
    logSecurityEvent("login_failure", {
      ip,
      meta: locked > 0 ? { cooldown_triggered: true } : undefined,
    });
    return NextResponse.redirect(
      new URL("/admin/login?error=invalid_key", request.url),
      303,
    );
  }

  /* ── success ── */
  clearLoginFailures(ip);
  logSecurityEvent("login_success", { ip });

  await logAdminAction({ action: "admin_login" });

  const token = createSessionToken();

  const response = NextResponse.redirect(
    new URL("/admin/waitlist", request.url),
    303,
  );

  response.cookies.set(ADMIN_COOKIE_NAME, token, {
    ...getAdminSessionCookieOptions(),
  });

  return response;
}
