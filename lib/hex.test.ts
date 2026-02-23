import { describe, expect, it } from "vitest";

import { bytesToHex } from "./hex";

describe("bytesToHex", () => {
  it("returns lowercase hex for known bytes", () => {
    expect(bytesToHex(new Uint8Array([0, 15, 16, 171, 255]))).toBe("000f10abff");
  });

  it("returns empty string for empty input", () => {
    expect(bytesToHex(new Uint8Array([]))).toBe("");
  });
});