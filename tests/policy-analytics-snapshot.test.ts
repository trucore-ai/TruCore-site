/**
 * Tests for the durable policy analytics snapshot system.
 *
 * Covers:
 * - Snapshot shape (aggregated-only, expected fields present)
 * - persistSnapshot / getLatestSnapshotMeta store functions
 * - POST /api/internal/policy-analytics-snapshot — access guard + persistence
 * - GET  /api/internal/policy-analytics-snapshot — access guard + latest fetch
 * - Privacy-safe output (no raw event payloads)
 */

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from "vitest";
import { NextRequest } from "next/server";

// ── mock next/headers (required by assertAdminSession) ────────────────────────

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

vi.mock("next/headers", () => ({ cookies: mocks.cookiesMock }));

// ── mock @/lib/db (DB layer) ──────────────────────────────────────────────────

const mockWriteAnalyticsSnapshot = vi.fn();
const mockGetLatestAnalyticsSnapshot = vi.fn();

vi.mock("@/lib/db", () => ({
  writeAnalyticsSnapshot: (...args: unknown[]) =>
    mockWriteAnalyticsSnapshot(...args),
  getLatestAnalyticsSnapshot: (...args: unknown[]) =>
    mockGetLatestAnalyticsSnapshot(...args),
  ensureAnalyticsSnapshotTable: vi.fn().mockResolvedValue(undefined),
}));

// ── import after mocks ────────────────────────────────────────────────────────

import {
  recordPolicyEvent,
  summarise,
  persistSnapshot,
  getLatestSnapshotMeta,
  SNAPSHOT_VERSION,
  _resetForTesting,
} from "@/lib/server/policy-analytics-store";

import {
  ADMIN_COOKIE_NAME,
  createSessionToken,
  _getSessionStore,
} from "@/lib/admin-auth";

import { POST, GET } from "@/app/api/internal/policy-analytics-snapshot/route";

// ── helpers ───────────────────────────────────────────────────────────────────

const ORIGINAL_ENV = { ...process.env };

function makeRequest(
  method: string,
  pathname: string,
  options?: {
    cookies?: Record<string, string>;
    origin?: string;
  },
): NextRequest {
  const url = new URL(pathname, "http://localhost:3000");
  const headers = new Headers();
  if (options?.origin) headers.set("origin", options.origin);
  const req = new NextRequest(url, { method, headers });
  if (options?.cookies) {
    for (const [name, value] of Object.entries(options.cookies)) {
      req.cookies.set(name, value);
    }
  }
  return req;
}

async function makeAuthenticatedRequest(
  method: string,
  pathname: string,
): Promise<NextRequest> {
  const token = createSessionToken(process.env.ADMIN_DASHBOARD_KEY!);
  mocks.cookieValues.set(ADMIN_COOKIE_NAME, token);
  return makeRequest(method, pathname, {
    origin: "http://localhost:3000",
    cookies: { [ADMIN_COOKIE_NAME]: token },
  });
}

// ── setup / teardown ──────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mocks.cookieValues.clear();
  _getSessionStore().clear();
  _resetForTesting();
  process.env = {
    ...ORIGINAL_ENV,
    ADMIN_DASHBOARD_KEY: "test-admin-key-snap",
  };
  mockWriteAnalyticsSnapshot.mockResolvedValue({
    id: "snap-uuid-001",
    created_at: "2026-04-16T12:00:00.000Z",
  });
  mockGetLatestAnalyticsSnapshot.mockResolvedValue(null);
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

// ── SNAPSHOT SHAPE ────────────────────────────────────────────────────────────

