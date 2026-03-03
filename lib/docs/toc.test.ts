import { describe, expect, it } from "vitest";
import { slugify } from "./toc";

describe("slugify", () => {
  it("converts a heading to a URL-safe slug", () => {
    expect(slugify("Getting Started")).toBe("getting-started");
  });

  it("strips special characters", () => {
    expect(slugify("What's New?")).toBe("whats-new");
  });

  it("collapses multiple dashes", () => {
    expect(slugify("Simulate - Verify - Execute")).toBe("simulate-verify-execute");
  });

  it("trims leading and trailing dashes", () => {
    expect(slugify(" --Hello World-- ")).toBe("hello-world");
  });

  it("handles empty strings", () => {
    expect(slugify("")).toBe("");
  });
});
