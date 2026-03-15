# Deploying TruCore-site to Vercel

This guide covers everything needed to deploy (or redeploy) the TruCore marketing site on Vercel after project creation or recreation.

## Prerequisites

- A Vercel account linked to the `trucore-ai/TruCore-site` GitHub repo.
- Access to Vercel Project Settings.

## 1. Node.js Version

The repo requires **Node 22** (LTS). Vercel reads this from:

- `engines.node` in `package.json` (`>=22.0.0`)
- `.nvmrc` at the repo root (`22`)

To set the version manually in Vercel:

> **Project Settings > General > Node.js Version > 22.x**

This eliminates `EBADENGINE` warnings from dependencies that require Node 22+.

## 2. Required Environment Variables

Set these in **Vercel Project > Settings > Environment Variables**.

| Variable | Required | Scopes | Example | Notes |
|---|---|---|---|---|
| `POSTGRES_URL` | **Yes** | Production, Preview | `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require` | Neon Postgres connection string. Without this, waitlist/design-partner submissions fail with "server configuration issue". |
| `NEXT_PUBLIC_ATF_CLI_VERSION` | **Yes** | Production, Preview, Development | `1.4.0` | Pinned CLI version shown on `/atf` quickstart and `/status`. Must be an explicit semver, never `latest`. |

### How to set it

1. Open your Vercel project dashboard.
2. Go to **Settings > Environment Variables**.
3. Click **Add New**.
4. Name: `NEXT_PUBLIC_ATF_CLI_VERSION`
5. Value: `1.4.0` (or the current pinned release).
6. Environments: check **Production**, **Preview**, and **Development**.
7. Click **Save**.

### What happens if it is missing?

**Production deployments** (`VERCEL_ENV=production`) will **fail by design**. The `/atf` page calls `getAtfCliVersion()` at build time, which throws:

```text
NEXT_PUBLIC_ATF_CLI_VERSION must be set (e.g., 1.4.0) in Vercel env vars for PRODUCTION.
Never use @latest. Pin an explicit version.
```

This is intentional. TruCore enforces explicit version pinning so production builds are deterministic and auditable.

**Preview and Development deployments** will fall back to the safe default (`0.1.0`) if the env var is not yet configured. This allows you to open a Preview deploy, access the Vercel dashboard, and set the env var before promoting to production. The `@latest` value is still forbidden everywhere.

## 3. Optional Environment Variables

These are set automatically by Vercel or are only needed for specific features:

| Variable | Source | Notes |
|---|---|---|
| `VERCEL_GIT_COMMIT_SHA` | Auto (Vercel) | Used for commit badge on `/status`. |
| `VERCEL_ENV` | Auto (Vercel) | `production`, `preview`, or `development`. |
| `ATF_API_KEY` | Manual (if needed) | Only for authenticated CLI usage in CI. |

For the full env var reference, see `ops/ENV_VARS.md`.

## 4. DNS and Domain Setup

After project recreation, verify domain assignments:

1. **Vercel Project > Settings > Domains**
2. Add `trucore.xyz` as primary.
3. Add `www.trucore.xyz` (redirects to apex, handled by `vercel.json`).
4. Namecheap DNS records:
   - `A` record: `@` to `76.76.21.21`
   - `CNAME` record: `www` to `cname.vercel-dns.com`
5. Vercel will auto-provision HTTPS certificates.

## 5. Post-Deploy Verification

After the first successful production deployment:

- [ ] `https://trucore.xyz` loads the home page.
- [ ] `https://www.trucore.xyz` redirects to `https://trucore.xyz`.
- [ ] `https://trucore.xyz/atf` renders with the pinned CLI version.
- [ ] `https://trucore.xyz/status` shows commit SHA and CLI version.
- [ ] OG images resolve: `/opengraph-image`, `/atf/opengraph-image`.

## 6. Redeploying After Project Deletion

If the Vercel project was deleted and recreated:

1. Re-link the GitHub repo in Vercel.
2. Set `NEXT_PUBLIC_ATF_CLI_VERSION` per Section 2 above.
3. Confirm Node.js version is 22.x per Section 1.
4. Re-add domains per Section 4.
5. Trigger a deployment from `main`.
6. Run the post-deploy checklist in Section 5.
