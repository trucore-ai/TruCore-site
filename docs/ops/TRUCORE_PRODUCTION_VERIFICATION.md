# TruCore Production Verification — Unified Operator Workflow

## What This Verifies

A single pass/fail answer for the live production state of the TruCore system:

1. **Site deployment provenance** — is `www.trucore.xyz` serving the expected commit?
2. **Backend deployment provenance** — is `api.trucore.xyz` serving the expected commit?
3. **Backend health** — is the ATF backend healthy and accepting requests?
4. **Commit alignment** — do both live services match expected main branch HEADs?
5. **Page content** (optional) — do key public surfaces contain expected strings?

## Prerequisites

- `curl` installed
- Network access to `https://www.trucore.xyz` and `https://api.trucore.xyz`
- Local clone of `TruCore-site` (for auto-resolving site expected commit)
- Local clone of `agent-transaction-firewall` as a sibling directory (for auto-resolving backend expected commit)
- Both repos fetched from origin (`git fetch origin main`)

## Quick Start

```bash
cd /path/to/TruCore-site
./scripts/verify_trucore_prod.sh
```

This auto-resolves expected commits from both repos' `origin/main` and checks everything.

## Commands

### Unified (both repos)
```bash
# Auto-detect expected commits from local repos
./scripts/verify_trucore_prod.sh

# Explicit commits
./scripts/verify_trucore_prod.sh --site-commit abc123 --backend-commit def456

# Machine-readable JSON output
./scripts/verify_trucore_prod.sh --json

# With page content check
CHECK_PAGE="/verify-demo" \
EXPECT_STRINGS="deterministic decision|proof packet" \
./scripts/verify_trucore_prod.sh
```

### Site-only
```bash
cd /path/to/TruCore-site
./scripts/verify_prod_site_deploy.sh
```

### Backend-only
```bash
cd /path/to/agent-transaction-firewall
./scripts/verify_prod_backend_deploy.sh
```

## Required Order of Operations After Merges

### Site changes merged to main
1. `git checkout main && git pull origin main`
2. `npm run lint && npx vitest run && npm run build`
3. `npx vercel --prod`
4. Wait 30–60 seconds for Vercel propagation
5. `./scripts/verify_trucore_prod.sh`

### Backend changes merged to main
1. `git checkout main && git pull origin main`
2. Run tests: `cd firewall-api && python -m pytest -q`
3. SSH to VPS and pull/rebuild:
   ```
   ssh atf@<VPS_IP>
   cd ~/agent-transaction-firewall && git fetch origin main && git reset --hard origin/main
   cd deploy/vps
   # Update ATF_GIT_COMMIT in .env to new SHA
   docker compose up -d --build
   ```
4. Wait 15 seconds for container restart
5. `./scripts/verify_trucore_prod.sh`

### Both repos changed
Complete site deploy first, then backend deploy, then run unified verification.

## Handling Mismatches

### How to diagnose the problem

| Symptom | Likely Cause | Resolution |
|---------|-------------|------------|
| Site commit mismatch | Vercel deployed from wrong branch or stale cache | Run `npx vercel --prod` from merged main |
| Backend commit mismatch | VPS running old code | SSH to VPS, pull latest, rebuild containers, update `ATF_GIT_COMMIT` in `.env` |
| Backend `git_commit` is null | `ATF_GIT_COMMIT` not set in VPS `.env` | Add to `.env` and restart containers |
| Site `git_commit` is null | `NEXT_PUBLIC_GIT_COMMIT` not injected at build | Vercel should auto-inject from `VERCEL_GIT_COMMIT_SHA`; check Vercel dashboard |
| Backend health unhealthy | Service dependency failure | Check `/health/deps` and `/health/backends` for details |
| `/health/version` returns 404 | Old backend code without version endpoint | Redeploy with latest main |
| `/api/version` returns 404 | Old site code without version route | Redeploy with `npx vercel --prod` |
| Commit matches but page content wrong | Build cache or SSG stale | For site: force redeploy; for backend: rebuild containers |
| Connection refused | Service not running | Check Vercel dashboard (site) or docker compose status (backend) |

### Specific false-positive patterns already experienced

**Pattern: Local fix appears complete but production is wrong**
- Symptom: Tests pass locally, code looks correct, but live verification fails
- Cause: Branch merged locally but not pushed/deployed
- Resolution: Always push to origin and trigger deploy before claiming completion

**Pattern: Split repo verification gives false confidence**
- Symptom: Site verification passes alone, backend verification passes alone, but system is inconsistent
- Cause: Verifying repos independently without cross-checking both live
- Resolution: Use the unified script that checks both in one pass

## Success Criteria Checklist

After any production change, all of these must be true:

- [ ] `./scripts/verify_trucore_prod.sh` exits 0
- [ ] Site live commit matches `origin/main` of TruCore-site
- [ ] Backend live commit matches `origin/main` of agent-transaction-firewall
- [ ] Backend reports `healthy: true`
- [ ] No FAIL lines in script output
- [ ] If page content check enabled, all expected strings found

## Environment Variables

| Variable | Used By | Default | Purpose |
|----------|---------|---------|---------|
| `SITE_URL` | unified script | `https://www.trucore.xyz` | Site base URL |
| `BACKEND_URL` | unified + backend scripts | `https://api.trucore.xyz` | Backend base URL |
| `BACKEND_REPO` | unified script | auto-detect sibling | Path to backend repo |
| `CHECK_PAGE` | unified + site scripts | (empty) | Page path to content-check |
| `EXPECT_STRINGS` | unified + site scripts | (empty) | Pipe-separated expected strings |
| `ATF_GIT_COMMIT` | backend prod env | (empty) | Git SHA of deployed code |
| `ATF_BUILD_TIME` | backend prod env | (empty) | ISO-8601 build timestamp |
| `ATF_RELEASE_VERSION` | backend prod env | (from package) | Semver release tag |

## Fallback Behavior

- If `ATF_GIT_COMMIT` is not set on the VPS, `git_commit` will be `null` and verification fails (by design)
- If `VERCEL_GIT_COMMIT_SHA` is not available, `git_commit` will be `null` and site verification fails
- If `BACKEND_REPO` is not found and `--backend-commit` is not given, backend commit check fails
- If `CHECK_PAGE` is set but `EXPECT_STRINGS` is empty, content check is skipped with a warning
- Connection timeouts: 15 seconds per endpoint, 2 retries with 3-second delay
