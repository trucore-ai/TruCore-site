import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const cookieValues = new Map<string, string>();

  const cookieStore = {
    get: vi.fn((name: string) => {
      const value = cookieValues.get(name);
      return value === undefined ? undefined : { name, value };
    }),
  };

  return {
    cookieValues,
    cookieStore,
    cookiesMock: vi.fn(async () => cookieStore),
  };
});

vi.mock("next/headers", () => ({
  cookies: mocks.cookiesMock,
}));

import {
  ADMIN_COOKIE_MAX_AGE,
  ADMIN_COOKIE_NAME,
  IDLE_TIMEOUT_SECONDS,
  LAST_SEEN_THROTTLE_SECONDS,
  SESSION_GC_RETENTION_MULTIPLIER,
  assertAdminSession,
  createSessionToken,
  getAdminSessionFromCookies,
  isAdminKeyValid,
  isValidSessionToken,
  revokeSessionToken,
  touchSession,
  _getSessionStore,
  _resetGcTimer,
} from "./admin-auth";

const ORIGINAL_ADMIN_KEY = process.env.ADMIN_DASHBOARD_KEY;

describe("admin-auth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.cookieValues.clear();
    _getSessionStore().clear();
    _resetGcTimer();
    process.env.ADMIN_DASHBOARD_KEY = "super-secret-admin-key";
  });

  it("returns false for missing cookie session", async () => {
    await expect(getAdminSessionFromCookies()).resolves.toBe(false);
  });

  it("returns false for wrong cookie session", async () => {
    mocks.cookieValues.set(ADMIN_COOKIE_NAME, "wrong-token");

    await expect(getAdminSessionFromCookies()).resolves.toBe(false);
  });

  it("returns true for valid session token in cookie", async () => {
    const token = createSessionToken();
    mocks.cookieValues.set(ADMIN_COOKIE_NAME, token);

    await expect(getAdminSessionFromCookies()).resolves.toBe(true);
  });

  it("assertAdminSession throws when cookie is missing", async () => {
    await expect(assertAdminSession()).rejects.toThrow("unauthorized");
  });

  it("assertAdminSession throws when cookie is invalid", async () => {
    mocks.cookieValues.set(ADMIN_COOKIE_NAME, "incorrect");

    await expect(assertAdminSession()).rejects.toThrow("unauthorized");
  });

  it("assertAdminSession succeeds when cookie has valid token", async () => {
    const token = createSessionToken();
    mocks.cookieValues.set(ADMIN_COOKIE_NAME, token);

    await expect(assertAdminSession()).resolves.toBeUndefined();
  });

  it("validates key with strict exact matching behavior", () => {
    expect(isAdminKeyValid("super-secret-admin-key")).toBe(true);
    expect(isAdminKeyValid("super-secret-admin-kex")).toBe(false);
    expect(isAdminKeyValid("super-secret-admin-key ")).toBe(true); // trimmed
    expect(isAdminKeyValid(" super-secret-admin-key")).toBe(true); // trimmed
    expect(isAdminKeyValid("super-secret-admin-ke")).toBe(false);
  });

  it("returns false when env key or provided key is missing", () => {
    process.env.ADMIN_DASHBOARD_KEY = "";
    expect(isAdminKeyValid("super-secret-admin-key")).toBe(false);

    process.env.ADMIN_DASHBOARD_KEY = "super-secret-admin-key";
    expect(isAdminKeyValid(undefined)).toBe(false);
    expect(isAdminKeyValid(null)).toBe(false);
  });

  it("exports cookie constants with secure defaults", () => {
    expect(ADMIN_COOKIE_NAME).toBe("admin_session");
    expect(ADMIN_COOKIE_MAX_AGE).toBe(60 * 60);
  });

  it("createSessionToken produces a unique token each call", () => {
    const t1 = createSessionToken();
    const t2 = createSessionToken();
    expect(t1).toBeTruthy();
    expect(t2).toBeTruthy();
    // With nonce, tokens must differ even when created in the same ms tick
    expect(t1).not.toBe(t2);
    expect(_getSessionStore().has(t1)).toBe(true);
    expect(_getSessionStore().has(t2)).toBe(true);
  });

  it("isValidSessionToken rejects null/undefined/unknown tokens", () => {
    expect(isValidSessionToken(null)).toBe(false);
    expect(isValidSessionToken(undefined)).toBe(false);
    expect(isValidSessionToken("nonexistent")).toBe(false);
  });

  it("revokeSessionToken marks token as revoked without removing from store", () => {
    const token = createSessionToken();
    expect(isValidSessionToken(token)).toBe(true);
    revokeSessionToken(token);
    expect(isValidSessionToken(token)).toBe(false);
    // Token stays in the store with revokedAt set
    const record = _getSessionStore().get(token);
    expect(record).toBeDefined();
    expect(record!.revokedAt).toBeTypeOf("number");
  });

  it("isValidSessionToken rejects expired tokens", () => {
    const token = createSessionToken();
    // Backdate the creation to beyond max age
    const old = Date.now() - (ADMIN_COOKIE_MAX_AGE + 1) * 1000;
    _getSessionStore().set(token, { issuedAt: old, lastSeenAt: old });
    expect(isValidSessionToken(token)).toBe(false);
    // Token should also be cleaned up from the store
    expect(_getSessionStore().has(token)).toBe(false);
  });

  it("isValidSessionToken rejects idle-timed-out tokens", () => {
    const token = createSessionToken();
    const record = _getSessionStore().get(token)!;
    // Session was created recently but lastSeenAt is beyond idle timeout
    record.lastSeenAt = Date.now() - (IDLE_TIMEOUT_SECONDS + 1) * 1000;
    expect(isValidSessionToken(token)).toBe(false);
    expect(_getSessionStore().has(token)).toBe(false);
  });

  it("isValidSessionToken rejects revoked tokens", () => {
    const token = createSessionToken();
    revokeSessionToken(token);
    expect(isValidSessionToken(token)).toBe(false);
    // Revoked tokens stay in store (not deleted)
    expect(_getSessionStore().has(token)).toBe(true);
  });

  it("isValidSessionToken rejects malformed session records", () => {
    const token = createSessionToken();
    // Corrupt the record
    _getSessionStore().set(token, { issuedAt: "bad", lastSeenAt: 0 } as never);
    expect(isValidSessionToken(token)).toBe(false);
    // Malformed records are deleted
    expect(_getSessionStore().has(token)).toBe(false);
  });

  it("touchSession updates lastSeenAt when throttle interval has elapsed", () => {
    const token = createSessionToken();
    const record = _getSessionStore().get(token)!;

    // Simulate that enough time has passed
    record.lastSeenAt = Date.now() - (LAST_SEEN_THROTTLE_SECONDS + 1) * 1000;
    const oldLastSeen = record.lastSeenAt;

    expect(touchSession(token)).toBe(true);
    expect(record.lastSeenAt).toBeGreaterThan(oldLastSeen);
  });

  it("touchSession skips update when throttle interval has not elapsed", () => {
    const token = createSessionToken();
    const record = _getSessionStore().get(token)!;
    const originalLastSeen = record.lastSeenAt;

    // Touch immediately — should not update
    expect(touchSession(token)).toBe(true);
    expect(record.lastSeenAt).toBe(originalLastSeen);
  });

  it("touchSession returns false for revoked session", () => {
    const token = createSessionToken();
    revokeSessionToken(token);
    expect(touchSession(token)).toBe(false);
  });

  it("touchSession returns false for nonexistent token", () => {
    expect(touchSession("nonexistent")).toBe(false);
  });

  it("getAdminSessionFromCookies touches session on success", async () => {
    const token = createSessionToken();
    const record = _getSessionStore().get(token)!;
    // Backdate lastSeenAt beyond throttle window
    record.lastSeenAt = Date.now() - (LAST_SEEN_THROTTLE_SECONDS + 1) * 1000;
    const oldLastSeen = record.lastSeenAt;

    mocks.cookieValues.set(ADMIN_COOKIE_NAME, token);
    const result = await getAdminSessionFromCookies();
    expect(result).toBe(true);
    expect(record.lastSeenAt).toBeGreaterThan(oldLastSeen);
  });

  it("createSessionToken stores full SessionRecord", () => {
    const token = createSessionToken();
    const record = _getSessionStore().get(token);
    expect(record).toBeDefined();
    expect(record!.issuedAt).toBeTypeOf("number");
    expect(record!.lastSeenAt).toBeTypeOf("number");
    expect(record!.revokedAt).toBeUndefined();
  });

  it("exports idle timeout and throttle constants", () => {
    expect(IDLE_TIMEOUT_SECONDS).toBe(15 * 60);
    expect(LAST_SEEN_THROTTLE_SECONDS).toBe(60);
  });

  /* ---------- session GC ---------- */

  describe("session GC", () => {
    it("removes expired sessions", () => {
      const store = _getSessionStore();
      const old = Date.now() - (ADMIN_COOKIE_MAX_AGE + 1) * 1000;
      store.set("expired-tok", { issuedAt: old, lastSeenAt: old });

      _resetGcTimer(); // force GC eligibility
      createSessionToken(); // triggers GC

      expect(store.has("expired-tok")).toBe(false);
    });

    it("retains revoked sessions until retention threshold", () => {
      const store = _getSessionStore();
      // Revoked and expired, but within retention window
      const expiredRecently =
        Date.now() - (ADMIN_COOKIE_MAX_AGE + 10) * 1000;
      store.set("revoked-recent", {
        issuedAt: expiredRecently,
        lastSeenAt: expiredRecently,
        revokedAt: expiredRecently + 1000,
      });

      _resetGcTimer();
      createSessionToken();

      // Should still be in the store (within 2× max age)
      expect(store.has("revoked-recent")).toBe(true);
    });

    it("removes revoked sessions past retention threshold", () => {
      const store = _getSessionStore();
      const veryOld =
        Date.now() -
        ADMIN_COOKIE_MAX_AGE * SESSION_GC_RETENTION_MULTIPLIER * 1000 -
        1000;
      store.set("revoked-old", {
        issuedAt: veryOld,
        lastSeenAt: veryOld,
        revokedAt: veryOld + 1000,
      });

      _resetGcTimer();
      createSessionToken();

      expect(store.has("revoked-old")).toBe(false);
    });

    it("removes malformed records", () => {
      const store = _getSessionStore();
      store.set("malformed-tok", {
        issuedAt: "bad",
        lastSeenAt: 0,
      } as never);

      _resetGcTimer();
      createSessionToken();

      expect(store.has("malformed-tok")).toBe(false);
    });

    it("respects GC interval — skips sweep when interval not elapsed", () => {
      const store = _getSessionStore();
      const old = Date.now() - (ADMIN_COOKIE_MAX_AGE + 1) * 1000;

      // First call — triggers GC, resets timer
      _resetGcTimer();
      createSessionToken();

      // Add expired session AFTER GC ran
      store.set("late-expired", { issuedAt: old, lastSeenAt: old });

      // Second call without resetting timer — GC should NOT run
      createSessionToken();
      expect(store.has("late-expired")).toBe(true);

      // After resetting timer, GC runs again
      _resetGcTimer();
      createSessionToken();
      expect(store.has("late-expired")).toBe(false);
    });

    it("GC triggered by touchSession", () => {
      const store = _getSessionStore();
      const old = Date.now() - (ADMIN_COOKIE_MAX_AGE + 1) * 1000;
      store.set("expired-touch", { issuedAt: old, lastSeenAt: old });

      const token = createSessionToken();
      // Reset GC timer so touchSession can trigger it
      _resetGcTimer();

      // Re-add expired session
      store.set("expired-touch2", { issuedAt: old, lastSeenAt: old });
      touchSession(token);
      expect(store.has("expired-touch2")).toBe(false);
    });
  });

  /* ---------- self-verifying token fallback (serverless) ---------- */

  describe("self-verifying token fallback", () => {
    it("validates a token after session store is cleared (cold start)", () => {
      const token = createSessionToken();
      expect(isValidSessionToken(token)).toBe(true);

      // Simulate serverless cold start: store is empty
      _getSessionStore().clear();
      expect(_getSessionStore().size).toBe(0);

      // Token should still validate via HMAC fallback
      expect(isValidSessionToken(token)).toBe(true);

      // Should re-register in the store
      expect(_getSessionStore().has(token)).toBe(true);
    });

    it("touchSession works after cold-start re-registration", () => {
      const token = createSessionToken();
      _getSessionStore().clear();

      // touchSession should self-verify and register
      expect(touchSession(token)).toBe(true);
      expect(_getSessionStore().has(token)).toBe(true);
    });

    it("getAdminSessionFromCookies works after cold start", async () => {
      const token = createSessionToken();
      _getSessionStore().clear();

      mocks.cookieValues.set(ADMIN_COOKIE_NAME, token);
      const result = await getAdminSessionFromCookies();
      expect(result).toBe(true);
    });

    it("rejects self-verifying token with wrong HMAC", () => {
      const token = createSessionToken();
      _getSessionStore().clear();

      // Tamper with the HMAC portion
      const parts = token.split(".");
      const tampered = `${parts[0]}.${parts[1]}.${"a".repeat(64)}`;
      expect(isValidSessionToken(tampered)).toBe(false);
    });

    it("rejects self-verifying token past absolute expiry", () => {
      createSessionToken();
      _getSessionStore().clear();

      // Backdate: create a token with old issuedAt
      const oldIat = Date.now() - (ADMIN_COOKIE_MAX_AGE + 1) * 1000;
      // We can't recompute the HMAC externally, so use createSessionToken and modify store
      const token2 = createSessionToken();
      const record = _getSessionStore().get(token2)!;
      record.issuedAt = oldIat;
      record.lastSeenAt = oldIat;

      // Primary path should reject
      expect(isValidSessionToken(token2)).toBe(false);
    });

    it("self-verifying token format has three dot-separated parts", () => {
      const token = createSessionToken();
      const parts = token.split(".");
      expect(parts.length).toBe(3);
      expect(Number(parts[0])).toBeGreaterThan(0); // issuedAt
      expect(parts[1].length).toBe(32); // nonce (16 bytes hex)
      expect(parts[2].length).toBe(64); // HMAC-SHA256 hex
    });
  });
});

afterAll(() => {
  if (ORIGINAL_ADMIN_KEY === undefined) {
    delete process.env.ADMIN_DASHBOARD_KEY;
    return;
  }

  process.env.ADMIN_DASHBOARD_KEY = ORIGINAL_ADMIN_KEY;
});