describe("snapshot shape — aggregated only, no raw events", () => {
  it("snapshot payload contains required top-level fields", async () => {
    recordPolicyEvent("policy_recommendation_impression", {
      recommendation_source: "Policy Intelligence",
      recommendation_priority: "high",
      recommendation_display_section: "featured",
      ts: Date.now(),
    });

    const payload = await persistSnapshot();

    expect(payload).toHaveProperty("captured_at");
    expect(payload).toHaveProperty("summary_version", SNAPSHOT_VERSION);
    expect(payload).toHaveProperty("summary");
  });

  it("summary in payload contains all expected aggregated fields", async () => {
    const payload = await persistSnapshot();
    const { summary } = payload;

    expect(summary).toHaveProperty("generated_at");
    expect(summary).toHaveProperty("instance_started_at");
    expect(summary).toHaveProperty("total_events");
    expect(summary).toHaveProperty("by_event_type");
    expect(summary).toHaveProperty("by_source");
    expect(summary).toHaveProperty("by_priority");
    expect(summary).toHaveProperty("by_display_section");
    expect(summary).toHaveProperty("by_source_and_section");
    expect(summary).toHaveProperty("teaser_performance");
    expect(summary).toHaveProperty("derived");
  });

  it("snapshot payload does NOT contain raw event payloads", async () => {
    recordPolicyEvent("policy_recommendation_impression", {
      recommendation_source: "External context",
      recommendation_priority: "medium",
      recommendation_display_section: "more",
      ts: Date.now(),
    });

    const payload = await persistSnapshot();
    const raw = JSON.stringify(payload);

    // The raw event ring-buffer must not leak into the snapshot
    expect(raw).not.toContain('"name"');
    expect(raw).not.toContain('"_events"');
    // Should only contain aggregated counts (BucketCounts shape)
    expect(raw).toContain('"total"');
    expect(raw).toContain('"last_7d"');
    expect(raw).toContain('"last_30d"');
  });

  it("empty state snapshot has zero totals and null derived rates", async () => {
    const payload = await persistSnapshot();
    expect(payload.summary.total_events).toBe(0);
    expect(payload.summary.derived.expand_rate).toBeNull();
    expect(payload.summary.derived.upgrade_teaser_click_rate).toBeNull();
  });

  it("captured_at matches the summary generated_at", async () => {
    const payload = await persistSnapshot();
    expect(payload.captured_at).toBe(payload.summary.generated_at);
  });

  it("summary_version matches SNAPSHOT_VERSION constant", async () => {
    const payload = await persistSnapshot();
    expect(payload.summary_version).toBe(SNAPSHOT_VERSION);
    expect(typeof SNAPSHOT_VERSION).toBe("string");
  });
});

// ── persistSnapshot ───────────────────────────────────────────────────────────

describe("persistSnapshot()", () => {
  it("calls writeAnalyticsSnapshot with correct version and payload", async () => {
    await persistSnapshot();
    expect(mockWriteAnalyticsSnapshot).toHaveBeenCalledOnce();
    const [version, payload] = (mockWriteAnalyticsSnapshot as Mock).mock.calls[0];
    expect(version).toBe(SNAPSHOT_VERSION);
    expect(payload).toHaveProperty("captured_at");
    expect(payload).toHaveProperty("summary_version", SNAPSHOT_VERSION);
    expect(payload).toHaveProperty("summary");
  });

  it("returns the snapshot payload from persistSnapshot", async () => {
    const payload = await persistSnapshot();
    expect(payload.summary).toMatchObject(summarise());
  });
});

// ── getLatestSnapshotMeta ─────────────────────────────────────────────────────

describe("getLatestSnapshotMeta()", () => {
  it("returns null when no snapshots exist", async () => {
    mockGetLatestAnalyticsSnapshot.mockResolvedValue(null);
    const meta = await getLatestSnapshotMeta();
    expect(meta).toBeNull();
  });

  it("returns metadata fields from DB row", async () => {
    mockGetLatestAnalyticsSnapshot.mockResolvedValue({
      id: "row-id-abc",
      created_at: "2026-04-16T10:00:00.000Z",
      summary_version: "1",
      snapshot: {},
    });
    const meta = await getLatestSnapshotMeta();
    expect(meta).not.toBeNull();
    expect(meta!.id).toBe("row-id-abc");
    expect(meta!.captured_at).toBe("2026-04-16T10:00:00.000Z");
    expect(meta!.summary_version).toBe("1");
  });

  it("does not expose snapshot body in meta (lightweight shape)", async () => {
    mockGetLatestAnalyticsSnapshot.mockResolvedValue({
      id: "row-id-xyz",
      created_at: "2026-04-16T10:00:00.000Z",
      summary_version: "1",
      snapshot: { captured_at: "...", summary: { total_events: 99 } },
    });
    const meta = await getLatestSnapshotMeta();
    // Meta should only have id, captured_at, summary_version — not snapshot body
    expect(meta).not.toHaveProperty("snapshot");
  });
});

// ── POST /api/internal/policy-analytics-snapshot ──────────────────────────────

