import { NextRequest, NextResponse } from "next/server";
import {
  isAdminKeyValid,
  ADMIN_COOKIE_NAME,
  ADMIN_COOKIE_MAX_AGE,
} from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit-log";

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
  </div>
</body>
</html>`;

export async function GET() {
  return new NextResponse(LOGIN_HTML, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const key = formData.get("key") as string | null;

  if (!isAdminKeyValid(key)) {
    return new NextResponse(null, { status: 404 });
  }

  const isProduction = process.env.NODE_ENV === "production";

  await logAdminAction({ action: "admin_login" });

  const response = NextResponse.redirect(
    new URL("/admin/waitlist", request.url),
    303,
  );

  response.cookies.set(ADMIN_COOKIE_NAME, key!, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_COOKIE_MAX_AGE,
  });

  return response;
}
