#!/usr/bin/env python3
"""Write SUMMARY.txt"""
import pathlib

summary = r"""PROMPT 044 SUMMARY -- test(site): stabilize receipt OG backend-timeout fallback coverage

Overall result: PASS -- test fixed, all suites green, lint clean, build passes

Branch: test/receipt-og-timeout-fix
Commit: ffd5786
Commit message: test(site): stabilize receipt OG backend-timeout fallback coverage
Parent (main): 47a5316
Files changed: 1 (tests/receipt-og-real.test.ts, +21 -5)
New dependencies: none
Route/product changes: none (test-only fix)

Root cause:
  The mock fetch in "falls back to deterministic on backend timeout" used
  setTimeout(() => reject(...), 600) -- a fixed 600ms delay that ignored the
  route's AbortController signal. Real fetch rejects immediately when
  controller.abort() fires at 500ms (VERIFICATION_TIMEOUT_MS). The mock
  instead waited the full 600ms regardless of the signal. Combined with
  ImageResponse WASM rendering overhead (~1-4s depending on the machine),
  total wall-clock time exceeded vitest's default 5000ms per-test timeout
  on CI and slower environments. On this machine the test took ~1950ms,
  leaving no margin for slower CI runners.

Issue type: TEST-ONLY (route logic is correct)

Fix applied (two parts):
  1. Signal-aware mock: replaced the setTimeout-based mock with one that
     listens to init.signal from the route's AbortController. The mock now
     rejects as soon as controller.abort() fires, accurately simulating
     real fetch + AbortController semantics. This eliminates the fixed
     600ms delay and the dangling setTimeout that could leak into test
     teardown.
  2. Per-test timeout: added { timeout: 15_000 } to this specific test.
     Rationale: the test legitimately waits ~500ms for the route's real
     abort timer to fire, plus ImageResponse rendering which varies by
     machine. The default 5000ms is too tight for this combination under
     CI load. 15s provides ample headroom while still catching genuine
     hangs.

Why this is the smallest correct fix:
  - Only the mock implementation and the per-test timeout were changed
  - No route code was modified (route behavior is correct)
  - No assertions were weakened -- the test still validates:
      * backend timeout triggers deterministic fallback
      * response is 200 with image/png content-type
      * cache-control is max-age=300 (fallback-tier caching)
  - No other tests were touched
  - No global timeout increase applied
  - No new dependencies introduced

Focused test result:
  tests/receipt-og-real.test.ts  20 passed (20)  ~2138ms total
  "falls back to deterministic on backend timeout"  ~1924ms  PASS

Full suite result:
  Test Files  101 passed (101)
  Tests       1452 passed (1452)
  Duration    38.82s
  Failures    0
  Regressions 0

Lint result:
  0 errors, 7 warnings (all pre-existing, unchanged)

Build result:
  Compiled successfully
  189 static pages generated
  No errors

Acceptance criteria:
  [x] Previously failing timeout test passes reliably
  [x] Test still validates real deterministic fallback behavior
  [x] No assertions weakened
  [x] No unrelated tests regress (1452/1452 pass)
  [x] Lint passes (0 errors)
  [x] Build passes (189 pages)
  [x] Diff is small and focused (1 file, +21 -5)
  [x] No new dependencies introduced
  [x] No route/product code changes
  [x] Branch not merged (awaiting review)

Risks / Follow-ups:
- The 7 lint warnings are pre-existing and unrelated. Cleanup is optional.
- Branch test/receipt-og-timeout-fix is ready to merge after review. It
  does not need to be merged in this task.
- The route's VERIFICATION_TIMEOUT_MS (500ms) is correct for production.
  The elevated per-test timeout accounts for test-environment overhead,
  not a production latency issue.
- If ImageResponse rendering speed improves in a future next/og update,
  the per-test timeout can be reduced. The 15s value is conservative and
  safe to leave as-is.
"""

pathlib.Path("/home/kontractkoder/repo/SUMMARY.txt").write_text(summary.lstrip())
print("SUMMARY.txt written")