describe("POST /api/internal/policy-analytics-snapshot", () => {
  it("returns 404 when unauthenticated (no session cookie)", async () => {
    const req = makeRequest("POST", "/api/internal/policy-analytics-snapshot", {
      origin: "http://localhost:3000",
    });
    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it("returns 404 when origin is mismatched (CSRF guard)", async () => {
    const token = createSessionToken(process.env.ADMIN_DASHBOARD_KEY!);
    mocks.cookieValues.set(ADMIN_COOKIE_NAME, token);
    const req = makeRequest("POST", "/api/internal/policy-analytics-snapshot", {
      origin: "http://evil.example.com",
      cookies: { [ADMIN_COOKIE_NAME]: token },
    });
    const res = await POST(req);
    expect(res.status).toBe(404);
    // Snapshot should NOT have been persisted
    expect(mockWriteAnalyticsSnapshot).not.toHaveBeenCalled();
  });

  it("persists snapshot and returns 201 with snapshot payload when authenticated", async () => {
    const req = await makeAuthenticatedRequest(
      "POST",
      "/api/internal/policy-analytics-snapshot",
    );
    const res = await POST(req);
    expect(res.status).toBe(201);

    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.snapshot).toHaveProperty("captured_at");
    expect(body.snapshot).toHaveProperty("summary_version", SNAPSHOT_VERSION);
    expect(body.snapshot).toHaveProperty("summary");
    expect(mockWriteAnalyticsSnapshot).toHaveBeenCalledOnce();
  });

  it("snapshot returned in POST body contains no raw event data", async () => {
    recordPolicyEvent("policy_upgrade_teaser_view", {
      recommendation_source: "Policy Intelligence",
      recommendation_priority: "high",
      recommendation_display_section: "featured",
      dominant_gated_source: "External context",
      highest_gated_tier: "Pro",
      gated_source_mix: "few",
      ts: Date.now(),
    });

    const req = await makeAuthenticatedRequest(
      "POST",
      "/api/internal/policy-analytics-snapshot",
    );
    const res = await POST(req);
    const body = await res.json();
    const raw = JSON.stringify(body.snapshot.summary);

    // No raw event fields — only aggregated buckets
    expect(raw).not.toContain('"_events"');
    // Aggregated teaser data is fine to include
    expect(body.snapshot.summary.teaser_performance).toBeDefined();
  });

  it("applies admin hardening headers on successful POST", async () => {
    const req = await makeAuthenticatedRequest(
      "POST",
      "/api/internal/policy-analytics-snapshot",
    );
    const res = await POST(req);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
  });
});

// ── GET /api/internal/policy-analytics-snapshot ───────────────────────────────

describe("GET /api/internal/policy-analytics-snapshot", () => {
  it("returns 404 when unauthenticated", async () => {
    const req = makeRequest("GET", "/api/internal/policy-analytics-snapshot");
    const res = await GET(req);
    expect(res.status).toBe(404);
  });

  it("returns 200 with null snapshot when none persisted yet", async () => {
    mockGetLatestAnalyticsSnapshot.mockResolvedValue(null);
    const req = await makeAuthenticatedRequest(
      "GET",
      "/api/internal/policy-analytics-snapshot",
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.snapshot).toBeNull();
    expect(body.message).toContain("No snapshots");
  });

  it("returns latest snapshot when one exists", async () => {
    const fakeSnapshot = {
      captured_at: "2026-04-16T08:00:00.000Z",
      summary_version: "1",
      summary: { total_events: 77 },
    };
    mockGetLatestAnalyticsSnapshot.mockResolvedValue({
      id: "snap-uuid-999",
      created_at: "2026-04-16T08:00:00.000Z",
      summary_version: "1",
      snapshot: fakeSnapshot,
    });

    const req = await makeAuthenticatedRequest(
      "GET",
      "/api/internal/policy-analytics-snapshot",
    );
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.id).toBe("snap-uuid-999");
    expect(body.captured_at).toBe("2026-04-16T08:00:00.000Z");
    expect(body.summary_version).toBe("1");
    expect(body.snapshot).toMatchObject(fakeSnapshot);
  });

  it("applies admin hardening headers on GET", async () => {
    const req = await makeAuthenticatedRequest(
      "GET",
      "/api/internal/policy-analytics-snapshot",
    );
    const res = await GET(req);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });
});
