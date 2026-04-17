// @vitest-environment node
/**
 * Unit tests for recommendation history functions in lib/customer-policy-trend.ts.
 *
 * Tests:
 *   - loadRecHistoryEntry / saveRecHistoryEntry — localStorage round-trip
 *   - classifyRecChanges — new / resolved classification
 *   - First-visit / empty-state suppression
 *
 * Uses the node environment (no jsdom) for lower heap consumption.
 * localStorage is provided via vi.stubGlobal.
 */
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  loadRecHistoryEntry,
  saveRecHistoryEntry,
  classifyRecChanges,
  type RecHistoryEntry,
} from "@/lib/customer-policy-trend";

// ---------------------------------------------------------------------------
// localStorage stub
// ---------------------------------------------------------------------------

function makeLocalStorageMock() {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const ENTRY_A: RecHistoryEntry = {
  id: "enable-simulation",
  title: "Enable simulation requirement",
  source: "Default guidance",
};
const ENTRY_B: RecHistoryEntry = {
  id: "tighten-slippage",
  title: "Tighten slippage tolerance",
  source: "Default guidance",
};
const ENTRY_C: RecHistoryEntry = {
  id: "restrict-tokens",
  title: "Restrict token access",
  source: "Default guidance",
};

// ---------------------------------------------------------------------------
// loadRecHistoryEntry / saveRecHistoryEntry
// ---------------------------------------------------------------------------

describe("loadRecHistoryEntry / saveRecHistoryEntry", () => {
  let lsMock: ReturnType<typeof makeLocalStorageMock>;

  beforeEach(() => {
    lsMock = makeLocalStorageMock();
    vi.stubGlobal("window", {});
    vi.stubGlobal("localStorage", lsMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns an empty array when localStorage is empty", () => {
    const result = loadRecHistoryEntry();
    expect(result).toEqual([]);
  });

  it("round-trips entries through save and load", () => {
    saveRecHistoryEntry([ENTRY_A, ENTRY_B]);
    const result = loadRecHistoryEntry();
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(ENTRY_A);
    expect(result[1]).toEqual(ENTRY_B);
  });

  it("overwrites existing history on save", () => {
    saveRecHistoryEntry([ENTRY_A]);
    saveRecHistoryEntry([ENTRY_B, ENTRY_C]);
    const result = loadRecHistoryEntry();
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("tighten-slippage");
    expect(result[1].id).toBe("restrict-tokens");
  });

  it("returns empty array for malformed JSON", () => {
    lsMock.setItem("atf_policy_rec_history", "not-valid-json{{");
    expect(loadRecHistoryEntry()).toEqual([]);
  });

  it("returns empty array for non-array JSON value", () => {
    lsMock.setItem("atf_policy_rec_history", JSON.stringify({ id: "wrong" }));
    expect(loadRecHistoryEntry()).toEqual([]);
  });

  it("filters out entries missing required fields", () => {
    lsMock.setItem(
      "atf_policy_rec_history",
      JSON.stringify([
        { id: "ok", title: "OK", source: "Default guidance" },
        { id: "missing-title", source: "Default guidance" },
        { title: "missing-id", source: "Default guidance" },
        { id: "missing-source", title: "Missing source" },
        null,
        42,
        "string",
      ]),
    );
    const result = loadRecHistoryEntry();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("ok");
  });

  it("saves an empty array without error", () => {
    saveRecHistoryEntry([]);
    expect(loadRecHistoryEntry()).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// classifyRecChanges — first visit / empty state
// ---------------------------------------------------------------------------

describe("classifyRecChanges — first visit / empty prev", () => {
  it("returns empty arrays when prevEntries is empty (first visit)", () => {
    const { newEntries, resolvedEntries } = classifyRecChanges(
      [ENTRY_A, ENTRY_B],
      [],
    );
    expect(newEntries).toEqual([]);
    expect(resolvedEntries).toEqual([]);
  });

  it("returns empty arrays when both current and prev are empty", () => {
    const { newEntries, resolvedEntries } = classifyRecChanges([], []);
    expect(newEntries).toEqual([]);
    expect(resolvedEntries).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// classifyRecChanges — new recommendations
// ---------------------------------------------------------------------------

describe("classifyRecChanges — new entries", () => {
  it("marks recs that appear now but were absent before as new", () => {
    const { newEntries } = classifyRecChanges(
      [ENTRY_A, ENTRY_B, ENTRY_C],
      [ENTRY_A],
    );
    expect(newEntries).toHaveLength(2);
    expect(newEntries.map((e) => e.id)).toContain("tighten-slippage");
    expect(newEntries.map((e) => e.id)).toContain("restrict-tokens");
  });

  it("produces no new entries when current set equals prev set", () => {
    const { newEntries } = classifyRecChanges([ENTRY_A, ENTRY_B], [ENTRY_A, ENTRY_B]);
    expect(newEntries).toEqual([]);
  });

  it("produces no new entries when current is a strict subset of prev", () => {
    const { newEntries } = classifyRecChanges([ENTRY_A], [ENTRY_A, ENTRY_B]);
    expect(newEntries).toEqual([]);
  });

  it("new entry carries correct title and source", () => {
    const { newEntries } = classifyRecChanges([ENTRY_B], [ENTRY_A]);
    expect(newEntries).toHaveLength(1);
    expect(newEntries[0].title).toBe(ENTRY_B.title);
    expect(newEntries[0].source).toBe(ENTRY_B.source);
  });
});

// ---------------------------------------------------------------------------
// classifyRecChanges — resolved recommendations
// ---------------------------------------------------------------------------

describe("classifyRecChanges — resolved entries", () => {
  it("marks recs that were present before but absent now as resolved", () => {
    const { resolvedEntries } = classifyRecChanges(
      [ENTRY_A],
      [ENTRY_A, ENTRY_B, ENTRY_C],
    );
    expect(resolvedEntries).toHaveLength(2);
    expect(resolvedEntries.map((e) => e.id)).toContain("tighten-slippage");
    expect(resolvedEntries.map((e) => e.id)).toContain("restrict-tokens");
  });

  it("resolved entry carries stored title and source from prev snapshot", () => {
    const { resolvedEntries } = classifyRecChanges([], [ENTRY_B]);
    expect(resolvedEntries).toHaveLength(1);
    expect(resolvedEntries[0].title).toBe(ENTRY_B.title);
    expect(resolvedEntries[0].source).toBe(ENTRY_B.source);
  });

  it("produces no resolved entries when prev is a strict subset of current", () => {
    const { resolvedEntries } = classifyRecChanges([ENTRY_A, ENTRY_B], [ENTRY_A]);
    expect(resolvedEntries).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// classifyRecChanges — simultaneous new and resolved
// ---------------------------------------------------------------------------

describe("classifyRecChanges — mixed new and resolved", () => {
  it("correctly splits simultaneous new and resolved in one pass", () => {
    // Prev: A, B — Current: B, C  → A is resolved, C is new
    const { newEntries, resolvedEntries } = classifyRecChanges(
      [ENTRY_B, ENTRY_C],
      [ENTRY_A, ENTRY_B],
    );
    expect(newEntries).toHaveLength(1);
    expect(newEntries[0].id).toBe("restrict-tokens");
    expect(resolvedEntries).toHaveLength(1);
    expect(resolvedEntries[0].id).toBe("enable-simulation");
  });

  it("handles complete replacement (all different IDs)", () => {
    const { newEntries, resolvedEntries } = classifyRecChanges(
      [ENTRY_C],
      [ENTRY_A, ENTRY_B],
    );
    expect(newEntries).toHaveLength(1);
    expect(resolvedEntries).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// classifyRecChanges — still-active entries
// ---------------------------------------------------------------------------

describe("classifyRecChanges — still-active (implicit)", () => {
  it("does not include still-active entries in either output array", () => {
    // A and B remain, C is new
    const { newEntries, resolvedEntries } = classifyRecChanges(
      [ENTRY_A, ENTRY_B, ENTRY_C],
      [ENTRY_A, ENTRY_B],
    );
    // Only C is new; nothing resolved
    expect(newEntries.map((e) => e.id)).toEqual(["restrict-tokens"]);
    expect(resolvedEntries).toEqual([]);
  });
});
