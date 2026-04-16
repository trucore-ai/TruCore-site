/**
 * Tests for the automated daily policy analytics snapshot route.
 *
 * Covers:
 * - GET /api/internal/policy-analytics-daily-snapshot
 *   - CRON_SECRET auth: rejects invalid / allows valid / open when unset
 *   - Duplicate-safe: skips capture when recent snapshot exists in window
 *   - Capture: calls persistSnapshot when no recent snapshot exists
 *   - Retention pruning: calls deleteSnapshotsOlderThan
 *   - Retention days override via SNAPSHOT_RETENTION_DAYS env var
 *   - Prune failure is non-fatal (capture still reported ok)
 */

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { NextRequest } from "next/server";

// ── mock @/lib/db ─────────────────────────────────────────────────────────────

const mockGetSnapshotCapturedAfter = vi.fn();
const mockDeleteSnapshotsOlderThan = vi.fn();

vi.mock("@/lib/db", () => ({
  getSnapshotCapturedAfter: (...args: unknown[]) =>
    mockGetSnapshotCapturedAfter(...args),
  deleteSnapshotsOlderThan: (...args: unknown[]) =>
    mockDeleteSnapshotsOlderThan(...args),
  ensureAnalyticsSnapshotTable: vi.fn().mockResolvedValue(undefined),
}));

// ── mock @/lib/server/policy-analytics-store ──────────────────────────────────

const mockPersistSnapshot = vi.fn();
const mockGetLatestSnapshotMeta = vi.fn();

vi.mock("@/lib/server/policy-analytics-store", () => ({
  persistSnapshot: (...args: unknown[]) => mockPersistSnapshot(...args),
  getLatestSnapshotMeta: (...args: unknown[]) =>
    mockGetLatestSnapshotMeta(...args),
}));

// ── import after mocks ────────────────────────────────────────────────────────

import { GET } from "@/app/api/internal/policy-analytics-daily-snapshot/route";

// ── helpers ───────────────────────────────────────────────────────────────────

const ORIGINAL_ENV = { ...process.env };

function makeRequest(
  headers: Record<string, string> = {},
): NextRequest {
  const url = new URL(
    "/api/internal/policy-analytics-daily-snapshot",
    "http://localhost:3000",
  );
  return new NextRequest(url, {
    method: "GET",
    headers: new Headers(headers),
  });
}

function makeAuthenticatedRequest(secret: string): NextRequest {
  return makeRequest({ authorization: `Bearer ${secret}` });
}

// ── setup / teardown ──────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  process.env = { ...ORIGINAL_ENV };

  // Default: no recent snapshot
  mockGetSnapshotCapturedAfter.mockResolvedValue(null);

  // Default: capture succeeds
  mockPersistSnapshot.mockResolvedValue({
    captured_at: "2026-04-16T01:00:00.000Z",
    summary_version: "1",
    summary: {},
  });
  mockGetLatestSnapshotMeta.mockResolvedValue({
    id: "daily-snap-uuid-001",
    captured_at: "2026-04-16T01:00:00.000Z",
    summary_version: "1",
  });

  // Default: prune removes 0 rows
  mockDeleteSnapshotsOlderThan.mockResolvedValue(0);
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

// ── CRON_SECRET AUTHORIZATION ─────────────────────────────────────────────────

describe("CRON_SECRET authorization", () => {
  it("rejects request with wrong secret when CRON_SECRET is set", async () => {
    process.env.CRON_SECRET = "correct-secret";
    const req = makeAuthenticatedRequest("wrong-secret");
    const res = await GET(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toBe("Unauthorized");
  });

  it("rejects request with missing auth header when CRON_SECRET is set", async () => {
    process.env.CRON_SECRET = "correct-secret";
    const req = makeRequest();
    const res = await GET(req);

    expect(res.status).toBe(401);
  });

  it("allows request with correct secret when CRON_SECRET is set", async () => {
    process.env.CRON_SECRET = "correct-secret";
    const req = makeAuthenticatedRequest("correct-secret");
    const res = await GET(req);

    expect(res.status).toBe(200);
  });

  it("allows any request when CRON_SECRET is not set", async () => {
    delete process.env.CRON_SECRET;
    const req = makeRequest();
    const res = await GET(req);

    expect(res.status).toBe(200);
  });
});

// ── DUPLICATE-SAFE BEHAVIOR ───────────────────────────────────────────────────

describe("duplicate-safe capture behavior", () => {
  it("skips capture when a recent snapshot exists within the 23-hour window", async () => {
    delete process.env.CRON_SECRET;
    mockGetSnapshotCapturedAfter.mockResolvedValue({
      id: "existing-snap-uuid",
      created_at: "2026-04-16T00:30:00.000Z",
      summary_version: "1",
      snapshot: {},
    });

    const req = makeRequest();
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.skipped).toBe(true);
    expect(body.existing_snapshot_id).toBe("existing-snap-uuid");
    // persistSnapshot should NOT have been called
    expect(mockPersistSnapshot).not.toHaveBeenCalled();
  });

  it("passes a date ~23 hours ago to getSnapshotCapturedAfter", async () => {
    delete process.env.CRON_SECRET;
    const before = Date.now();
    const req = makeRequest();
    await GET(req);
    const after = Date.now();

    expect(mockGetSnapshotCapturedAfter).toHaveBeenCalledTimes(1);
    const calledWith: Date = mockGetSnapshotCapturedAfter.mock.calls[0][0];
    expect(calledWith).toBeInstanceOf(Date);

    const windowMs = 23 * 60 * 60 * 1000;
    // The window start should be roughly now - 23h
    expect(calledWith.getTime()).toBeGreaterThanOrEqual(before - windowMs - 100);
    expect(calledWith.getTime()).toBeLessThanOrEqual(after - windowMs + 100);
  });

  it("proceeds with capture when no recent snapshot exists", async () => {
    delete process.env.CRON_SECRET;
    mockGetSnapshotCapturedAfter.mockResolvedValue(null);

    const req = makeRequest();
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.skipped).toBe(false);
    expect(mockPersistSnapshot).toHaveBeenCalledTimes(1);
  });
});

