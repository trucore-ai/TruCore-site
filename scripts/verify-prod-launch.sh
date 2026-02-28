#!/usr/bin/env bash

set -u

BASE_URL="${BASE_URL:-https://trucore.xyz}"
ADMIN_KEY="${ADMIN_KEY:-}"
PARTNER_PORTAL_TOKEN="${PARTNER_PORTAL_TOKEN:-}"
REQUIRED_SIGNING_KEYS="${REQUIRED_SIGNING_KEYS:-0}"

BASE_URL="$(printf "%s" "$BASE_URL" | sed 's:/*$::')"

TMP_DIR="$(mktemp -d 2>/dev/null || mktemp -d -t launch-smoke)"
COOKIE_JAR="$TMP_DIR/cookies.txt"

PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0

cleanup() {
  rm -rf "$TMP_DIR"
}

trap cleanup EXIT INT TERM

pass() {
  PASS_COUNT=$((PASS_COUNT + 1))
  printf "PASS: %s\n" "$1"
}

fail() {
  FAIL_COUNT=$((FAIL_COUNT + 1))
  printf "FAIL: %s\n" "$1"
}

warn() {
  WARN_COUNT=$((WARN_COUNT + 1))
  printf "WARN: %s\n" "$1"
}

info() {
  printf "INFO: %s\n" "$1"
}

http_status() {
  awk '/^HTTP\// { code=$2 } END { print code }' "$1"
}

header_contains() {
  file="$1"
  header_name="$2"
  expected="$3"
  header_name_lc="$(printf "%s" "$header_name" | tr '[:upper:]' '[:lower:]')"
  expected_lc="$(printf "%s" "$expected" | tr '[:upper:]' '[:lower:]')"

  tr -d '\r' < "$file" \
    | tr '[:upper:]' '[:lower:]' \
    | grep -E "^${header_name_lc}:[[:space:]]*" \
    | grep -Fq "$expected_lc"
}

header_exists() {
  file="$1"
  header_name="$2"
  header_name_lc="$(printf "%s" "$header_name" | tr '[:upper:]' '[:lower:]')"
  tr -d '\r' < "$file" | tr '[:upper:]' '[:lower:]' | grep -Eq "^${header_name_lc}:[[:space:]]*"
}

assert_header_contains() {
  file="$1"
  header_name="$2"
  expected="$3"
  label="$4"

  if header_contains "$file" "$header_name" "$expected"; then
    pass "$label"
  else
    fail "$label (missing ${header_name} contains '${expected}')"
  fi
}

assert_header_exists() {
  file="$1"
  header_name="$2"
  label="$3"

  if header_exists "$file" "$header_name"; then
    pass "$label"
  else
    fail "$label (missing ${header_name})"
  fi
}

run_curl() {
  method="$1"
  url="$2"
  headers_file="$3"
  body_file="$4"
  shift 4

  if ! curl -sS -D "$headers_file" -o "$body_file" -X "$method" "$@" "$url"; then
    fail "Request failed: ${method} ${url}"
    return 1
  fi

  return 0
}

check_public_route_200() {
  path="$1"
  route_headers="$TMP_DIR/route_$(printf "%s" "$path" | sed 's#/#_#g').headers"

  if run_curl "GET" "$BASE_URL$path" "$route_headers" "/dev/null"; then
    status="$(http_status "$route_headers")"
    if [ "$status" = "200" ]; then
      pass "GET ${path} returns 200"
    else
      fail "GET ${path} returned ${status}, expected 200"
    fi
  fi
}

check_security_headers() {
  path="$1"
  route_headers="$TMP_DIR/security_$(printf "%s" "$path" | sed 's#/#_#g').headers"

  if run_curl "GET" "$BASE_URL$path" "$route_headers" "/dev/null"; then
    assert_header_exists "$route_headers" "Strict-Transport-Security" "GET ${path} has Strict-Transport-Security"
    assert_header_exists "$route_headers" "Content-Security-Policy" "GET ${path} has Content-Security-Policy"
    assert_header_exists "$route_headers" "X-Frame-Options" "GET ${path} has X-Frame-Options"
    assert_header_exists "$route_headers" "X-Content-Type-Options" "GET ${path} has X-Content-Type-Options"
    assert_header_exists "$route_headers" "Referrer-Policy" "GET ${path} has Referrer-Policy"
  fi
}

