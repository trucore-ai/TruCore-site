#!/usr/bin/env bash
# scripts/deploy_trucore_prod.sh
#
# Fail-closed production deploy for the TruCore system.
# Injects provenance metadata automatically, deploys backend (VPS via SSH)
# and/or site (Vercel), then immediately runs unified verification.
# Exits non-zero if verification fails — THIS IS THE ONLY APPROVED DEPLOY METHOD.
#
# Usage:
#   ./scripts/deploy_trucore_prod.sh              # deploy both (default)
#   ./scripts/deploy_trucore_prod.sh --site       # site only
#   ./scripts/deploy_trucore_prod.sh --backend    # backend only
#   ./scripts/deploy_trucore_prod.sh --all        # explicit both
#
# Environment overrides:
#   BACKEND_REPO    — path to agent-transaction-firewall repo (default: ../agent-transaction-firewall)
#   VPS_HOST        — VPS IP or hostname (required for backend deploy)
#   VPS_USER        — VPS SSH user (default: atf)
#   VPS_DEPLOY_DIR  — remote deploy dir (default: ~/atf-prod)
#   SKIP_VERIFY     — set to "true" to skip post-deploy verification (NOT recommended)
#   VERIFY_WAIT     — seconds to wait before verification (default: 20)
#
# Exit codes:
#   0 — deploy + verification passed
#   1 — deploy or verification failed
#   2 — usage / prerequisite error

set -euo pipefail

# ── Colors ──────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BOLD='\033[1m'
NC='\033[0m'

banner()  { printf "\n${BOLD}=== %s ===${NC}\n\n" "$1"; }
step()    { printf "${GREEN}▸${NC} %s\n" "$1"; }
warn_msg(){ printf "${YELLOW}WARN${NC}: %s\n" "$1"; }
die()     { printf "${RED}FATAL${NC}: %s\n" "$1" >&2; exit "${2:-1}"; }

# ── Paths ───────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SITE_REPO="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_REPO="${BACKEND_REPO:-../agent-transaction-firewall}"

# Resolve backend to absolute path
if [ -d "$BACKEND_REPO" ]; then
  BACKEND_REPO="$(cd "$BACKEND_REPO" && pwd)"
elif [ -d "$SITE_REPO/../agent-transaction-firewall" ]; then
  BACKEND_REPO="$(cd "$SITE_REPO/../agent-transaction-firewall" && pwd)"
else
  die "Cannot find backend repo at '$BACKEND_REPO'. Set BACKEND_REPO env var." 2
fi

# ── VPS config ──────────────────────────────────────────────────────────
VPS_HOST="${VPS_HOST:-}"
VPS_USER="${VPS_USER:-atf}"
VPS_DEPLOY_DIR="${VPS_DEPLOY_DIR:-~/atf-prod}"
VERIFY_WAIT="${VERIFY_WAIT:-20}"
SKIP_VERIFY="${SKIP_VERIFY:-false}"

# ── Arg parsing ─────────────────────────────────────────────────────────
DEPLOY_SITE=false
DEPLOY_BACKEND=false

if [ $# -eq 0 ]; then
  DEPLOY_SITE=true
  DEPLOY_BACKEND=true
else
  for arg in "$@"; do
    case "$arg" in
      --site)    DEPLOY_SITE=true ;;
      --backend) DEPLOY_BACKEND=true ;;
      --all)     DEPLOY_SITE=true; DEPLOY_BACKEND=true ;;
      -h|--help)
        echo "Usage: $0 [--site] [--backend] [--all]"
        echo ""
        echo "Fail-closed production deploy with auto provenance injection."
        echo "Deploys both site + backend by default."
        exit 0 ;;
      *) die "Unknown argument: $arg" 2 ;;
    esac
  done
fi

# ── Capture provenance ──────────────────────────────────────────────────
banner "TruCore Production Deploy (Fail-Closed)"

SITE_COMMIT="$(git -C "$SITE_REPO" rev-parse HEAD)"
BACKEND_COMMIT="$(git -C "$BACKEND_REPO" rev-parse HEAD)"
BUILD_TIME="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
RELEASE_VERSION="$(cat "$BACKEND_REPO/VERSION" 2>/dev/null || echo "unknown")"

step "Site repo:       $SITE_REPO"
step "Backend repo:    $BACKEND_REPO"
step "Site commit:     $SITE_COMMIT"
step "Backend commit:  $BACKEND_COMMIT"
step "Build time:      $BUILD_TIME"
step "Release version: $RELEASE_VERSION"
echo ""

if [ "$DEPLOY_SITE" = true ]; then step "Will deploy: SITE (Vercel)"; fi
if [ "$DEPLOY_BACKEND" = true ]; then step "Will deploy: BACKEND (VPS)"; fi
echo ""

