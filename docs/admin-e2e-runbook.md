# Admin Security E2E — Local Testing Runbook

## Running the admin E2E suite

```bash
cd /home/kontractkoder/repo/TruCore-site

# Option A — let Playwright start its own server (recommended, deterministic)
ADMIN_DASHBOARD_KEY=e2e-admin-key \
RECEIPT_SIGNING_KEY=MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY= \
ATF_E2E_TEST_SECRET=e2e-test-secret \
npx playwright test tests/e2e/admin-auth-flow.spec.ts

# Option B — run the full E2E suite (all specs)
ADMIN_DASHBOARD_KEY=e2e-admin-key \
RECEIPT_SIGNING_KEY=MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY= \
ATF_E2E_TEST_SECRET=e2e-test-secret \
npm run test:e2e
```

To reuse an already-running local server (skips build + start):

```bash
PW_REUSE_SERVER=1 \
ADMIN_DASHBOARD_KEY=e2e-admin-key \
RECEIPT_SIGNING_KEY=MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY= \
ATF_E2E_TEST_SECRET=e2e-test-secret \
npx playwright test tests/e2e/admin-auth-flow.spec.ts
```

> **Note:** When reusing an existing server, ensure it was started with the
> same env vars listed above, otherwise test-only routes will 404 and
> throttle tests will fail.

## Required environment variables

| Variable | Purpose | Required in prod? |
|---|---|---|
| `ADMIN_DASHBOARD_KEY` | Admin login credential (set to any value for E2E) | Yes (real secret) |
| `RECEIPT_SIGNING_KEY` | Receipt HMAC signing key | Yes |
| `ATF_E2E_TEST_SECRET` | Gates test-only API routes (reset/advance throttle) | **No — never set in production** |

## Why `ATF_E2E_TEST_SECRET` exists

The login throttle lifecycle tests need to:

1. **Reset** the in-memory throttle store between test runs.
2. **Advance** the internal clock to simulate cooldown expiry.

These controls live behind `/api/test/login-throttle/{reset,advance}` routes
that are gated by `lib/test-gate.ts`. The gate is **fail-closed**:

- If `ATF_E2E_TEST_SECRET` is unset or empty → routes return **404**.
- If the request header `x-test-secret` is missing or wrong → routes return **404**.
- Only `POST` is accepted; `GET` always returns **404**.

Production deployments never set `ATF_E2E_TEST_SECRET`, so the routes are
unreachable even though the code is present in the bundle.

## Fail-closed verification

You can confirm the test routes are inaccessible without the correct secret:

```bash
# Should return 404
curl -s -o /dev/null -w '%{http_code}' -X POST http://localhost:3000/api/test/login-throttle/reset
# 404

# Should also return 404 with wrong secret
curl -s -o /dev/null -w '%{http_code}' -X POST \
  -H 'x-test-secret: wrong' \
  http://localhost:3000/api/test/login-throttle/reset
# 404
```

## What the admin auth E2E covers

| Test | What it verifies |
|---|---|
| Logged-out redirect | Unauthenticated → middleware redirects to `/admin/login` |
| Login page accessible | `/admin/login` serves the form |
| Invalid credentials denied | Wrong key → no cookie, stays on login |
| Authenticated lifecycle | Login → cookie set (HttpOnly, Strict, /admin) → API access → logout → session revoked |
| API denial without session | `/api/admin/security` returns generic 404 |
| CSRF origin rejection | POST without valid Origin → denied |
| Test-route gating (×4) | Reset/advance routes 404 without correct header |
| Throttle: lockout | 5 failures → next attempt denied |
| Throttle: cooldown denial | Valid key during cooldown → still denied |
| Throttle: time advance | Advance clock past cooldown → login succeeds |
| Throttle: reset | Reset throttle → login succeeds |

## CI integration

The GitHub Actions workflow (`.github/workflows/test.yml`) runs the E2E suite
automatically on push and pull request. It injects `ATF_E2E_TEST_SECRET`
from a GitHub Actions secret, scoped only to the `e2e` job.

