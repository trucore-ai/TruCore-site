# TruCore Site

Launch-ready marketing site for TruCore: trust-first, AI-native financial infrastructure.

## Stack

- Next.js 16 (App Router, TypeScript)
- Tailwind CSS
- Canvas 2D hero background with animated pulses

## Local Development

### 1) Node.js Version

Use Node.js `20.19+` or `22.13+` (recommended: Node 22 LTS).

### 2) Install Dependencies

```bash
npm install
```

### 3) Start Dev Server

```bash
npm run dev
```

Open `http://localhost:3000`.

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
