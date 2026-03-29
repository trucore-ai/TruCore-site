# TruCore Site

Launch-ready marketing site for TruCore: trust-first, AI-native financial infrastructure.

## Stack

- Next.js 16 (App Router, TypeScript)
- Tailwind CSS
- Canvas 2D hero background with animated pulses

## Local Development

### 1) Node.js Version

This project requires **Node.js 22** (LTS). The repo ships an `.nvmrc` pinned to `22`.

```bash
nvm use
```

### Deploy Prerequisites (Vercel)

If deploying to Vercel (especially after project recreation), see [docs/DEPLOY_VERCEL.md](docs/DEPLOY_VERCEL.md) for the full checklist including required environment variables and Node version settings.

### 2) Install Dependencies

```bash
npm install
```

### 3) Start Dev Server

```bash
npm run dev
```

Open `http://localhost:3000`.

### 3.1) Single Command Quickstart (ATF v1)

Run one command and get a deterministic decision plus receipt hash:

```bash
npx @trucore/atf@v1.4.0 simulate --preset swap_small --verify
```

Use an API key for higher quota when available:

```bash
ATF_API_KEY="<your_key>" npx @trucore/atf@v1.4.0 simulate --preset swap_small --verify
```

v1 launch mode keeps the CLI command pinned for reproducibility. Bump only when a new CLI tag is intentionally published.

Run from this repo against local dev server:

```bash
node packages/atf-cli/dist/index.js simulate --preset swap_small --base-url http://localhost:3000
```

Raw JSON mode:

```bash
node packages/atf-cli/dist/index.js simulate --json '{"action":"swap","token_in":"SOL","token_out":"USDC","amount":10,"max_slippage_bps":100,"ttl_seconds":60}'
```

### 4) Production Build

```bash
npm run build
npm run start
```

## Quality Checks

```bash
npm run lint
npm run build
```

## Motion and Accessibility (Stage 77)

- A visible footer control lets users toggle between system motion behavior and a minimal background mode.
- Preference persists in localStorage under `trucore.motionPreference`.
- The root element mirrors the resolved state with `data-reduce-motion="true|false"` so animation-heavy layers can be disabled consistently.
- On viewports below 768px, the animated hero background is disabled to prioritize legibility and performance.

## Static Social Preview and Background Budget (Stage 78)

- Key routes now serve dedicated static OpenGraph image endpoints:
  - `/opengraph-image`
  - `/atf/opengraph-image`
  - `/receipts/opengraph-image`
  - `/launch/opengraph-image`
- Home, ATF, Receipts, and Launch metadata now explicitly point both `openGraph.images` and `twitter.images` to their route-specific static previews.
- Hero background rendering is hard-stopped with no active RAF work whenever any of these are true:
  - `document.hidden`
  - `prefers-reduced-motion: reduce`
  - user minimal background mode (`data-reduce-motion="true"`)
  - viewport below `768px`
- Development-only budget diagnostics sample RAF throughput for 2 seconds and log once if:
  - average RAF exceeds 30 fps, or
  - any RAF frame executes while animation should be suspended.

## Performance Guardrails (Stage 50)

The project includes enforceable guardrails to catch performance regressions before merge.

### Bundle Analyzer

Generate a bundle analysis report:

```bash
npm run analyze
```

This runs `next build` with `ANALYZE=true` and opens webpack bundle analyzer output for route and chunk inspection.

### Bundle Size Budget

Validate bundle size thresholds after a production build:

```bash
npm run build
npm run check:bundle
```

Enforced thresholds:

- Max initial route JS: 200 KB
- Max single chunk: 150 KB

The script reads Next.js build manifests under `.next`, calculates route and chunk sizes, and exits non-zero if limits are exceeded.

### Lighthouse CI

Run Lighthouse assertions locally:

```bash
npm run lhci
```

Configured pages:

- `http://localhost:3000/`
- `http://localhost:3000/atf`
- `http://localhost:3000/blog`

Minimum Lighthouse category scores:

- Performance: 0.85
- Accessibility: 0.95
- Best Practices: 0.90
- SEO: 0.90

GitHub Actions also runs Lighthouse CI on pull requests and uploads the `.lighthouseci/` report artifact.

## Distribution Readiness (Stage 51)