Secrets required in GitHub repo settings:
- `ADMIN_DASHBOARD_KEY` — used by the e2e job
- `ATF_E2E_TEST_SECRET` — used by the e2e job only

---

## Prometheus security metrics

### Endpoint

`GET /api/metrics/security` — **public**, no authentication required.

Returns aggregate admin/security counters and gauges in Prometheus text
exposition format (`text/plain; version=0.0.4`). Designed for scraping by
Prometheus, Grafana Agent, or any compatible collector.

### Why public exposure is safe

The endpoint exposes only aggregate numeric counters and gauges. It never
returns secrets, tokens, cookies, IP addresses, per-user dimensions, or
any identifying information. The data is equivalent to what an application
error-rate dashboard would show.

### Abuse protection (rate limiting)

The route includes a lightweight in-memory rate limiter to damp obvious
probe spam without interfering with normal Prometheus scraping.

| Parameter | Value |
|---|---|
| **Limit** | 60 requests per 60-second window |
| **Key** | Truncated SHA-256 hash of client IP (never raw IP) |
| **Scope** | Process-local; resets on cold start |
| **429 behavior** | Empty body, `Retry-After` header, no internal details |

This is intended as a lightweight abuse guard, not a hard security boundary.
Normal Prometheus scrape intervals (15–30 s) are well within the limit.

When the limiter triggers, a `metrics_route_rate_limited` event is logged
(without raw IP) for operational visibility.

### Response caching

The serialized Prometheus output is cached in-memory for **10 seconds**
to reduce repeated serialization under burst traffic. Metrics are
approximate within the TTL window — counter and gauge values may lag
by up to 10 s after an event occurs.

The cache is process-local and resets on cold start. Downstream
`Cache-Control: no-store` headers remain unchanged — the caching is
internal only and does not affect Prometheus staleness detection.

### Metrics exposed

**Counters**

| Metric | Description |
|---|---|
| `trucore_admin_login_success_total` | Successful admin logins |
| `trucore_admin_login_failure_total` | Failed admin login attempts |
| `trucore_admin_login_rate_limited_total` | Logins rejected by rate limiter |
| `trucore_admin_csrf_origin_rejected_total` | CSRF origin mismatches |
| `trucore_admin_route_denied_total` | Admin route access denials |
| `trucore_admin_api_denied_total` | Admin API access denials |
| `trucore_admin_action_denied_total` | Admin action denials |
| `trucore_admin_session_expired_total` | Sessions expired (absolute lifetime) |
| `trucore_admin_session_idle_timeout_total` | Sessions expired (idle timeout) |
| `trucore_admin_revoked_session_rejected_total` | Revoked session reuse attempts |

**Gauges**

| Metric | Description |
|---|---|
| `trucore_admin_session_store_size` | Current in-memory session count |
| `trucore_admin_revoked_session_count` | Revoked sessions retained for detection |
| `trucore_security_uptime_seconds` | Seconds since module startup |

### Scraping

```yaml
# prometheus.yml
scrape_configs:
  - job_name: "trucore-security"
    scrape_interval: 30s
    metrics_path: /api/metrics/security
    static_configs:
      - targets: ["your-trucore-host:3000"]
```

A `scrape_interval` of 15 s or longer is recommended. The 10 s internal
cache TTL means scrapes faster than 10 s will receive the same snapshot,
which is harmless but provides no additional resolution.

### Important notes

- Metrics are **in-memory and process-local**. They reset on cold start.
- Rate-limit buckets and the metrics cache are also process-local and
  reset on cold start or new serverless isolate.
- The existing admin-only JSON telemetry at `/api/admin/security` is
  unchanged and still requires an authenticated admin session.
- Response headers include `Cache-Control: no-store` and
  `X-Content-Type-Options: nosniff`.

---

## Public agent route abuse controls

### Routes covered

| Route | Purpose | Rate limit |
|---|---|---|
| `GET /api/agent/dashboard` | Full dashboard snapshot for bots (OpenClaw, etc.) | 60 req / 60 s per IP |
| `GET /api/agent/tenant?id=<id>` | Single tenant detail for bots | 60 req / 60 s per IP |
| `GET /api/agent/stream` | SSE real-time dashboard stream | 10 connections / 60 s per IP |

