# TruCore-site UI and Connectivity Audit

## Environment
- **Branch:** triage/site-ui-connectivity-audit (off main @ f7fee74)
- **Commit:** f7fee74
- **Date:** 2026-03-27
- **Local dev:** Next.js 16.1.6 (Turbopack) on Node v23.7.0 - starts clean on :3000
- **Production checked:** https://www.trucore.xyz (Vercel)

## Build & Lint Summary

| Check | Result |
|-------|--------|
| `npm run dev` | PASS - starts in 3.6 s, one deprecation warning (middleware -> proxy) |
| `npm run lint` | PASS - 3 warnings (no errors): unused `clearAuth` import, unused `PublicFeatureEntry`, unused `parts` in test |
| `npm run build` | PASS - all routes compile, SSG + dynamic routes render |
| Build warnings | 1: middleware.ts convention deprecated in Next.js 16 (migrate to "proxy") |
| Node engine warning | whatwg-url@16.0.1 wants Node ^20.19 or ^22.12 or >=24; running v23.7.0 |

## Issue Inventory

---

### Issue 1 - FIREWALL_API_BASE_URL not set in production (Vercel)
- **Severity:** HIGH (P1)
- **Route/Page:** /status, /api/status, /api/simulate (firewall passthrough path)
- **Reproduction steps:** `curl -sS https://www.trucore.xyz/api/status`
- **Actual behavior:**
  ```json
  {"ok":true,"firewall_api":{"configured":false,"reachable":false}}
  ```
  The /api/simulate endpoint falls back to local demo policy instead of reaching the live ATF backend at api.trucore.xyz for intents/approve. /status reports the firewall API as unconfigured and unreachable.
- **Expected behavior:** `firewall_api.configured: true, reachable: true`. Simulate requests should pass through to the live ATF /v1/intents/approve endpoint.
- **Console/network evidence:** `getFirewallApiBaseUrl()` returns `null` because `FIREWALL_API_BASE_URL` is not in `.env.local` or Vercel environment variables. It only exists in `.env.local.example`.
- **Likely source files:**
  - `app/api/simulate/route.ts` (line 75)
  - `app/api/status/route.ts` (line 18)
- **Root-cause hypothesis:** `FIREWALL_API_BASE_URL` was never added to the Vercel project environment variables. The site has always fallen back to the local policy simulator.
- **Recommended fix:** Add `FIREWALL_API_BASE_URL=https://api.trucore.xyz` and `FIREWALL_API_API_KEY=<server-side ATF key>` to the Vercel project environment variables (Settings > Environment Variables). No code change needed.

---

### Issue 2 - Receipt signing key unavailable
- **Severity:** HIGH (P1)
- **Route/Page:** /receipts, /verify-demo, any receipt verification flow
- **Reproduction steps:** `curl -sS https://www.trucore.xyz/api/receipt-signing-key`
- **Actual behavior:**
  ```json
  {"ok":true,"available":false,"public_key":null,"alg":"Ed25519","encoding":"base64"}
  ```
  All receipt signature verification panels show no public key. Users cannot cryptographically verify receipts.
- **Expected behavior:** `available: true` with a valid Ed25519 public key.
- **Console/network evidence:** The `receipt-signing-key` API returns `available: false`. Components `verify-receipt-form.tsx`, `receipt-viewer.tsx`, and `portal-verify-panel.tsx` all call this endpoint and degrade to "not available" state.
- **Likely source files:**
  - `app/api/receipt-signing-key/route.ts`
  - `lib/receipt-signature.ts`
  - `components/verify-receipt-form.tsx` (line 101)
  - `components/receipt-viewer.tsx` (line 46)
  - `components/portal-verify-panel.tsx` (line 25)
- **Root-cause hypothesis:** The Ed25519 signing keypair has not been generated or its environment variable has not been set in Vercel.
- **Recommended fix:** Generate an Ed25519 keypair, set the relevant signing key env vars in Vercel. Verify the receipt-signing-key endpoint returns `available: true`.

---

### Issue 3 - verify-demo operates in fallback mode
- **Severity:** MEDIUM (P2)
- **Route/Page:** /verify-demo
- **Reproduction steps:** `curl -sS https://www.trucore.xyz/verify-demo?format=json`
- **Actual behavior:** Returns `"mode": "fallback"` - the middleware chain catches an error from the sandbox proxy and falls back to static demo data (`FALLBACK_RESULT`).
- **Expected behavior:** `"mode": "live"` - real-time data from the ATF sandbox endpoint.
- **Console/network evidence:** The middleware at `middleware.ts` line 46-65 attempts to call `/api/sandbox/sample-intent` -> `/api/sandbox/protect`. These proxy to `api.trucore.xyz/sandbox/*`. When the upstream call fails or times out, the fallback fires.
- **Likely source files:**
  - `middleware.ts` (lines 39-73)
  - `app/api/sandbox/protect/route.ts`
  - `app/api/sandbox/sample-intent/route.ts`
  - `lib/verify-demo-data.ts`
