import { SECURITY_HEADERS } from "@/lib/security-headers";

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
});