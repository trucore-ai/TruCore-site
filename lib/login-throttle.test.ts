import { afterEach, describe, expect, it, vi } from "vitest";
import {
  checkLoginThrottle,
  recordLoginFailure,
  clearLoginFailures,
  _resetThrottleStore,
  _advanceTime,
  _getTimeOffset,
} from "./login-throttle";

describe("login-throttle", () => {
  afterEach(() => {
    _resetThrottleStore();
    vi.restoreAllMocks();
  });

  it("allows login when no failures exist", () => {
    expect(checkLoginThrottle("1.2.3.4")).toBe(0);
  });

  it("allows login after fewer than 5 failures", () => {
    for (let i = 0; i < 4; i++) {
      recordLoginFailure("1.2.3.4");
    }
    expect(checkLoginThrottle("1.2.3.4")).toBe(0);
  });

  it("triggers cooldown after 5 failures", () => {
    for (let i = 0; i < 4; i++) {
      expect(recordLoginFailure("1.2.3.4")).toBe(0);
    }
    // 5th failure triggers cooldown
    const cooldown = recordLoginFailure("1.2.3.4");
    expect(cooldown).toBeGreaterThan(0);
  });

  it("blocks login attempts during cooldown", () => {
    for (let i = 0; i < 5; i++) {
      recordLoginFailure("10.0.0.1");
    }
    const remaining = checkLoginThrottle("10.0.0.1");
    expect(remaining).toBeGreaterThan(0);
  });

  it("isolates cooldown per IP", () => {
    for (let i = 0; i < 5; i++) {
      recordLoginFailure("10.0.0.1");
    }
    // Different IP should not be affected
    expect(checkLoginThrottle("10.0.0.2")).toBe(0);
  });

  it("clearLoginFailures resets tracking for an IP", () => {
    for (let i = 0; i < 4; i++) {
      recordLoginFailure("10.0.0.1");
    }
    clearLoginFailures("10.0.0.1");
    // After clearing, 5 more failures are needed to trigger cooldown
    for (let i = 0; i < 4; i++) {
      expect(recordLoginFailure("10.0.0.1")).toBe(0);
    }
    expect(checkLoginThrottle("10.0.0.1")).toBe(0);
  });

  it("cooldown expires after the cooldown period", () => {
    // Lock the IP
    for (let i = 0; i < 5; i++) {
      recordLoginFailure("10.0.0.1");
    }
    expect(checkLoginThrottle("10.0.0.1")).toBeGreaterThan(0);

    // Advance time past the 15-minute cooldown
    const realDateNow = Date.now;
    const start = realDateNow.call(Date);
    vi.spyOn(Date, "now").mockReturnValue(start + 16 * 60 * 1000);

    expect(checkLoginThrottle("10.0.0.1")).toBe(0);

    vi.spyOn(Date, "now").mockRestore();
  });

  it("handles undefined/unknown IP gracefully", () => {
    expect(checkLoginThrottle(undefined)).toBe(0);
    expect(checkLoginThrottle("unknown")).toBe(0);
    for (let i = 0; i < 5; i++) {
      recordLoginFailure(undefined);
    }
    // Both undefined and "unknown" map to the same key
    expect(checkLoginThrottle(undefined)).toBeGreaterThan(0);
    expect(checkLoginThrottle("unknown")).toBeGreaterThan(0);
  });

  /* ── _advanceTime / _getTimeOffset deterministic clock tests ── */

  describe("_advanceTime / _getTimeOffset", () => {
    it("offset starts at 0", () => {
      expect(_getTimeOffset()).toBe(0);
    });

    it("_advanceTime increments the offset", () => {
      _advanceTime(5000);
      expect(_getTimeOffset()).toBe(5000);
      _advanceTime(3000);
      expect(_getTimeOffset()).toBe(8000);
    });

    it("_resetThrottleStore resets offset to 0", () => {
      _advanceTime(10_000);
      expect(_getTimeOffset()).toBe(10_000);
      _resetThrottleStore();
      expect(_getTimeOffset()).toBe(0);
    });

    it("cooldown expires via _advanceTime instead of Date mock", () => {
      for (let i = 0; i < 5; i++) {
        recordLoginFailure("10.0.0.1");
      }
      expect(checkLoginThrottle("10.0.0.1")).toBeGreaterThan(0);

      // Advance past 15-minute cooldown
      _advanceTime(15 * 60 * 1000 + 1);
      expect(checkLoginThrottle("10.0.0.1")).toBe(0);
    });

    it("cooldown still active if advance is insufficient", () => {
      for (let i = 0; i < 5; i++) {
        recordLoginFailure("10.0.0.1");
      }
      // Advance only 10 minutes — not enough
      _advanceTime(10 * 60 * 1000);
      expect(checkLoginThrottle("10.0.0.1")).toBeGreaterThan(0);
    });
  });
});