### Why these are public

These endpoints serve machine-readable JSON for OpenClaw and other AI
agents. They expose the same data as the human dashboard — no admin
mutations, no secrets, no PII. They remain publicly accessible without
authentication.

### Abuse protection

Each route includes an IP-based in-memory rate limiter using truncated
SHA-256 hashed IP (first 12 hex chars). Raw IPs are never stored or
logged.

| Parameter | dashboard / tenant | stream |
|---|---|---|
| **Limit** | 60 requests per 60 s | 10 connections per 60 s |
| **Key** | `agent_dashboard:<hash>` or `agent_tenant:<hash>` | `agent_stream:<hash>` |
| **Scope** | Process-local; resets on cold start | Process-local |
| **429 behavior** | Empty body, `Retry-After` header | Empty body, `Retry-After` header |

The dashboard and tenant limits (60/min) comfortably accommodate the 5 s
polling contract (12 req/min for one agent) while damping trivial abuse.
The stream limit (10/min) is intentionally lower since connections are
long-lived.

When the limiter triggers, an `agent_route_rate_limited` security event
is logged (without raw IP) for operational visibility.

### Failure response safety

All three routes catch backend/upstream exceptions and return safe
structured responses:

- **Dashboard**: `{ available: false, reason: "temporarily_unavailable" }` (502)
- **Tenant**: `{ available: false, reason: "temporarily_unavailable" }` (502)
- **Stream**: SSE comment keep-alive on transient errors

Error responses never include raw exception text, stack traces, SQL,
DSNs, connection strings, or internal identifiers.

The tenant route uses static reason codes (`missing_required_parameter`,
`tenant_not_found`, `upstream_unavailable`) and never reflects
user-supplied input back in the response body.

### Process-local limitations

- Rate-limit buckets are in-memory and process-local. They reset on
  deploy, restart, or new serverless isolate.
- In multi-instance deployments, each instance tracks its own buckets.
  This is acceptable for a lightweight abuse guard.
- For persistent rate limiting, add an upstream reverse-proxy limiter
  (nginx, Cloudflare, etc.).

---

## Degraded admin-page telemetry

### What it shows

When a DB-dependent admin page (waitlist, metrics, audit, CSP, usage,
acquisition, keys) fails to load its data, the page renders a safe
fallback panel and logs an `admin_page_degraded` security event.

Operators can now see these events through the authenticated admin UI:

- **Admin Metrics page** (`/admin/metrics`) — an "Admin Page Stability"
  panel shows the aggregate degraded render count and a per-page breakdown.
- **Admin security API** (`/api/admin/security`) — the JSON payload
  includes `admin_page_degraded_total` and `admin_page_degraded_by_page`.

### What is exposed

| Field | Description |
|---|---|
| `admin_page_degraded_total` | Total degraded renders across all admin pages (process lifetime) |
| `admin_page_degraded_by_page` | Object mapping safe page name → count (e.g. `{ "waitlist": 3, "csp": 1 }`) |

### Safety guarantees

- Only aggregate numeric counts are shown — no raw errors, stack traces,
  IPs, SQL, DSNs, cookies, or tokens.
- Page names are restricted to a static allowlist of known admin route
  names. Unknown page values are silently ignored.
- The telemetry API remains gated by `withAdminApiAuth` — unauthenticated
  requests receive a generic 404.
- The UI panel is a client component that fetches from the authenticated
  API — it inherits the same session protection.

### Process-local limitations

- Counters are in-memory and process-local. They reset on deploy,
  restart, or new serverless isolate.
- In multi-instance deployments, each instance tracks its own counters.
  For cross-instance visibility, use the Prometheus `/api/metrics/security`
  endpoint with an aggregating dashboard.
- This is an aggregate signal, not a full event log. For detailed
  investigation, use structured log aggregation (e.g. Datadog, CloudWatch).

---

## Degraded admin-mutation telemetry

### What it shows

When an admin server action (status change, notes update, CSV export)
fails due to a backend error, `withAdminAction` catches the exception,
returns a safe generic error, and logs an `admin_action_degraded`
security event with a safe action label.