Stage 51 adds launch and media distribution surfaces for announcements, press handoff, and builder onboarding.

### New Public Routes

- `/launch` for announcement-ready ATF positioning and tracked launch CTAs
- `/media` for press-ready company/product blurbs and downloadable media assets
- `/launch/opengraph-image` for launch-specific social preview rendering

### New Reusable Sections

- `PublicMetricsStrip` exposes non-sensitive credibility signals (release, CI, security posture, roadmap/status)
- `WhyNowSection` on `/atf` communicates urgency and adversarial context without implementation leakage

### Builder Path Events

Added tracked builder and launch events:

- `builder_docs_click` on `/atf`
- `launch_apply_click`, `launch_primer_click`, `launch_whitepaper_click` on `/launch`

## Conversion Attribution and Metrics (Stage 52)

Stage 52 adds first-touch UTM capture and a lightweight internal metrics snapshot without adding external analytics vendors.

### UTM Capture

- On first visit, if URL includes any UTM params (`utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`), the app stores a cookie named `trucore_utm`.
- Cookie policy:
  - Max age: 7 days
  - Path: `/`
  - `HttpOnly: false`
  - `SameSite: Lax`
- Existing attribution cookie is never overwritten.

### Waitlist Attribution Persistence

Waitlist submissions now persist optional attribution fields in `waitlist_signups`:

- `utm_source`
- `utm_medium`
- `utm_campaign`
- `utm_term`
- `utm_content`

Attribution values are optional and do not block submissions.

### Admin Metrics Snapshot

- JSON endpoint: `/api/metrics` (admin-session gated)
- Admin page: `/admin/metrics` (read-only)

Snapshot payload shape:

```json
{
  "total_signups": 0,
  "design_partner_count": 0,
  "standard_count": 0,
  "by_status": {
    "new": 0,
    "contacted": 0,
    "qualified": 0,
    "closed": 0
  },
  "top_utm_sources": [
    { "source": "x", "count": 0 }
  ],
  "top_campaigns": [
    { "campaign": "launch", "count": 0 }
  ]
}
```

## Trust Hardening and Public Security Proofs (Stage 53)

Stage 53 adds public, security-first trust surfaces and verifiable whitepaper integrity proof without exposing private implementation details.

### Public Security Pages

- `/security/overview` documents architecture philosophy, operational controls, data handling, and release discipline.
- `/security/disclosure` provides responsible disclosure policy and response timelines.
- `/security` redirects to `/security/overview`.

Both security pages include a build-time “Last updated” timestamp via `NEXT_PUBLIC_BUILD_DATE`.

### ATF Trust Surface Enhancements

- `/atf` now includes a public Security Commitments section:
  - Fail-closed design
  - Scoped permits
  - Immutable audit trail
  - Versioned releases

### Whitepaper Integrity Signature Endpoint

- New endpoint: `/atf/whitepaper/signature`
- Response shape:

```json
{
  "sha256": "...",
  "signature": "..."
}
```

Signature details:

- `sha256` is computed from generated whitepaper PDF bytes.
- `signature` is `HMAC-SHA256(sha256, WHITEPAPER_SIGNING_KEY)`.
- Uses `Cache-Control: no-store` to avoid caching integrity responses.
- `WHITEPAPER_SIGNING_KEY` is required in production.

### Header Verification Test

- Added unit test: `tests/security-headers.test.ts`
- Asserts presence of required hardening headers:
  - `strict-transport-security`
  - `content-security-policy`
  - `x-frame-options`
  - `x-content-type-options`
  - `referrer-policy`

<<<<<<< Updated upstream
## Signed Receipts and Public Verification (Stage 80)

Stage 80 adds cryptographic integrity for deterministic receipt hashes using Ed25519 signatures.

### What is signed

- The signer only signs `receipt_hash` values.
- Input must be a 64-character SHA-256 hex string.
- Full receipt bodies are not accepted by signing endpoints.

### Signature and key encoding

- Algorithm: `Ed25519`
- Signature encoding: `base64`
- Public key encoding: `base64` (32-byte raw key)

### Environment variable

- `RECEIPT_SIGNING_KEY` must be base64-encoded and can be either:
  - 32-byte Ed25519 seed, or
  - 64-byte secret form (first 32 bytes are used as seed)
