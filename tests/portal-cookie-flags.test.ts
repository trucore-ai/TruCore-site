import { beforeEach, describe, expect, it, vi } from "vitest";
import { parseSetCookie } from "./helpers/cookies";

const dbMocks = vi.hoisted(() => {
  return {
    getActivePartnerPortalTokenByHash: vi.fn(),
  };
});

vi.mock("@/lib/db", () => {
  return {
    getActivePartnerPortalTokenByHash: dbMocks.getActivePartnerPortalTokenByHash,
    createPartnerPortalToken: vi.fn(),
    getPartnerFromPortalSession: vi.fn(),
    revokePartnerPortalTokensForOwner: vi.fn(),
  };
});

import { POST as portalLoginPost } from "@/app/portal/login/route";

function buildPostRequest(token: string) {
  return new Request("https://trucore.xyz/portal/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ token }).toString(),
  });
}

describe("portal login cookie flags", () => {
  beforeEach(() => {
    dbMocks.getActivePartnerPortalTokenByHash.mockReset();
    process.env.PARTNER_PORTAL_SESSION_SECRET = "test_secret_partner_portal";
  });

  it("sets partner_portal_session with hardened attributes on successful login in production", async () => {
    process.env.NODE_ENV = "production";
    dbMocks.getActivePartnerPortalTokenByHash.mockResolvedValue({
      id: "portal-token-1",
      owner_email: "partner@example.com",
      owner_project: "Alpha",
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    });

    const response = await portalLoginPost(buildPostRequest("ptl_live_valid") as never);
    const setCookie = response.headers.get("set-cookie");

    expect(response.status).toBe(303);
    expect(setCookie).toBeTruthy();

    const parsed = parseSetCookie(String(setCookie));
    expect(parsed.name).toBe("partner_portal_session");
    expect(parsed.value).toBeTruthy();

    expect(parsed.attributes.has("httponly")).toBe(true);
    expect(String(parsed.attributes.get("samesite")).toLowerCase()).toBe("lax");
    expect(parsed.attributes.get("path")).toBe("/portal");
    expect(parsed.attributes.has("secure")).toBe(true);
  });

  it("does not set session cookie for invalid token", async () => {
    process.env.NODE_ENV = "test";
    dbMocks.getActivePartnerPortalTokenByHash.mockResolvedValue(null);

    const response = await portalLoginPost(buildPostRequest("ptl_live_invalid") as never);

    expect(response.status).toBe(404);
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("allows Secure to be present or absent outside production while keeping core flags", async () => {
    process.env.NODE_ENV = "test";
    dbMocks.getActivePartnerPortalTokenByHash.mockResolvedValue({
      id: "portal-token-2",
      owner_email: "partner@example.com",
      owner_project: null,
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    });

    const response = await portalLoginPost(buildPostRequest("ptl_live_valid_non_prod") as never);
    const setCookie = response.headers.get("set-cookie");

    expect(response.status).toBe(303);
    expect(setCookie).toBeTruthy();

    const parsed = parseSetCookie(String(setCookie));
    expect(parsed.name).toBe("partner_portal_session");
    expect(parsed.attributes.has("httponly")).toBe(true);
    expect(String(parsed.attributes.get("samesite")).toLowerCase()).toBe("lax");
    expect(parsed.attributes.get("path")).toBe("/portal");
  });
});