// ── SUCCESSFUL CAPTURE ────────────────────────────────────────────────────────

describe("successful capture", () => {
  it("returns snapshot_id and captured_at on success", async () => {
    delete process.env.CRON_SECRET;
    const req = makeRequest();
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.snapshot_id).toBe("daily-snap-uuid-001");
    expect(body.captured_at).toBe("2026-04-16T01:00:00.000Z");
    expect(body.skipped).toBe(false);
  });

  it("calls deleteSnapshotsOlderThan with the retention window", async () => {
    delete process.env.CRON_SECRET;
    const req = makeRequest();
    await GET(req);

    expect(mockDeleteSnapshotsOlderThan).toHaveBeenCalledTimes(1);
    expect(mockDeleteSnapshotsOlderThan).toHaveBeenCalledWith(90);
  });

  it("reports pruned count in response", async () => {
    delete process.env.CRON_SECRET;
    mockDeleteSnapshotsOlderThan.mockResolvedValue(5);
    const req = makeRequest();
    const res = await GET(req);
    const body = await res.json();

    expect(body.pruned).toBe(5);
    expect(body.retention_days).toBe(90);
  });
});

// ── RETENTION DAYS OVERRIDE ───────────────────────────────────────────────────

describe("SNAPSHOT_RETENTION_DAYS env override", () => {
  it("uses SNAPSHOT_RETENTION_DAYS when set to a valid number", async () => {
    delete process.env.CRON_SECRET;
    process.env.SNAPSHOT_RETENTION_DAYS = "30";
    const req = makeRequest();
    await GET(req);

    expect(mockDeleteSnapshotsOlderThan).toHaveBeenCalledWith(30);
  });

  it("falls back to 90 when SNAPSHOT_RETENTION_DAYS is invalid", async () => {
    delete process.env.CRON_SECRET;
    process.env.SNAPSHOT_RETENTION_DAYS = "not-a-number";
    const req = makeRequest();
    await GET(req);

    expect(mockDeleteSnapshotsOlderThan).toHaveBeenCalledWith(90);
  });

  it("falls back to 90 when SNAPSHOT_RETENTION_DAYS is 0", async () => {
    delete process.env.CRON_SECRET;
    process.env.SNAPSHOT_RETENTION_DAYS = "0";
    const req = makeRequest();
    await GET(req);

    expect(mockDeleteSnapshotsOlderThan).toHaveBeenCalledWith(90);
  });
});

// ── ERROR HANDLING ────────────────────────────────────────────────────────────

describe("error handling", () => {
  it("returns 500 and capture_error when persistSnapshot throws", async () => {
    delete process.env.CRON_SECRET;
    mockPersistSnapshot.mockRejectedValue(new Error("DB write failed"));

    const req = makeRequest();
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.ok).toBe(false);
    expect(body.capture_error).toContain("DB write failed");
  });

  it("still runs pruning even when duplicate check fails (fail-open)", async () => {
    delete process.env.CRON_SECRET;
    // Duplicate check failure → should proceed with capture
    mockGetSnapshotCapturedAfter.mockRejectedValue(new Error("DB timeout"));

    const req = makeRequest();
    const res = await GET(req);
    const body = await res.json();

    // Should have attempted capture
    expect(mockPersistSnapshot).toHaveBeenCalledTimes(1);
    // Pruning should also have run
    expect(mockDeleteSnapshotsOlderThan).toHaveBeenCalledTimes(1);
    expect(body.ok).toBe(true);
  });

  it("is non-fatal when pruning fails — ok=true, prune_error surfaced", async () => {
    delete process.env.CRON_SECRET;
    mockDeleteSnapshotsOlderThan.mockRejectedValue(new Error("pruning failed"));

    const req = makeRequest();
    const res = await GET(req);
    const body = await res.json();

    // Capture succeeded, so overall ok
    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.prune_error).toContain("pruning failed");
    expect(body.pruned).toBe(0);
  });
});

// ── RESPONSE SHAPE ────────────────────────────────────────────────────────────

describe("response shape", () => {
  it("includes Cache-Control: no-store header", async () => {
    delete process.env.CRON_SECRET;
    const req = makeRequest();
    const res = await GET(req);

    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("does not include snapshot_id or captured_at when skipped", async () => {
    delete process.env.CRON_SECRET;
    mockGetSnapshotCapturedAfter.mockResolvedValue({
      id: "existing",
      created_at: "2026-04-16T00:00:00.000Z",
      summary_version: "1",
      snapshot: {},
    });

    const req = makeRequest();
    const res = await GET(req);
    const body = await res.json();

    expect(body.snapshot_id).toBeUndefined();
    expect(body.captured_at).toBeUndefined();
    expect(body.existing_snapshot_id).toBe("existing");
  });
});
