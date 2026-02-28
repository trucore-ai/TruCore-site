/**
 * GitHub OAuth: redirect to GitHub authorize URL.
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "node:crypto";
import { getGitHubAuthorizeUrl } from "@/lib/feedback-auth";

export async function GET() {
  try {
    const state = crypto.randomBytes(16).toString("hex");

    const cookieStore = await cookies();
    cookieStore.set("gh_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 600, // 10 minutes
    });

    const url = getGitHubAuthorizeUrl(state);
    return NextResponse.redirect(url);
  } catch (err) {
    console.error("GitHub OAuth redirect error:", err);
    return NextResponse.redirect(
      new URL("/feedback?error=oauth_config", process.env.NEXT_PUBLIC_SITE_URL ?? "https://trucore.xyz"),
    );
  }
}
