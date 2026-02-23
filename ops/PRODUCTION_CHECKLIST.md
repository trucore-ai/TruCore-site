# Production Checklist

## Pre-deploy Checks

1. Confirm latest `main` commit has green CI checks (`lint`, `unit`, `e2e`).
2. Run local parity checks:

   ```bash
   npm run ci
   ```

3. Confirm required env vars are present in Vercel (see `ops/ENV_VARS.md`).
4. Review release notes draft in `RELEASE.md` template format.
5. Verify Vercel Preview deployment for the release commit.

## Post-deploy Checks

### Smoke Checks

Run each check from production and confirm expected result.

- `GET /` -> Homepage loads with no server error.
- `GET /atf` -> Hero renders and primary CTAs navigate correctly.
- `GET /atf/apply` -> Application page loads and form submit succeeds with test data.
- `GET /admin/login` then login -> Redirects to `/admin/waitlist` with valid key.
- `GET /admin/audit` -> Recent audit events are visible.
- `GET /admin/csp` -> CSP reports table loads (empty is acceptable).
- `GET /status` -> Live checks report healthy state.
- `GET /api/health` -> HTTP 200 and `ok: true` payload.
- `GET /api/status` -> HTTP 200 and status snapshot payload.
- `GET /blog` and `GET /docs` -> Pages load successfully.

### Partner Portal Header and Session Verification (Stage 58)

Use the repeatable curl-based script from your laptop for production and preview checks.

Public checks only, no token required:

```bash
BASE_URL=https://trucore.xyz bash scripts/verify-prod-portal.sh
```

Optional authenticated checks, requires a valid one-time partner portal token:

```bash
BASE_URL=https://trucore.xyz PARTNER_PORTAL_TOKEN=REDACTED bash scripts/verify-prod-portal.sh
```

Expected successful output pattern:

- `PASS: GET /portal returns 307 redirect to /portal/login when unauthenticated` (or `PASS ... returns 200` if session already exists)
- `PASS: GET /portal has X-Robots-Tag noindex`
- `PASS: GET /portal has Cache-Control no-store`
- `PASS: GET /portal/login returns 200`
- With token: login sets `partner_portal_session` with `HttpOnly`, `SameSite=Lax`, `Path=/portal`, plus `Secure` on HTTPS
- With token: logout returns redirect and clears cookie with `Max-Age=0` or expired `Expires`
- Final line: `Summary: N passed, 0 failed`

Negative test for failure handling:

```bash
BASE_URL=https://invalid.example bash scripts/verify-prod-portal.sh
```

This should print one or more `FAIL:` lines and exit non-zero.

### Operational Verification

1. Submit one waitlist test entry and verify DB row appears.
2. Confirm Resend shows a delivered or accepted event for test email.
3. Confirm no new error spikes in Vercel logs during first 15 minutes.

## Data Backup and Export (Neon)

1. Open Neon console for the production project.
2. Use **Branches** and confirm automated backups are enabled.
3. Trigger on-demand backup or export before major schema changes.
4. Export critical tables (`waitlist_signups`, `admin_audit_log`, `csp_reports`) using SQL export or `psql` dump.
5. Store exports in restricted ops storage with timestamp and release tag.

Example ad-hoc export:

```bash
pg_dump "$POSTGRES_URL" -t waitlist_signups -t admin_audit_log -t csp_reports > trucore-release-backup.sql
```

## Admin Key Rotation Procedure

1. Generate a new high-entropy key.
2. Update `ADMIN_DASHBOARD_KEY` in Vercel for Preview first, then Production.
3. Redeploy, then verify `/admin/login` accepts only the new key.
4. Invalidate active sessions by redeploying or cycling the key and cookie context.
5. Record rotation date, operator, and reason in internal ops notes.

Recommended cadence: rotate every 90 days or immediately after suspected exposure.

## Resend Deliverability Checklist

1. Verify sending domain is authenticated in Resend (SPF, DKIM, DMARC aligned).
2. Confirm `WAITLIST_FROM` uses the verified domain.
3. Send a seed test to multiple providers (Gmail, Outlook, iCloud).
4. Confirm no hard bounces or spam placement in seed tests.
5. Review Resend dashboard for suppression, bounce, and complaint metrics.
6. If deliverability degrades, pause volume spikes and investigate domain reputation.

## Rollback Plan

1. Identify last known good production commit.
2. In Vercel, redeploy that commit from deployment history.
3. Re-run post-deploy smoke checks.
4. If issue is data-related, restore from latest valid Neon backup/export.
5. Create incident note with root cause and follow-up fix owner.

## Incident Triage Quick Steps

1. Confirm scope: single route, admin-only, or full-site outage.
2. Check `/api/health` and `/api/status` for immediate signals.
3. Review Vercel runtime logs for latest failing requests.
4. Check Neon connectivity and Resend API status if relevant.
5. Communicate status in internal channel and update owners.
6. Mitigate first, then capture root cause and preventive action.
