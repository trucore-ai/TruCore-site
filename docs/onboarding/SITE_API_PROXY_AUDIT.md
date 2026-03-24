# Site API Proxy Audit

**Date:** 2026-03-24
**Branch:** `feat/pricing-and-usage-ui`
**Scope:** All direct browser-to-api.trucore.xyz call sites across auth, customer, and onboarding flows.
**Trigger:** PROMPT 157 — audit(site-auth): remove remaining browser-to-api.trucore.xyz onboarding calls

---

## 1. Architecture Context

TruCore-site is a Next.js app deployed on Vercel. The ATF backend lives at `https://api.trucore.xyz`.

**Auth model (as verified in `lib/customer-auth.ts`):**
- JWT stored in `localStorage` (not cookies or server sessions)
- Auth calls (`signup`, `login`) carry no auth header, just email/password
- All post-auth calls carry `Authorization: Bearer {jwt}` from localStorage
- `NEXT_PUBLIC_ATF_API_URL` env var controls the base URL (defaults to `https://api.trucore.xyz`)
- A server-only `ATF_API_KEY` exists in `.env.vercel` for admin/server-side use only

**Proxy precedent (from /try fix):**
- `app/api/sandbox/sample-intent/route.ts` — GET proxy, no auth, upstream forward
- `app/api/sandbox/protect/route.ts` — POST proxy, no auth, body validated + forwarded

---

## 2. All Direct api.trucore.xyz Call Sites

### A. Source code (runtime calls — the real threat surface)

| File | Function | HTTP Method | Endpoint | Execution Context | Risk |
|---|---|---|---|---|---|
| `lib/customer-auth.ts` | `signup()` | POST | `/auth/signup` | Browser (`"use client"`) | **HIGH** |
| `lib/customer-auth.ts` | `login()` | POST | `/auth/login` | Browser (`"use client"`) | **HIGH** |
| `lib/customer-auth.ts` | `requestVerificationEmail()` | POST | `/auth/verify-email/request` | Browser (`"use client"`) | **HIGH** |
| `lib/customer-auth.ts` | `confirmVerificationEmail()` | POST | `/auth/verify-email/confirm` | Browser (`"use client"`) | **HIGH** |
| `lib/customer-auth.ts` | `fetchDashboard()` | GET | `/dashboard/me` | Browser, auth-gated | MEDIUM |
| `lib/customer-auth.ts` | `fetchActivation()` | GET | `/dashboard/activation` | Browser, auth-gated | MEDIUM |
| `lib/customer-auth.ts` | `markActivationStep()` | POST | `/dashboard/activation` | Browser, auth-gated | MEDIUM |
| `lib/customer-auth.ts` | `fetchCustomerKeys()` | GET | `/customer/keys` | Browser, auth-gated | MEDIUM |
| `lib/customer-auth.ts` | `createCustomerKey()` | POST | `/customer/keys` | Browser, auth-gated | MEDIUM |
| `lib/customer-auth.ts` | `revokeCustomerKey()` | POST | `/customer/keys/{id}/revoke` | Browser, auth-gated | MEDIUM |
| `lib/customer-auth.ts` | `rotateCustomerKey()` | POST | `/customer/keys/{id}/rotate` | Browser, auth-gated | MEDIUM |
| `lib/customer-auth.ts` | `fetchReceipts()` | GET | `/customer/receipts` | Browser, auth-gated | LOW |
| `lib/customer-auth.ts` | `fetchReceiptDetail()` | GET | `/customer/receipts/{id}` | Browser, auth-gated | LOW |
| `lib/customer-auth.ts` | `verifyReceipt()` | POST | `/customer/receipts/verify` | Browser, auth-gated | LOW |
| `lib/customer-auth.ts` | `fetchSampleIntent()` | GET | `/onboarding/sample-intent` | Browser, auth-gated | LOW |
| `lib/customer-auth.ts` | `simulateProtection()` | POST | `/onboarding/protect-dry-run` | Browser, auth-gated | LOW |
| `lib/customer-auth.ts` | `executeSample()` | POST | `/onboarding/execute-sample` | Browser, auth-gated | LOW |
| `app/api/internal/health-monitor/route.ts` | health check | GET | `/health` | Server-side only | SAFE |
| `app/api/sandbox/protect/route.ts` | proxy | POST | `/sandbox/protect` | Server-side proxy | SAFE (already fixed) |
| `app/api/sandbox/sample-intent/route.ts` | proxy | GET | `/sandbox/sample-intent` | Server-side proxy | SAFE (already fixed) |

### B. Documentation / static content (not runtime calls)

These are curl examples in doc pages. They are safe because they are string literals displayed to users, not executed by the browser against the API.

- `app/docs/auth/page.tsx` — curl snippets for docs
- `app/docs/getting-started/page.tsx` — curl snippets
- `app/docs/first-protected-trade/page.tsx` — curl/Python/TypeScript examples (static examples for devs)
- `app/docs/receipts-and-trust/page.tsx` — curl snippet
- `app/docs/upgrade/page.tsx` — curl snippet
- `app/docs/plans/page.tsx` — base URL reference in text
- `app/docs/surfaces/page.tsx` — base URL reference in text
- `app/docs/api/page.tsx` — base URL display
- `app/examples/protected-swap/page.tsx` — curl snippet
- `app/integrations/bot/page.tsx` — curl snippet
- `components/portal-first-protected-trade.tsx` — curl snippet

**These do NOT need to be changed.** They are documentation showing the real API URL, which is correct and expected.

---

## 3. Risk Classification

