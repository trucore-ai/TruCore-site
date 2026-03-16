import { afterEach, describe, expect, it, vi } from "vitest";
import { denyUnlessTestMode } from "./test-gate";

function makeRequest(headers: Record<string, string> = {}): Request {
  return new Request("http://localhost:3000/api/test/login-throttle/reset", {
    method: "POST",
    headers,
  });
}

describe("test-gate / denyUnlessTestMode", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns 404 when ATF_E2E_TEST_SECRET is not set", () => {
    vi.stubEnv("ATF_E2E_TEST_SECRET", "");
    const result = denyUnlessTestMode(makeRequest({ "x-test-secret": "anything" }));
    expect(result).not.toBeNull();
    expect(result!.status).toBe(404);
  });

  it("returns 404 when ATF_E2E_TEST_SECRET is undefined", () => {
    delete process.env.ATF_E2E_TEST_SECRET;
    const result = denyUnlessTestMode(makeRequest({ "x-test-secret": "anything" }));
    expect(result).not.toBeNull();
    expect(result!.status).toBe(404);
  });

  it("returns 404 when header is missing", () => {
    vi.stubEnv("ATF_E2E_TEST_SECRET", "my-secret");
    const result = denyUnlessTestMode(makeRequest());
    expect(result).not.toBeNull();
    expect(result!.status).toBe(404);
  });

  it("returns 404 when header does not match secret", () => {
    vi.stubEnv("ATF_E2E_TEST_SECRET", "my-secret");
    const result = denyUnlessTestMode(makeRequest({ "x-test-secret": "wrong" }));
    expect(result).not.toBeNull();
    expect(result!.status).toBe(404);
  });

  it("returns null (allowed) when secret is set and header matches", () => {
    vi.stubEnv("ATF_E2E_TEST_SECRET", "my-secret");
    const result = denyUnlessTestMode(makeRequest({ "x-test-secret": "my-secret" }));
    expect(result).toBeNull();
  });

  it("fails closed on empty secret even with matching empty header", () => {
    vi.stubEnv("ATF_E2E_TEST_SECRET", "");
    const result = denyUnlessTestMode(makeRequest({ "x-test-secret": "" }));
    expect(result).not.toBeNull();
    expect(result!.status).toBe(404);
  });
});
