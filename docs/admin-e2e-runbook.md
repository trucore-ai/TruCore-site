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