- **Root-cause hypothesis:** The sandbox endpoints at api.trucore.xyz may have transient availability issues, or the 6 s middleware timeout is too aggressive. The sandbox/sample-intent GET works standalone (returns 200) but the full protect chain through middleware may race with the timeout.
- **Recommended fix:** Investigate the protect endpoint latency. Consider increasing `VERIFY_JSON_TIMEOUT_MS` from 6000 to 10000 ms. Verify `api.trucore.xyz/sandbox/protect` POST returns 200 consistently.

---

### Issue 4 - middleware.ts deprecated in Next.js 16
- **Severity:** MEDIUM (P2)
- **Route/Page:** All routes (middleware is global)
- **Reproduction steps:** `npm run dev` or `npm run build`
- **Actual behavior:** Warning: `The "middleware" file convention is deprecated. Please use "proxy" instead.`
- **Expected behavior:** No deprecation warning. Using the supported "proxy" convention.
- **Console/network evidence:** Next.js 16.1.6 build output shows the warning.
- **Likely source files:**
  - `middleware.ts` (entire file)
- **Root-cause hypothesis:** Next.js 16 deprecated `middleware.ts` in favor of `proxy.ts`. The current codebase still uses the legacy convention.
- **Recommended fix:** Migrate `middleware.ts` to the new `proxy.ts` convention. This is non-trivial because the middleware handles admin auth gating, verify-demo JSON, customer auth redirects, and portal session checks. Plan as a dedicated PR.

---

### Issue 5 - Status page shows stale/hardcoded system list
- **Severity:** MEDIUM (P2)
- **Route/Page:** /status
- **Reproduction steps:** Visit https://www.trucore.xyz/status
- **Actual behavior:** The "Current Status" section shows three hardcoded systems (Website, Waitlist API, Admin Tools) all as "Operational" regardless of actual state. Below that, live checks run but can show contradictory info.
- **Expected behavior:** The static list should match the live-check results, or the hardcoded list should be removed in favor of the dynamic `StatusLiveChecks` component.
- **Console/network evidence:** `app/status/page.tsx` lines 22-26 define a static `systems` array that never changes. The `StatusLiveChecks` component below does real probes.
- **Likely source files:**
  - `app/status/page.tsx` (lines 22-26)
  - `components/status-live-checks.tsx`
- **Root-cause hypothesis:** The static list was placeholder content that was never replaced after the live-check component was built.
- **Recommended fix:** Remove the hardcoded `systems` array and rely entirely on `StatusLiveChecks` for real-time status, or feed the live-check results into the "Current Status" card.

---

### Issue 6 - LiveStatusStrip on homepage shows zeros for most metrics
- **Severity:** LOW-MEDIUM (P2/P3)
- **Route/Page:** / (homepage)
- **Reproduction steps:** Visit https://www.trucore.xyz and observe the status strip
- **Actual behavior:** `protected_requests_total: 0`, `receipts_verified_total: 0`, `enforcement_events_total: 0`, `avg_request_latency_ms: 0`. Active tenants = 5, uptime = 100%.
- **Expected behavior:** Non-zero enforcement and request metrics if ATF is processing real traffic.
- **Console/network evidence:** `/api/metrics/public-summary` returns the above zeros. The data is fetched from `NEXT_PUBLIC_ATF_DASHBOARD_URL` (api.trucore.xyz) `/metrics/public-summary`.
- **Likely source files:**
  - `components/home/live-status-strip.tsx`
  - `lib/public-metrics.ts`
- **Root-cause hypothesis:** Either cumulative counters on the ATF backend reset at restart, or no real tenant traffic has flowed through the enforcement path yet. The 5 active tenants and 100% uptime suggest the backend is running but hasn't processed enforcement-path requests.
- **Recommended fix:** Verify ATF backend metric counters persist across restarts. If metrics are correct (truly zero traffic), consider showing meaningful context like "System ready, awaiting first production traffic" rather than bare zeros.

---

### Issue 7 - In-memory rate limiter resets on Vercel cold starts
- **Severity:** LOW-MEDIUM (P3)
- **Route/Page:** All API routes using `consumeRateLimit()`
- **Reproduction steps:** Wait for lambda cold start, then observe rate limit state is fresh.
- **Actual behavior:** Each Vercel isolate maintains its own `Map<string, TokenBucket>`. On cold start or new isolate, all rate limit state is lost.
- **Expected behavior:** Rate limits should survive cold starts for abuse-critical endpoints.
- **Console/network evidence:** `lib/rate-limit.ts` uses a module-level `Map`. This is documented in the code itself.
- **Likely source files:**
  - `lib/rate-limit.ts`
