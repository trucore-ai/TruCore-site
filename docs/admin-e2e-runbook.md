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
