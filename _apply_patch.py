#!/usr/bin/env python3
"""Apply the targeted edit to receipt-og-real.test.ts preserving CRLF."""

import sys

target = "tests/receipt-og-real.test.ts"

with open(target, "rb") as f:
    content = f.read()

old = (
    b'  describe("backend verification - error paths", () => {\r\n'
    b'    it("falls back to deterministic on backend timeout", async () => {\r\n'
    b'      vi.stubEnv("OG_REAL_VERIFICATION_ENABLED", "true");\r\n'
    b'      vi.stubEnv("ATF_API_URL", "https://api.example.com");\r\n'
    b'\r\n'
    b'      // Simulate timeout by making fetch hang\r\n'
    b'      vi.spyOn(globalThis, "fetch").mockImplementationOnce(\r\n'
    b'        () =>\r\n'
    b'          new Promise((_, reject) => {\r\n'
    b'            setTimeout(() => reject(new Error("The operation was aborted")), 600);\r\n'
    b'          }),\r\n'
    b'      );'
)

new = (
    b'  describe("backend verification - error paths", () => {\r\n'
    b"    // Elevated timeout: this test waits for the route's real 500ms AbortController\r\n"
    b'    // timer to fire, plus ImageResponse rendering. Under CI load the combined\r\n'
    b'    // wall-clock time can exceed the default 5000ms vitest timeout.\r\n'
    b'    it("falls back to deterministic on backend timeout", { timeout: 15_000 }, async () => {\r\n'
    b'      vi.stubEnv("OG_REAL_VERIFICATION_ENABLED", "true");\r\n'
    b'      vi.stubEnv("ATF_API_URL", "https://api.example.com");\r\n'
    b'\r\n'
    b"      // Simulate a hanging backend that is terminated by the route's AbortController.\r\n"
    b"      // The mock listens to the signal so it rejects as soon as the route's 500ms\r\n"
    b'      // timeout fires, matching real fetch + AbortController semantics and avoiding\r\n'
    b'      // a fixed delay that can push total test time past the default 5000ms limit\r\n'
    b'      // when combined with ImageResponse WASM rendering overhead.\r\n'
    b'      vi.spyOn(globalThis, "fetch").mockImplementationOnce(\r\n'
    b'        (_url: string | URL | Request, init?: RequestInit) =>\r\n'
    b'          new Promise<Response>((_, reject) => {\r\n'
    b'            const signal = init?.signal;\r\n'
    b'            if (signal) {\r\n'
    b'              const onAbort = () =>\r\n'
    b'                reject(new Error("The operation was aborted"));\r\n'
    b'              if (signal.aborted) {\r\n'
    b'                onAbort();\r\n'
    b'                return;\r\n'
    b'              }\r\n'
    b'              signal.addEventListener("abort", onAbort, { once: true });\r\n'
    b'            }\r\n'
    b'          }),\r\n'
    b'      );'
)

if old not in content:
    print("ERROR: old block not found in file", file=sys.stderr)
    sys.exit(1)

count = content.count(old)
if count != 1:
    print(f"ERROR: found {count} occurrences, expected 1", file=sys.stderr)
    sys.exit(1)

content = content.replace(old, new, 1)

with open(target, "wb") as f:
    f.write(content)

print("Patch applied successfully")