- Never commit or log private signing keys.
- Public key publication is safe and supported.

### Public endpoints

- `GET /api/receipt-signing-key`
  - Returns availability and public key metadata:

```json
{
  "available": true,
  "public_key": "...",
  "alg": "Ed25519",
  "encoding": "base64"
}
```

- `POST /api/receipt-signature`
  - Request body:

```json
{
  "receipt_hash": "<64 hex chars>"
}
```

- Successful response:
=======
## Public API Preview and Read-Only Firewall Simulator (Stage 54)

Stage 54 introduces a public, read-only simulator that demonstrates deterministic ATF policy behavior without any wallet or chain connectivity.

### New Public Simulator Route

- `/atf/simulator` includes:
  - JSON input editor with a pre-filled swap example
  - Result panel showing status, reason, invariant checks, and deterministic receipt hash
  - Copyable request and response JSON examples (allowed and denied)

Tracked simulator events:

- `simulator_view_click` from `/atf` hero CTA
- `simulator_run_click` from `/atf/simulator`

### Public Simulation API

- Endpoint: `/api/simulate` (POST only)
- Behavior:
  - Validates request shape
  - Applies safe mock policy checks
  - Returns deterministic result payload
  - Sets `Cache-Control: no-store`
  - Rate-limits by IP hash at `30 req/min`

Request shape:

```json
{
  "action": "swap",
  "token_in": "SOL",
  "token_out": "USDC",
  "amount": 10,
  "max_slippage_bps": 100,
  "ttl_seconds": 60
}
```

Result shape:
>>>>>>> Stashed changes

```json
{
  "ok": true,
<<<<<<< Updated upstream
  "receipt_hash": "...",
  "signature": "...",
  "public_key": "...",
  "alg": "Ed25519"
}
```

- If key is not configured:

```json
{
  "ok": false,
  "error": "signature_unavailable"
}
```

### Verification flow on `/verify`

1. Paste a `receipt_hash` (or open `/verify?hash=...`).
2. Click `Fetch signature for this hash`.
3. The app requests signature data and verifies it server-side.
4. UI reports `Verified`, `Invalid`, or `Not available`.

## Formal Receipt Specification v1 (Stage 85)

Stage 85 publishes a formal RFC-style receipt contract for deterministic verification workflows.

- Public spec route: `/docs/receipt-specification-v1`
- Scope includes canonical JSON structure, deterministic evaluation contract, receipt hash definition, versioning rules, optional signature extension, and security considerations.
- Version constants are centralized in `lib/receipt-spec-constants.ts` and shared with verifier logic.
- Unknown receipt versions continue to resolve with `supported_version=false`, and missing version remains backward-compatible as legacy v1.

The verification utility sends only the hash for signing and verification operations.

## Anchoring and Execution Roadmap (Stage 86)

Stage 86 adds a public technical roadmap page for phased receipt verification and anchoring evolution.

