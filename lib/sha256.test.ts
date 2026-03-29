import { describe, expect, it } from "vitest";

import { sha256Hex } from "./sha256";

describe("sha256Hex", () => {
  it("hashes a known string to the expected SHA-256 hex", () => {
    expect(sha256Hex("hello world")).toBe("b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9");
  });
});
