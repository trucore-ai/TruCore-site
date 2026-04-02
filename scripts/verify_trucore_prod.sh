#!/usr/bin/env bash
# scripts/verify_trucore_prod.sh
#
# Unified fail-closed production verification for the TruCore system.
# Checks both TruCore-site (Vercel) and ATF backend (VPS) provenance,
# health, and optionally page content — in a single operator command.
#
# Usage:
#   ./scripts/verify_trucore_prod.sh
#   ./scripts/verify_trucore_prod.sh --site-commit <sha> --backend-commit <sha>
#   ./scripts/verify_trucore_prod.sh --json
#
# Environment overrides:
#   SITE_URL          — site base URL        (default: https://www.trucore.xyz)
#   BACKEND_URL       — backend base URL     (default: https://api.trucore.xyz)
#   BACKEND_REPO      — path to backend repo (default: auto-detect)
#   CHECK_PAGE        — optional site page path to content-check
#   EXPECT_STRINGS    — pipe-separated strings to assert on CHECK_PAGE
#
# Exit codes:
#   0  — all checks passed
#   1  — verification failed
#   2  — usage / prerequisite error

set -uo pipefail

# ── Defaults ────────────────────────────────────────────────────────────
SITE_URL="${SITE_URL:-https://www.trucore.xyz}"
SITE_URL="${SITE_URL%/}"
BACKEND_URL="${BACKEND_URL:-https://api.trucore.xyz}"
BACKEND_URL="${BACKEND_URL%/}"
CHECK_PAGE="${CHECK_PAGE:-}"
EXPECT_STRINGS="${EXPECT_STRINGS:-}"

# Try to locate backend repo relative to this script's repo
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SITE_REPO="$(cd "$SCRIPT_DIR/.." && pwd)"

if [ -z "${BACKEND_REPO:-}" ]; then
  # Try common sibling locations
  for candidate in \
    "$SITE_REPO/../agent-transaction-firewall" \
    "$HOME/repo/agent-transaction-firewall" \
    "$HOME/agent-transaction-firewall"; do
    if [ -d "$candidate/.git" ]; then
      BACKEND_REPO="$(cd "$candidate" && pwd)"
      break
    fi
  done
fi

# ── CLI argument parsing ────────────────────────────────────────────────
SITE_COMMIT=""
BACKEND_COMMIT=""
JSON_OUTPUT=false

while [ $# -gt 0 ]; do
  case "$1" in
    --site-commit)
      SITE_COMMIT="$2"; shift 2 ;;
    --backend-commit)
      BACKEND_COMMIT="$2"; shift 2 ;;
    --json)
      JSON_OUTPUT=true; shift ;;
    -h|--help)
      echo "Usage: $0 [--site-commit SHA] [--backend-commit SHA] [--json]"
      echo ""
      echo "Verifies both TruCore-site and ATF backend production deployments."
      echo "Fails non-zero on any mismatch or missing provenance metadata."
      exit 0 ;;
    *)
      echo "Unknown argument: $1"; exit 2 ;;
  esac
done

# ── Colors (disabled for --json) ────────────────────────────────────────
if [ "$JSON_OUTPUT" = true ]; then
  RED=''; GREEN=''; YELLOW=''; NC=''
