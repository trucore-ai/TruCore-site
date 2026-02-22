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
  assertAdminSession,
  getAdminSessionFromCookies,
  isAdminKeyValid,
} from "./admin-auth";

const ORIGINAL_ADMIN_KEY = process.env.ADMIN_DASHBOARD_KEY;

describe("admin-auth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.cookieValues.clear();
    process.env.ADMIN_DASHBOARD_KEY = "super-secret-admin-key";
  });

  it("returns false for missing cookie session", async () => {
    await expect(getAdminSessionFromCookies()).resolves.toBe(false);
  });

  it("returns false for wrong cookie session", async () => {
    mocks.cookieValues.set(ADMIN_COOKIE_NAME, "wrong-key");

    await expect(getAdminSessionFromCookies()).resolves.toBe(false);
  });

  it("returns true for valid cookie session", async () => {
    mocks.cookieValues.set(ADMIN_COOKIE_NAME, "super-secret-admin-key");

    await expect(getAdminSessionFromCookies()).resolves.toBe(true);
  });

  it("assertAdminSession throws when cookie is missing", async () => {
    await expect(assertAdminSession()).rejects.toThrow("unauthorized");
  });

  it("assertAdminSession throws when cookie is invalid", async () => {
    mocks.cookieValues.set(ADMIN_COOKIE_NAME, "incorrect");

    await expect(assertAdminSession()).rejects.toThrow("unauthorized");
  });

  it("assertAdminSession succeeds when cookie is valid", async () => {
    mocks.cookieValues.set(ADMIN_COOKIE_NAME, "super-secret-admin-key");

    await expect(assertAdminSession()).resolves.toBeUndefined();
  });

  it("validates key with strict exact matching behavior", () => {
    expect(isAdminKeyValid("super-secret-admin-key")).toBe(true);
    expect(isAdminKeyValid("super-secret-admin-kex")).toBe(false);
    expect(isAdminKeyValid("super-secret-admin-key ")).toBe(false);
    expect(isAdminKeyValid("super-secret-admin-ke")).toBe(false);
  });

  it("returns false when env key or provided key is missing", () => {
    process.env.ADMIN_DASHBOARD_KEY = "";
    expect(isAdminKeyValid("super-secret-admin-key")).toBe(false);

    process.env.ADMIN_DASHBOARD_KEY = "super-secret-admin-key";
    expect(isAdminKeyValid(undefined)).toBe(false);
    expect(isAdminKeyValid(null)).toBe(false);
  });

  it("exports cookie constants used by login route with secure defaults", () => {
    expect(ADMIN_COOKIE_NAME).toBe("admin_session");
    expect(ADMIN_COOKIE_MAX_AGE).toBe(60 * 60 * 8);
  });
});

afterAll(() => {
  if (ORIGINAL_ADMIN_KEY === undefined) {
    delete process.env.ADMIN_DASHBOARD_KEY;
    return;
  }

  process.env.ADMIN_DASHBOARD_KEY = ORIGINAL_ADMIN_KEY;
});