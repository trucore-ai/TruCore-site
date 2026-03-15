import { afterEach, describe, expect, it, vi } from "vitest";
import { logSecurityEvent } from "./security-log";

describe("security-log", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("emits a structured log line for login_success", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    logSecurityEvent("login_success", { ip: "1.2.3.4" });
    expect(spy).toHaveBeenCalledOnce();
    const msg = spy.mock.calls[0][0] as string;
    expect(msg).toContain("[security]");
    expect(msg).toContain("event=login_success");
    expect(msg).toContain("ip_hash=");
    // Must NOT contain the raw IP
    expect(msg).not.toContain("1.2.3.4");
  });

  it("emits a structured log line for login_failure", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    logSecurityEvent("login_failure", { ip: "10.0.0.1" });
    expect(spy).toHaveBeenCalledOnce();
    const msg = spy.mock.calls[0][0] as string;
    expect(msg).toContain("event=login_failure");
    expect(msg).not.toContain("10.0.0.1");
  });

  it("includes request ID when provided", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    logSecurityEvent("logout", { ip: "10.0.0.1", requestId: "abc-123" });
    const msg = spy.mock.calls[0][0] as string;
    expect(msg).toContain("req=abc-123");
  });

  it("includes meta fields when provided", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    logSecurityEvent("login_rate_limited", {
      ip: "10.0.0.1",
      meta: { cooldown_triggered: true },
    });
    const msg = spy.mock.calls[0][0] as string;
    expect(msg).toContain("cooldown_triggered=true");
  });

  it("handles unknown IP gracefully", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    logSecurityEvent("invalid_session_rejected");
    const msg = spy.mock.calls[0][0] as string;
    expect(msg).toContain("ip_hash=unknown");
  });

  it("emits admin_route_denied event", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    logSecurityEvent("admin_route_denied", {
      ip: "192.168.1.1",
      meta: { path: "/admin/keys" },
    });
    const msg = spy.mock.calls[0][0] as string;
    expect(msg).toContain("event=admin_route_denied");
    expect(msg).toContain("path=/admin/keys");
    expect(msg).not.toContain("192.168.1.1");
  });

  it("emits admin_api_denied event", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    logSecurityEvent("admin_api_denied", {
      ip: "10.0.0.5",
      meta: { path: "/api/keys/create" },
    });
    const msg = spy.mock.calls[0][0] as string;
    expect(msg).toContain("event=admin_api_denied");
    expect(msg).not.toContain("10.0.0.5");
  });

  it("emits csrf_origin_rejected event", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    logSecurityEvent("csrf_origin_rejected", {
      ip: "172.16.0.1",
      meta: { method: "POST", path: "/admin/logout" },
    });
    const msg = spy.mock.calls[0][0] as string;
    expect(msg).toContain("event=csrf_origin_rejected");
    expect(msg).toContain("method=POST");
    expect(msg).not.toContain("172.16.0.1");
  });

  it("emits session_expired event", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    logSecurityEvent("session_expired");
    const msg = spy.mock.calls[0][0] as string;
    expect(msg).toContain("event=session_expired");
    expect(msg).toContain("ip_hash=unknown");
  });

  it("emits session_idle_timeout event", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    logSecurityEvent("session_idle_timeout");
    const msg = spy.mock.calls[0][0] as string;
    expect(msg).toContain("event=session_idle_timeout");
  });

  it("emits revoked_session_rejected event", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    logSecurityEvent("revoked_session_rejected", { ip: "10.0.0.9" });
    const msg = spy.mock.calls[0][0] as string;
    expect(msg).toContain("event=revoked_session_rejected");
    expect(msg).not.toContain("10.0.0.9");
  });

  it("emits admin_action_denied event", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    logSecurityEvent("admin_action_denied", { ip: "192.168.0.50" });
    const msg = spy.mock.calls[0][0] as string;
    expect(msg).toContain("event=admin_action_denied");
    expect(msg).not.toContain("192.168.0.50");
  });
});