# ════════════════════════════════════════════════════════════════════════
# DEPLOY SITE (VERCEL)
# ════════════════════════════════════════════════════════════════════════
if [ "$DEPLOY_SITE" = true ]; then
  banner "Deploying Site to Vercel"

  cd "$SITE_REPO"

  # Inject provenance as build-time env vars
  export NEXT_PUBLIC_GIT_COMMIT="$SITE_COMMIT"
  export NEXT_PUBLIC_BUILD_TIME="$BUILD_TIME"

  step "NEXT_PUBLIC_GIT_COMMIT=$SITE_COMMIT"
  step "NEXT_PUBLIC_BUILD_TIME=$BUILD_TIME"
  step "Running: npx vercel --prod"
  echo ""

  npx vercel --prod || die "Vercel deploy failed"

  step "Site deploy complete"
  echo ""
fi

# ════════════════════════════════════════════════════════════════════════
# DEPLOY BACKEND (VPS via SSH)
# ════════════════════════════════════════════════════════════════════════
if [ "$DEPLOY_BACKEND" = true ]; then
  banner "Deploying Backend to VPS"

  if [ -z "$VPS_HOST" ]; then
    die "VPS_HOST is required for backend deploy. Export VPS_HOST=<ip-or-hostname>" 2
  fi

  VPS_TARGET="${VPS_USER}@${VPS_HOST}"
  step "VPS target: $VPS_TARGET"
  step "Deploy dir: $VPS_DEPLOY_DIR"

  # Build the remote command sequence
  REMOTE_CMD="$(cat <<REMOTE_SCRIPT
set -euo pipefail

cd $VPS_DEPLOY_DIR

echo "Pulling latest code..."
git -C \$(readlink -f ../../) pull --ff-only origin main || {
  echo "WARN: git pull failed — continuing with current code"
}

echo "Injecting provenance into .env..."

# Helper: update or append an env var in .env
update_env() {
  local key="\$1" val="\$2" file="deploy/vps/.env"
  if grep -q "^\${key}=" "\$file" 2>/dev/null; then
    sed -i "s|^\${key}=.*|\${key}=\${val}|" "\$file"
  else
    echo "\${key}=\${val}" >> "\$file"
  fi
}

cd \$(readlink -f ../../)
update_env "ATF_GIT_COMMIT" "$BACKEND_COMMIT"
update_env "ATF_BUILD_TIME" "$BUILD_TIME"
update_env "ATF_RELEASE_VERSION" "$RELEASE_VERSION"

echo "Rebuilding containers..."
cd deploy/vps
docker compose down
docker compose build --no-cache
docker compose up -d

echo "Backend deploy complete on VPS"
REMOTE_SCRIPT
)"

  step "Executing remote deploy sequence..."
  echo ""

  ssh -o ConnectTimeout=15 \
      -o ServerAliveInterval=30 \
      -o ServerAliveCountMax=3 \
      "$VPS_TARGET" "$REMOTE_CMD" || die "Backend VPS deploy failed"

  step "Backend deploy complete"
  echo ""
fi

# ════════════════════════════════════════════════════════════════════════
# POST-DEPLOY VERIFICATION (FAIL-CLOSED)
# ════════════════════════════════════════════════════════════════════════
if [ "$SKIP_VERIFY" = "true" ]; then
  warn_msg "SKIP_VERIFY=true — skipping post-deploy verification (NOT recommended)"
  banner "DEPLOY COMPLETE (UNVERIFIED)"
  exit 0
fi

banner "Post-Deploy Verification"

step "Waiting ${VERIFY_WAIT}s for services to stabilize..."
sleep "$VERIFY_WAIT"

# Build verification args based on what we deployed
VERIFY_ARGS=()
if [ "$DEPLOY_SITE" = true ]; then
  VERIFY_ARGS+=("--site-commit" "$SITE_COMMIT")
fi
if [ "$DEPLOY_BACKEND" = true ]; then
  VERIFY_ARGS+=("--backend-commit" "$BACKEND_COMMIT")
fi

step "Running: scripts/verify_trucore_prod.sh ${VERIFY_ARGS[*]}"
echo ""

cd "$SITE_REPO"
BACKEND_REPO="$BACKEND_REPO" \
  bash scripts/verify_trucore_prod.sh "${VERIFY_ARGS[@]}"

VERIFY_EXIT=$?

if [ "$VERIFY_EXIT" -ne 0 ]; then
  die "POST-DEPLOY VERIFICATION FAILED (exit $VERIFY_EXIT) — DEPLOY IS NOT CONFIRMED SAFE" 1
fi

banner "DEPLOY SUCCESSFULLY VERIFIED"