- New docs route: `/docs/anchoring-roadmap`
- Scope is documentation and positioning only, with explicit separation between live, preview, planned, and future phases.
- Includes a static social preview image route at `/docs/anchoring-roadmap/opengraph-image`.
- No runtime anchoring logic changed in this stage.
=======
  "input": {
    "action": "swap",
    "token_in": "SOL",
    "token_out": "USDC",
    "amount": 10,
    "max_slippage_bps": 100,
    "ttl_seconds": 60
  },
  "result": {
    "status": "allowed",
    "reason": "Request satisfies demo policy limits.",
    "invariant_checks": [
      "amount <= 1000: pass",
      "max_slippage_bps <= 300: pass",
      "ttl_seconds <= 300: pass"
    ],
    "receipt_hash": "sha256(JSON.stringify(input))"
  }
}
```

### Simulator Tests

- Added unit test: `tests/simulator.test.ts`
- Covers deny conditions, allow path, and deterministic receipt hash behavior
>>>>>>> Stashed changes

## CI and Branch Protection (Stage 42)

### Required CI Checks

The GitHub Actions `Test` workflow runs three required jobs in parallel:

- `lint`
- `unit`
- `e2e`

Each job uses Node 20 with npm dependency caching. The `e2e` job also caches Playwright browsers.

### Run CI Locally

Use the same top-level script used for local parity with CI:

```bash
npm run ci
```

This runs lint with zero warnings, unit tests, and Playwright e2e tests in sequence.

### Branch Protection Setup

In GitHub repository settings for `main`:

1. Open **Settings** -> **Branches**.
1. Create or edit the branch protection rule for `main`.
1. Enable **Require status checks to pass before merging**.
1. Mark these checks as required: `lint`, `unit`, `e2e`.
1. Enable **Require branches to be up to date before merging**.

## Production Release and Ops Baseline (Stage 48)

Use these docs for production-ready releases, tagging, and operations procedures:

- `RELEASE.md` for versioning, release flow, and release notes template
- `ops/PRODUCTION_CHECKLIST.md` for pre/post deploy checks, smoke checks, rollback, and incident triage
- `ops/ENV_VARS.md` for environment variable inventory, scope, and safe defaults

## Build Output Notes

- Main route: `/`
- Generated social preview routes:
  - `/opengraph-image`
  - `/twitter-image`
- Favicon: `/favicon.ico`

## Waitlist Setup

### Vercel Postgres

1. In Vercel dashboard, go to **Storage** → **Create** → **Postgres**.
2. Name the database (e.g., `trucore-waitlist`) and confirm.
3. Vercel auto-injects `POSTGRES_URL` (and related vars) into the project.
4. The `waitlist_signups` table is auto-created on the first submission via `ensureWaitlistTable()`.

### Resend (Email)

1. Sign up at [resend.com](https://resend.com) and verify your domain (`trucore.xyz`).
2. Create an API key with **Send** permission.
3. Add these environment variables in **Vercel → Project Settings → Environment Variables**:

| Variable | Value |
| --- | --- |
| `RESEND_API_KEY` | `re_xxxxxxxxxx` |
| `WAITLIST_NOTIFY_TO` | `info@trucore.xyz` |
| `WAITLIST_FROM` | `TruCore <info@trucore.xyz>` |

### Run Locally

```bash
# Copy env vars (needs POSTGRES_URL + RESEND_API_KEY at minimum)
cp .env.example .env.local