Operators can see these events through the authenticated admin UI:

- **Admin Metrics page** (`/admin/metrics`) — an "Admin Mutation
  Stability" section shows the aggregate degraded mutation count and an
  optional per-action breakdown.
- **Admin security API** (`/api/admin/security`) — the JSON payload
  includes `admin_action_degraded_total` and
  `admin_action_degraded_by_action`.

### What is exposed

| Field | Description |
|---|---|
| `admin_action_degraded_total` | Total degraded admin mutations across all actions (process lifetime) |
| `admin_action_degraded_by_action` | Object mapping safe action label → count (e.g. `{ "set_signup_status": 2 }`) |

### Allowed action labels

Only the following static labels are tracked in the per-action breakdown.
Unknown action names are silently ignored.

- `set_signup_status`
- `update_admin_notes`
- `export_design_partners_csv`

### Safety guarantees

- Only aggregate numeric counts — no raw errors, stack traces, IPs, SQL,
  DSNs, cookies, or tokens.
- Action labels are restricted to a static allowlist. Unknown values are
  silently dropped.
- The telemetry API remains gated by `withAdminApiAuth` —
  unauthenticated requests receive a generic 404.
- The UI panel is a client component that fetches from the authenticated
  API — it inherits the same session protection.

### Process-local limitations

- Same as page-render telemetry: in-memory, process-local, resets on
  deploy/restart. Use Prometheus + aggregation for cross-instance views.

---

## Degraded admin API telemetry

### What it shows

When an authenticated admin API route (key management, portal tokens,
dashboard refresh, agent routes) experiences a backend failure, the
control path logs an `admin_api_degraded` security event with a safe
route label.

Operators can see these events through the authenticated admin UI:

- **Admin Metrics page** (`/admin/metrics`) — an "Admin API Stability"
  section shows the aggregate degraded API call count and an optional
  per-route breakdown.
- **Admin security API** (`/api/admin/security`) — the JSON payload
  includes `admin_api_degraded_total` and
  `admin_api_degraded_by_route`.

### What is exposed

| Field | Description |
|---|---|
| `admin_api_degraded_total` | Total degraded admin API calls across all routes (process lifetime) |
| `admin_api_degraded_by_route` | Object mapping safe route label → count (e.g. `{ "keys/create": 2, "agent/dashboard": 1 }`) |

### Allowed route labels

Only the following static labels are tracked in the per-route breakdown.
Unknown route names are silently ignored.

- `keys/create`
- `keys/revoke`
- `keys/issue-for-partner`
- `portal/token/create`
- `portal/token/revoke`
- `dashboard/refresh`
- `dashboard/tenant`
- `admin/security`
- `agent/dashboard`
- `agent/tenant`

### UI behavior

- **Green** (zero failures): "No degraded admin API calls detected."
- **Amber** (non-zero): "Temporary control-plane API instability
  detected — backend API failures handled safely." with per-route
  breakdown grid.

### Safety guarantees

- Only aggregate numeric counts — no raw errors, stack traces, IPs, SQL,
  DSNs, cookies, or tokens.
- Route labels are restricted to a static allowlist. Unknown values are
  silently dropped.
- The telemetry API remains gated by `withAdminApiAuth` —
  unauthenticated requests receive a generic 404.
- The UI panel is a client component that fetches from the authenticated
  API — it inherits the same session protection.

### Process-local limitations

- Same as page-render telemetry: in-memory, process-local, resets on
  deploy/restart. Use Prometheus + aggregation for cross-instance views.

---

## Waitlist fallback storage (CI / local dev)

### Problem

The waitlist submission path requires Postgres for persistence. In CI and
local development, Postgres is typically unavailable, which made the E2E
waitlist test non-deterministic (accepted either success **or** graceful error).

### Solution: `WAITLIST_FALLBACK_MODE=memory`

A tiny persistence abstraction (`lib/waitlist-store.ts`) routes submissions to
one of two backends:

