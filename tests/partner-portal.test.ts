import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => {
  return {
    createPartnerPortalToken: vi.fn(),
    getActivePartnerPortalTokenByHash: vi.fn(),
    getPartnerFromPortalSession: vi.fn(),
    revokePartnerPortalTokensForOwner: vi.fn(),
  };
});

vi.mock("@/lib/db", () => ({
  createPartnerPortalToken: dbMocks.createPartnerPortalToken,
  getActivePartnerPortalTokenByHash: dbMocks.getActivePartnerPortalTokenByHash,
  getPartnerFromPortalSession: dbMocks.getPartnerFromPortalSession,
  revokePartnerPortalTokensForOwner: dbMocks.revokePartnerPortalTokensForOwner,
}));

import {
  createPartnerPortalAccess,
  createPartnerPortalSessionCookie,
  generatePartnerPortalToken,
  hashPartnerPortalToken,
  parsePartnerPortalSessionCookie,
  resolvePartnerPortalSession,
  verifyPartnerPortalToken,
} from "@/lib/partner-portal";

describe("partner portal tokens", () => {
  beforeEach(() => {
    dbMocks.createPartnerPortalToken.mockReset();
    dbMocks.getActivePartnerPortalTokenByHash.mockReset();
    dbMocks.getPartnerFromPortalSession.mockReset();
    dbMocks.revokePartnerPortalTokensForOwner.mockReset();
    process.env.ADMIN_DASHBOARD_KEY = "test-admin-secret";
    delete process.env.PARTNER_PORTAL_SESSION_SECRET;
  });

  it("generates expected token format", () => {
    const token = generatePartnerPortalToken();
    expect(token).toMatch(/^ptl_live_[a-f0-9]{48}$/);
  });

  it("stores hash only when creating partner portal token", async () => {
    dbMocks.createPartnerPortalToken.mockResolvedValue({
      id: "portal-1",
      created_at: new Date().toISOString(),
      revoked_at: null,
      owner_email: "partner@example.com",
      owner_project: "Alpha",
      token_hash: "hashed",
      expires_at: new Date(Date.now() + 60_000).toISOString(),
    });
    dbMocks.revokePartnerPortalTokensForOwner.mockResolvedValue(0);

    const created = await createPartnerPortalAccess({
      ownerEmail: "partner@example.com",
      ownerProject: "Alpha",
      ttlSeconds: 3600,
    });

    expect(created.rawToken).toMatch(/^ptl_live_[a-f0-9]{48}$/);
    expect(dbMocks.revokePartnerPortalTokensForOwner).toHaveBeenCalledWith("partner@example.com");

    const createArgs = dbMocks.createPartnerPortalToken.mock.calls[0]?.[0] as {
      tokenHash: string;
    };

    expect(createArgs.tokenHash).toBe(hashPartnerPortalToken(created.rawToken));
    expect(createArgs.tokenHash).not.toContain(created.rawToken);
  });

  it("rejects expired or revoked tokens during verification", async () => {
    dbMocks.getActivePartnerPortalTokenByHash.mockResolvedValueOnce(null);
    dbMocks.getActivePartnerPortalTokenByHash.mockResolvedValueOnce(null);

    const expiredResult = await verifyPartnerPortalToken("ptl_live_expiredtoken000000000000000000000000000000000000");
    const revokedResult = await verifyPartnerPortalToken("ptl_live_revokedtoken000000000000000000000000000000000000");

    expect(expiredResult).toBeNull();
    expect(revokedResult).toBeNull();
    expect(dbMocks.getActivePartnerPortalTokenByHash).toHaveBeenCalledTimes(2);
  });
});

describe("partner portal session cookie", () => {
  beforeEach(() => {
    dbMocks.getPartnerFromPortalSession.mockReset();
    process.env.ADMIN_DASHBOARD_KEY = "test-admin-secret";
    delete process.env.PARTNER_PORTAL_SESSION_SECRET;
  });

  it("parses valid signed session cookie and rejects tampered cookie", () => {
    const now = Math.floor(Date.now() / 1000);
    const cookie = createPartnerPortalSessionCookie({
      tokenId: "portal-1",
      ownerEmail: "partner@example.com",
      ownerProject: "Alpha",
      exp: now + 3600,
    });

    const parsed = parsePartnerPortalSessionCookie(cookie);
    expect(parsed?.tokenId).toBe("portal-1");
    expect(parsed?.ownerEmail).toBe("partner@example.com");

    const parts = cookie.split(".");
    const tampered = `${parts[0]}.${parts[1]}x.${parts[2]}`;
    expect(parsePartnerPortalSessionCookie(tampered)).toBeNull();
  });

  it("gates portal session by DB lookup", async () => {
    const now = Math.floor(Date.now() / 1000);
    const cookie = createPartnerPortalSessionCookie({
      tokenId: "portal-2",
      ownerEmail: "partner@example.com",
      ownerProject: null,
      exp: now + 3600,
    });

    dbMocks.getPartnerFromPortalSession.mockResolvedValueOnce(null);
    const blocked = await resolvePartnerPortalSession(cookie);
    expect(blocked).toBeNull();

    dbMocks.getPartnerFromPortalSession.mockResolvedValueOnce({
      token_id: "portal-2",
      owner_email: "partner@example.com",
      owner_project: "Alpha",
      expires_at: new Date(Date.now() + 3600_000).toISOString(),
    });

    const resolved = await resolvePartnerPortalSession(cookie);
    expect(resolved).not.toBeNull();
    expect(resolved?.ownerEmail).toBe("partner@example.com");
  });
});
