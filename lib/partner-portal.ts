import { randomBytes } from "node:crypto";
import {
  createPartnerPortalToken,
  getActivePartnerPortalTokenByHash,
  getPartnerFromPortalSession,
  revokePartnerPortalTokensForOwner,
} from "./db";
import { sha256 } from "./hash";

export const PARTNER_PORTAL_COOKIE_NAME = "partner_portal_session";
export const PARTNER_PORTAL_SESSION_MAX_AGE = 60 * 60 * 8;
export const PARTNER_PORTAL_TOKEN_TTL_SECONDS_DEFAULT = 60 * 60 * 24 * 7;

export interface PartnerPortalSessionPayload {
  tokenId: string;
  ownerEmail: string;
  ownerProject: string | null;
  exp: number;
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let index = 0; index < a.length; index++) {
    mismatch |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return mismatch === 0;
}

function getPortalSessionSecret(): string {
  const secret =
    process.env.PARTNER_PORTAL_SESSION_SECRET
    ?? process.env.ADMIN_DASHBOARD_KEY
    ?? "";

  if (!secret) {
    throw new Error("PARTNER_PORTAL_SESSION_SECRET or ADMIN_DASHBOARD_KEY must be configured.");
  }

  return secret;
}

function encodeBase64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decodeBase64Url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sessionSignature(encodedPayload: string): string {
  return sha256(`${encodedPayload}.${getPortalSessionSecret()}`);
}

export function generatePartnerPortalToken(): string {
  return `ptl_live_${randomBytes(24).toString("hex")}`;
}

export function hashPartnerPortalToken(rawToken: string): string {
  return sha256(rawToken.trim());
}

export async function createPartnerPortalAccess({
  ownerEmail,
  ownerProject,
  ttlSeconds = PARTNER_PORTAL_TOKEN_TTL_SECONDS_DEFAULT,
}: {
  ownerEmail: string;
  ownerProject?: string | null;
  ttlSeconds?: number;
}) {
  const normalizedEmail = ownerEmail.trim().toLowerCase();
  const safeProject = ownerProject?.trim().slice(0, 160) || null;
  const safeTtl = Number.isFinite(ttlSeconds)
    ? Math.min(Math.max(Math.floor(ttlSeconds), 60), PARTNER_PORTAL_TOKEN_TTL_SECONDS_DEFAULT)
    : PARTNER_PORTAL_TOKEN_TTL_SECONDS_DEFAULT;

  await revokePartnerPortalTokensForOwner(normalizedEmail);

  const rawToken = generatePartnerPortalToken();
  const tokenHash = hashPartnerPortalToken(rawToken);
  const expiresAt = new Date(Date.now() + safeTtl * 1000);

  const record = await createPartnerPortalToken({
    ownerEmail: normalizedEmail,
    ownerProject: safeProject,
    tokenHash,
    expiresAt,
  });

  return {
    rawToken,
    record,
  };
}

export async function verifyPartnerPortalToken(rawToken: string) {
  const trimmed = rawToken.trim();
  if (!trimmed) return null;

  const tokenHash = hashPartnerPortalToken(trimmed);
  return getActivePartnerPortalTokenByHash(tokenHash);
}

export function createPartnerPortalSessionCookie(payload: PartnerPortalSessionPayload): string {
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signature = sessionSignature(encodedPayload);
  return `v1.${encodedPayload}.${signature}`;
}

export function parsePartnerPortalSessionCookie(value: string | null | undefined): PartnerPortalSessionPayload | null {
  if (!value) return null;

  const [version, encodedPayload, signature] = value.split(".");
  if (version !== "v1" || !encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = sessionSignature(encodedPayload);
  if (!constantTimeEqual(signature, expectedSignature)) {
    return null;
  }

  try {
    const parsed = JSON.parse(decodeBase64Url(encodedPayload)) as PartnerPortalSessionPayload;
    if (!parsed || typeof parsed !== "object") return null;
    if (!parsed.tokenId || !parsed.ownerEmail || typeof parsed.exp !== "number") return null;
    if (parsed.exp <= Math.floor(Date.now() / 1000)) return null;
    return {
      tokenId: parsed.tokenId,
      ownerEmail: parsed.ownerEmail.toLowerCase(),
      ownerProject: parsed.ownerProject ?? null,
      exp: parsed.exp,
    };
  } catch {
    return null;
  }
}

export function getPartnerPortalSessionCookieOptions(maxAge = PARTNER_PORTAL_SESSION_MAX_AGE) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/portal",
    maxAge,
  };
}

export async function resolvePartnerPortalSession(cookieValue: string | null | undefined) {
  const session = parsePartnerPortalSessionCookie(cookieValue);
  if (!session) return null;

  const owner = await getPartnerFromPortalSession({
    tokenId: session.tokenId,
    ownerEmail: session.ownerEmail,
  });

  if (!owner) return null;

  return {
    tokenId: owner.token_id,
    ownerEmail: owner.owner_email,
    ownerProject: owner.owner_project,
    tokenExpiresAt: owner.expires_at,
  };
}