else
  RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[0;33m'; NC='\033[0m'
fi

PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0
CHECKS=()
SITE_LIVE_COMMIT=""
BACKEND_LIVE_COMMIT=""

pass() {
  PASS_COUNT=$((PASS_COUNT + 1))
  CHECKS+=("PASS: $1")
  [ "$JSON_OUTPUT" = false ] && printf "${GREEN}PASS${NC}: %s\n" "$1"
}

fail() {
  FAIL_COUNT=$((FAIL_COUNT + 1))
  CHECKS+=("FAIL: $1")
  [ "$JSON_OUTPUT" = false ] && printf "${RED}FAIL${NC}: %s\n" "$1"
}

warn() {
  WARN_COUNT=$((WARN_COUNT + 1))
  CHECKS+=("WARN: $1")
  [ "$JSON_OUTPUT" = false ] && printf "${YELLOW}WARN${NC}: %s\n" "$1"
}

info() {
  [ "$JSON_OUTPUT" = false ] && printf "INFO: %s\n" "$1"
}

# ── Resolve expected commits ───────────────────────────────────────────
if [ -z "$SITE_COMMIT" ]; then
  if git -C "$SITE_REPO" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    git -C "$SITE_REPO" fetch origin main --quiet 2>/dev/null || true
    SITE_COMMIT="$(git -C "$SITE_REPO" rev-parse origin/main 2>/dev/null || git -C "$SITE_REPO" rev-parse HEAD)"
  else
    fail "Cannot resolve site expected commit — not in git repo and --site-commit not given"
  fi
fi

if [ -z "$BACKEND_COMMIT" ]; then
  if [ -n "${BACKEND_REPO:-}" ] && git -C "$BACKEND_REPO" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    git -C "$BACKEND_REPO" fetch origin main --quiet 2>/dev/null || true
    BACKEND_COMMIT="$(git -C "$BACKEND_REPO" rev-parse origin/main 2>/dev/null || git -C "$BACKEND_REPO" rev-parse HEAD)"
  else
    fail "Cannot resolve backend expected commit — BACKEND_REPO not found and --backend-commit not given"
  fi
fi

info "══════════════════════════════════════════════════════════════"
info "TruCore Unified Production Verification"
info "══════════════════════════════════════════════════════════════"
info "Site URL:             ${SITE_URL}"
info "Backend URL:          ${BACKEND_URL}"
info "Expected site commit: ${SITE_COMMIT:-UNRESOLVED}"
info "Expected backend commit: ${BACKEND_COMMIT:-UNRESOLVED}"
info ""

# ── Helper: fetch endpoint ──────────────────────────────────────────────
fetch_endpoint() {
  local url="$1"
  local outfile="$2"
  local code
  code=$(curl -s -o "$outfile" -w '%{http_code}' \
    --max-time 15 --retry 2 --retry-delay 3 \
    "$url" 2>/dev/null) || code="000"
  echo "$code"
}

# ── Extract JSON value (portable, no jq dependency) ────────────────────
json_str() {
  printf '%s' "$1" | grep -oP "\"$2\"\\s*:\\s*\"\\K[^\"]+" 2>/dev/null || echo ""
}

json_val() {
  printf '%s' "$1" | grep -oP "\"$2\"\\s*:\\s*\\K[^\",}]+" 2>/dev/null || echo ""
}

# ════════════════════════════════════════════════════════════════════════
# SECTION 1: SITE PROVENANCE
# ════════════════════════════════════════════════════════════════════════
info "── Site Provenance ──────────────────────────────────────────"

SITE_VERSION_CODE=$(fetch_endpoint "${SITE_URL}/api/version" /tmp/trucore_site_version.json)

if [ "$SITE_VERSION_CODE" != "200" ]; then
  fail "Site /api/version returned HTTP ${SITE_VERSION_CODE}"
else
  pass "Site /api/version reachable (HTTP 200)"

  SITE_BODY="$(cat /tmp/trucore_site_version.json)"
  SITE_LIVE_COMMIT="$(json_str "$SITE_BODY" "git_commit")"
  SITE_LIVE_APP="$(json_str "$SITE_BODY" "app")"
  SITE_LIVE_ENV="$(json_str "$SITE_BODY" "environment")"
  SITE_LIVE_BUILD="$(json_str "$SITE_BODY" "build_time")"

  if [ "$SITE_LIVE_APP" = "trucore-site" ]; then
    pass "Site app field is 'trucore-site'"
  else
    fail "Site app field is '${SITE_LIVE_APP}' (expected 'trucore-site')"
  fi

  if [ -z "$SITE_LIVE_COMMIT" ]; then
    fail "Site git_commit is missing or null"
  else
    pass "Site git_commit present: ${SITE_LIVE_COMMIT}"

    if [ -n "$SITE_COMMIT" ]; then
      if [ "${SITE_LIVE_COMMIT}" = "${SITE_COMMIT}" ] || \
         { [ "${SITE_LIVE_COMMIT:0:7}" = "${SITE_COMMIT:0:7}" ] && \
           [ "${#SITE_LIVE_COMMIT}" -ge 7 ] && [ "${#SITE_COMMIT}" -ge 7 ]; }; then
        pass "Site live commit matches expected"
      else
        fail "SITE COMMIT MISMATCH: expected=${SITE_COMMIT} live=${SITE_LIVE_COMMIT}"
      fi
    fi
  fi

  [ -n "$SITE_LIVE_ENV" ] && info "Site environment: ${SITE_LIVE_ENV}"
  [ -n "$SITE_LIVE_BUILD" ] && info "Site build_time: ${SITE_LIVE_BUILD}"
fi

info ""

# ════════════════════════════════════════════════════════════════════════
# SECTION 2: BACKEND HEALTH
# ════════════════════════════════════════════════════════════════════════
info "── Backend Health ────────────────────────────────────────────"

BACKEND_HEALTH_CODE=$(fetch_endpoint "${BACKEND_URL}/health" /tmp/trucore_backend_health.json)

if [ "$BACKEND_HEALTH_CODE" != "200" ]; then
  fail "Backend /health returned HTTP ${BACKEND_HEALTH_CODE}"
else
  HEALTH_BODY="$(cat /tmp/trucore_backend_health.json)"
  HEALTH_STATUS="$(json_str "$HEALTH_BODY" "status")"
  HEALTHY_FLAG="$(json_val "$HEALTH_BODY" "healthy")"

  if [ "$HEALTH_STATUS" = "ok" ] && [ "$HEALTHY_FLAG" = "true" ]; then
    pass "Backend health check passed (status=ok, healthy=true)"
  else
    fail "Backend health: status=${HEALTH_STATUS}, healthy=${HEALTHY_FLAG}"
  fi
fi

info ""

# ════════════════════════════════════════════════════════════════════════
# SECTION 3: BACKEND PROVENANCE
# ════════════════════════════════════════════════════════════════════════
info "── Backend Provenance ────────────────────────────────────────"

BACKEND_VERSION_CODE=$(fetch_endpoint "${BACKEND_URL}/health/version" /tmp/trucore_backend_version.json)

if [ "$BACKEND_VERSION_CODE" != "200" ]; then
  fail "Backend /health/version returned HTTP ${BACKEND_VERSION_CODE}"
else
  pass "Backend /health/version reachable (HTTP 200)"

  BACKEND_BODY="$(cat /tmp/trucore_backend_version.json)"

  # Backend response has result wrapper: {"status":"ok","result":{"app":...}}
  BACKEND_LIVE_COMMIT="$(json_str "$BACKEND_BODY" "git_commit")"
  BACKEND_LIVE_APP="$(json_str "$BACKEND_BODY" "app")"
  BACKEND_LIVE_BUILD="$(json_str "$BACKEND_BODY" "build_time")"
  BACKEND_LIVE_VERSION="$(json_str "$BACKEND_BODY" "release_version")"

  if [ "$BACKEND_LIVE_APP" = "agent-transaction-firewall" ]; then
    pass "Backend app field is 'agent-transaction-firewall'"
  else
    fail "Backend app field is '${BACKEND_LIVE_APP}' (expected 'agent-transaction-firewall')"
  fi

  if [ -z "$BACKEND_LIVE_COMMIT" ]; then
    fail "Backend git_commit is missing or null"
  else
    pass "Backend git_commit present: ${BACKEND_LIVE_COMMIT}"

    if [ -n "$BACKEND_COMMIT" ]; then
      if [ "${BACKEND_LIVE_COMMIT}" = "${BACKEND_COMMIT}" ] || \
         { [ "${BACKEND_LIVE_COMMIT:0:7}" = "${BACKEND_COMMIT:0:7}" ] && \
           [ "${#BACKEND_LIVE_COMMIT}" -ge 7 ] && [ "${#BACKEND_COMMIT}" -ge 7 ]; }; then
        pass "Backend live commit matches expected"
      else
        fail "BACKEND COMMIT MISMATCH: expected=${BACKEND_COMMIT} live=${BACKEND_LIVE_COMMIT}"
      fi
    fi
  fi

  [ -n "$BACKEND_LIVE_BUILD" ] && info "Backend build_time: ${BACKEND_LIVE_BUILD}"
  [ -n "$BACKEND_LIVE_VERSION" ] && info "Backend release_version: ${BACKEND_LIVE_VERSION}"
fi

info ""

# ════════════════════════════════════════════════════════════════════════
# SECTION 4: OPTIONAL PAGE CONTENT CHECK
# ════════════════════════════════════════════════════════════════════════
if [ -n "$CHECK_PAGE" ] && [ -n "$EXPECT_STRINGS" ]; then
  info "── Page Content Check ──────────────────────────────────────"

  PAGE_BODY=$(curl -sL --max-time 15 "${SITE_URL}${CHECK_PAGE}" 2>/dev/null) || {
    fail "Could not fetch ${SITE_URL}${CHECK_PAGE}"
    PAGE_BODY=""
  }

  if [ -n "$PAGE_BODY" ]; then
    IFS='|' read -ra STRINGS <<< "$EXPECT_STRINGS"
    for expected_str in "${STRINGS[@]}"; do
      if printf '%s' "$PAGE_BODY" | grep -qF "$expected_str"; then
        pass "Page contains: '${expected_str}'"
      else
        fail "Page MISSING: '${expected_str}'"
      fi
    done
  fi
  info ""
elif [ -n "$CHECK_PAGE" ]; then
  warn "CHECK_PAGE set but EXPECT_STRINGS empty — skipping content check"
fi

# ════════════════════════════════════════════════════════════════════════
# SUMMARY
# ════════════════════════════════════════════════════════════════════════
OVERALL="PASS"
if [ "$FAIL_COUNT" -gt 0 ]; then
  OVERALL="FAIL"
fi

if [ "$JSON_OUTPUT" = true ]; then
  # Machine-readable JSON summary
  CHECKS_JSON="["
  first=true
  for c in "${CHECKS[@]}"; do
    [ "$first" = true ] && first=false || CHECKS_JSON+=","
    # Escape the string for JSON
    escaped="$(printf '%s' "$c" | sed 's/"/\\"/g')"
    CHECKS_JSON+="\"${escaped}\""
  done
  CHECKS_JSON+="]"

  cat <<EOF
{
  "overall": "${OVERALL}",
  "pass_count": ${PASS_COUNT},
  "fail_count": ${FAIL_COUNT},
  "warn_count": ${WARN_COUNT},
  "site_url": "${SITE_URL}",
  "backend_url": "${BACKEND_URL}",
  "expected_site_commit": "${SITE_COMMIT:-null}",
  "expected_backend_commit": "${BACKEND_COMMIT:-null}",
  "live_site_commit": "${SITE_LIVE_COMMIT:-null}",
  "live_backend_commit": "${BACKEND_LIVE_COMMIT:-null}",
  "checks": ${CHECKS_JSON}
}
EOF
else
  echo ""
  echo "════════════════════════════════════════════════════════════════"
  printf "TruCore Production: ${GREEN}%d passed${NC}, ${RED}%d failed${NC}, ${YELLOW}%d warnings${NC}\n" \
    "$PASS_COUNT" "$FAIL_COUNT" "$WARN_COUNT"
  echo "════════════════════════════════════════════════════════════════"

  if [ "$FAIL_COUNT" -gt 0 ]; then
    printf "\n${RED}TRUCORE PRODUCTION VERIFICATION FAILED${NC}\n"
  else
    printf "\n${GREEN}TRUCORE PRODUCTION VERIFICATION PASSED${NC}\n"
  fi
fi

if [ "$FAIL_COUNT" -gt 0 ]; then
  exit 1
fi
exit 0
