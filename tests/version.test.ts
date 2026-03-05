import { afterEach, describe, expect, it, vi } from "vitest";

async function importVersion() {
  vi.resetModules();
  return import("@/lib/version");
}

describe("getAtfCliVersion()", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns env value when NEXT_PUBLIC_ATF_CLI_VERSION is set", async () => {
    vi.stubEnv("NEXT_PUBLIC_ATF_CLI_VERSION", "1.2.3");
    const { getAtfCliVersion } = await importVersion();
    expect(getAtfCliVersion()).toBe("1.2.3");
  });

  it("strips leading v from env value", async () => {
    vi.stubEnv("NEXT_PUBLIC_ATF_CLI_VERSION", "v0.3.0");
    const { getAtfCliVersion } = await importVersion();
    expect(getAtfCliVersion()).toBe("0.3.0");
  });

  it("returns safe fallback when env is unset", async () => {
    vi.stubEnv("NEXT_PUBLIC_ATF_CLI_VERSION", "");
    const { getAtfCliVersion } = await importVersion();
    const version = getAtfCliVersion();
    expect(version).toBeTruthy();
    expect(version.length).toBeGreaterThan(0);
  });

  it("fallback is never 'latest'", async () => {
    vi.stubEnv("NEXT_PUBLIC_ATF_CLI_VERSION", "");
    const { getAtfCliVersion } = await importVersion();
    expect(getAtfCliVersion()).not.toBe("latest");
    expect(getAtfCliVersion()).not.toContain("latest");
  });

  it("never returns an empty string", async () => {
    vi.stubEnv("NEXT_PUBLIC_ATF_CLI_VERSION", "");
    const { getAtfCliVersion } = await importVersion();
    expect(getAtfCliVersion()).not.toBe("");
  });

  it("never returns undefined", async () => {
    vi.stubEnv("NEXT_PUBLIC_ATF_CLI_VERSION", "");
    const { getAtfCliVersion } = await importVersion();
    expect(getAtfCliVersion()).toBeDefined();
  });

  it("handles whitespace-only env value", async () => {
    vi.stubEnv("NEXT_PUBLIC_ATF_CLI_VERSION", "   ");
    const { getAtfCliVersion } = await importVersion();
    const version = getAtfCliVersion();
    expect(version).not.toBe("");
    expect(version).not.toBe("latest");
  });

  it("DEFAULT_ATF_CLI_VERSION is a valid semver-like string", async () => {
    const { DEFAULT_ATF_CLI_VERSION } = await importVersion();
    expect(DEFAULT_ATF_CLI_VERSION).toMatch(/^\d+\.\d+\.\d+/);
    expect(DEFAULT_ATF_CLI_VERSION).not.toBe("latest");
  });
});

describe("getAtfCliTag()", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns version prefixed with v", async () => {
    vi.stubEnv("NEXT_PUBLIC_ATF_CLI_VERSION", "0.5.0");
    const { getAtfCliTag } = await importVersion();
    expect(getAtfCliTag()).toBe("v0.5.0");
  });
});

describe("getAtfCliVersion() — production determinism", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("throws when NEXT_PUBLIC_ATF_CLI_VERSION is missing in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_ATF_CLI_VERSION", "");
    const { getAtfCliVersion } = await importVersion();
    expect(() => getAtfCliVersion()).toThrow(
      "NEXT_PUBLIC_ATF_CLI_VERSION must be set"
    );
  });

  it("throws when NEXT_PUBLIC_ATF_CLI_VERSION is 'latest' in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_ATF_CLI_VERSION", "latest");
    const { getAtfCliVersion } = await importVersion();
    expect(() => getAtfCliVersion()).toThrow(
      "Never use @latest"
    );
  });

  it("throws when NEXT_PUBLIC_ATF_CLI_VERSION is whitespace in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_ATF_CLI_VERSION", "   ");
    const { getAtfCliVersion } = await importVersion();
    expect(() => getAtfCliVersion()).toThrow(
      "NEXT_PUBLIC_ATF_CLI_VERSION must be set"
    );
  });

  it("returns pinned version in production when explicitly set", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_ATF_CLI_VERSION", "1.3.1");
    const { getAtfCliVersion } = await importVersion();
    expect(getAtfCliVersion()).toBe("1.3.1");
  });
});
