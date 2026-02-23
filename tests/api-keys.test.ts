import { beforeEach, describe, expect, it, vi } from "vitest";
import { assertRateLimit } from "@/lib/rate-limit";

const mockApiKeyRows: Array<{
  id: string;
  name: string;
  key_hash: string;
  created_at: string;
  revoked_at: string | null;
}> = [];

vi.mock("@/lib/db", () => {
  return {
    ensureApiKeyTables: vi.fn(async () => undefined),
    getSQL: () =>
      async (_strings: TemplateStringsArray, ...values: unknown[]) => {
        const keyHash = String(values[0] ?? "");
        return mockApiKeyRows.filter((row) => row.key_hash === keyHash);
      },
  };
});

import {
  KEYED_SIM_RATE_LIMIT_MAX,
  PUBLIC_SIM_RATE_LIMIT_MAX,
  generateApiKey,
  hashKey,
  validateApiKey,
} from "@/lib/api-keys";

function createKey(label: string): string {
  return `${label}-${Math.random().toString(36).slice(2)}`;
}

describe("api key foundation", () => {
  beforeEach(() => {
    mockApiKeyRows.splice(0, mockApiKeyRows.length);
  });

  it("generates keys with the expected tk_live format", () => {
    const key = generateApiKey();
    expect(key).toMatch(/^tk_live_[a-f0-9]{48}$/);
  });

  it("hashes keys deterministically", () => {
    const raw = "tk_live_demo_key";
    expect(hashKey(raw)).toBe(hashKey(raw));
    expect(hashKey(raw)).not.toBe(hashKey(`${raw}_different`));
  });

  it("rejects revoked keys during validation", async () => {
    const raw = generateApiKey();
    const keyHash = hashKey(raw);

    mockApiKeyRows.push({
      id: "key-1",
      name: "Revoked key",
      key_hash: keyHash,
      created_at: new Date().toISOString(),
      revoked_at: new Date().toISOString(),
    });

    const record = await validateApiKey(raw);
    expect(record).toBeNull();
  });

  it("applies lower public limit and higher keyed limit", () => {
    const publicBucket = createKey("simulate-public");
    for (let i = 0; i < PUBLIC_SIM_RATE_LIMIT_MAX; i += 1) {
      expect(() =>
        assertRateLimit(publicBucket, {
          max: PUBLIC_SIM_RATE_LIMIT_MAX,
          windowMs: 60_000,
        }),
      ).not.toThrow();
    }
    expect(() =>
      assertRateLimit(publicBucket, {
        max: PUBLIC_SIM_RATE_LIMIT_MAX,
        windowMs: 60_000,
      }),
    ).toThrow("Too many requests");

    const keyedBucket = createKey("simulate-keyed");
    for (let i = 0; i < KEYED_SIM_RATE_LIMIT_MAX; i += 1) {
      expect(() =>
        assertRateLimit(keyedBucket, {
          max: KEYED_SIM_RATE_LIMIT_MAX,
          windowMs: 60_000,
        }),
      ).not.toThrow();
    }
    expect(() =>
      assertRateLimit(keyedBucket, {
        max: KEYED_SIM_RATE_LIMIT_MAX,
        windowMs: 60_000,
      }),
    ).toThrow("Too many requests");
  });
});
