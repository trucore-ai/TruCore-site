/**
 * GitHub OAuth callback: exchange code for token, upsert user, set session cookie.
 */

import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import {
  exchangeCodeForToken,
  getGitHubUser,
  getGitHubUserEmail,
  createSessionToken,
  getSessionCookieOptions,
  isAdminEmail,
  isAdminUsername,
  FEEDBACK_SESSION_COOKIE,
} from "@/lib/feedback-auth";
import { upsertFeedbackUser } from "@/lib/feedback-db";

const siteUrl = () =>
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://trucore.xyz";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/feedback?error=${encodeURIComponent(error)}`, siteUrl()),
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/feedback?error=missing_params", siteUrl()),
    );
  }

  // Validate state
  const cookieStore = await cookies();
  const savedState = cookieStore.get("gh_oauth_state")?.value;
  if (!savedState || savedState !== state) {
    return NextResponse.redirect(
      new URL("/feedback?error=state_mismatch", siteUrl()),
    );
  }

  // Clear the state cookie
  cookieStore.delete("gh_oauth_state");

  try {
    // Exchange code for access token
    const tokenData = await exchangeCodeForToken(code);

    // Get user info
    const ghUser = await getGitHubUser(tokenData.access_token);

    // Get email if not public
    const email =
      ghUser.email ?? (await getGitHubUserEmail(tokenData.access_token));

    // Determine admin status
    const admin = isAdminEmail(email) || isAdminUsername(ghUser.login);

    // Upsert user in DB
    const user = await upsertFeedbackUser({
      github_id: ghUser.id,
      username: ghUser.login,
      display_name: ghUser.name,
      avatar_url: ghUser.avatar_url,
      email,
      is_admin: admin,
    });

    // Create session cookie
    const sessionToken = createSessionToken(user.id);
    cookieStore.set(
      FEEDBACK_SESSION_COOKIE,
      sessionToken,
      getSessionCookieOptions(),
    );

    // Redirect back to feedback board or the return URL
    const returnUrl = searchParams.get("return") ?? "/feedback";
    return NextResponse.redirect(new URL(returnUrl, siteUrl()));
  } catch (err) {
    console.error("GitHub OAuth callback error:", err);
    return NextResponse.redirect(
      new URL("/feedback?error=auth_failed", siteUrl()),
    );
  }
}
