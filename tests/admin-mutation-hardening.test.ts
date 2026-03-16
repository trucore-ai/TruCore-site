import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/* ═══════════ Mocks ═══════════ */

const mocks = vi.hoisted(() => {
  return {
    assertAdminSessionMock: vi.fn(),
    updateWaitlistSignupStatusMock: vi.fn(),
    updateWaitlistAdminNotesMock: vi.fn(),
    listDesignPartnerSignupsMock: vi.fn(),
    logAdminActionMock: vi.fn(),
    assertRateLimitMock: vi.fn(),
    toCsvMock: vi.fn(() => "csv-content"),
  };
});

vi.mock("@/lib/admin-auth", () => ({
  assertAdminSession: mocks.assertAdminSessionMock,
}));

vi.mock("@/lib/db", () => ({
  updateWaitlistSignupStatus: mocks.updateWaitlistSignupStatusMock,
  updateWaitlistAdminNotes: mocks.updateWaitlistAdminNotesMock,
  listDesignPartnerSignups: mocks.listDesignPartnerSignupsMock,
  PIPELINE_STATUSES: ["new", "contacted", "qualified", "closed"],
}));

vi.mock("@/lib/audit-log", () => ({
  logAdminAction: mocks.logAdminActionMock,
}));

vi.mock("@/lib/rate-limit", () => ({
  assertRateLimit: mocks.assertRateLimitMock,
}));

vi.mock("@/lib/csv", () => ({
  toCsv: mocks.toCsvMock,
}));

import {
  setSignupStatus,
  updateAdminNotes,
  exportDesignPartnersCsv,
} from "@/app/admin/waitlist/actions";
import {
  getSecurityEventCounters,
  _resetSecurityEventCounters,
} from "@/lib/security-log";

/* ═══════════ Helpers ═══════════ */

function buildFormData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    fd.set(key, value);
  }
  return fd;
}

/* ═══════════ Setup / Teardown ═══════════ */

