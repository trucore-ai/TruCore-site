import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { ADMIN_COOKIE_NAME } from "@/lib/admin-auth";

/* Middleware imports — the module reads ADMIN_COOKIE_NAME at import time */
import { middleware } from "@/middleware";

function makeRequest(
  pathname: string,
  cookies?: Record<string, string>,
): NextRequest {
  const url = new URL(pathname, "http://localhost:3000");
  const req = new NextRequest(url);
  if (cookies) {
    for (const [name, value] of Object.entries(cookies)) {
      req.cookies.set(name, value);
    }
  }
  return req;
}

describe("middleware — admin route guard", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("allows non-admin routes through", () => {
    const res = middleware(makeRequest("/docs/getting-started"));
    expect(res.status).toBe(200); // NextResponse.next()
    expect(res.headers.get("x-middleware-next")).toBeTruthy();
  });

  it("allows /admin/login without session cookie", () => {
    const res = middleware(makeRequest("/admin/login"));
    expect(res.status).toBe(200);
    expect(res.headers.get("x-middleware-next")).toBeTruthy();
  });

  it("redirects /admin/waitlist to /admin/login when no cookie", () => {
    const res = middleware(makeRequest("/admin/waitlist"));
    expect(res.status).toBe(307);
    const location = res.headers.get("location");
    expect(location).toContain("/admin/login");
  });

  it("redirects /admin/keys to /admin/login when no cookie", () => {
    const res = middleware(makeRequest("/admin/keys"));
    expect(res.status).toBe(307);
    const location = res.headers.get("location");
    expect(location).toContain("/admin/login");
  });

  it("allows /admin/waitlist when session cookie is present", () => {
    const res = middleware(
      makeRequest("/admin/waitlist", { [ADMIN_COOKIE_NAME]: "some-token" }),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("x-middleware-next")).toBeTruthy();
  });

  it("logs admin_route_denied when denying", () => {
    const spy = vi.spyOn(console, "warn");
    middleware(makeRequest("/admin/audit"));
    expect(spy).toHaveBeenCalled();
    const msg = spy.mock.calls.find((c) =>
      (c[0] as string).includes("admin_route_denied"),
    );
    expect(msg).toBeTruthy();
  });

  it("strips search params from redirect URL", () => {
    const url = new URL("/admin/waitlist?tab=design", "http://localhost:3000");
    const req = new NextRequest(url);
    const res = middleware(req);
    expect(res.status).toBe(307);
    const location = new URL(res.headers.get("location")!);
    expect(location.pathname).toBe("/admin/login");
    expect(location.search).toBe("");
  });
});
