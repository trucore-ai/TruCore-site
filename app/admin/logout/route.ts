import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit-log";

export async function POST(request: NextRequest) {
  await logAdminAction({ action: "admin_logout" });

  const response = NextResponse.redirect(new URL("/", request.url), 303);

  response.cookies.set(ADMIN_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
