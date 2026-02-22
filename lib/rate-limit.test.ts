import { describe, expect, it, vi } from "vitest";

import { assertRateLimit } from "./rate-limit";

function createKey(label: string): string {
  return `${label}-${Math.random().toString(36).slice(2)}`;
}

describe("assertRateLimit", () => {
  it("allows requests at or under limit", () => {
    const key = createKey("under-limit");

    for (let i = 0; i < 30; i += 1) {
      expect(() => assertRateLimit(key)).not.toThrow();
    }
  });

  it("blocks requests above limit", () => {
    const key = createKey("over-limit");

    for (let i = 0; i < 30; i += 1) {
      assertRateLimit(key);
    }

    expect(() => assertRateLimit(key)).toThrow("Too many requests");
  });

  it("tracks separate buckets per key", () => {
    const keyA = createKey("bucket-a");
    const keyB = createKey("bucket-b");

    for (let i = 0; i < 30; i += 1) {
      assertRateLimit(keyA);
    }

    expect(() => assertRateLimit(keyA)).toThrow("Too many requests");
    expect(() => assertRateLimit(keyB)).not.toThrow();
  });

  it("resets counts after window expires", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-22T12:00:00.000Z"));

    try {
      const key = createKey("window-reset");

      for (let i = 0; i < 30; i += 1) {
        assertRateLimit(key);
      }
      expect(() => assertRateLimit(key)).toThrow("Too many requests");

      vi.advanceTimersByTime(60_001);

      expect(() => assertRateLimit(key)).not.toThrow();
    } finally {
      vi.useRealTimers();
    }
  });
});