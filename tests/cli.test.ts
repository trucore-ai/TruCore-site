// @vitest-environment node

import { describe, expect, it } from "vitest";
import { parseArgs, runSimulateWithIo } from "../packages/atf-cli/src/cli.js";

type HeaderMap = Record<string, string>;

function createHeaders(map: HeaderMap) {
  return {
    get(key: string) {
      return map[key.toLowerCase()] ?? null;
    },
  };
}

function createWritable() {
  return {
    value: "",
    write(chunk: string) {
      this.value += chunk;
    },
  };
}

describe("atf cli", () => {
  it("parses --format, --verify, --preset, and --json flags", () => {
    const parsed = parseArgs([
      "simulate",
      "--preset",
      "swap_small",
      "--format",
      "pretty",
      "--verify",
      "--json",
      '{"action":"swap"}',
    ]);

    expect(parsed.command).toBe("simulate");
    expect(parsed.preset).toBe("swap_small");
    expect(parsed.format).toBe("pretty");
    expect(parsed.verify).toBe(true);
    expect(parsed.json).toBe('{"action":"swap"}');
  });

  it("returns exit code 2 for denied responses", async () => {
    const stdout = createWritable();
    const stderr = createWritable();
    const args = parseArgs(["simulate", "--preset", "swap_too_large", "--format", "pretty", "--verify"]);

    const exitCode = await runSimulateWithIo(args, {
      fetchImpl: async () => ({
        ok: true,
        status: 200,
        headers: createHeaders({}),
        async json() {
          return {
            ok: true,
            result: {
              status: "denied",
              reason: "Amount exceeds max demo limit (1000).",
              receipt_hash: "deadbeef",
              invariant_checks: ["amount <= 1000: fail"],
            },
          };
        },
      }),
      stdout,
      stderr,
    });

    expect(exitCode).toBe(2);
    expect(stdout.value).toContain("Status: denied");
    expect(stdout.value).toContain("Verification URL:");
    expect(stderr.value).toBe("");
  });

  it("returns exit code 1 for non-200 responses and prints code/message", async () => {
    const stdout = createWritable();
    const stderr = createWritable();
    const args = parseArgs(["simulate", "--preset", "swap_small"]);

    const exitCode = await runSimulateWithIo(args, {
      fetchImpl: async () => ({
        ok: false,
        status: 401,
        headers: createHeaders({
          "x-ratelimit-limit": "30",
          "x-ratelimit-remaining": "12",
          "x-ratelimit-reset": "1700000100",
        }),
        async text() {
          return JSON.stringify({
            code: "invalid_api_key",
            message: "The provided API key is invalid.",
          });
        },
      }),
      stdout,
      stderr,
    });

    expect(exitCode).toBe(1);
    expect(stdout.value).toBe("");
    expect(stderr.value).toContain("HTTP 401");
    expect(stderr.value).toContain("Code: invalid_api_key");
    expect(stderr.value).toContain("Message: The provided API key is invalid.");
    expect(stderr.value).toContain("Rate limits:");
  });
});
