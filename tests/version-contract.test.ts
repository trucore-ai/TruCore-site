import { afterEach, describe, expect, it, vi } from "vitest";

async function importOneLineQuickstart() {
  vi.resetModules();
  return import("@/lib/one-line-quickstart");
}

describe("one-line quickstart version contract", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses 0.1.0 fallback when NEXT_PUBLIC_ATF_CLI_VERSION is unset", async () => {
    vi.stubEnv("NEXT_PUBLIC_ATF_CLI_VERSION", "");

    const quickstartModule = await importOneLineQuickstart();

    expect(quickstartModule.ONE_LINE_NPX_COMMAND).toContain("@trucore/atf@v0.1.0");
    expect(quickstartModule.ONE_LINE_NPX_COMMAND).not.toContain("@latest");
  });

  it("uses NEXT_PUBLIC_ATF_CLI_VERSION when set", async () => {
    vi.stubEnv("NEXT_PUBLIC_ATF_CLI_VERSION", "0.1.7");

    const quickstartModule = await importOneLineQuickstart();

    expect(quickstartModule.ONE_LINE_NPX_COMMAND).toContain("@trucore/atf@v0.1.7");
    expect(quickstartModule.ONE_LINE_NPX_COMMAND).not.toContain("@latest");
  });
});
