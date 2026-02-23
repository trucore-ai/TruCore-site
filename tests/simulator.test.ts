import { describe, expect, it } from "vitest";
import { simulatePolicy } from "@/lib/simulator";

const BASE_REQUEST = {
  action: "swap",
  token_in: "SOL",
  token_out: "USDC",
  amount: 10,
  max_slippage_bps: 100,
  ttl_seconds: 60,
};

describe("simulatePolicy", () => {
  it("denies when amount exceeds limit", () => {
    const result = simulatePolicy({
      ...BASE_REQUEST,
      amount: 1001,
    });

    expect(result.status).toBe("denied");
    expect(result.reason).toContain("Amount exceeds max demo limit");
  });

  it("denies when slippage exceeds limit", () => {
    const result = simulatePolicy({
      ...BASE_REQUEST,
      max_slippage_bps: 301,
    });

    expect(result.status).toBe("denied");
    expect(result.reason).toContain("Slippage exceeds max demo limit");
  });

  it("denies when ttl exceeds limit", () => {
    const result = simulatePolicy({
      ...BASE_REQUEST,
      ttl_seconds: 301,
    });

    expect(result.status).toBe("denied");
    expect(result.reason).toContain("TTL exceeds max demo limit");
  });

  it("allows valid request", () => {
    const result = simulatePolicy(BASE_REQUEST);

    expect(result.status).toBe("allowed");
    expect(result.reason).toBe("Request satisfies demo policy limits.");
    expect(result.invariant_checks).toEqual([
      "amount <= 1000: pass",
      "max_slippage_bps <= 300: pass",
      "ttl_seconds <= 300: pass",
    ]);
  });

  it("returns deterministic receipt hash for identical input", () => {
    const first = simulatePolicy(BASE_REQUEST);
    const second = simulatePolicy(BASE_REQUEST);

    expect(first.receipt_hash).toBe(second.receipt_hash);
    expect(first.receipt_hash).toMatch(/^[a-f0-9]{64}$/);
  });
});