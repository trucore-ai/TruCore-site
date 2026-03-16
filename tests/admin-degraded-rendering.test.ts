import { describe, it, expect, vi, afterEach } from "vitest";
import {
  logSecurityEvent,
  getSecurityEventCounters,
  _resetSecurityEventCounters,
} from "@/lib/security-log";

afterEach(() => {
  _resetSecurityEventCounters();
  vi.restoreAllMocks();
});

/* ═══════════ AdminDegradedState component ═══════════ */

describe("AdminDegradedState component", () => {
  it("renders title and description without leaking internals", async () => {
    const mod = await import(
      "@/components/dashboard/admin-degraded-state"
    );
    const { AdminDegradedState } = mod;

    // Simulate React element creation (server component — no render needed)
    const el = AdminDegradedState({
      title: "Usage",
      description: "Usage data could not be loaded right now.",
    });

    // Element should be a valid React element
    expect(el).toBeTruthy();
    expect(el.props.role).toBe("alert");

    // Verify the rendered tree contains safe messaging
    const html = JSON.stringify(el);
    expect(html).toContain("Usage");
    expect(html).toContain("temporarily unavailable");
    expect(html).toContain("Usage data could not be loaded right now.");
    expect(html).toContain("Try again shortly or verify backend connectivity.");

    // Must NOT contain any backend internals
    expect(html).not.toContain("POSTGRES");
    expect(html).not.toContain("DATABASE_URL");
    expect(html).not.toContain("password");
    expect(html).not.toContain("stack");
    expect(html).not.toContain("Error:");
    expect(html).not.toContain("SELECT ");
    expect(html).not.toContain("INSERT ");
    expect(html).not.toContain("connection refused");
  });

  it("renders custom retry hint when provided", async () => {
    const { AdminDegradedState } = await import(
      "@/components/dashboard/admin-degraded-state"
    );

    const el = AdminDegradedState({
      title: "Audit Log",
      description: "Audit data could not be loaded.",
      retryHint: "Check Postgres status.",
    });

    const html = JSON.stringify(el);
    expect(html).toContain("Audit Log");
    expect(html).toContain("temporarily unavailable");
    expect(html).toContain("Check Postgres status.");
  });
});

/* ═══════════ Security event: admin_page_degraded ═══════════ */

describe("admin_page_degraded security event", () => {
  it("increments counter when logged", () => {
    const before = getSecurityEventCounters();
    expect(before["admin_page_degraded"] ?? 0).toBe(0);

    logSecurityEvent("admin_page_degraded", {
      meta: { page: "usage", reason: "db_unavailable" },
    });
    logSecurityEvent("admin_page_degraded", {
      meta: { page: "metrics", reason: "fetch_failed" },
    });

    const after = getSecurityEventCounters();
    expect(after["admin_page_degraded"]).toBe(2);
  });

  it("emits log line to stderr via console.warn", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});

    logSecurityEvent("admin_page_degraded", {
      meta: { page: "audit", reason: "db_unavailable" },
    });

    expect(spy).toHaveBeenCalledTimes(1);
    const line = spy.mock.calls[0][0] as string;
    expect(line).toContain("[security]");
    expect(line).toContain("event=admin_page_degraded");
    expect(line).toContain("page=audit");
    expect(line).toContain("reason=db_unavailable");

    // Must not contain secrets
    expect(line).not.toContain("DATABASE_URL");
    expect(line).not.toContain("ADMIN_DASHBOARD_KEY");
  });
});

/* ═══════════ Admin error boundary (client component) ═══════════ */

describe("AdminError boundary", () => {
  it("does not render error.message or stack in output", async () => {
    const mod = await import("@/app/admin/error");
    const AdminError = mod.default;

    const fakeError = new Error("connect ECONNREFUSED 127.0.0.1:5432");
    fakeError.stack =
      "Error: connect ECONNREFUSED 127.0.0.1:5432\n    at TCPConnectWrap.afterConnect";

    const el = AdminError({
      error: fakeError,
      reset: () => {},
    });

    const html = JSON.stringify(el);

    // Safe messaging present
    expect(html).toContain("Admin Error");
    expect(html).toContain("Something went wrong");

    // No leaked backend details
    expect(html).not.toContain("ECONNREFUSED");
    expect(html).not.toContain("5432");
    expect(html).not.toContain("TCPConnectWrap");
    expect(html).not.toContain("afterConnect");
    expect(html).not.toContain("connect ECONNREFUSED");
  });
});
