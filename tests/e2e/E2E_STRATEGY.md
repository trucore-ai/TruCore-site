# E2E Smoke Test Strategy

## Overview

The E2E smoke suite validates core ATF product flows from the browser perspective.
It uses **Playwright** with **route interception** to mock ATF backend API responses,
so tests run deterministically without a live backend.

## Architecture

```
tests/e2e/
├── helpers/
│   └── smoke-fixtures.ts    # Shared mocks, auth injection, test data
├── try.spec.ts               # Public sandbox flow (no auth)
├── auth.spec.ts              # Signup → verify → login → reset lifecycle
├── onboarding.spec.ts        # Dashboard + onboarding wizard
├── receipts.spec.ts          # Receipt list, detail, verification
├── keys.spec.ts              # API key CRUD (create, revoke, rotate)
└── admin-users.spec.ts       # Admin user ops (login → users → search)
```

## Test Environment Variables

| Variable                 | Default                     | Purpose                                 |
|--------------------------|-----------------------------|-----------------------------------------|
| `ADMIN_DASHBOARD_KEY`    | `e2e-admin-key`             | Admin login credential for E2E          |
| `RECEIPT_SIGNING_KEY`    | (base64 mock key)           | Receipt signature verification          |
| `ATF_E2E_TEST_SECRET`   | `e2e-test-secret`           | Gating for test-only API routes         |
| `WAITLIST_FALLBACK_MODE` | `memory`                    | In-memory store (no Postgres needed)    |
| `ATF_E2E_API_BASE`      | `https://api.trucore.xyz`   | Base URL for route interception mocks   |
| `PW_REUSE_SERVER`        | `1` (local) / unset (CI)    | Reuse existing dev server locally       |
| `CI`                     | unset                       | Set in CI to disable server reuse       |

## Test Data Strategy

- **No live backend required**: All ATF API routes are intercepted via Playwright `page.route()`.
- **Deterministic fixtures**: Mock responses are defined in `helpers/smoke-fixtures.ts`.
- **Unique emails**: `uniqueEmail()` generates collision-free test emails per run.
- **Customer auth injection**: `injectCustomerAuth()` sets localStorage tokens via `addInitScript`.
- **Admin auth**: Uses real admin login flow with the mocked `ADMIN_DASHBOARD_KEY`.

## Running Tests

### Local development

```bash
cd ~/repo/TruCore-site

# Run all E2E tests (headless)
npm run test:e2e

# Run only smoke tests
npx playwright test try auth onboarding receipts keys admin-users

# Run with visible browser
npm run test:e2e:headed

# Run a single spec
npx playwright test tests/e2e/try.spec.ts

# Reuse an already-running dev server (faster iteration)
PW_REUSE_SERVER=1 npx playwright test tests/e2e/auth.spec.ts
```

### With local dev server (faster iteration)

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Run tests against existing server
PW_REUSE_SERVER=1 npx playwright test tests/e2e/try.spec.ts
```

### CI

```bash
npm run ci
# or specifically:
npm run test:e2e
```

## Test Coverage Map

| Flow                  | Spec File            | Auth Required | Backend Mocked |
|-----------------------|----------------------|---------------|----------------|
| Public try sandbox    | `try.spec.ts`        | No            | Yes            |
| Signup                | `auth.spec.ts`       | No            | Yes            |
| Login (verified)      | `auth.spec.ts`       | No            | Yes            |
| Login (unverified)    | `auth.spec.ts`       | No            | Yes            |
| Forgot password       | `auth.spec.ts`       | No            | Yes            |
| Reset password        | `auth.spec.ts`       | No            | Yes            |
| Dashboard load        | `onboarding.spec.ts` | Yes (mocked)  | Yes            |
| Onboarding wizard     | `onboarding.spec.ts` | Yes (mocked)  | Yes            |
| Receipt list          | `receipts.spec.ts`   | Yes (mocked)  | Yes            |
| Receipt detail        | `receipts.spec.ts`   | Yes (mocked)  | Yes            |
| Receipt verification  | `receipts.spec.ts`   | Yes (mocked)  | Yes            |
| Key list              | `keys.spec.ts`       | Yes (mocked)  | Yes            |
| Key create            | `keys.spec.ts`       | Yes (mocked)  | Yes            |
| Key revoke            | `keys.spec.ts`       | Yes (mocked)  | Yes            |
| Key rotate            | `keys.spec.ts`       | Yes (mocked)  | Yes            |
| Admin login → users   | `admin-users.spec.ts`| Admin cookie  | Partial*       |

\* Admin pages are server-rendered; the test uses real admin auth flow. If no
live ATF backend is available, the page shows a degraded state which the test
handles gracefully.

## Design Decisions

1. **Route interception over test API**: Mocking at the network layer means
   zero production code changes. No test-only endpoints needed for customer flows.

2. **localStorage injection for customer auth**: The customer auth system uses
   client-side localStorage. `addInitScript` injects tokens before page load.

3. **Admin uses real auth flow**: Admin auth relies on server-side HMAC cookies,
   so we exercise the real login → cookie → page flow.

4. **Graceful degraded handling**: Admin tests accept either successful data or
   the degraded state, since the admin pages SSR-fetch from the ATF backend.

5. **No clipboard assertions**: Key reveal tests check DOM text presence rather
   than clipboard APIs to avoid browser permission issues.