echo "Verifying launch readiness for BASE_URL=$BASE_URL"
echo "Mode: REQUIRED_SIGNING_KEYS=$REQUIRED_SIGNING_KEYS"

info "Checking launch-critical public routes"
for path in \
  / \
  /atf \
  /launch \
  /docs \
  /atf/simulator \
  /receipts \
  /verify \
  /status \
  /security/overview \
  /security/disclosure \
  /security/compliance; do
  check_public_route_200 "$path"
done

info "Checking security headers on / and /atf"
check_security_headers "/"
check_security_headers "/atf"

info "Checking noindex and no-store protections"
HEALTH_HEADERS="$TMP_DIR/health.headers"
HEALTH_BODY="$TMP_DIR/health.body"
if run_curl "GET" "$BASE_URL/api/health" "$HEALTH_HEADERS" "$HEALTH_BODY"; then
  assert_header_contains "$HEALTH_HEADERS" "X-Robots-Tag" "noindex" "GET /api/health has X-Robots-Tag noindex"
  assert_header_contains "$HEALTH_HEADERS" "X-Robots-Tag" "nofollow" "GET /api/health has X-Robots-Tag nofollow"
fi

for path in /portal /portal/login; do
  portal_headers="$TMP_DIR/portal_$(printf "%s" "$path" | sed 's#/#_#g').headers"
  if run_curl "GET" "$BASE_URL$path" "$portal_headers" "/dev/null"; then
    assert_header_contains "$portal_headers" "X-Robots-Tag" "noindex" "GET ${path} has X-Robots-Tag noindex"
    assert_header_contains "$portal_headers" "X-Robots-Tag" "nofollow" "GET ${path} has X-Robots-Tag nofollow"
    assert_header_contains "$portal_headers" "Cache-Control" "no-store" "GET ${path} has Cache-Control no-store"
  fi
done

info "Checking health and status API payload shape"
if [ -f "$HEALTH_BODY" ] && [ -f "$HEALTH_HEADERS" ]; then
  if grep -Eq '"ok"[[:space:]]*:[[:space:]]*true' "$HEALTH_BODY"; then
    pass "GET /api/health payload includes ok=true"
  else
    fail "GET /api/health payload missing ok=true"
  fi

  assert_header_contains "$HEALTH_HEADERS" "Cache-Control" "no-store" "GET /api/health has Cache-Control no-store"
fi

STATUS_HEADERS="$TMP_DIR/status.headers"
STATUS_BODY="$TMP_DIR/status.body"
if run_curl "GET" "$BASE_URL/api/status" "$STATUS_HEADERS" "$STATUS_BODY"; then
  if grep -Eq '"ok"[[:space:]]*:' "$STATUS_BODY" && grep -Eq '"ts"[[:space:]]*:' "$STATUS_BODY"; then
    pass "GET /api/status payload includes ok and ts"
  else
    fail "GET /api/status payload missing expected ok/ts fields"
  fi

  assert_header_contains "$STATUS_HEADERS" "Cache-Control" "no-store" "GET /api/status has Cache-Control no-store"
fi

info "Checking signing key availability endpoints"
RECEIPT_KEY_HEADERS="$TMP_DIR/receipt-key.headers"
RECEIPT_KEY_BODY="$TMP_DIR/receipt-key.body"
receipt_available="unknown"

if run_curl "GET" "$BASE_URL/api/receipt-signing-key" "$RECEIPT_KEY_HEADERS" "$RECEIPT_KEY_BODY"; then
  if grep -Eq '"available"[[:space:]]*:[[:space:]]*true' "$RECEIPT_KEY_BODY"; then
    receipt_available="true"
    pass "GET /api/receipt-signing-key reports available=true"
  elif grep -Eq '"available"[[:space:]]*:[[:space:]]*false' "$RECEIPT_KEY_BODY"; then
    receipt_available="false"
    if [ "$REQUIRED_SIGNING_KEYS" = "1" ]; then
      fail "GET /api/receipt-signing-key reports available=false in required mode"
    else
      warn "GET /api/receipt-signing-key reports available=false"
    fi
  else
    fail "GET /api/receipt-signing-key payload missing available field"
  fi
fi