beforeEach(() => {
  vi.clearAllMocks();
  _resetSecurityEventCounters();
  vi.spyOn(console, "warn").mockImplementation(() => {});
  // Auth passes by default
  mocks.assertAdminSessionMock.mockResolvedValue(undefined);
  mocks.logAdminActionMock.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

/* ═══════════ setSignupStatus ═══════════ */

describe("setSignupStatus", () => {
  it("returns { ok: true } on successful status update", async () => {
    mocks.updateWaitlistSignupStatusMock.mockResolvedValue(1);

    const result = await setSignupStatus(
      buildFormData({ email: "user@test.com", status: "contacted" }),
    );

    expect(result).toHaveProperty("ok", true);
    expect(mocks.updateWaitlistSignupStatusMock).toHaveBeenCalledWith({
      email: "user@test.com",
      status: "contacted",
    });
  });

  it("returns safe error on DB failure — no raw details leaked", async () => {
    mocks.updateWaitlistSignupStatusMock.mockRejectedValue(
      new Error("connection refused to postgres://admin:secret@host:5432/db"),
    );

    const result = await setSignupStatus(
      buildFormData({ email: "user@test.com", status: "contacted" }),
    );

    expect(result).toHaveProperty("error", "temporarily_unavailable");
    expect(result).not.toHaveProperty("ok");
    // Ensure no raw DB error or DSN leaks
    const json = JSON.stringify(result);
    expect(json).not.toContain("postgres://");
    expect(json).not.toContain("connection refused");
    expect(json).not.toContain("secret");
  });

  it("logs admin_action_degraded event on DB failure", async () => {
    mocks.updateWaitlistSignupStatusMock.mockRejectedValue(
      new Error("ECONNREFUSED"),
    );

    await setSignupStatus(
      buildFormData({ email: "user@test.com", status: "contacted" }),
    );

    const counters = getSecurityEventCounters();
    expect(counters["admin_action_degraded"]).toBe(1);
  });

  it("fails closed on auth failure before mutation", async () => {
    mocks.assertAdminSessionMock.mockRejectedValue(new Error("no session"));

    const result = await setSignupStatus(
      buildFormData({ email: "user@test.com", status: "contacted" }),
    );

    expect(result).toHaveProperty("error", "unauthorized");
    expect(mocks.updateWaitlistSignupStatusMock).not.toHaveBeenCalled();
  });
});

/* ═══════════ updateAdminNotes ═══════════ */

describe("updateAdminNotes", () => {
  it("returns { ok: true } on successful notes update", async () => {
    mocks.updateWaitlistAdminNotesMock.mockResolvedValue(1);

    const result = await updateAdminNotes(
      buildFormData({ email: "user@test.com", notes: "Followed up" }),
    );

    expect(result).toHaveProperty("ok", true);
    expect(mocks.updateWaitlistAdminNotesMock).toHaveBeenCalledWith({
      email: "user@test.com",
      notes: "Followed up",
    });
  });

  it("returns safe error on DB failure — no raw details leaked", async () => {
    mocks.updateWaitlistAdminNotesMock.mockRejectedValue(
      new TypeError("Cannot read properties of null (reading 'query')"),
    );

    const result = await updateAdminNotes(
      buildFormData({ email: "user@test.com", notes: "test" }),
    );

    expect(result).toHaveProperty("error", "temporarily_unavailable");
    expect(result).not.toHaveProperty("ok");
    const json = JSON.stringify(result);
    expect(json).not.toContain("Cannot read properties");
    expect(json).not.toContain("query");
  });

  it("logs admin_action_degraded on DB failure with action label", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    mocks.updateWaitlistAdminNotesMock.mockRejectedValue(new Error("timeout"));

    await updateAdminNotes(
      buildFormData({ email: "user@test.com", notes: "test" }),
    );

    const counters = getSecurityEventCounters();
    expect(counters["admin_action_degraded"]).toBe(1);

    // Verify the logged event contains the action label
    const logged = warnSpy.mock.calls.find((c) =>
      typeof c[0] === "string" && c[0].includes("admin_action_degraded"),
    );
    expect(logged).toBeDefined();
    expect(logged![0]).toContain("action=update_admin_notes");
  });

  it("fails closed on auth failure before mutation", async () => {
    mocks.assertAdminSessionMock.mockRejectedValue(new Error("no session"));

    const result = await updateAdminNotes(
      buildFormData({ email: "user@test.com", notes: "test" }),
    );

    expect(result).toHaveProperty("error", "unauthorized");
    expect(mocks.updateWaitlistAdminNotesMock).not.toHaveBeenCalled();
  });
});

/* ═══════════ exportDesignPartnersCsv ═══════════ */

describe("exportDesignPartnersCsv", () => {
  it("returns CSV content on success", async () => {
    mocks.listDesignPartnerSignupsMock.mockResolvedValue([
      { email: "a@test.com", status: "new" },
    ]);

    const result = await exportDesignPartnersCsv(new FormData());

    expect(result).toHaveProperty("csv", "csv-content");
    expect(result).toHaveProperty("filename");
    expect((result as { filename: string }).filename).toMatch(
      /^trucore-design-partners-\d+\.csv$/,
    );
  });

  it("returns safe error on DB failure — no raw details leaked", async () => {
    mocks.listDesignPartnerSignupsMock.mockRejectedValue(
      new Error("relation \"waitlist_signups\" does not exist"),
    );

    const result = await exportDesignPartnersCsv(new FormData());

    expect(result).toHaveProperty("error", "temporarily_unavailable");
    const json = JSON.stringify(result);
    expect(json).not.toContain("relation");
    expect(json).not.toContain("waitlist_signups");
    expect(json).not.toContain("does not exist");
  });

  it("logs admin_action_degraded on DB failure", async () => {
    mocks.listDesignPartnerSignupsMock.mockRejectedValue(
      new Error("ECONNREFUSED"),
    );

    await exportDesignPartnersCsv(new FormData());

    const counters = getSecurityEventCounters();
    expect(counters["admin_action_degraded"]).toBe(1);
  });

  it("fails closed on auth failure", async () => {
    mocks.assertAdminSessionMock.mockRejectedValue(new Error("no session"));

    const result = await exportDesignPartnersCsv(new FormData());

    expect(result).toHaveProperty("error", "unauthorized");
    expect(mocks.listDesignPartnerSignupsMock).not.toHaveBeenCalled();
  });
});

/* ═══════════ withAdminAction wrapper isolation ═══════════ */

describe("withAdminAction hardening", () => {
  it("never leaks Error.stack through action return values", async () => {
    const dbError = new Error("SSL connection failed: certificate verify failed");
    dbError.stack = "Error: SSL connection failed\n    at TLSSocket._finishInit\n    at node:net:123";
    mocks.updateWaitlistSignupStatusMock.mockRejectedValue(dbError);

    const result = await setSignupStatus(
      buildFormData({ email: "user@test.com", status: "contacted" }),
    );

    const json = JSON.stringify(result);
    expect(json).not.toContain("stack");
    expect(json).not.toContain("TLSSocket");
    expect(json).not.toContain("SSL connection");
    expect(json).not.toContain("certificate");
  });

  it("handles non-Error thrown values safely", async () => {
    mocks.updateWaitlistSignupStatusMock.mockRejectedValue("raw string error");

    const result = await setSignupStatus(
      buildFormData({ email: "user@test.com", status: "contacted" }),
    );

    expect(result).toHaveProperty("error", "temporarily_unavailable");
    const json = JSON.stringify(result);
    expect(json).not.toContain("raw string error");
  });

  it("increments admin_action_degraded counter cumulatively", async () => {
    mocks.updateWaitlistSignupStatusMock.mockRejectedValue(new Error("fail"));
    mocks.updateWaitlistAdminNotesMock.mockRejectedValue(new Error("fail"));

    await setSignupStatus(
      buildFormData({ email: "a@test.com", status: "contacted" }),
    );
    await updateAdminNotes(
      buildFormData({ email: "b@test.com", notes: "test" }),
    );

    const counters = getSecurityEventCounters();
    expect(counters["admin_action_degraded"]).toBe(2);
  });
});
