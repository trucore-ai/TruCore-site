import { NextRequest, NextResponse } from "next/server";
import {
  PARTNER_PORTAL_COOKIE_NAME,
  getPartnerPortalSessionCookieOptions,
} from "@/lib/partner-portal";

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/portal/login", request.url), 303);

  response.cookies.set(PARTNER_PORTAL_COOKIE_NAME, "", {
    ...getPartnerPortalSessionCookieOptions(0),
  });

  response.headers.set("Cache-Control", "no-store");
  return response;
}
