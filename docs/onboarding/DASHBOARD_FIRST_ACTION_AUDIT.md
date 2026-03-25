# Dashboard First-Action Audit

**Date:** 2026-03-25
**Scope:** First authenticated user journey from `/portal` → API key → first protected trade
**Branch:** main

---

## Current Flow

```
1. Admin issues portal token (ptl_live_*) to partner via email
2. Partner opens /portal/login → enters token → session cookie set
3. /portal renders:
   a. Header (email, project, tier info, logout)
   b. PortalCreateKeyGuide    — if no keys exist
   c. PortalActivationGuide   — state-aware (zero/early/active)
   d. PortalFirstProtectedTrade — curl example (zero/early only)
   e. API Keys table          — read-only display
   f. Usage Snapshots table   — per-key metrics
   g. Simulator examples      — allowed/denied payloads
   h. PortalVerifyPanel       — receipt hash lookup
   i. PortalPremiumSection    — gated analytics (silent)
```

API key creation is admin-only via `/api/keys/issue-for-partner` (requires `withAdminApiAuth`).
There is no self-service key creation endpoint or form for partners.

---

## Friction Points

### 1. CRITICAL — "Create API key" CTA is a dead-end

**Component:** `components/portal-create-key-guide.tsx`
**Severity:** Critical — blocks 100% of new partners without keys

The amber-bordered `PortalCreateKeyGuide` shown when `hasKeys === false` displays a
prominent "Create API key" button that anchors to `#api-keys`. But the API keys
section is a **read-only display table** with no creation form or button.

A new partner clicks "Create API key", scrolls to a table showing
"No API keys found for this partner profile", and has nowhere to go.

Key issuance is admin-only by design, but the CTA misleads the user into
thinking they can self-serve.

**Fix:** Replace the misleading "Create API key" button with honest guidance:
explain that keys are provisioned by the TruCore team, provide a contact/Discord
CTA, and optionally add a "Request API key" action.

### 2. HIGH — First Protected Trade curl is missing `x-api-key` header

**Component:** `components/portal-first-protected-trade.tsx`
**Severity:** High — copy-paste leads to immediate 401

The `CURL_SNIPPET` in `PortalFirstProtectedTrade` sends a request to
`https://api.trucore.xyz/v1/bot/protect` but does not include the
`-H "x-api-key: YOUR_API_KEY"` header. A partner who copies and runs it
gets an auth rejection on their very first attempt.

Meanwhile, the Simulator examples section lower on the page DOES include
`x-api-key: YOUR_API_KEY` for a different endpoint (`/api/simulate`),
creating two inconsistent paths.

**Fix:** Add `-H "x-api-key: YOUR_API_KEY"` to the curl snippet.

### 3. MEDIUM — Header is info-heavy with no primary action affordance

**Component:** `app/portal/page.tsx` — header section
**Severity:** Medium — slows orientation, doesn't block anything

The portal header shows 4 lines of explanatory text (tenant scoping,
API key usage instructions, tier name, rate-limit header names) but
has zero visual hierarchy toward the next action. There's no progress
indicator, no "Get Started" button, no visual CTA.

A returning partner who already knows their tier and rate-limit headers
scans the same 4 lines every visit.

**Fix (future):** Add a compact activation status badge to the header
(e.g., "0 of 3 steps complete") and move detailed info to a collapsible
or tooltip. Not implemented in this step.

---

## Auth-Gated Direct API Calls

No browser-direct calls to `api.trucore.xyz` were found. All external
API communication routes through Next.js `/api/*` proxy routes with
server-side fetch, 8-second timeouts, and error handling.

Customer auth routes (`/api/customer/auth/signup`, `/api/customer/auth/login`)
proxy upstream but are resilient (502 fallback on upstream failure).

No auth-gated fragile browser-direct calls need remediation at this time.

---

## Implementation: This Step

**Fix applied:** Rewrite `PortalCreateKeyGuide` to remove the dead-end
"Create API key" CTA and replace it with actionable guidance:
- Clear message that API keys are provisioned by the TruCore team
- Primary CTA: Discord link for requesting key provisioning
- Secondary: email link as fallback contact method
- Keep doc links (Quickstart guide, Builder docs)

**Why this fix:** It's the #1 activation blocker, affects 100% of new
keyless partners, requires no backend changes, no new dependencies,
and is fully reversible.

---

## Recommended Next Steps

1. **Add `x-api-key` header to first-protected-trade curl snippet** — high confidence, small diff
2. **Add activation progress badge to portal header** — medium effort
3. **Add self-service key creation endpoint** — larger scope, needs product decision
4. **Add "Request API key" server action** that emails admin — medium effort, removes Discord dependency

---

## Risks / Follow-ups

- Discord link uses fallback `https://discord.gg/hZWTn6Vr` if env var is unset — verify this is still valid
- If product later adds self-service key creation, the empty-state messaging needs to revert to a creation form
- Premium analytics section silently hides for non-preview tenants with no upgrade path shown
- Portal session is 8 hours — may be short for partners doing multi-day integrations
- In-memory rate limiting resets on deploy — consider persistent store if abuse is observed
