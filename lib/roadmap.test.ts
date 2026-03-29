import { describe, expect, it } from "vitest";

import { groupByScope, roadmapItems } from "./roadmap";

describe("groupByScope", () => {
  it("groups roadmap items by scope and preserves scope order", () => {
    const grouped = groupByScope(roadmapItems);

    expect(grouped.map((group) => group.scope)).toEqual(["core", "security", "ecosystem"]);
    expect(grouped.every((group) => group.items.every((item) => item.scope === group.scope))).toBe(true);
  });

  it("preserves completed, in_progress, and planned status counts", () => {
    const grouped = groupByScope(roadmapItems);
    const flattened = grouped.flatMap((group) => group.items);

    const statusCounts = flattened.reduce<Record<string, number>>((accumulator, item) => {
      accumulator[item.status] = (accumulator[item.status] ?? 0) + 1;
      return accumulator;
    }, {});

    expect(statusCounts).toEqual({
      completed: 2,
      in_progress: 2,
      planned: 3,
    });
  });
});
