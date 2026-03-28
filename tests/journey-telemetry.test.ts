import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  recordJourneyEvent,
  getFunnelSummary,
  clearAllEvents,
  isValidJourneyEvent,
  JOURNEY_EVENTS,
  type JourneyEventInput,
} from "@/lib/journey-telemetry";
import { POST, GET } from "@/app/api/telemetry/journey/route";
import { GET as getFunnel } from "@/app/api/ops/journey-funnel/route";

const ORIGINAL_ENV = { ...process.env };

// Mock rate-limit to avoid test flakiness
vi.mock("@/lib/rate-limit", () => ({
  consumeRateLimit: () => ({ exceeded: false, remaining: 99 }),
}));

// Mock hash to avoid crypto issues in test
vi.mock("@/lib/hash", () => ({
  sha256: (s: string) => `hash_${s}`,
}));

function makeJourneyRequest(
  body: unknown,
  headers: Record<string, string> = {},
): NextRequest {
  return new NextRequest("http://localhost:3000/api/telemetry/journey", {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": "192.168.1.1",
      ...headers,
    },
  });
}

function makeFunnelRequest(
  headers: Record<string, string> = {},
): NextRequest {
  return new NextRequest("http://localhost:3000/api/ops/journey-funnel", {
    headers: {
      host: "localhost:3000",
      ...headers,
    },
  });
}

beforeEach(() => {
  clearAllEvents();
  process.env = { ...ORIGINAL_ENV, ATF_OPS_KEY: "test-ops-key-123" };
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.restoreAllMocks();
});

/* ================================================================== */
/*  Unit tests: lib/journey-telemetry.ts                              */
/* ================================================================== */

describe("lib/journey-telemetry", () => {
  describe("isValidJourneyEvent", () => {
    it("returns true for valid event names", () => {
      for (const event of JOURNEY_EVENTS) {
        expect(isValidJourneyEvent(event)).toBe(true);
      }
    });

    it("returns false for invalid event names", () => {
      expect(isValidJourneyEvent("invalid_event")).toBe(false);
      expect(isValidJourneyEvent("page_view")).toBe(false);
      expect(isValidJourneyEvent("")).toBe(false);
    });
  });

  describe("recordJourneyEvent", () => {
    it("records valid events and generates session_id", () => {
      const input: JourneyEventInput = { event_name: "dashboard_viewed" };
      const result = recordJourneyEvent(input);

      expect(result.ok).toBe(true);
      expect(result.session_id).toBeDefined();
      expect(result.session_id).toMatch(/^[a-f0-9]{32}$/);
    });

    it("uses provided session_id if valid", () => {
      const sessionId = "abcd1234abcd1234abcd1234abcd1234";
      const result = recordJourneyEvent({
        event_name: "dashboard_viewed",
        session_id: sessionId,
      });

      expect(result.ok).toBe(true);
      expect(result.session_id).toBe(sessionId);
    });

    it("rejects invalid event names", () => {
      const result = recordJourneyEvent({ event_name: "invalid_event" });
      expect(result.ok).toBe(false);
      expect(result.error).toBe("invalid_event_name");
    });

    it("rejects invalid session_id format", () => {
      const result = recordJourneyEvent({
        event_name: "dashboard_viewed",
        session_id: "not-valid-hex",
      });
      expect(result.ok).toBe(false);
      expect(result.error).toBe("invalid_session_id");
    });

    it("rejects user_id that is too long", () => {
      const result = recordJourneyEvent({
        event_name: "dashboard_viewed",
        user_id: "a".repeat(65),
      });
      expect(result.ok).toBe(false);
      expect(result.error).toBe("user_id_too_long");
    });

    it("records status field correctly", () => {
      const result = recordJourneyEvent({
        event_name: "protect_dry_run_completed",
        status: "success",
      });
      expect(result.ok).toBe(true);
    });
  });

  describe("getFunnelSummary", () => {
    it("returns zero counts when no events recorded", () => {
      const summary = getFunnelSummary();
      expect(summary.event_count).toBe(0);
      expect(summary.totals.dashboard_viewed).toBe(0);
      expect(summary.totals.receipt_verified).toBe(0);
      expect(summary.oldest_event_age_ms).toBeNull();
    });

    it("correctly aggregates events by session", () => {
      const session1 = "aaaa1111aaaa1111aaaa1111aaaa1111";
      const session2 = "bbbb2222bbbb2222bbbb2222bbbb2222";

      // Session 1: dashboard -> sample -> protect
      recordJourneyEvent({ event_name: "dashboard_viewed", session_id: session1 });
      recordJourneyEvent({ event_name: "sample_intent_loaded", session_id: session1 });
      recordJourneyEvent({ event_name: "protect_dry_run_started", session_id: session1 });

      // Session 2: dashboard only
      recordJourneyEvent({ event_name: "dashboard_viewed", session_id: session2 });

      const summary = getFunnelSummary();

      expect(summary.totals.dashboard_viewed).toBe(2);
      expect(summary.totals.sample_intent_loaded).toBe(1);
      expect(summary.totals.protect_dry_run_started).toBe(1);
      expect(summary.totals.receipt_verified).toBe(0);
      expect(summary.event_count).toBe(4);
    });

    it("counts unique sessions not duplicate events", () => {
      const session = "cccc3333cccc3333cccc3333cccc3333";

      // Same session, same event multiple times
      recordJourneyEvent({ event_name: "dashboard_viewed", session_id: session });
      recordJourneyEvent({ event_name: "dashboard_viewed", session_id: session });
      recordJourneyEvent({ event_name: "dashboard_viewed", session_id: session });

      const summary = getFunnelSummary();

      // Should count as 1 unique session, not 3
      expect(summary.totals.dashboard_viewed).toBe(1);
      expect(summary.event_count).toBe(3); // but 3 events total
    });

    it("calculates conversion percentages correctly", () => {
      const session1 = "dddd4444dddd4444dddd4444dddd4444";
      const session2 = "eeee5555eeee5555eeee5555eeee5555";

      // Session 1: full journey
      recordJourneyEvent({ event_name: "dashboard_viewed", session_id: session1 });
      recordJourneyEvent({ event_name: "sample_intent_loaded", session_id: session1 });

      // Session 2: dashboard only
      recordJourneyEvent({ event_name: "dashboard_viewed", session_id: session2 });

      const summary = getFunnelSummary();

      // 2 dashboards, 1 sample = 50% conversion
      expect(summary.conversion.dashboard_to_sample).toBe(50);
    });

    it("identifies biggest dropoff stage", () => {
      const session = "ffff6666ffff6666ffff6666ffff6666";

      recordJourneyEvent({ event_name: "dashboard_viewed", session_id: session });
      recordJourneyEvent({ event_name: "sample_intent_loaded", session_id: session });
      // No protect events = 0% conversion from sample to protect

      const summary = getFunnelSummary();

      expect(summary.biggest_dropoff).toContain("0%");
    });
  });
});