| Backend | When used |
|---|---|
| **Postgres** (production) | `POSTGRES_URL` or `DATABASE_URL` is configured |
| **In-memory** (test/dev) | No DB configured **and** `WAITLIST_FALLBACK_MODE=memory` **and** `NODE_ENV !== "production"` |

### Fail-closed rules

- If a DB connection string exists, **DB is always used** — even if the
  fallback flag is set. This prevents accidental memory-mode in staging
  that has a DB.
- `NODE_ENV=production` **never** uses the memory backend, regardless of flags.
- If no DB exists **and** fallback is not allowed, the submission fails
  gracefully with a generic user-safe error (existing behavior).

### How Playwright uses it

`playwright.config.ts` injects `WAITLIST_FALLBACK_MODE=memory` into the
`webServer` build and start commands. This means:

- The E2E waitlist spec asserts **deterministic success** through the real
  form, real server action, and in-memory store.
- No Postgres required for local or CI E2E runs.

To run waitlist E2E manually:

```bash
WAITLIST_FALLBACK_MODE=memory \
ADMIN_DASHBOARD_KEY=e2e-admin-key \
RECEIPT_SIGNING_KEY=MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY= \
ATF_E2E_TEST_SECRET=e2e-test-secret \
npx playwright test tests/e2e/waitlist.spec.ts
```

### Production

Production uses the DB-backed path as before. `WAITLIST_FALLBACK_MODE` should
**not** be set in production environment variables. If it is accidentally set,
the `NODE_ENV=production` guard prevents the memory backend from activating.

---

## Agent route abuse telemetry

### What is shown

The authenticated admin metrics page (`/admin/metrics`) includes an
**Agent Route Abuse Controls** section in the degraded-telemetry panel.
This surfaces aggregate counts of public bot-facing route throttles
triggered by the per-IP rate limiters on the agent endpoints.

### Where operators can see it

- **UI**: `/admin/metrics` → "Agent Route Abuse Controls" panel
- **API**: `GET /api/admin/security` → `agent_route_rate_limited_total`
  and `agent_route_rate_limited_by_route` fields (authenticated only)

### Telemetry fields

| Field | Description |
|---|---|
| `agent_route_rate_limited_total` | Aggregate count of all agent-route rate-limit rejections |
| `agent_route_rate_limited_by_route` | Per-route breakdown (allowlisted labels only) |

### Safe route labels

Only the following static labels appear in the per-route breakdown:

- `agent/dashboard`
- `agent/tenant`
- `agent/stream`

Any rate-limited event with an unknown route label is counted in the
aggregate total but silently excluded from the per-route breakdown.

### Design notes

- **Aggregate-only**: No IPs, tokens, cookies, stack traces, SQL,
  DSNs, or raw backend error messages are exposed.
- **Process-local**: Counters are in-memory and reset on deploy or
  cold start. They are not persisted.
- **Fail-closed**: The `/api/admin/security` endpoint requires a valid
  admin session. Unauthenticated requests receive a generic 404.
- **UI behavior**: The panel shows green when zero throttles are
  detected and amber when non-zero, consistent with other stability
  sections.

---

## Public route abuse telemetry

### What is shown

The authenticated admin metrics page (`/admin/metrics`) includes a
**Public Route Abuse Controls** section in the degraded-telemetry panel.
This surfaces aggregate counts of public endpoint throttles triggered by
per-IP rate limiters on the public demo, verify, status, and metrics
routes.

### Where operators can see it

- **UI**: `/admin/metrics` → "Public Route Abuse Controls" panel
- **API**: `GET /api/admin/security` → `public_route_rate_limited_total`
  and `public_route_rate_limited_by_route` fields (authenticated only)

### Telemetry fields

| Field | Description |
|---|---|
| `public_route_rate_limited_total` | Aggregate count of all public-route rate-limit rejections |
| `public_route_rate_limited_by_route` | Per-route breakdown (allowlisted labels only) |

### Safe route labels

Only the following static labels appear in the per-route breakdown:

- `verify-receipt`
- `verify-receipt-signature`
- `public-metrics`
- `public-receipts`
- `demo-policy`
- `metrics/public-summary`
- `receipt-signing-key`
- `status`

