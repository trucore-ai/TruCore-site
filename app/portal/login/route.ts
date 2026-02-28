import { NextRequest, NextResponse } from "next/server";
import {
  PARTNER_PORTAL_COOKIE_NAME,
  PARTNER_PORTAL_SESSION_MAX_AGE,
  createPartnerPortalSessionCookie,
  getPartnerPortalSessionCookieOptions,
  verifyPartnerPortalToken,
} from "@/lib/partner-portal";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
};

function getLoginHtml(tokenPrefill = "", error = "") {
  const escapedToken = tokenPrefill.replace(/"/g, "&quot;");
  const errorHtml = error
    ? `<p style=\"margin-top:0.75rem;color:#fca5a5;font-size:0.8rem;\">${error}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang=\"en\">
<head>
  <meta charset=\"UTF-8\" />
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />
  <title>Partner Portal Login</title>
  <meta name=\"robots\" content=\"noindex, nofollow\" />
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{min-height:100vh;display:flex;align-items:center;justify-content:center;
      background:#0a0a0a;color:#e2e8f0;font-family:system-ui,sans-serif;padding:1rem}
    .card{width:100%;max-width:420px;padding:2rem;border-radius:0.75rem;
      border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.03)}
    h1{font-size:1.35rem;font-weight:600;margin-bottom:0.5rem}
    p{font-size:0.9rem;color:#94a3b8;line-height:1.5;margin-bottom:1rem}
    label{display:block;font-size:0.75rem;color:#94a3b8;margin-bottom:0.25rem}
    input{width:100%;padding:0.6rem 0.75rem;border-radius:0.375rem;border:1px solid rgba(255,255,255,0.12);
      background:rgba(255,255,255,0.06);color:#e2e8f0;font-size:0.875rem;outline:none}
    input:focus{border-color:#6366f1;box-shadow:0 0 0 2px rgba(99,102,241,0.3)}
    button{margin-top:1rem;width:100%;padding:0.55rem;border:none;border-radius:0.375rem;
      background:#6366f1;color:#fff;font-size:0.875rem;font-weight:500;cursor:pointer;transition:background 0.15s}
    button:hover{background:#818cf8}
  </style>
</head>
<body>
  <div class=\"card\">
    <h1>Partner Portal Access</h1>
    <p>Enter your signed access token to start a secure session. API keys are not used for portal login.</p>
    <form method=\"POST\" action=\"/portal/login\">
      <label for=\"token\">Access token</label>
      <input id=\"token\" name=\"token\" type=\"password\" required value=\"${escapedToken}\" autocomplete=\"off\" />
      <button type=\"submit\">Continue</button>
      ${errorHtml}
    </form>
  </div>
</body>
</html>`;
}

async function issuePortalSession(request: NextRequest, token: string) {
  const record = await verifyPartnerPortalToken(token);
  if (!record) return null;

  const tokenExpiryEpoch = Math.floor(new Date(record.expires_at).getTime() / 1000);
  const nowEpoch = Math.floor(Date.now() / 1000);
  const maxAge = Math.min(PARTNER_PORTAL_SESSION_MAX_AGE, Math.max(0, tokenExpiryEpoch - nowEpoch));
  if (maxAge <= 0) return null;

  const cookieValue = createPartnerPortalSessionCookie({
    tokenId: record.id,
    ownerEmail: record.owner_email,
    ownerProject: record.owner_project,
    exp: nowEpoch + maxAge,
  });

  const response = NextResponse.redirect(new URL("/portal", request.url), 303);
  response.cookies.set(PARTNER_PORTAL_COOKIE_NAME, cookieValue, {
    ...getPartnerPortalSessionCookieOptions(maxAge),
  });
  response.headers.set("Cache-Control", "no-store");

  return response;
}

export async function GET(request: NextRequest) {
  const incomingToken = request.nextUrl.searchParams.get("token")?.trim() ?? "";

  if (incomingToken) {
    const response = await issuePortalSession(request, incomingToken);
    if (response) return response;
  }

  return new NextResponse(getLoginHtml("", incomingToken ? "Token is invalid, expired, or revoked." : ""), {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      ...NO_STORE_HEADERS,
    },
  });
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const token = String(formData.get("token") ?? "").trim();

  if (!token) {
    return new NextResponse(getLoginHtml("", "Access token is required."), {
      status: 400,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        ...NO_STORE_HEADERS,
      },
    });
  }

  const response = await issuePortalSession(request, token);
  if (response) return response;

  return new NextResponse(getLoginHtml(token, "Token is invalid, expired, or revoked."), {
    status: 404,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      ...NO_STORE_HEADERS,
    },
  });
}
