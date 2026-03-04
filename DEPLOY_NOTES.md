# Deploy Notes: Fix 404 for `/.well-known/atf.json` and `/docs/agent-discovery`

**Incident commit:** `6a7a7d5`
**Symptom:** Both `https://trucore.xyz/.well-known/atf.json` and
`https://trucore.xyz/docs/agent-discovery` returned HTTP 404 with Vercel
HTML error pages and cache `Age` headers over 11 hours, indicating the domain
was pointing to a stale deployment or a different Vercel project.

---

## A. Vercel Dashboard Checks (human steps)

### 1. Confirm the correct deployment is live

1. Open the [Vercel dashboard](https://vercel.com/trucore-ai/TruCore-site).
2. In the **Deployments** tab, verify that the topmost Production deployment
   shows commit `6a7a7d5` and status **Ready**.
3. If a different commit is promoted, click the `6a7a7d5` deployment row and
   use **Promote to Production**.

### 2. Confirm `trucore.xyz` is attached to exactly this project

1. In the project **Settings > Domains**, confirm `trucore.xyz` (apex) and
   `www.trucore.xyz` are listed and show a green check.
2. If either domain is claimed by a different Vercel project, go to that
   project's Settings > Domains, remove the domain, then add it back in
   TruCore-site.

### 3. Force a cache refresh

After confirming the correct deployment is promoted and the domain is correctly
attached, open the deployment page and click **Redeploy** (without clearing
build cache). This pushes a fresh edge manifest to all Vercel PoPs and clears
the stale 404 responses.

---

## B. Route Integrity (code-verified)

The following checks confirmed no code-level routing issue exists:

| File | Finding |
|------|---------|
| `vercel.json` | Only contains a `www` to apex redirect. No wildcard rewrites. |
| `next.config.ts` | Security headers only. No `rewrites` or `redirects` arrays. |
| `middleware.ts` | Does not exist. No global middleware intercepting requests. |
| `public/.well-known/atf.json` | Present. Contains `openclaw_plugin` at line 132. |
| `app/docs/agent-discovery/page.tsx` | Present. Exports valid metadata and page component. |

---

## C. Bulletproof Route Handler (implemented)

`app/.well-known/atf.json/route.ts` was added as a Next.js App Router `GET`
handler. It reads from `public/.well-known/atf.json` at runtime, so the JSON
file remains the single source of truth.

**Why this is needed:** Vercel/Next.js normally serves dotfile directories from
`public/` correctly, but under certain edge-cache or CDN configurations the
static-file handler can be bypassed for paths starting with `.`. An explicit
App Router handler always wins over static-file ambiguity.

**Response headers set by the handler:**

```
Content-Type: application/json; charset=utf-8
Cache-Control: public, max-age=300, stale-while-revalidate=60
```

A unit test was added at `tests/well-known-atf.test.ts` covering:
- HTTP 200 + correct Content-Type
- Parsed body contains `openclaw_plugin`
- HTTP 500 when file is missing
- HTTP 500 when file contains invalid JSON

---

## D. Post-Deploy Verification Commands

Run these after the next production deployment. All three must succeed.

```bash
# 1. Check /.well-known/atf.json headers -- expect HTTP/2 200, application/json
curl -sSI "https://trucore.xyz/.well-known/atf.json?ts=$(date +%s)" | head -n 20

# 2. Check /docs/agent-discovery headers -- expect HTTP/2 200
curl -sSI "https://trucore.xyz/docs/agent-discovery?ts=$(date +%s)" | head -n 20

# 3. grep for openclaw_plugin in the live JSON -- must find a line
curl -sS "https://trucore.xyz/.well-known/atf.json?ts=$(date +%s)" | grep -n '"openclaw_plugin"'
```

### Expected outputs

**Command 1 / 2:**
```
HTTP/2 200
content-type: application/json; charset=utf-8   (cmd 1 only)
```

**Command 3:**
```
132:  "openclaw_plugin": {
```
(line number may vary if the JSON is modified; the key must appear)

---

## E. Staged Commits

| # | Type | Message |
|---|------|---------|
| 1 | `docs(deploy)` | add DEPLOY_NOTES.md with Vercel checks |
| 2 | `fix(routes)` | add explicit app/.well-known/atf.json/route.ts fallback |
| 3 | `test` | add well-known-atf unit test |
