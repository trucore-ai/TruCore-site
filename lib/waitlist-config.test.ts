import { afterEach, describe, expect, it } from "vitest";
import {
  hasDatabaseConfig,
  hasResendConfig,
  hasSchedulingConfig,
  getWaitlistConfigStatus,
} from "./waitlist-config";

describe("waitlist-config", () => {
  const envBackup: Record<string, string | undefined> = {};
  const KEYS = [
    "POSTGRES_URL",
    "DATABASE_URL",
    "RESEND_API_KEY",
    "DESIGN_PARTNER_SCHEDULING_URL",
  ] as const;

  afterEach(() => {
    for (const key of KEYS) {
      if (envBackup[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = envBackup[key];
      }
    }
  });

  function clearEnv() {
    for (const key of KEYS) {
      envBackup[key] = process.env[key];
      delete process.env[key];
    }
  }

  it("hasDatabaseConfig returns true when POSTGRES_URL is set", () => {
    clearEnv();
    process.env.POSTGRES_URL = "postgres://localhost/test";
    expect(hasDatabaseConfig()).toBe(true);
  });

  it("hasDatabaseConfig returns true when DATABASE_URL is set", () => {
    clearEnv();
    process.env.DATABASE_URL = "postgres://localhost/test";
    expect(hasDatabaseConfig()).toBe(true);
  });

  it("hasDatabaseConfig returns false when neither is set", () => {
    clearEnv();
    expect(hasDatabaseConfig()).toBe(false);
  });

  it("hasResendConfig returns true when RESEND_API_KEY is set", () => {
    clearEnv();
    process.env.RESEND_API_KEY = "re_test";
    expect(hasResendConfig()).toBe(true);
  });

  it("hasResendConfig returns false when not set", () => {
    clearEnv();
    expect(hasResendConfig()).toBe(false);
  });

  it("hasSchedulingConfig returns true when DESIGN_PARTNER_SCHEDULING_URL is set", () => {
    clearEnv();
    process.env.DESIGN_PARTNER_SCHEDULING_URL = "https://cal.example.com/test";
    expect(hasSchedulingConfig()).toBe(true);
  });

  it("hasSchedulingConfig returns false when not set", () => {
    clearEnv();
    expect(hasSchedulingConfig()).toBe(false);
  });

  it("getWaitlistConfigStatus returns aggregate booleans", () => {
    clearEnv();
    process.env.POSTGRES_URL = "postgres://localhost/test";
    // RESEND_API_KEY intentionally absent
    process.env.DESIGN_PARTNER_SCHEDULING_URL = "https://cal.example.com/test";

    expect(getWaitlistConfigStatus()).toEqual({
      database: true,
      email: false,
      scheduling: true,
    });
  });

  it("getWaitlistConfigStatus returns all false when no env vars set", () => {
    clearEnv();
    expect(getWaitlistConfigStatus()).toEqual({
      database: false,
      email: false,
      scheduling: false,
    });
  });
});