WHITEPAPER_HEADERS="$TMP_DIR/whitepaper-signature.headers"
WHITEPAPER_BODY="$TMP_DIR/whitepaper-signature.body"
if run_curl "GET" "$BASE_URL/atf/whitepaper/signature" "$WHITEPAPER_HEADERS" "$WHITEPAPER_BODY"; then
  whitepaper_status="$(http_status "$WHITEPAPER_HEADERS")"
  has_sha="0"
  has_sig="0"

  if grep -Eq '"sha256"[[:space:]]*:[[:space:]]*"[a-f0-9]{64}"' "$WHITEPAPER_BODY"; then
    has_sha="1"
  fi
  if grep -Eq '"signature"[[:space:]]*:[[:space:]]*"[A-Za-z0-9+/=]+"' "$WHITEPAPER_BODY"; then
    has_sig="1"
  fi

  if [ "$whitepaper_status" = "200" ] && [ "$has_sha" = "1" ] && [ "$has_sig" = "1" ]; then
    pass "GET /atf/whitepaper/signature returns sha256 and signature"
  else
    if [ "$REQUIRED_SIGNING_KEYS" = "1" ]; then
      fail "GET /atf/whitepaper/signature not returning signatures in required mode (status=${whitepaper_status})"
    else
      warn "GET /atf/whitepaper/signature not returning signatures (status=${whitepaper_status})"
    fi
  fi
fi

info "Checking /api/verify-receipt format behavior"
VALID_HASH="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
INVALID_HASH="not-a-valid-hash"

VERIFY_VALID_HEADERS="$TMP_DIR/verify-valid.headers"
VERIFY_VALID_BODY="$TMP_DIR/verify-valid.body"
if run_curl "POST" "$BASE_URL/api/verify-receipt" "$VERIFY_VALID_HEADERS" "$VERIFY_VALID_BODY" \
  -H "Content-Type: application/json" \
  --data "{\"hash\":\"$VALID_HASH\",\"receipt_hash\":\"$VALID_HASH\"}"; then

  if grep -Eq '"format_valid"[[:space:]]*:[[:space:]]*true|"valid_format"[[:space:]]*:[[:space:]]*true' "$VERIFY_VALID_BODY"; then
    pass "POST /api/verify-receipt valid hash returns format_valid=true (or valid_format=true)"
  else
    fail "POST /api/verify-receipt valid hash missing expected true format field"
  fi
fi

VERIFY_INVALID_HEADERS="$TMP_DIR/verify-invalid.headers"
VERIFY_INVALID_BODY="$TMP_DIR/verify-invalid.body"
if run_curl "POST" "$BASE_URL/api/verify-receipt" "$VERIFY_INVALID_HEADERS" "$VERIFY_INVALID_BODY" \
  -H "Content-Type: application/json" \
  --data "{\"hash\":\"$INVALID_HASH\",\"receipt_hash\":\"$INVALID_HASH\"}"; then

  invalid_status="$(http_status "$VERIFY_INVALID_HEADERS")"
  if grep -Eq '"format_valid"[[:space:]]*:[[:space:]]*false|"valid_format"[[:space:]]*:[[:space:]]*false' "$VERIFY_INVALID_BODY"; then
    pass "POST /api/verify-receipt invalid hash returns format_valid=false (or valid_format=false)"
  elif [ "$invalid_status" = "400" ] && grep -Eq '"error"[[:space:]]*:[[:space:]]*"invalid_request"' "$VERIFY_INVALID_BODY"; then
    pass "POST /api/verify-receipt invalid hash rejected with stable invalid_request error"
  else
    fail "POST /api/verify-receipt invalid hash did not show expected invalid format/error behavior"
  fi
fi

info "Checking rate limit sanity on /api/status"
RATE_HEADERS_1="$TMP_DIR/rate-1.headers"
RATE_HEADERS_2="$TMP_DIR/rate-2.headers"
RATE_HEADERS_3="$TMP_DIR/rate-3.headers"

rate_fail=0
for i in 1 2 3; do
  headers_var="$TMP_DIR/rate-${i}.headers"
  body_var="$TMP_DIR/rate-${i}.body"
  if run_curl "GET" "$BASE_URL/api/status" "$headers_var" "$body_var"; then
    code="$(http_status "$headers_var")"
    case "$code" in
      5*)
        rate_fail=1
        fail "Rapid /api/status call ${i} returned ${code}"
        ;;
      *)
        pass "Rapid /api/status call ${i} returned ${code}"
        ;;
    esac
  else
    rate_fail=1
  fi
done