### HIGH — onboarding-critical, browser-direct, no prior auth

These 4 functions execute cross-origin from the browser with no Authorization header. A CORS failure on `api.trucore.xyz` breaks the entire onboarding funnel.

1. `signup()` — user cannot register
2. `login()` — returning user is locked out
3. `requestVerificationEmail()` — user cannot get a verification resend
4. `confirmVerificationEmail()` — user cannot activate their account from the email link

**Fix: proxy through Next.js API routes.** Pattern matches existing `/api/sandbox/protect` route.

### MEDIUM — authenticated calls, token forwarded from browser

These calls include `Authorization: Bearer {jwt}` from localStorage. The JWT is customer-specific, not a shared secret. Proxying these adds defense-in-depth by hiding the API URL, but is lower priority because:
- The CORS relationship to `api.trucore.xyz` has already been established at login
- The bearer token is scoped per-customer, not a site-wide secret
- ATF backend already validates these tokens; a proxy would just relay them

**Fix: defer. Document for next phase.**

### LOW — post-activation flows (receipts, onboarding simulation)

Same reasoning as MEDIUM, but these are only reached after a user has successfully logged in and started using the product. Failures here are recoverable via UI retries.

**Fix: defer.**

### SAFE — server-side only

- `health-monitor/route.ts` — runs on the server, result is not user-facing
- `sandbox/protect` and `sandbox/sample-intent` — already proxied

---

## 4. "Fix Now" vs "Defer" Summary

| Call group | Action | Priority |
|---|---|---|
| `signup`, `login` | **Fix now** — proxy via `/api/customer/auth/login` and `/api/customer/auth/signup` | P0 (Prompt 157) |
| `requestVerificationEmail`, `confirmVerificationEmail` | **Fix now** — proxy via `/api/customer/auth/verify-email/*` | P0 (Prompt 157) |
| `fetchDashboard`, `fetchActivation`, `markActivationStep` | Defer | P1 |
| `fetchCustomerKeys`, `createCustomerKey`, `revokeCustomerKey`, `rotateCustomerKey` | Defer | P1 |
| `fetchReceipts`, `fetchReceiptDetail`, `verifyReceipt` | Defer | P2 |
| `fetchSampleIntent`, `simulateProtection`, `executeSample` | Defer | P2 |

---

## 5. Fix Applied (Prompt 157)

**Files created:**
- `app/api/customer/auth/login/route.ts` — server-side proxy for POST /auth/login
- `app/api/customer/auth/signup/route.ts` — server-side proxy for POST /auth/signup
- `app/api/customer/auth/verify-email/request/route.ts` — proxy for POST /auth/verify-email/request
- `app/api/customer/auth/verify-email/confirm/route.ts` — proxy for POST /auth/verify-email/confirm

**Files modified:**
- `lib/customer-auth.ts` — updated `login()`, `signup()`, `requestVerificationEmail()`, `confirmVerificationEmail()` to call same-origin proxy routes

**Pattern used:**
- Same as `app/api/sandbox/protect/route.ts`
- Body validated (JSON only, size-limited)
- IP-based rate limiting via `lib/rate-limit.ts`
- Timeout set to 8s
- Upstream error mapped to `{ error, message }` — no stack traces or internal URLs exposed
- `no-store` cache headers on all responses

**Auth note:** Proxy routes for login/signup do NOT add any server-side auth headers (no `ATF_API_KEY`). The ATF backend validates email+password directly. The proxy routes are pass-through.

---

## 6. Remaining Deferred Calls

The following calls still go directly from the browser to `api.trucore.xyz`:

| Function | Endpoint | Why deferred |
|---|---|---|
| `fetchDashboard()` | `GET /dashboard/me` | Auth-gated, bearer token forwarded, low CORS risk once logged in |
| `fetchActivation()` | `GET /dashboard/activation` | Same as above |
| `markActivationStep()` | `POST /dashboard/activation` | Same as above |
| `fetchCustomerKeys()` | `GET /customer/keys` | Auth-gated; proxying requires bearer forwarding pattern |
| `createCustomerKey()` | `POST /customer/keys` | Same |
| `revokeCustomerKey()` | `POST /customer/keys/{id}/revoke` | Same |
| `rotateCustomerKey()` | `POST /customer/keys/{id}/rotate` | Same |
| `fetchReceipts()` | `GET /customer/receipts` | Post-activation, low funnel risk |
| `fetchReceiptDetail()` | `GET /customer/receipts/{id}` | Post-activation |
| `verifyReceipt()` | `POST /customer/receipts/verify` | Post-activation |
| `fetchSampleIntent()` | `GET /onboarding/sample-intent` | Post-auth onboarding, lower CORS risk |
| `simulateProtection()` | `POST /onboarding/protect-dry-run` | Same |
| `executeSample()` | `POST /onboarding/execute-sample` | Same |

To proxy the deferred authenticated calls, the Next.js API routes must forward the incoming `Authorization` header to the upstream. The pattern is: read `Authorization` from request headers, validate it is a Bearer token format, then forward to ATF. No server secret is needed on those routes.

---

## 7. Decision Record: Why JWT Stays in localStorage

The current auth model uses `localStorage` for JWT storage (not HttpOnly cookies). This was a deliberate design choice documented in `lib/customer-auth.ts`. Changing the session transport is out of scope for this prompt. This audit only proxies the calls, not the token model.

If a future prompt proposes switching to cookie-based sessions, read `lib/customer-auth.ts` and the dashboard bootstrap flow carefully before accepting the direction.
