import { describe, expect, it, vi, afterEach } from "vitest";
import * as fsHelpers from "@/lib/fs-helpers";

// ---------------------------------------------------------------------------
// Unit test: app/.well-known/atf.json/route.ts
//
// Spies on @/lib/fs-helpers.readTextFile (a user-land wrapper around
// fs/promises.readFile) which is configurable in vitest's module system,
// unlike the non-configurable native ESM namespace of Node built-ins.
// ---------------------------------------------------------------------------

import { GET } from "@/app/.well-known/atf.json/route";

const FIXTURE = JSON.stringify({
  description: "Agent Transaction Firewall",
  openclaw_plugin: { name: "@trucore/openclaw-atf" },
});

describe("GET /.well-known/atf.json", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("exports a callable GET function", () => {
    expect(typeof GET).toBe("function");
  });

  it("returns 200 with application/json content-type", async () => {
    vi.spyOn(fsHelpers, "readTextFile").mockResolvedValueOnce(FIXTURE);
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("application/json");
  });

  it("body is valid JSON containing openclaw_plugin", async () => {
    vi.spyOn(fsHelpers, "readTextFile").mockResolvedValueOnce(FIXTURE);
    const res = await GET();
    const parsed = (await res.json()) as Record<string, unknown>;
    expect(parsed).toHaveProperty("openclaw_plugin");
  });

  it("returns 500 when manifest file is missing", async () => {
    vi.spyOn(fsHelpers, "readTextFile").mockRejectedValueOnce(
      Object.assign(new Error("ENOENT"), { code: "ENOENT" }),
    );
    const res = await GET();
    expect(res.status).toBe(500);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("manifest_not_found");
  });

  it("returns 500 when manifest contains invalid JSON", async () => {
    vi.spyOn(fsHelpers, "readTextFile").mockResolvedValueOnce("{not valid json");
    const res = await GET();
    expect(res.status).toBe(500);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("manifest_parse_error");
  });
});
