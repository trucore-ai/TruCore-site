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