npm install
npm run dev
```

> **Tip:** If you don't have Postgres set up locally, submissions will fail but the UI will still render.
> You can pull Vercel env vars locally with `vercel env pull .env.local`.

### Verify in Production

- Submit a test email on <https://trucore.xyz/#waitlist>.
- Confirm the row appears in Vercel Postgres (Storage → Data tab).
- Confirm admin + user emails arrive via Resend dashboard.

---

## Admin Triage Dashboard

A lightweight, server-rendered page for reviewing and triaging waitlist signups (especially design partner applications). Includes pipeline status tracking, inline status updates, outreach email copy, and CSV export.

### Authentication

Admin access is protected by an HttpOnly cookie session. No credentials appear in URLs.

1. Visit `/admin/login` and enter the `ADMIN_DASHBOARD_KEY`.
2. On success, a secure HttpOnly cookie (`admin_session`) is set for 8 hours.
3. Access `/admin/waitlist` with clean URLs (no query key).
4. Click **Logout** (top-right) to clear the session and return to the home page.

### URL Pattern

```text
/admin/waitlist?intent=design_partner&limit=50
```

### Query Parameters

| Param | Values | Default |
| --- | --- | --- |
| `intent` | `all`, `standard`, `design_partner` | `all` |
| `limit` | `25`, `50`, `100` | `50` |

### Pipeline Status

Each signup has a `status` field with one of: `new`, `contacted`, `qualified`, `closed`. Change status inline from the dashboard using the per-row dropdown and Save button.

### CSV Export

Click "Export Design Partners (CSV)" at the top of the dashboard. The download includes: `created_at`, `updated_at`, `email`, `status`, `project_name`, `integrations_interest`, `tx_volume_bucket`, `build_stage`, `role`, `source`, `admin_notes`.

### Outreach Email Copy

For design partner rows, a "Copy email" button copies a pre-filled outreach template to your clipboard. No email is sent automatically.

### Admin Notes

Each signup row has an expandable "Notes" column. Click the note preview (or "+ Add note") to open an inline textarea. Notes are capped at 2,000 characters and saved server-side. Notes are never exposed outside the admin dashboard.

### Design Partner Dedupe

If a design partner re-submits with the same email, the existing row is updated with the latest project details instead of being silently ignored. The original `created_at` is preserved and `updated_at` is refreshed. Standard waitlist submissions still ignore duplicates.

### Rate Limiting

Admin actions (status changes, note edits, CSV export) are rate-limited to 30 mutations per minute per session. This is an in-memory guard that resets on cold start.

### Security

- Admin key is never exposed in URLs, query params, or browser history.
- The session cookie is HttpOnly (not accessible to client JS), Secure in production, and SameSite=Lax.
- If the session is missing or invalid, the page returns a 404 (no hints).
- Incorrect login attempts also return a 404.
- Treat `ADMIN_DASHBOARD_KEY` like a password. Do not share it publicly or commit it to source control.
- The page is server-rendered only. Client components handle clipboard and downloads only.
- Rotate `.well-known/security.txt` `Expires` yearly. Current expiry is `2026-08-19T23:59:59.000Z`, plan to update before this date each year.

### Security Headers (Stage 23)

Every response includes strict security headers configured in `next.config.ts`:

| Header | Value |
| --- | --- |
| Strict-Transport-Security | `max-age=63072000; includeSubDomains; preload` |
| X-Frame-Options | `DENY` |
| X-Content-Type-Options | `nosniff` |
| Referrer-Policy | `strict-origin-when-cross-origin` |
| Permissions-Policy | `camera=(), microphone=(), geolocation=()` |
| Content-Security-Policy | Restricts sources to self + Vercel Analytics |

Header values are defined in `lib/security-headers.ts` for easy auditing.

### Admin Audit Log (Stage 23)

All admin actions are recorded in the `admin_audit_log` Postgres table. Logged actions:

| Action | When |
| --- | --- |
| `admin_login` | Successful login |
| `admin_logout` | Logout |
| `status_change` | Pipeline status changed (metadata: `{ to }`) |
| `note_update` | Admin notes edited |
| `csv_export` | Design partner CSV downloaded (metadata: `{ rowCount }`) |

View the last 50 entries at `/admin/audit` (requires admin session). The log is read-only, no editing or deletion is supported. No secrets or raw cookies are ever stored.

### API Keys and Usage Quotas (Stage 55)

Stage 55 adds API key primitives for controlled simulator access and future monetization.

- Admin page: `/admin/keys`
- Create endpoint: `POST /api/keys/create` (admin-session gated)
- Revoke endpoint: `POST /api/keys/revoke` (admin-session gated)
- Key format: `tk_live_<random>`
- Storage model: raw key is shown once on creation, only `SHA-256` hash is stored in Postgres.

#### Simulator quota behavior

- `POST /api/simulate` without `x-api-key`: `30 req/min` per hashed IP
- `POST /api/simulate` with valid `x-api-key`: `120 req/min` per key
- Revoked keys are rejected with `401` and `invalid_api_key`
- All simulator responses keep `Cache-Control: no-store`

#### Usage metering

All `/api/simulate` hits write a record to `api_usage` with:

- `api_key_id` nullable (null for public access)
- `endpoint` (currently `/api/simulate`)
- `created_at`

Both `api_keys` and `api_usage` tables are auto-created with idempotent `CREATE TABLE IF NOT EXISTS` setup.

### Partner Key Issuing and Usage Dashboard (Stage 56)

Stage 56 makes key operations usable for qualified design partners in admin workflows.

- Waitlist action: in `/admin/waitlist`, rows with `intent=design_partner` and `status=qualified` show `Issue Sandbox Key`.
- Issue endpoint: `POST /api/keys/issue-for-partner` (admin-session gated, 404 when not authenticated).
- Usage dashboard: `/admin/usage` with per-key totals, `last_24h`, `last_7d`, `last_seen`, and top endpoint counts.
- Ownership metadata: keys may include `owner_email`, `owner_project`, and `label` for admin-only attribution.

#### One-time raw key reveal policy

- Raw key is revealed in the admin UI one time at issuance.
- Raw key is never persisted in storage.
- Raw key is never written to audit logs.
- Raw key is never emailed.
- Database stores only `SHA-256` key hash.

#### Simulator self-debug headers

`POST /api/simulate` includes these response headers for public and keyed traffic, including 429 responses:

- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset` (epoch seconds)

