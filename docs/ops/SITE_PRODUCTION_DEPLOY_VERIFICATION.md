# Site Production Deploy Verification

Fail-closed runbook for verifying TruCore-site production deployments.

## Why this exists

A real false-completion incident occurred where a fix existed only in the
working tree, was never committed or pushed, and production kept serving the
broken version. This runbook ensures every deploy is verifiable.

---

## Pre-deploy checklist

1. **Clean working tree**
   ```bash
   git status          # must show "nothing to commit, working tree clean"
   ```
   If files are modified or untracked, commit or stash them first.

2. **Branch merged to main**
   ```bash
   git log --oneline origin/main..HEAD   # must be empty on main
   ```

3. **Main pushed to origin**
   ```bash
   git fetch origin main
   git diff origin/main..main            # must produce no output
   ```

---

## Deploy

Standard deploy path (Vercel auto-deploys on push to main):

```bash
git checkout main
git pull origin main
# Vercel auto-deploys; or trigger manually:
npx vercel --prod
```

---

## Post-deploy verification

### Step 1: Verify live commit via `/api/version`

```bash
curl -s https://www.trucore.xyz/api/version | python3 -m json.tool
```

Expected response shape:
```json
{
  "app": "trucore-site",
  "environment": "production",
  "git_commit": "<full-sha>",
  "build_time": "<iso-8601>",
  "vercel_env": "production",
  "deployment_id": "<vercel-deployment-id or null>"
}
```

Compare `git_commit` to `git rev-parse origin/main`.

### Step 2: Run the automated verification script

```bash
./scripts/verify_prod_site_deploy.sh
```

Or with an explicit expected commit:

```bash
./scripts/verify_prod_site_deploy.sh $(git rev-parse origin/main)
```

With optional page content check:

```bash
CHECK_PAGE="/verify-demo" \
EXPECT_STRINGS="The exact policy rules that were applied|The deterministic decision" \
./scripts/verify_prod_site_deploy.sh
```

### Step 3: Visual spot check

Open the target page in a browser and confirm rendering is correct.

---

## What counts as success

All of the following must be true:

- [ ] `git_commit` in `/api/version` matches `origin/main` HEAD
- [ ] `environment` is `"production"`
- [ ] Verification script exits 0
- [ ] Target page renders correctly (if applicable)

---

## Common false-positive failure modes

| Failure | Cause | Resolution |
|---------|-------|------------|
| Fix only in working tree | Changes never committed | `git add . && git commit` |
| Branch not merged | Feature branch not merged to main | Merge PR or `git merge` |
| Main not pushed | Local main ahead of origin | `git push origin main` |
| Vercel serving old deployment | Deploy not triggered or still building | Check Vercel dashboard; wait or redeploy |
| Preview checked instead of production | Hit preview URL instead of www | Use `https://www.trucore.xyz`, not preview URL |
| Live page cached but build metadata mismatches | CDN cache stale | Wait for propagation or purge cache |
| `git_commit` is null | Env vars not wired in build or running locally | Check `next.config.ts` env block and Vercel env settings |

---

## Fallback behavior

- If `VERCEL_GIT_COMMIT_SHA` is unavailable (e.g., local dev), `git_commit`
  will be `null`. The verification script treats null as a failure.
- In preview deployments, `environment` will be `"preview"`.
- The endpoint never exposes secrets, tokens, or PII.

---

## Environment variables used

| Variable | Source | Purpose |
|----------|--------|---------|
| `NEXT_PUBLIC_GIT_COMMIT` | Wired in `next.config.ts` from `VERCEL_GIT_COMMIT_SHA` | Commit SHA in build output |
| `NEXT_PUBLIC_BUILD_TIME` | Wired in `next.config.ts` at build time | ISO build timestamp |
| `VERCEL_GIT_COMMIT_SHA` | Provided by Vercel automatically | Git commit for the deployment |
| `VERCEL_ENV` | Provided by Vercel automatically | `production`, `preview`, or `development` |
| `VERCEL_DEPLOYMENT_ID` | Provided by Vercel automatically | Unique deployment identifier |
