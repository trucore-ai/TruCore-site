import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, getAdminSessionCookieOptions, revokeSessionToken } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit-log";
import { logSecurityEvent } from "@/lib/security-log";
import { ADMIN_RESPONSE_HEADERS } from "@/lib/admin-api-auth";

function getRequestIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "unknown";
}

function isOriginValid(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return origin === request.nextUrl.origin;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const ip = getRequestIp(request);

  /* ── CSRF / Origin check ── */
  if (!isOriginValid(request)) {
    logSecurityEvent("csrf_origin_rejected", {
      ip,
      meta: { method: "POST", path: "/admin/logout" },
    });
    return new NextResponse(null, {
      status: 404,
      headers: ADMIN_RESPONSE_HEADERS,
    });
  }

  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  revokeSessionToken(token);

  logSecurityEvent("logout", { ip });
  await logAdminAction({ action: "admin_logout" });

  const response = NextResponse.redirect(new URL("/", request.url), 303);

  response.cookies.set(ADMIN_COOKIE_NAME, "", {
    ...getAdminSessionCookieOptions(0),
  });

  for (const [key, value] of Object.entries(ADMIN_RESPONSE_HEADERS)) {
    response.headers.set(key, value);
  }

  return response;
}
