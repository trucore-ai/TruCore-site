/**
 * Logout: clear the feedback session cookie and redirect.
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { FEEDBACK_SESSION_COOKIE } from "@/lib/feedback-auth";

export async function GET() {
  const cookieStore = await cookies();
  cookieStore.delete(FEEDBACK_SESSION_COOKIE);
  return NextResponse.redirect(
    new URL("/feedback", process.env.NEXT_PUBLIC_SITE_URL ?? "https://trucore.xyz"),
  );
}
