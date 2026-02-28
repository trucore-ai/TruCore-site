import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  createSessionToken,
  verifySessionToken,
  isAdminEmail,
  isAdminUsername,
} from "@/lib/feedback-auth";

describe("feedback-auth session tokens", () => {
  beforeEach(() => {
    vi.stubEnv("FEEDBACK_SESSION_SECRET", "test-secret-key-for-feedback");
  });

  it("creates and verifies a valid session token", () => {
    const token = createSessionToken("user-123");
    const payload = verifySessionToken(token);
    expect(payload).not.toBeNull();
    expect(payload?.uid).toBe("user-123");
  });

  it("returns null for tampered token", () => {
    const token = createSessionToken("user-123");
    const tampered = token.slice(0, -4) + "xxxx";
    expect(verifySessionToken(tampered)).toBeNull();
  });

  it("returns null for empty token", () => {
    expect(verifySessionToken("")).toBeNull();
  });

  it("returns null for malformed token without dot", () => {
    expect(verifySessionToken("nodot")).toBeNull();
  });

  it("returns null for expired token", async () => {
    // Create a token, then manually craft one with past expiry
    const payload = { uid: "user-123", exp: Math.floor(Date.now() / 1000) - 100 };
    const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const { createHmac } = await import("node:crypto");
    const sig = createHmac("sha256", "test-secret-key-for-feedback")
      .update(encoded)
      .digest("hex");
    const expiredToken = `${encoded}.${sig}`;
    expect(verifySessionToken(expiredToken)).toBeNull();
  });
});

describe("admin role checks", () => {
  beforeEach(() => {
    vi.stubEnv("FEEDBACK_ADMIN_EMAILS", "admin@test.com,devlead");
  });

  it("recognizes admin email", () => {
    expect(isAdminEmail("admin@test.com")).toBe(true);
  });

  it("is case-insensitive for admin email", () => {
    expect(isAdminEmail("Admin@Test.com")).toBe(true);
  });

  it("rejects non-admin email", () => {
    expect(isAdminEmail("user@test.com")).toBe(false);
  });

  it("returns false for null email", () => {
    expect(isAdminEmail(null)).toBe(false);
  });

  it("recognizes admin username", () => {
    expect(isAdminUsername("devlead")).toBe(true);
  });

  it("rejects non-admin username", () => {
    expect(isAdminUsername("randomuser")).toBe(false);
  });
});
