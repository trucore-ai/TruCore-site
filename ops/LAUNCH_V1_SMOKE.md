# Launch v1 Smoke Checklist

Use this checklist for final launch verification after production deploy.

## 1) Preflight

- Confirm `RECEIPT_SIGNING_KEY` is set in Vercel Production.
- Confirm `WHITEPAPER_SIGNING_KEY` is set in Vercel Production.
- Redeploy production after any env var change.

## 2) Automated smoke run

Run from your laptop or trusted shell:

```bash
BASE_URL=https://trucore.xyz REQUIRED_SIGNING_KEYS=1 bash scripts/verify-prod-launch.sh
```

Optional local run when signing keys are not enabled:

```bash
BASE_URL=http://localhost:3000 REQUIRED_SIGNING_KEYS=0 bash scripts/verify-prod-launch.sh
```

Optional authenticated checks:

```bash
BASE_URL=https://trucore.xyz REQUIRED_SIGNING_KEYS=1 ADMIN_KEY=REDACTED PARTNER_PORTAL_TOKEN=REDACTED bash scripts/verify-prod-launch.sh
```

## 3) Manual UI tour

- Home: `/`
- ATF: `/atf`
- Simulator: `/atf/simulator`
- Receipts: `/receipts`
- Verify: `/verify`
- Whitepaper: `/atf/whitepaper`

Confirm each route loads and primary CTAs navigate correctly.

## 4) Evidence capture

- `/status` commit SHA: ______________________________
- Simulator result screenshot with verify link: ______________________________
- `/verify` verified signature screenshot (when enabled): ______________________________

## 5) Email flow verification

- Submit one design partner application from `/atf/apply`.
- Confirm user confirmation email received.
- Confirm internal admin notification email received.
- Attach inbox screenshots:
  - User inbox screenshot: ______________________________
  - Admin inbox screenshot: ______________________________

## 6) Admin verification

- Login at `/admin/login`.
- Open `/admin/audit` and confirm recent events exist.
- Open `/admin/csp` and confirm entries table loads.

## 7) Known acceptable warnings

- Node experimental runtime warning in local shell output.
- Missing optional token checks when `ADMIN_KEY` or `PARTNER_PORTAL_TOKEN` are not provided.
- Rate-limit headers may be absent on some routes if limits are enforced without header exposure.