/* ================================================================== */
/*  Route tests: POST /api/telemetry/journey                          */
/* ================================================================== */

describe("POST /api/telemetry/journey", () => {
  it("accepts valid journey events", async () => {
    const res = await POST(
      makeJourneyRequest({ event_name: "dashboard_viewed" }),
    );
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.session_id).toMatch(/^[a-f0-9]{32}$/);
  });

  it("returns session_id for subsequent calls", async () => {
    const sessionId = "1234567890abcdef1234567890abcdef";
    const res = await POST(
      makeJourneyRequest({
        event_name: "sample_intent_loaded",
        session_id: sessionId,
      }),
    );
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.session_id).toBe(sessionId);
  });

  it("silently accepts unknown events (no error)", async () => {
    const res = await POST(
      makeJourneyRequest({ event_name: "unknown_event_name" }),
    );
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it("returns 400 for missing event_name", async () => {
    const res = await POST(makeJourneyRequest({}));
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toBe("missing_event_name");
  });

  it("returns 400 for invalid json", async () => {
    const req = new NextRequest("http://localhost:3000/api/telemetry/journey", {
      method: "POST",
      body: "not json",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": "192.168.1.1",
      },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toBe("invalid_json");
  });

  it("returns 400 for invalid session_id format", async () => {
    const res = await POST(
      makeJourneyRequest({
        event_name: "dashboard_viewed",
        session_id: "invalid-session",
      }),
    );
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toBe("invalid_session_id");
  });

  it("returns 400 for invalid status value", async () => {
    const res = await POST(
      makeJourneyRequest({
        event_name: "protect_dry_run_completed",
        status: "maybe",
      }),
    );
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toBe("invalid_status");
  });

  it("does not leak PII - accepts only valid fields", async () => {
    const res = await POST(
      makeJourneyRequest({
        event_name: "dashboard_viewed",
        email: "user@example.com",
        api_key: "secret123",
        password: "supersecret",
      }),
    );
    expect(res.status).toBe(200);

    // These fields should be ignored, not cause errors
    const body = await res.json();
    expect(body.ok).toBe(true);
  });
});

/* ================================================================== */
/*  Route tests: GET /api/telemetry/journey                           */
/* ================================================================== */

describe("GET /api/telemetry/journey", () => {
  it("returns list of valid event names", async () => {
    const res = await GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.events).toBeInstanceOf(Array);
    expect(body.events).toContain("dashboard_viewed");
    expect(body.events).toContain("receipt_verified");
    expect(body.events.length).toBe(8);
  });
});

