import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/* ---------- dynamic import mock for lib/db ---------- */

const dbMocks = vi.hoisted(() => ({
  ensureWaitlistTable: vi.fn(),
  upsertWaitlistSignup: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  ensureWaitlistTable: dbMocks.ensureWaitlistTable,
  upsertWaitlistSignup: dbMocks.upsertWaitlistSignup,
}));

import {
  ensureWaitlistTable,
  upsertWaitlistSignup,
  __resetMemoryStoreForTesting,
  __getMemoryEntriesForTesting,
} from "./waitlist-store";

function baseParams(overrides: Record<string, unknown> = {}) {
  return {
    email: "test@example.com",
    role: null,
    useCase: null,
    source: "homepage",
    userAgent: null,
    ipHash: null,
    intent: "standard",
    projectName: null,
    integrationsInterest: null,
    txVolumeBucket: null,
    buildStage: null,
    utmSource: null,
    utmMedium: null,
    utmCampaign: null,
    utmTerm: null,
    utmContent: null,
    ...overrides,
  };
}

describe("waitlist-store", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    __resetMemoryStoreForTesting();
    // Default: no DB, memory fallback allowed, test env
    delete process.env.POSTGRES_URL;
    delete process.env.DATABASE_URL;
    process.env.WAITLIST_FALLBACK_MODE = "memory";
    vi.stubEnv("NODE_ENV", "test");

    dbMocks.ensureWaitlistTable.mockResolvedValue(undefined);
    dbMocks.upsertWaitlistSignup.mockResolvedValue({ isNew: true });
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  /* ---------- memory fallback ---------- */

  describe("memory fallback (no DB, WAITLIST_FALLBACK_MODE=memory, non-production)", () => {
    it("ensureWaitlistTable resolves without calling DB", async () => {
      await ensureWaitlistTable();
      expect(dbMocks.ensureWaitlistTable).not.toHaveBeenCalled();
    });

    it("upsertWaitlistSignup stores entry in memory and returns isNew=true", async () => {
      const result = await upsertWaitlistSignup(baseParams());
      expect(result.isNew).toBe(true);
      expect(dbMocks.upsertWaitlistSignup).not.toHaveBeenCalled();

      const entries = __getMemoryEntriesForTesting();
      expect(entries.size).toBe(1);
      expect(entries.get("test@example.com")).toMatchObject({ email: "test@example.com" });
    });

    it("returns isNew=false for duplicate email", async () => {
      await upsertWaitlistSignup(baseParams());
      const result = await upsertWaitlistSignup(baseParams({ useCase: "updated" }));
      expect(result.isNew).toBe(false);
      expect(__getMemoryEntriesForTesting().size).toBe(1);
    });

    it("reset helper clears entries", async () => {
      await upsertWaitlistSignup(baseParams());
      expect(__getMemoryEntriesForTesting().size).toBe(1);
      __resetMemoryStoreForTesting();
      expect(__getMemoryEntriesForTesting().size).toBe(0);
    });
  });

  /* ---------- Postgres path ---------- */

  describe("Postgres path (DB configured)", () => {
    beforeEach(() => {
      process.env.POSTGRES_URL = "postgres://localhost/test";
    });

    it("ensureWaitlistTable delegates to DB even if fallback is set", async () => {
      await ensureWaitlistTable();
      expect(dbMocks.ensureWaitlistTable).toHaveBeenCalledTimes(1);
    });

    it("upsertWaitlistSignup delegates to DB", async () => {
      const params = baseParams();
      const result = await upsertWaitlistSignup(params);
      expect(dbMocks.upsertWaitlistSignup).toHaveBeenCalledWith(params);
      expect(result.isNew).toBe(true);
      expect(__getMemoryEntriesForTesting().size).toBe(0);
    });

    it("prefers DB even when WAITLIST_FALLBACK_MODE=memory", async () => {
      process.env.WAITLIST_FALLBACK_MODE = "memory";
      await upsertWaitlistSignup(baseParams());
      expect(dbMocks.upsertWaitlistSignup).toHaveBeenCalledTimes(1);
    });
  });

  /* ---------- production safety ---------- */

  describe("production safety", () => {
    it("DB is always preferred even when fallback flag is set", async () => {
      process.env.POSTGRES_URL = "postgres://localhost/prod";
      process.env.WAITLIST_FALLBACK_MODE = "memory";

      await upsertWaitlistSignup(baseParams());
      expect(dbMocks.upsertWaitlistSignup).toHaveBeenCalledTimes(1);
      expect(__getMemoryEntriesForTesting().size).toBe(0);
    });

    it("test helpers throw in production", () => {
      vi.stubEnv("NODE_ENV", "production");
      expect(() => __resetMemoryStoreForTesting()).toThrow("not available in production");
      expect(() => __getMemoryEntriesForTesting()).toThrow("not available in production");
    });

    it("fallback not used when flag is absent even without DB", async () => {
      delete process.env.WAITLIST_FALLBACK_MODE;
      delete process.env.POSTGRES_URL;
      delete process.env.DATABASE_URL;

      dbMocks.ensureWaitlistTable.mockRejectedValue(
        new Error("POSTGRES_URL (or DATABASE_URL) is not configured."),
      );

      await expect(ensureWaitlistTable()).rejects.toThrow("not configured");
    });
  });

  /* ---------- no backend available ---------- */

  describe("graceful error when no backend and fallback disabled", () => {
    it("delegates to DB (which throws) when fallback mode is not set", async () => {
      delete process.env.WAITLIST_FALLBACK_MODE;
      delete process.env.POSTGRES_URL;
      delete process.env.DATABASE_URL;

      dbMocks.ensureWaitlistTable.mockRejectedValue(
        new Error("POSTGRES_URL (or DATABASE_URL) is not configured."),
      );

      await expect(ensureWaitlistTable()).rejects.toThrow("not configured");
    });

    it("delegates to DB when fallback mode is an unrecognized value", async () => {
      process.env.WAITLIST_FALLBACK_MODE = "disk";
      delete process.env.POSTGRES_URL;
      delete process.env.DATABASE_URL;

      dbMocks.upsertWaitlistSignup.mockRejectedValue(
        new Error("POSTGRES_URL (or DATABASE_URL) is not configured."),
      );

      await expect(upsertWaitlistSignup(baseParams())).rejects.toThrow("not configured");
    });
  });
});
