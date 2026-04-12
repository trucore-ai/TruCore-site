import { describe, expect, it } from "vitest";
import { normalizeDecision, isAllowedDecision } from "@/lib/normalize-decision";

describe("normalizeDecision", () => {
  // ── ALLOWED variants ──
  it.each([
    "ALLOW",
    "allow",
    "Allow",
    "ALLOWED",
    "allowed",
    "Allowed",
    "APPROVE",
    "approve",
    "approved",
    "APPROVED",
  ])('normalizes "%s" → ALLOWED', (input) => {
    expect(normalizeDecision(input)).toBe("ALLOWED");
  });

  // ── DENIED variants ──
  it.each([
    "DENY",
    "deny",
    "Deny",
    "DENIED",
    "denied",
    "Denied",
    "BLOCK",
    "block",
    "BLOCKED",
    "blocked",
    "Blocked",
  ])('normalizes "%s" → DENIED', (input) => {
    expect(normalizeDecision(input)).toBe("DENIED");
  });

  // ── UNKNOWN variants ──
  it.each([
    "UNKNOWN",
    "unknown",
    "Unknown",
    "error",
    "ERROR",
    "",
  ])('normalizes "%s" → UNKNOWN', (input) => {
    expect(normalizeDecision(input)).toBe("UNKNOWN");
  });

  // ── Null / undefined / garbage ──
  it("returns UNKNOWN for undefined", () => {
    expect(normalizeDecision(undefined)).toBe("UNKNOWN");
  });

  it("returns UNKNOWN for null", () => {
    expect(normalizeDecision(null)).toBe("UNKNOWN");
  });

  it("returns UNKNOWN for unrecognised input", () => {
    expect(normalizeDecision("foobar")).toBe("UNKNOWN");
  });

  // ── Whitespace trimming ──
  it("trims whitespace before normalizing", () => {
    expect(normalizeDecision("  allow  ")).toBe("ALLOWED");
    expect(normalizeDecision("  DENY  ")).toBe("DENIED");
  });
});

describe("isAllowedDecision", () => {
  it("returns true for allow-family values", () => {
    expect(isAllowedDecision("ALLOW")).toBe(true);
    expect(isAllowedDecision("allowed")).toBe(true);
    expect(isAllowedDecision("approved")).toBe(true);
  });

  it("returns false for deny-family values", () => {
    expect(isAllowedDecision("DENY")).toBe(false);
    expect(isAllowedDecision("blocked")).toBe(false);
  });

  it("returns false for unknown/null/undefined", () => {
    expect(isAllowedDecision("unknown")).toBe(false);
    expect(isAllowedDecision(null)).toBe(false);
    expect(isAllowedDecision(undefined)).toBe(false);
  });
});