### Partner Developer Portal (Stage 57)

Stage 57 adds a lightweight self-serve partner portal with signed access tokens, no separate partner account system required.

- Portal page: `/portal`
- Login endpoint: `GET/POST /portal/login`
- Logout endpoint: `POST /portal/logout`
- Admin create endpoint: `POST /api/portal/token/create`
- Admin revoke endpoint: `POST /api/portal/token/revoke`

#### Access model

- Admin creates a short-lived portal token for one `owner_email` (default 7-day TTL).
- Raw token is shown once, only the SHA-256 hash is stored in `partner_portal_tokens`.
- Visiting `/portal/login?token=...` or posting token at `/portal/login` verifies token server-side and issues `partner_portal_session` HttpOnly cookie.
- Cookie scope is `/portal`, SameSite=Lax, Secure in production, max session 8 hours.
- Token creation rotates previous active tokens for the same owner email.
- Revoked or expired tokens cannot create sessions.

#### Data visibility guarantees

- Portal renders only keys and usage where `api_keys.owner_email` matches the session owner.
- No admin pages, no cross-partner data, no raw API keys.
- Key cards show metadata only, including label, created/revoked timestamps, tier, and last4.
- Portal routes are `noindex, nofollow` and use `Cache-Control: no-store`.

### CSP Reporting (Stage 24)

A `Content-Security-Policy-Report-Only` header mirrors the enforce CSP and sends violation reports to `/api/csp-report` via the Reporting API. Both enforce and report-only headers coexist, so reports are collected without blocking anything.

**What is stored** (in the `csp_reports` Postgres table):

| Field | Description |
| --- | --- |
| `effective_directive` | The CSP directive that was violated |
| `violated_directive` | The policy string that was violated |
| `disposition` | `enforce` or `report` |
| `document_origin` | Scheme + host only (query/hash stripped) |
| `user_agent` | Truncated to 120 characters |

Blocked URIs, source files, and full document URLs are never stored. Reports are rate-limited to 30/min per IP. View reports at `/admin/csp` (requires admin session).

### Status Page (Stage 25)

`/status` displays current operational status for Website, Waitlist API, and Admin Tools. Includes monitoring details, incident reporting instructions, and optional last-deploy commit SHA (from `VERCEL_GIT_COMMIT_SHA`).

### Production Smoke Monitor (Stage 46)

`/status` now includes a live browser-side check panel that probes:

- Website reachability (`/`)
- Waitlist workflow readiness (derived from website + service probes)
- Health endpoint (`/api/health`)

The browser also fetches `/api/status` for a lightweight status snapshot.

#### `/api/status` Snapshot Endpoint

`GET /api/status` returns:

```json
{
  "ok": true,
  "ts": "2026-02-22T00:00:00.000Z",
  "commit": "<sha-or-null>",
  "env": "<vercel-env-or-null>"
}
```

Response headers include `Cache-Control: no-store`.

#### Manual Smoke Checks with curl

```bash
curl -sS https://trucore.xyz/api/health
curl -sS https://trucore.xyz/api/status
```

For local development:

```bash
curl -sS http://localhost:3000/api/health
curl -sS http://localhost:3000/api/status
```

#### Optional External Uptime Ping (No Dependencies)

Use any external HTTP monitor to poll:

- `https://trucore.xyz/api/health` every 60 seconds
- Optional: `https://trucore.xyz/api/status` every 5 minutes

Suggested alert trigger: any non-2xx response for 2 consecutive checks.

These endpoints are read-only and do not store PII.

### Changelog (Stage 25)

`/changelog` renders a chronological list of updates sourced from `lib/changelog.ts`. Entries include date, title, and bullet-point changes. Latest entries appear first.

### Contact Page (Stage 25)

`/contact` provides clear email routes (`info@trucore.xyz` for general, `security@trucore.xyz` for vulnerabilities), links to the responsible disclosure policy, and social channel buttons (X and GitHub).

### ATF Primer (Stage 27)

