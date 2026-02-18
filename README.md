# TruCore Site

Launch-ready marketing site for TruCore: trust-first, AI-native financial infrastructure.

## Stack

- Next.js 16 (App Router, TypeScript)
- Tailwind CSS
- React Three Fiber for subtle hero background motion

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
