#!/usr/bin/env bash
# scripts/verify_prod_site_deploy.sh
#
# Fail-closed verification that production is serving the expected commit.
#
# Usage:
#   ./scripts/verify_prod_site_deploy.sh [EXPECTED_COMMIT]
#
# If EXPECTED_COMMIT is omitted, uses the current HEAD of origin/main.
#
# Environment overrides:
#   PROD_URL       — production base URL (default: https://www.trucore.xyz)
#   CHECK_PAGE     — optional page path to content-check (e.g. /verify-demo)
#   EXPECT_STRINGS — pipe-separated strings to assert on CHECK_PAGE
#
# Exit codes:
#   0  — all checks passed
#   1  — verification failed (mismatch, missing metadata, content failure)
#   2  — usage / prerequisite error

set -euo pipefail

PROD_URL="${PROD_URL:-https://www.trucore.xyz}"
PROD_URL="${PROD_URL%/}"
VERSION_ENDPOINT="${PROD_URL}/api/version"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

PASS_COUNT=0
FAIL_COUNT=0

pass() {
  PASS_COUNT=$((PASS_COUNT + 1))
  printf "${GREEN}PASS${NC}: %s\n" "$1"
}

fail() {
  FAIL_COUNT=$((FAIL_COUNT + 1))
  printf "${RED}FAIL${NC}: %s\n" "$1"
}

warn() {
  printf "${YELLOW}WARN${NC}: %s\n" "$1"
}

info() {
  printf "INFO: %s\n" "$1"
}

# ── Resolve expected commit ────────────────────────────────────────────
if [ $# -ge 1 ]; then
  EXPECTED_COMMIT="$1"
else
  if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo "ERROR: Not in a git repo and no EXPECTED_COMMIT argument provided."
    exit 2
  fi
  git fetch origin main --quiet 2>/dev/null || true
  EXPECTED_COMMIT="$(git rev-parse origin/main 2>/dev/null || git rev-parse HEAD)"
fi

info "Expected commit: ${EXPECTED_COMMIT}"
info "Production URL:  ${PROD_URL}"
info "Version endpoint: ${VERSION_ENDPOINT}"
echo ""

# ── Fetch version endpoint ─────────────────────────────────────────────
HTTP_CODE=$(curl -s -o /tmp/atf_version_response.json -w '%{http_code}' \
  --max-time 15 \
  --retry 2 \
  --retry-delay 3 \
  "${VERSION_ENDPOINT}" 2>/dev/null) || {
  fail "Could not reach ${VERSION_ENDPOINT}"
  exit 1
}

if [ "$HTTP_CODE" != "200" ]; then
  fail "Version endpoint returned HTTP ${HTTP_CODE}"
  cat /tmp/atf_version_response.json 2>/dev/null || true
  exit 1
fi

pass "Version endpoint reachable (HTTP 200)"

# ── Parse response ──────────────────────────────────────────────────────
RESPONSE="$(cat /tmp/atf_version_response.json)"
info "Response: ${RESPONSE}"
echo ""

# Extract git_commit from JSON (portable, no jq dependency)
LIVE_COMMIT="$(printf '%s' "$RESPONSE" | grep -oP '"git_commit"\s*:\s*"\K[^"]+' || echo "")"
LIVE_APP="$(printf '%s' "$RESPONSE" | grep -oP '"app"\s*:\s*"\K[^"]+' || echo "")"
LIVE_ENV="$(printf '%s' "$RESPONSE" | grep -oP '"environment"\s*:\s*"\K[^"]+' || echo "")"
LIVE_BUILD_TIME="$(printf '%s' "$RESPONSE" | grep -oP '"build_time"\s*:\s*"\K[^"]+' || echo "")"

# ── Validate fields ────────────────────────────────────────────────────
if [ -z "$LIVE_COMMIT" ]; then
  fail "git_commit is missing or null in version response"
  exit 1
fi
pass "git_commit present: ${LIVE_COMMIT}"

if [ "$LIVE_APP" = "trucore-site" ]; then
  pass "app field is 'trucore-site'"
else
  fail "app field is '${LIVE_APP}' (expected 'trucore-site')"
fi

if [ -n "$LIVE_ENV" ]; then
  info "environment: ${LIVE_ENV}"
else
  warn "environment field is empty or null"
fi

if [ -n "$LIVE_BUILD_TIME" ]; then
  info "build_time: ${LIVE_BUILD_TIME}"
else
  warn "build_time is empty or null"
fi

# ── Commit comparison ──────────────────────────────────────────────────
# Compare using prefix match (short SHA to full SHA is valid)
EXPECTED_SHORT="${EXPECTED_COMMIT:0:40}"
LIVE_SHORT="${LIVE_COMMIT:0:40}"

if [ "${LIVE_COMMIT}" = "${EXPECTED_COMMIT}" ] || \
   [ "${LIVE_COMMIT:0:7}" = "${EXPECTED_COMMIT:0:7}" ] && \
   [ "${#LIVE_COMMIT}" -ge 7 ] && [ "${#EXPECTED_COMMIT}" -ge 7 ]; then
  pass "Live commit matches expected commit"
else
  fail "COMMIT MISMATCH"
  printf "  Expected: %s\n" "$EXPECTED_COMMIT"
  printf "  Live:     %s\n" "$LIVE_COMMIT"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi

# ── Optional page content check ────────────────────────────────────────
CHECK_PAGE="${CHECK_PAGE:-}"
EXPECT_STRINGS="${EXPECT_STRINGS:-}"

if [ -n "$CHECK_PAGE" ] && [ -n "$EXPECT_STRINGS" ]; then
  echo ""
  info "Checking page content: ${PROD_URL}${CHECK_PAGE}"

  PAGE_BODY=$(curl -sL --max-time 15 "${PROD_URL}${CHECK_PAGE}" 2>/dev/null) || {
    fail "Could not fetch ${PROD_URL}${CHECK_PAGE}"
    exit 1
  }

  IFS='|' read -ra STRINGS <<< "$EXPECT_STRINGS"
  for expected_str in "${STRINGS[@]}"; do
    if printf '%s' "$PAGE_BODY" | grep -qF "$expected_str"; then
      pass "Page contains: '${expected_str}'"
    else
      fail "Page MISSING: '${expected_str}'"
    fi
  done
elif [ -n "$CHECK_PAGE" ]; then
  warn "CHECK_PAGE set but EXPECT_STRINGS empty — skipping content check"
fi

# ── Summary ─────────────────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════"
printf "Results: ${GREEN}%d passed${NC}, ${RED}%d failed${NC}\n" "$PASS_COUNT" "$FAIL_COUNT"
echo "════════════════════════════════════════"

if [ "$FAIL_COUNT" -gt 0 ]; then
  printf "\n${RED}DEPLOY VERIFICATION FAILED${NC}\n"
  exit 1
fi

printf "\n${GREEN}DEPLOY VERIFICATION PASSED${NC}\n"
exit 0
