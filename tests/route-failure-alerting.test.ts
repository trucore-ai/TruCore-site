import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  shouldTriggerRouteFailureAlert,
  getRecentRouteFailureStats,
  _resetSecurityEventCounters,
} from "@/lib/security-log";
import { sendRouteFailureAlert } from "@/lib/ops-alerts";

/* ------------------------------------------------------------------ */
/*  Mock fetch globally so no real HTTP calls are made                  */
/* ------------------------------------------------------------------ */
const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

beforeEach(() => {
  _resetSecurityEventCounters();
  fetchMock.mockReset();
  vi.unstubAllEnvs();
});

afterEach(() => {
  vi.restoreAllMocks();
});

/* ================================================================== */
/*  shouldTriggerRouteFailureAlert                                      */
/* ================================================================== */

describe("shouldTriggerRouteFailureAlert", () => {
  it("does NOT trigger below threshold (default 5)", () => {
    for (let i = 0; i < 4; i++) {
      expect(shouldTriggerRouteFailureAlert("sandbox/protect")).toBe(false);
    }
  });

  it("triggers when threshold is reached", () => {
    for (let i = 0; i < 4; i++) {
      shouldTriggerRouteFailureAlert("sandbox/protect");
    }
    // 5th call hits threshold
    expect(shouldTriggerRouteFailureAlert("sandbox/protect")).toBe(true);
  });

  it("rate-limits — does NOT trigger again in same window", () => {
    // Fire threshold times to trigger
    for (let i = 0; i < 5; i++) {
      shouldTriggerRouteFailureAlert("sandbox/protect");
    }
    // Additional failures should NOT re-trigger within same window
    for (let i = 0; i < 10; i++) {
      expect(shouldTriggerRouteFailureAlert("sandbox/protect")).toBe(false);
    }
  });

  it("ignores unknown routes", () => {
    for (let i = 0; i < 20; i++) {
      expect(shouldTriggerRouteFailureAlert("unknown/route")).toBe(false);
    }
  });

  it("tracks routes independently", () => {
    for (let i = 0; i < 4; i++) {
      shouldTriggerRouteFailureAlert("sandbox/protect");
      shouldTriggerRouteFailureAlert("sandbox/sample-intent");
    }
    expect(shouldTriggerRouteFailureAlert("sandbox/protect")).toBe(true);
    expect(shouldTriggerRouteFailureAlert("sandbox/sample-intent")).toBe(true);
  });
});

/* ================================================================== */
/*  getRecentRouteFailureStats                                         */
/* ================================================================== */

describe("getRecentRouteFailureStats", () => {
  it("returns empty when no failures recorded", () => {
    const stats = getRecentRouteFailureStats();
    expect(Object.keys(stats)).toHaveLength(0);
  });

  it("returns correct counts after failures", () => {
    for (let i = 0; i < 3; i++) {
      shouldTriggerRouteFailureAlert("sandbox/protect");
    }
    const stats = getRecentRouteFailureStats();
    expect(stats["sandbox/protect"]?.failuresInWindow).toBe(3);
  });

  it("includes lastAlertTs after alert fires", () => {
    for (let i = 0; i < 5; i++) {
      shouldTriggerRouteFailureAlert("sandbox/protect");
    }
    const stats = getRecentRouteFailureStats();
    expect(stats["sandbox/protect"]?.lastAlertTs).toBeGreaterThan(0);
  });
});

/* ================================================================== */
/*  sendRouteFailureAlert                                               */
/* ================================================================== */

describe("sendRouteFailureAlert", () => {
  it("returns false when ATF_ALERT_EMAIL_TO is not set", async () => {
    vi.stubEnv("ATF_ALERT_EMAIL_TO", "");
    vi.stubEnv("RESEND_API_KEY", "re_test_123");
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await sendRouteFailureAlert("sandbox/protect", "upstream_5xx", {
      countInWindow: 5,
    });
    expect(result).toBe(false);
    expect(spy).toHaveBeenCalled();
  });

  it("returns false when RESEND_API_KEY is not set", async () => {
    vi.stubEnv("ATF_ALERT_EMAIL_TO", "ops@trucore.xyz");
    vi.stubEnv("RESEND_API_KEY", "");
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await sendRouteFailureAlert("sandbox/protect", "upstream_5xx", {
      countInWindow: 5,
    });
    expect(result).toBe(false);
    expect(spy).toHaveBeenCalled();
  });

  it("sends email and returns true on success", async () => {
    vi.stubEnv("ATF_ALERT_EMAIL_TO", "ops@trucore.xyz");
    vi.stubEnv("RESEND_API_KEY", "re_test_123");
    vi.spyOn(console, "warn").mockImplementation(() => {});

    fetchMock.mockResolvedValueOnce({ ok: true, status: 200 });

    const result = await sendRouteFailureAlert("sandbox/protect", "upstream_5xx", {
      countInWindow: 5,
    });
    expect(result).toBe(true);
    expect(fetchMock).toHaveBeenCalledOnce();

    // Verify payload shape
    const callArgs = fetchMock.mock.calls[0];
    const body = JSON.parse(callArgs[1].body);
    expect(body.to).toEqual(["ops@trucore.xyz"]);
    expect(body.subject).toContain("[ATF ALERT]");
    expect(body.subject).toContain("sandbox/protect");
  });

  it("returns false on Resend API error", async () => {
    vi.stubEnv("ATF_ALERT_EMAIL_TO", "ops@trucore.xyz");
    vi.stubEnv("RESEND_API_KEY", "re_test_123");
    vi.spyOn(console, "error").mockImplementation(() => {});

    fetchMock.mockResolvedValueOnce({ ok: false, status: 500 });

    const result = await sendRouteFailureAlert("sandbox/protect", "upstream_5xx", {
      countInWindow: 5,
    });
    expect(result).toBe(false);
  });

  it("returns false on network failure (never throws)", async () => {
    vi.stubEnv("ATF_ALERT_EMAIL_TO", "ops@trucore.xyz");
    vi.stubEnv("RESEND_API_KEY", "re_test_123");
    vi.spyOn(console, "error").mockImplementation(() => {});

    fetchMock.mockRejectedValueOnce(new Error("network down"));

    const result = await sendRouteFailureAlert("sandbox/protect", "network_error", {
      countInWindow: 5,
    });
    expect(result).toBe(false);
  });

  it("alert payload does NOT contain secrets", async () => {
    vi.stubEnv("ATF_ALERT_EMAIL_TO", "ops@trucore.xyz");
    vi.stubEnv("RESEND_API_KEY", "re_test_secret_key_123");
    vi.spyOn(console, "warn").mockImplementation(() => {});

    fetchMock.mockResolvedValueOnce({ ok: true, status: 200 });

    await sendRouteFailureAlert("sandbox/protect", "upstream_5xx", {
      countInWindow: 5,
    });

    const callArgs = fetchMock.mock.calls[0];
    const body = JSON.parse(callArgs[1].body);

    // HTML and subject must not contain the API key
    expect(body.html).not.toContain("re_test_secret_key_123");
    expect(body.subject).not.toContain("re_test_secret_key_123");

    // Auth header should use the key, but the email body must not
    expect(callArgs[1].headers.Authorization).toContain("re_test_secret_key_123");
  });
});