/* ================================================================== */
/*  Route tests: GET /api/ops/journey-funnel                          */
/* ================================================================== */

describe("GET /api/ops/journey-funnel", () => {
  it("returns 403 without x-ops-key header", async () => {
    const res = await getFunnel(makeFunnelRequest());
    expect(res.status).toBe(403);

    const body = await res.json();
    expect(body.error).toBe("forbidden");
  });

  it("returns 403 with wrong x-ops-key", async () => {
    const res = await getFunnel(makeFunnelRequest({ "x-ops-key": "wrong-key" }));
    expect(res.status).toBe(403);
  });

  it("returns 503 when ATF_OPS_KEY is not configured", async () => {
    delete process.env.ATF_OPS_KEY;
    const res = await getFunnel(makeFunnelRequest({ "x-ops-key": "anything" }));
    expect(res.status).toBe(503);

    const body = await res.json();
    expect(body.error).toBe("endpoint_not_configured");
  });

  it("returns funnel summary with valid ops key", async () => {
    // Record some events first
    recordJourneyEvent({
      event_name: "dashboard_viewed",
      session_id: "1111111111111111aaaaaaaaaaaaaaaa",
    });
    recordJourneyEvent({
      event_name: "sample_intent_loaded",
      session_id: "1111111111111111aaaaaaaaaaaaaaaa",
    });

    const res = await getFunnel(makeFunnelRequest({ "x-ops-key": "test-ops-key-123" }));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.data).toBeDefined();
    expect(body.data.totals).toBeDefined();
    expect(body.data.totals.dashboard_viewed).toBe(1);
    expect(body.data.totals.sample_intent_loaded).toBe(1);
    expect(body.data.conversion).toBeDefined();
    expect(body.data.biggest_dropoff).toBeDefined();
    expect(body.data.event_count).toBe(2);
  });

  it("returns correct conversion percentages", async () => {
    // 2 sessions view dashboard, 1 continues to sample
    recordJourneyEvent({
      event_name: "dashboard_viewed",
      session_id: "aaaa1111aaaa1111aaaa1111aaaa1111",
    });
    recordJourneyEvent({
      event_name: "sample_intent_loaded",
      session_id: "aaaa1111aaaa1111aaaa1111aaaa1111",
    });
    recordJourneyEvent({
      event_name: "dashboard_viewed",
      session_id: "bbbb2222bbbb2222bbbb2222bbbb2222",
    });

    const res = await getFunnel(makeFunnelRequest({ "x-ops-key": "test-ops-key-123" }));
    const body = await res.json();

    expect(body.data.totals.dashboard_viewed).toBe(2);
    expect(body.data.totals.sample_intent_loaded).toBe(1);
    expect(body.data.conversion.dashboard_to_sample).toBe(50);
  });
});

/* ================================================================== */
/*  Integration: No PII leakage                                       */
/* ================================================================== */

describe("PII protection", () => {
  it("does not store email in events", async () => {
    // Attempt to pass PII - should be ignored
    await POST(
      makeJourneyRequest({
        event_name: "dashboard_viewed",
        email: "user@example.com",
      }),
    );

    const summary = getFunnelSummary();
    // Events should be recorded but without PII
    expect(summary.event_count).toBe(1);
    // No way to extract email from summary
    expect(JSON.stringify(summary)).not.toContain("@example.com");
  });

  it("enforces user_id length limit", async () => {
    const res = await POST(
      makeJourneyRequest({
        event_name: "dashboard_viewed",
        user_id: "a".repeat(65),
      }),
    );
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toBe("user_id_too_long");
  });
});
