import { SECURITY_HEADERS, CSP_DIRECTIVES } from "@/lib/security-headers";

describe("security headers", () => {
  it("includes required hardening headers", () => {
    const headers = new Headers(
      SECURITY_HEADERS.map((entry) => [entry.key, entry.value]),
    );

    expect(headers.get("strict-transport-security")).toBeTruthy();
    expect(headers.get("content-security-policy")).toBeTruthy();
    expect(headers.get("x-frame-options")).toBeTruthy();
    expect(headers.get("x-content-type-options")).toBeTruthy();
    expect(headers.get("referrer-policy")).toBeTruthy();
  });

  it("emits exactly one enforce and one report-only CSP header", () => {
    const cspEntries = SECURITY_HEADERS.filter(
      (h) => h.key === "Content-Security-Policy",
    );
    const reportOnlyEntries = SECURITY_HEADERS.filter(
      (h) => h.key === "Content-Security-Policy-Report-Only",
    );
    expect(cspEntries).toHaveLength(1);
    expect(reportOnlyEntries).toHaveLength(1);
  });
});

describe("CSP directives", () => {
  const csp = CSP_DIRECTIVES.join("; ");

  it("includes style-src-elem with unsafe-inline", () => {
    expect(csp).toContain("style-src-elem 'self' 'unsafe-inline'");
  });

  it("includes style-src with unsafe-inline", () => {
    expect(csp).toContain("style-src 'self' 'unsafe-inline'");
  });

  it("includes script-src-elem with Vercel Analytics", () => {
    expect(csp).toContain("script-src-elem");
    expect(csp).toContain("https://va.vercel-scripts.com");
  });

  it("includes script-src with Vercel Analytics", () => {
    expect(csp).toContain(
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com",
    );
  });

  it("includes img-src with data: and https:", () => {
    expect(csp).toContain("img-src 'self' data: https:");
  });

  it("includes upgrade-insecure-requests", () => {
    expect(csp).toContain("upgrade-insecure-requests");
  });

  it("report-only CSP mirrors enforce CSP with report-to appended", () => {
    const enforce = SECURITY_HEADERS.find(
      (h) => h.key === "Content-Security-Policy",
    )!.value;
    const reportOnly = SECURITY_HEADERS.find(
      (h) => h.key === "Content-Security-Policy-Report-Only",
    )!.value;
    expect(reportOnly).toBe(enforce + "; report-to csp");
  });
});