- **Root-cause hypothesis:** Intentional tradeoff for simplicity. Acceptable as a lightweight abuse guard but not suitable for hard security boundaries.
- **Recommended fix:** For now, document this limitation. For future hardening: migrate rate limiting to Vercel KV, Upstash Redis, or similar edge-compatible store.

---

### Issue 8 - Unused imports (eslint warnings)
- **Severity:** LOW (P4)
- **Route/Page:** /customer/receipts, /pricing
- **Reproduction steps:** `npm run lint`
- **Actual behavior:** 3 linting warnings:
  - `app/customer/receipts/page.tsx:8` - `clearAuth` defined but never used
  - `app/pricing/page.tsx:6` - `PublicFeatureEntry` defined but never used
  - `lib/admin-auth.test.ts:382` - `parts` assigned but never used
- **Expected behavior:** No warnings.
- **Console/network evidence:** `npm run lint` output.
- **Likely source files:** Listed above.
- **Root-cause hypothesis:** Leftover imports from refactoring.
- **Recommended fix:** Remove unused imports. One-line fixes per file.

---

### Issue 9 - npm audit: 13 vulnerabilities (1 critical, 5 high)
- **Severity:** LOW-MEDIUM (P3)
- **Route/Page:** Build/deploy pipeline
- **Reproduction steps:** `npm audit`
- **Actual behavior:** 13 vulnerabilities (4 low, 3 moderate, 5 high, 1 critical).
- **Expected behavior:** Zero critical/high vulnerabilities.
- **Console/network evidence:** `npm install` output.
- **Likely source files:** `package.json` / `package-lock.json`
- **Root-cause hypothesis:** Transitive dependency drift. Common with three.js and PostCSS ecosystems.
- **Recommended fix:** Run `npm audit fix` for non-breaking fixes. For breaking changes, evaluate and update in a dedicated chore PR. Prioritize the critical vulnerability.

---

### Issue 10 - Node.js engine mismatch (v23.7.0 vs required ranges)
- **Severity:** LOW (P4)
- **Route/Page:** Build pipeline
- **Reproduction steps:** `npm install` shows engine warnings; `.nvmrc` may be misaligned.
- **Actual behavior:** `whatwg-url@16.0.1` requires `^20.19.0 || ^22.12.0 || >=24.0.0`. Running v23.7.0.
- **Expected behavior:** Node version in `.nvmrc` matches a supported range.
- **Console/network evidence:** npm EBADENGINE warnings.
- **Likely source files:** `.nvmrc`, `package.json` engines field
- **Root-cause hypothesis:** v23.x is an odd-numbered (non-LTS) release not in the required range.
- **Recommended fix:** Update `.nvmrc` to `22` (current LTS) or `24` (upcoming). Align local and CI environments.

---

## Prioritized Fix Order

1. **P1 - Issue 1:** Set `FIREWALL_API_BASE_URL` + `FIREWALL_API_API_KEY` in Vercel env vars (zero code change, immediate connectivity fix)
2. **P1 - Issue 2:** Configure receipt signing key env vars in Vercel (enables receipt verification)
3. **P2 - Issue 3:** Investigate verify-demo fallback; increase timeout or fix upstream latency
4. **P2 - Issue 4:** Plan middleware.ts -> proxy.ts migration (Next.js 16 deprecation)
5. **P2 - Issue 5:** Remove hardcoded status list; use live checks only
6. **P2/P3 - Issue 6:** Address zero-metric display (add context messaging or fix ATF counters)
7. **P3 - Issue 7:** Document rate-limit cold-start limitation; plan Redis migration
8. **P4 - Issue 8:** Remove unused imports (3 one-line fixes)
9. **P3 - Issue 9:** Run `npm audit fix`; address critical vulnerability
10. **P4 - Issue 10:** Align Node.js version to LTS (22.x)

## Notes
- Keep all website fixes in TruCore-site only
- Issues 1 and 2 are Vercel config-only changes (no code, no PR needed)
- Issue 4 (middleware migration) is the largest code change and should be its own PR
- The firewall simulator has a local fallback that works well; fixing Issue 1 upgrades it to live enforcement
- All 20+ routes tested return HTTP 200 on production - no broken pages
- Auth flows (login/signup/portal) use same-origin proxy routes through /api/customer/auth/* - no CORS issues
- The /try sandbox flow works end-to-end (sample-intent -> protect -> receipt display)
