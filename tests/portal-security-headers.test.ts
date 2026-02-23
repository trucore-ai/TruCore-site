import { describe, expect, it } from "vitest";
import { getSecurityHeaderRules } from "@/next.config";

function headerValue(headers: Array<{ key: string; value: string }>, key: string) {
  return headers.find((entry) => entry.key.toLowerCase() === key.toLowerCase())?.value ?? "";
}

describe("portal security header rules", () => {
  it("applies robots noindex/nofollow and no-store headers to /portal/:path*", () => {
    const rules = getSecurityHeaderRules();
    const portalRule = rules.find((rule) => rule.source === "/portal/:path*");

    expect(portalRule).toBeTruthy();
    const robotsTag = headerValue(portalRule?.headers ?? [], "X-Robots-Tag").toLowerCase();
    const cacheControl = headerValue(portalRule?.headers ?? [], "Cache-Control").toLowerCase();

    expect(robotsTag).toContain("noindex");
    expect(robotsTag).toContain("nofollow");
    expect(cacheControl).toContain("no-store");
  });

  it("covers both /portal and /portal/login via /portal/:path* source scoping", () => {
    const rules = getSecurityHeaderRules();
    const portalRule = rules.find((rule) => rule.source === "/portal/:path*");

    expect(portalRule).toBeTruthy();
    expect(portalRule?.source).toBe("/portal/:path*");
  });
});