`/atf/primer` is a concise, technical primer covering the ATF problem space, model, V1 scope, hard invariants, threat model, and design partner program. Content is sourced from `lib/primer-content.ts` so the web page and downloadable PDF stay in sync.

`/atf/primer/pdf` generates a formatted PDF using `pdf-lib` with `Cache-Control: public, max-age=86400`. No PII or user data is embedded in the document.

Links to the primer appear in the ATF hero section and the site footer under Products.

### Design Partner Scheduling (Stage 28)

After a successful design partner application, the success UI offers a "Book a fit check" button linking to an external scheduling tool. The user confirmation email also includes the scheduling link plus a short intake questionnaire.

**Setup:**

1. Create a free scheduling link using [Calendly](https://calendly.com) (free tier) or [Google Calendar Appointment Schedule](https://support.google.com/calendar/answer/10729749).
1. Add the env var in **Vercel > Project Settings > Environment Variables** (Production + Preview):

| Variable | Value |
| --- | --- |
| `DESIGN_PARTNER_SCHEDULING_URL` | `https://calendly.com/your-link` (or Google equivalent) |

1. For local development, add it to `.env.local`:

```bash
DESIGN_PARTNER_SCHEDULING_URL=https://calendly.com/your-link
```

**Behavior:**

- If the env var is set, the success card shows a prominent "Book a fit check" button and the user email includes a clickable scheduling CTA.
- If the env var is missing, the button is hidden and a fallback message ("Scheduling link unavailable. We'll email you.") is shown instead.
- Admin notification emails include a "Suggested first reply" block with the scheduling link for quick operator outreach.

### Design Partner Apply Page (Stage 29)

`/atf/apply` is a dedicated, premium application page for the ATF Design Partner program. It includes contextual sections (who it's for, what you get, what happens next) and a focused form that submits through the same backend pipeline as the waitlist.

All design partner CTAs across the site (ATF hero, primer page, CTA component) route to `/atf/apply`. The homepage waitlist (`/#waitlist`) remains available for general signups and still supports `?intent=design_partner` for backward compatibility with existing links.

The apply form includes: email, project name, integrations, build stage, expected volume, optional role, and optional use case. Success state matches Stage 28 behavior (scheduling button when env var present).

### Public Roadmap and Transparency Metrics (Stage 30)

`/atf/roadmap` is a public roadmap for ATF with infrastructure-grade milestone tracking. Milestones are grouped by scope (`core`, `security`, `ecosystem`) and each item has a status badge:

- `Completed` (green)
- `In Progress` (orange)
- `Planned` (neutral)

No dates, promises, or speculative timelines are shown.

`/atf` now includes:

- A `View Full Roadmap` link that tracks `roadmap_view_click` with `{ location: "atf_page" }`
- A `Transparency Metrics` section summarizing active controls (security headers, CSP logging, audit logging, health monitoring, and design partner program status)

The footer `Products` column includes an `ATF Roadmap` link for persistent navigation.

### Security Whitepaper Preview and Integrity Hash (Stage 31)

`/atf/whitepaper` publishes a short security whitepaper preview for ATF. It focuses on what exists now: threat model, trust assumptions, enforcement model, receipt model, V1 scope, and design partner engagement.

`/atf/whitepaper/pdf` generates a downloadable PDF using `pdf-lib` with `Cache-Control: public, max-age=86400`.

`/atf/whitepaper/hash` returns a SHA-256 hash for the generated PDF:

```json
{ "sha256": "..." }
```

The whitepaper page displays this hash and includes a copy action so readers can verify document integrity.

Navigation updates:

- `/atf` hero includes a `Whitepaper (Preview)` CTA
- Footer `Products` includes `ATF Whitepaper (Preview)`

Analytics events:

- `whitepaper_view_click` (location: `atf_page`)
- `whitepaper_download_click` (location: `whitepaper_page`)
- `whitepaper_hash_copy_click` (location: `whitepaper_page`)

### Blog Authoring Upgrade to MDX (Stage 33)

`/blog` publishes short technical posts from frontmatter metadata in `content/blog/*.mdx`.

`/blog/[slug]` renders each MDX post with minimal custom components for code blocks and callouts, followed by a consistent design partner CTA.

`/blog/rss.xml` serves an RSS 2.0 feed (`Content-Type: application/rss+xml; charset=utf-8`) built from MDX frontmatter metadata (latest 20 posts, canonical URLs like `https://trucore.xyz/blog/<slug>`).

No CMS is required. Authoring is now file-based MDX for simpler publishing while keeping static builds deterministic and Vercel-friendly.

Footer navigation includes a `Resources` column with a `Blog` link.

### Blog UX and SEO Upgrade (Stage 34)

`/blog` now supports client-side filtering with search and tag chips, plus a clear action and a live count (`Showing X of Y posts`).

Filtering is case-insensitive and matches post title, description, and tags. Empty filter results show a clear message.

Dynamic Open Graph image routes now exist for blog sharing:

- `/blog/opengraph-image` (blog index social preview)
- `/blog/<slug>/opengraph-image` (per-post social preview with title, date, tags)

`/blog/[slug]` metadata now points `openGraph.images` and `twitter.images` to the per-post OG route.

`/sitemap.xml` is generated via `app/sitemap.ts` and includes key marketing routes, blog index, and all blog post URLs from MDX frontmatter.

### Docs Hub and Initial ATF Docs (Stage 35)

`/docs` now serves as a lightweight documentation hub for technical teams evaluating ATF.

Initial docs pages:

- `/docs/quickstart`
- `/docs/policy-model`
- `/docs/permits`

The docs area uses a shared two-column layout with a persistent desktop sidebar and a mobile dropdown navigator.

Navigation updates:

- `/atf` hero includes a `Docs` CTA near Primer and Whitepaper links
- Footer `Resources` includes a `Docs` link

Analytics:

- `docs_view_click` with `{ location: "atf_page", target: "docs" }`

### Docs Search, Version Badge, and Anchors (Stage 36)

The docs layout now includes a lightweight client-side search input that matches docs titles, curated content snippets, and tags.

Search behavior:

- Keyboard-accessible dropdown results (up to 8)
- Clear empty state when no pages match
- Optional analytics event: `docs_search_select` with `{ href }` only

Docs versioning is now visible in the header as `ATF Docs v0.1` plus `Updated 2026-02-20`.

Major `h2` headings in the docs pages include hover-revealed copy-link anchors. Selecting the icon copies the full URL with hash.

Optional analytics event: `docs_anchor_copy` with `{ id, href }`.

### Health Endpoint (Stage 24)

`GET /api/health` returns `{"ok":true,"ts":"..."}` with `Cache-Control: no-store`. No database checks, no secrets. Use with external uptime monitors (Checkly, UptimeRobot, etc.).

### Error Boundaries (Stage 24)

A global error boundary (`app/error.tsx`) catches unexpected runtime errors and shows a friendly reload page. Admin routes have a scoped error boundary (`app/admin/error.tsx`) with an admin-specific message and sign-in link.

### Setup

Add the following environment variable in **Vercel > Project Settings > Environment Variables** (Production):

| Variable | Value |
| --- | --- |
| `ADMIN_DASHBOARD_KEY` | A long random string |

---

## Vercel Deployment Checklist

### 1) Import Repo

1. Go to Vercel dashboard.
2. Click **Add New → Project**.
3. Import `trucore-ai/TruCore-site`.
4. Keep framework preset as **Next.js**.
5. Deploy from `main` branch.

### 2) Environment Variables

No required environment variables for current frontend-only release.

### 3) Add Domains

In Vercel project settings, add both:

- `trucore.xyz`
- `www.trucore.xyz`

### 4) Namecheap DNS

Create/update these DNS records:

- `A` record: host `@` → `76.76.21.21`
- `CNAME` record: host `www` → `cname.vercel-dns.com`

### 5) HTTPS + Redirects

- Vercel will provision HTTPS certificates automatically for both domains.
- This repo includes host redirect config to make `www.trucore.xyz` redirect to `trucore.xyz`.
- In Vercel domains UI, verify `trucore.xyz` is marked as **Primary**.

### 6) Final Verification

- Vercel build log is green on latest `main` commit.
- `https://trucore.xyz` loads successfully.
- `https://www.trucore.xyz` redirects to `https://trucore.xyz`.
- OG/Twitter images resolve:
  - `https://trucore.xyz/opengraph-image`
  - `https://trucore.xyz/twitter-image`
