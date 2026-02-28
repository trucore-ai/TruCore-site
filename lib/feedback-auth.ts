/**
 * Feedback authentication helpers.
 *
 * GitHub OAuth for user login + signed HttpOnly cookie sessions.
 * Admin role determined by FEEDBACK_ADMIN_EMAILS env var.
 */

import { cookies } from "next/headers";
import crypto from "node:crypto";

/* ---------- constants ---------- */

export const FEEDBACK_SESSION_COOKIE = "fb_session";
export const FEEDBACK_SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/* ---------- env helpers ---------- */

function getSessionSecret(): string {
  const secret =
    process.env.FEEDBACK_SESSION_SECRET ??
    process.env.ADMIN_DASHBOARD_KEY;
  if (!secret) {
    throw new Error(
      "FEEDBACK_SESSION_SECRET (or ADMIN_DASHBOARD_KEY) is not configured.",
    );
  }
  return secret;
}

export function getGitHubClientId(): string {
  const id = process.env.GITHUB_CLIENT_ID;
  if (!id) throw new Error("GITHUB_CLIENT_ID is not configured.");
  return id;
}

export function getGitHubClientSecret(): string {
  const secret = process.env.GITHUB_CLIENT_SECRET;
  if (!secret) throw new Error("GITHUB_CLIENT_SECRET is not configured.");
  return secret;
}

/* ---------- admin check ---------- */

const adminEmailsCache: Set<string> | null = null;

function getAdminEmails(): Set<string> {
  if (adminEmailsCache) return adminEmailsCache;
  const raw = process.env.FEEDBACK_ADMIN_EMAILS ?? "";
  return new Set(
    raw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAdminEmails().has(email.toLowerCase());
}

export function isAdminUsername(username: string | null | undefined): boolean {
  if (!username) return false;
  return getAdminEmails().has(username.toLowerCase());
}

/* ---------- session signing ---------- */

interface SessionPayload {
  uid: string;
  exp: number;
}

function signPayload(payload: string, secret: string): string {
  return crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
}

export function createSessionToken(userId: string): string {
  const secret = getSessionSecret();
  const payload: SessionPayload = {
    uid: userId,
    exp: Math.floor(Date.now() / 1000) + FEEDBACK_SESSION_MAX_AGE,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = signPayload(encoded, secret);
  return `${encoded}.${sig}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const secret = getSessionSecret();
    const [encoded, sig] = token.split(".");
    if (!encoded || !sig) return null;

    const expectedSig = signPayload(encoded, secret);

    // constant-time comparison
    if (sig.length !== expectedSig.length) return null;
    let mismatch = 0;
    for (let i = 0; i < sig.length; i++) {
      mismatch |= sig.charCodeAt(i) ^ expectedSig.charCodeAt(i);
    }
    if (mismatch !== 0) return null;

    const payload: SessionPayload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    );

    if (payload.exp < Math.floor(Date.now() / 1000)) return null;

    return payload;
  } catch {
    return null;
  }
}

/* ---------- cookie helpers ---------- */

export async function getSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(FEEDBACK_SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = verifySessionToken(token);
  return payload?.uid ?? null;
}

export interface FeedbackSessionCookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax";
  path: string;
  maxAge: number;
}

export function getSessionCookieOptions(
  maxAge: number = FEEDBACK_SESSION_MAX_AGE,
): FeedbackSessionCookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  };
}

/* ---------- GitHub OAuth helpers ---------- */

export function getGitHubAuthorizeUrl(state: string): string {
  const clientId = getGitHubClientId();
  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://trucore.xyz"}/api/auth/github/callback`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "read:user user:email",
    state,
  });
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

export interface GitHubTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

export async function exchangeCodeForToken(
  code: string,
): Promise<GitHubTokenResponse> {
  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: getGitHubClientId(),
      client_secret: getGitHubClientSecret(),
      code,
    }),
  });
  if (!res.ok) {
    throw new Error(`GitHub token exchange failed: ${res.status}`);
  }
  const data = await res.json();
  if (data.error) {
    throw new Error(`GitHub OAuth error: ${data.error_description ?? data.error}`);
  }
  return data as GitHubTokenResponse;
}

export interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
  email: string | null;
}

export async function getGitHubUser(
  accessToken: string,
): Promise<GitHubUser> {
  const res = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
    },
  });
  if (!res.ok) {
    throw new Error(`GitHub user fetch failed: ${res.status}`);
  }
  return res.json() as Promise<GitHubUser>;
}

export async function getGitHubUserEmail(
  accessToken: string,
): Promise<string | null> {
  try {
    const res = await fetch("https://api.github.com/user/emails", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
      },
    });
    if (!res.ok) return null;
    const emails = (await res.json()) as Array<{
      email: string;
      primary: boolean;
      verified: boolean;
    }>;
    const primary = emails.find((e) => e.primary && e.verified);
    return primary?.email ?? emails[0]?.email ?? null;
  } catch {
    return null;
  }
}