Any rate-limited event with an unknown route label is counted in the
aggregate total but silently excluded from the per-route breakdown.

### Design notes

- **Aggregate-only**: No IPs, tokens, cookies, stack traces, SQL,
  DSNs, or raw backend error messages are exposed.
- **Process-local**: Counters are in-memory and reset on deploy or
  cold start. They are not persisted.
- **Fail-closed**: The `/api/admin/security` endpoint requires a valid
  admin session. Unauthenticated requests receive a generic 404.
- **UI behavior**: The panel shows green when zero throttles are
  detected and amber when non-zero, consistent with other stability
  sections.

---

## Public demo/verify route hardening

### Audited routes

The following public routes were audited and hardened (Prompt 57):

| Route | Method | Rate limit | Cache policy | Notes |
| --- | --- | --- | --- | --- |
| `/api/verify-receipt` | POST | 30/min per IP | `no-store` | Hash computation per request; rate limited to prevent spam |
| `/api/verify-receipt-signature` | POST | 30/min per IP | `no-store` | Crypto verification per request; rate limited |
| `/api/public-metrics` | GET | 30/min per IP | `no-store` (+ 60s in-memory cache) | Hits DB; in-memory cache prevents redundant queries |
| `/api/metrics/public-summary` | GET | 30/min per IP | `s-maxage=60, stale-while-revalidate=120` | Upstream fetch; edge cache + rate limit |
| `/api/demo-policy` | GET | 60/min per IP | `public, max-age=60` | Static constant data; generous limit |
| `/api/public-receipts` | GET | 60/min per IP | `public, max-age=60` | Static demo data; generous limit |
| `/api/receipt-signing-key` | GET | 30/min per IP | `no-store` | Key availability may change at runtime |
| `/api/status` | GET | 60/min per IP (existing) | `no-store` | Removed `base_url` leak; replaced with `configured` boolean |

### Already-hardened routes (unchanged)

| Route | Method | Rate limit | Notes |
| --- | --- | --- | --- |
| `/api/demo-live` | GET | 60/min per IP | Already had full rate limiting |
| `/api/simulate` | POST | Per-IP + per-key | Already had full hardening |
| `/api/health` | GET | 60/min per IP | Already hardened |
| `/api/receipt-signature` | POST | 30/min per IP | Already hardened |
| `/api/bot-feedback` | POST | 10/5min per IP | Already hardened |
| `/api/csp-report` | POST | 30/min per IP | Already hardened |

### Protections added

- **IP-based rate limiting**: All previously-unprotected public routes
  now have per-IP rate limits using hashed IPs (SHA-256, first 12 hex
  chars). Rate limits use `consumeRateLimit` from `lib/rate-limit.ts`.
- **In-memory response cache**: `/api/public-metrics` adds a 60-second
  process-local cache to avoid hitting the database on every request.
- **Cache policy upgrades**: Static/constant routes (`demo-policy`,
  `public-receipts`) upgraded from `no-store` to `public, max-age=60`.
- **Info leak fix**: `/api/status` no longer exposes `firewall_api.base_url`
  in public responses. Replaced with a `configured` boolean.
- **Telemetry**: New `public_route_rate_limited` security event with
  per-route breakdown tracking via allowlisted static labels.

### Telemetry

Rate-limit events are logged as `public_route_rate_limited` in the
security event log. Per-route breakdowns are available via
`getPublicRouteRateLimitedCounts()` using allowlisted labels only:

- `verify-receipt`
- `verify-receipt-signature`
- `public-metrics`
- `public-receipts`
- `demo-policy`
- `metrics/public-summary`
- `receipt-signing-key`

### Public route hardening design notes

- **Process-local**: All rate limits and caches are in-memory and reset
  on deploy or cold start. Acceptable for abuse damping.
- **Aggregate-only**: No IPs, tokens, cookies, or backend details are
  exposed in rate-limit responses or telemetry.
- **Fail-safe**: Rate-limited responses return `{ ok: false, error: "rate_limited" }`
  with `429` status, `Retry-After` header, and `Cache-Control: no-store`.
- **Non-breaking**: All existing response contracts preserved for
  non-throttled requests.
