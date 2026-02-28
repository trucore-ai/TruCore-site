import { describe, expect, it } from "vitest";
import {
  createFeedbackSchema,
  updateFeedbackSchema,
  voteFeedbackSchema,
  listFeedbackSchema,
} from "@/lib/validation/feedback";

describe("createFeedbackSchema", () => {
  it("accepts valid input", () => {
    const result = createFeedbackSchema.safeParse({
      title: "Add webhook support",
      body: "It would be great to have webhook callbacks when a policy decision is made.",
      category: "Feature Request",
    });
    expect(result.success).toBe(true);
  });

  it("rejects title shorter than 5 characters", () => {
    const result = createFeedbackSchema.safeParse({
      title: "Hi",
      body: "Some body text that is long enough to pass validation checks here.",
      category: "Bug",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain("at least 5");
    }
  });

  it("rejects title longer than 120 characters", () => {
    const result = createFeedbackSchema.safeParse({
      title: "A".repeat(121),
      body: "Some body text that is long enough to pass validation checks here.",
      category: "Bug",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain("120");
    }
  });

  it("rejects body shorter than 20 characters", () => {
    const result = createFeedbackSchema.safeParse({
      title: "Valid title here",
      body: "Too short",
      category: "Docs",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain("at least 20");
    }
  });

  it("rejects body longer than 4000 characters", () => {
    const result = createFeedbackSchema.safeParse({
      title: "Valid title here",
      body: "B".repeat(4001),
      category: "Docs",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain("4,000");
    }
  });

  it("rejects invalid category", () => {
    const result = createFeedbackSchema.safeParse({
      title: "Valid title here",
      body: "Some body text that is long enough to pass validation checks here.",
      category: "InvalidCategory",
    });
    expect(result.success).toBe(false);
  });

  it("accepts all valid categories", () => {
    const categories = [
      "Feature Request",
      "Bug",
      "Docs",
      "Integration",
      "Question",
    ];
    for (const category of categories) {
      const result = createFeedbackSchema.safeParse({
        title: "Valid title here",
        body: "Some body text that is long enough to pass validation checks here.",
        category,
      });
      expect(result.success).toBe(true);
    }
  });

  it("trims whitespace from title and body", () => {
    const result = createFeedbackSchema.safeParse({
      title: "  Trimmed title  ",
      body: "  This body will be trimmed of leading and trailing spaces.  ",
      category: "Feature Request",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("Trimmed title");
      expect(result.data.body).toBe(
        "This body will be trimmed of leading and trailing spaces.",
      );
    }
  });
});

describe("updateFeedbackSchema", () => {
  it("accepts valid update with status", () => {
    const result = updateFeedbackSchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      status: "Planned",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid update with pinned", () => {
    const result = updateFeedbackSchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      pinned: true,
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid update with hidden", () => {
    const result = updateFeedbackSchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      hidden: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid UUID", () => {
    const result = updateFeedbackSchema.safeParse({
      id: "not-a-uuid",
      status: "Shipped",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid status", () => {
    const result = updateFeedbackSchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      status: "Invalid",
    });
    expect(result.success).toBe(false);
  });

  it("accepts all valid statuses", () => {
    const statuses = [
      "Considering",
      "Planned",
      "In Progress",
      "Shipped",
      "Wont Implement",
    ];
    for (const status of statuses) {
      const result = updateFeedbackSchema.safeParse({
        id: "550e8400-e29b-41d4-a716-446655440000",
        status,
      });
      expect(result.success).toBe(true);
    }
  });
});

describe("voteFeedbackSchema", () => {
  it("accepts valid UUID", () => {
    const result = voteFeedbackSchema.safeParse({
      feedbackItemId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid UUID", () => {
    const result = voteFeedbackSchema.safeParse({
      feedbackItemId: "abc123",
    });
    expect(result.success).toBe(false);
  });
});

describe("listFeedbackSchema", () => {
  it("accepts empty params with defaults", () => {
    const result = listFeedbackSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sort).toBe("top");
    }
  });

  it("accepts all sort options", () => {
    for (const sort of ["top", "new", "shipped"]) {
      const result = listFeedbackSchema.safeParse({ sort });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid sort option", () => {
    const result = listFeedbackSchema.safeParse({ sort: "random" });
    expect(result.success).toBe(false);
  });

  it("accepts category filter", () => {
    const result = listFeedbackSchema.safeParse({ category: "Bug" });
    expect(result.success).toBe(true);
  });

  it("accepts status filter", () => {
    const result = listFeedbackSchema.safeParse({ status: "Shipped" });
    expect(result.success).toBe(true);
  });
});