if [ "$rate_fail" = "0" ]; then
  if header_exists "$RATE_HEADERS_1" "X-RateLimit-Limit" || header_exists "$RATE_HEADERS_1" "X-RateLimit-Remaining" || header_exists "$RATE_HEADERS_1" "X-RateLimit-Reset"; then
    pass "X-RateLimit headers detected on /api/status"
  else
    pass "No X-RateLimit headers on /api/status, no 5xx observed"
  fi
fi

if [ -n "$ADMIN_KEY" ]; then
  info "Running optional admin checks"

  ADMIN_LOGIN_GET_HEADERS="$TMP_DIR/admin-login-get.headers"
  if run_curl "GET" "$BASE_URL/admin/login" "$ADMIN_LOGIN_GET_HEADERS" "/dev/null"; then
    login_get_status="$(http_status "$ADMIN_LOGIN_GET_HEADERS")"
    if [ "$login_get_status" = "200" ]; then
      pass "GET /admin/login returns 200"
    else
      fail "GET /admin/login returned ${login_get_status}, expected 200"
    fi
  fi

  ADMIN_LOGIN_POST_HEADERS="$TMP_DIR/admin-login-post.headers"
  ADMIN_LOGIN_POST_BODY="$TMP_DIR/admin-login-post.body"
  if run_curl "POST" "$BASE_URL/admin/login" "$ADMIN_LOGIN_POST_HEADERS" "$ADMIN_LOGIN_POST_BODY" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    --data-urlencode "key=$ADMIN_KEY" \
    -c "$COOKIE_JAR" \
    -b "$COOKIE_JAR"; then

    login_post_status="$(http_status "$ADMIN_LOGIN_POST_HEADERS")"
    if [ "$login_post_status" = "303" ] || [ "$login_post_status" = "200" ]; then
      pass "POST /admin/login accepted ADMIN_KEY"
    else
      fail "POST /admin/login returned ${login_post_status}, expected 303 or 200"
    fi

    if header_exists "$ADMIN_LOGIN_POST_HEADERS" "Set-Cookie"; then
      pass "POST /admin/login sets admin cookie"
    else
      warn "POST /admin/login did not include Set-Cookie"
    fi
  fi

  for path in /admin/audit /admin/csp; do
    admin_headers="$TMP_DIR/admin_$(printf "%s" "$path" | sed 's#/#_#g').headers"
    if run_curl "GET" "$BASE_URL$path" "$admin_headers" "/dev/null" -b "$COOKIE_JAR" -c "$COOKIE_JAR"; then
      admin_status="$(http_status "$admin_headers")"
      case "$admin_status" in
        200)
          pass "GET ${path} returns 200 with admin session"
          ;;
        303|307|308)
          warn "GET ${path} redirected (status ${admin_status}), verify ADMIN_KEY and DB availability"
          ;;
        *)
          fail "GET ${path} returned ${admin_status}, expected 200 or redirect"
          ;;
      esac
    fi
  done
else
  info "ADMIN_KEY not provided, skipping optional admin checks"
fi

if [ -n "$PARTNER_PORTAL_TOKEN" ]; then
  info "Running optional partner portal token checks"

  PORTAL_LOGIN_HEADERS="$TMP_DIR/portal-login-post.headers"
  PORTAL_LOGIN_BODY="$TMP_DIR/portal-login-post.body"
  if run_curl "POST" "$BASE_URL/portal/login" "$PORTAL_LOGIN_HEADERS" "$PORTAL_LOGIN_BODY" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    --data-urlencode "token=$PARTNER_PORTAL_TOKEN" \
    -c "$COOKIE_JAR" \
    -b "$COOKIE_JAR"; then

    portal_login_status="$(http_status "$PORTAL_LOGIN_HEADERS")"
    if [ "$portal_login_status" = "303" ] || [ "$portal_login_status" = "200" ]; then
      pass "POST /portal/login accepted PARTNER_PORTAL_TOKEN"
    else
      fail "POST /portal/login returned ${portal_login_status}, expected 303 or 200"
    fi
  fi
else
  info "PARTNER_PORTAL_TOKEN not provided, skipping optional portal token checks"
fi

echo "Summary: ${PASS_COUNT} passed, ${WARN_COUNT} warnings, ${FAIL_COUNT} failed"

if [ "$FAIL_COUNT" -gt 0 ]; then
  exit 1
fi

exit 0