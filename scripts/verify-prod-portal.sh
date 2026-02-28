#!/usr/bin/env sh

set -u

BASE_URL="${BASE_URL:-}"
PARTNER_PORTAL_TOKEN="${PARTNER_PORTAL_TOKEN:-}"

if [ -z "$BASE_URL" ]; then
  echo "FAIL: BASE_URL is required, example BASE_URL=https://trucore.xyz bash scripts/verify-prod-portal.sh" >&2
  exit 2
fi

BASE_URL="$(printf "%s" "$BASE_URL" | sed 's:/*$::')"

TMP_DIR="$(mktemp -d 2>/dev/null || mktemp -d -t portal-verify)"
COOKIE_JAR="$TMP_DIR/cookiejar.txt"

PASS_COUNT=0
FAIL_COUNT=0

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

http_status() {
  awk '/^HTTP\// { code=$2 } END { print code }' "$1"
}

header_last_value() {
  header_name="$2"
  tr -d '\r' < "$1" | grep -i "^${header_name}:[[:space:]]*" | tail -n 1 | sed 's/^[^:]*:[[:space:]]*//'
}

assert_header_contains() {
  file="$1"
  header_name="$2"
  expected="$3"
  label="$4"

  if grep -i "^${header_name}:[[:space:]]*" "$file" | grep -Fqi "$expected"; then
    pass "$label"
  else
    fail "$label (missing ${header_name} containing '${expected}')"
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

echo "Verifying portal protections for BASE_URL=$BASE_URL"

PORTAL_HEADERS="$TMP_DIR/portal.headers"

if run_curl "GET" "$BASE_URL/portal" "$PORTAL_HEADERS" "/dev/null"; then
  status="$(http_status "$PORTAL_HEADERS")"
  location="$(header_last_value "$PORTAL_HEADERS" "Location")"

  case "$status" in
    307|308)
      if printf "%s" "$location" | grep -Fq "/portal/login"; then
        pass "GET /portal returns ${status} redirect to /portal/login when unauthenticated"
      else
        fail "GET /portal returns ${status} but Location is not /portal/login (got '${location}')"
      fi
      ;;
    200)
      pass "GET /portal returns 200 (already authenticated context)"
      ;;
    *)
      fail "GET /portal returned unexpected status ${status}, expected 307/308 or 200"
      ;;
  esac

  assert_header_contains "$PORTAL_HEADERS" "X-Robots-Tag" "noindex" "GET /portal has X-Robots-Tag noindex"
  assert_header_contains "$PORTAL_HEADERS" "X-Robots-Tag" "nofollow" "GET /portal has X-Robots-Tag nofollow"
  assert_header_contains "$PORTAL_HEADERS" "Cache-Control" "no-store" "GET /portal has Cache-Control no-store"
fi

LOGIN_HEADERS="$TMP_DIR/login.headers"

if run_curl "GET" "$BASE_URL/portal/login" "$LOGIN_HEADERS" "/dev/null"; then
  login_status="$(http_status "$LOGIN_HEADERS")"

  if [ "$login_status" = "200" ]; then
    pass "GET /portal/login returns 200"
  else
    fail "GET /portal/login returned ${login_status}, expected 200"
  fi

  assert_header_contains "$LOGIN_HEADERS" "X-Robots-Tag" "noindex" "GET /portal/login has X-Robots-Tag noindex"
  assert_header_contains "$LOGIN_HEADERS" "X-Robots-Tag" "nofollow" "GET /portal/login has X-Robots-Tag nofollow"
  assert_header_contains "$LOGIN_HEADERS" "Cache-Control" "no-store" "GET /portal/login has Cache-Control no-store"
fi

if [ -n "$PARTNER_PORTAL_TOKEN" ]; then
  echo "Running optional authenticated flow checks"

  AUTH_LOGIN_HEADERS="$TMP_DIR/auth-login.headers"
  AUTH_LOGIN_BODY="$TMP_DIR/auth-login.body"

  if run_curl "POST" "$BASE_URL/portal/login" "$AUTH_LOGIN_HEADERS" "$AUTH_LOGIN_BODY" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    --data-urlencode "token=$PARTNER_PORTAL_TOKEN" \
    -c "$COOKIE_JAR" \
    -b "$COOKIE_JAR"; then

    auth_login_status="$(http_status "$AUTH_LOGIN_HEADERS")"
    auth_login_location="$(header_last_value "$AUTH_LOGIN_HEADERS" "Location")"
    session_cookie_line="$(grep -i '^set-cookie:' "$AUTH_LOGIN_HEADERS" | grep -i 'partner_portal_session=' | tail -n 1 | tr -d '\r')"

    if [ -n "$session_cookie_line" ]; then
      pass "POST /portal/login sets partner_portal_session cookie"
    else
      fail "POST /portal/login did not set partner_portal_session cookie"
    fi

    if [ "$auth_login_status" = "303" ]; then
      if printf "%s" "$auth_login_location" | grep -Fq "/portal"; then
        pass "POST /portal/login returns 303 redirect to /portal"
      else
        fail "POST /portal/login returned 303 but Location is '${auth_login_location}'"
      fi
    elif [ "$auth_login_status" = "200" ] && [ -n "$session_cookie_line" ]; then
      pass "POST /portal/login returns 200 with session cookie"
    else
      fail "POST /portal/login returned ${auth_login_status}, expected 303 redirect or 200 with Set-Cookie"
    fi

    if [ -n "$session_cookie_line" ]; then
      if printf "%s" "$session_cookie_line" | grep -Fqi "httponly"; then
        pass "Session cookie has HttpOnly"
      else
        fail "Session cookie missing HttpOnly"
      fi

      if printf "%s" "$session_cookie_line" | grep -Fqi "samesite=lax"; then
        pass "Session cookie has SameSite=Lax"
      else
        fail "Session cookie missing SameSite=Lax"
      fi

      if printf "%s" "$session_cookie_line" | grep -Fqi "path=/portal"; then
        pass "Session cookie has Path=/portal"
      else
        fail "Session cookie missing Path=/portal"
      fi

      if printf "%s" "$BASE_URL" | grep -qi '^https://'; then
        if printf "%s" "$session_cookie_line" | grep -Fqi "secure"; then
          pass "Session cookie has Secure on HTTPS"
        else
          fail "Session cookie missing Secure on HTTPS"
        fi
      else
        pass "Skipping Secure cookie assertion for non-HTTPS BASE_URL"
      fi
    fi
  fi

  AUTH_PORTAL_HEADERS="$TMP_DIR/auth-portal.headers"
  AUTH_PORTAL_BODY="$TMP_DIR/auth-portal.body"

  if run_curl "GET" "$BASE_URL/portal" "$AUTH_PORTAL_HEADERS" "$AUTH_PORTAL_BODY" -b "$COOKIE_JAR" -c "$COOKIE_JAR"; then
    auth_portal_status="$(http_status "$AUTH_PORTAL_HEADERS")"

    if [ "$auth_portal_status" = "200" ]; then
      pass "GET /portal with cookie jar returns 200"
    else
      fail "GET /portal with cookie jar returned ${auth_portal_status}, expected 200"
    fi

    if grep -Fq "Partner Portal" "$AUTH_PORTAL_BODY"; then
      pass "GET /portal body contains 'Partner Portal'"
    else
      fail "GET /portal body did not contain 'Partner Portal'"
    fi
  fi

  LOGOUT_HEADERS="$TMP_DIR/logout.headers"

  if run_curl "POST" "$BASE_URL/portal/logout" "$LOGOUT_HEADERS" "/dev/null" -b "$COOKIE_JAR" -c "$COOKIE_JAR"; then
    logout_status="$(http_status "$LOGOUT_HEADERS")"
    logout_location="$(header_last_value "$LOGOUT_HEADERS" "Location")"
    logout_cookie_line="$(grep -i '^set-cookie:' "$LOGOUT_HEADERS" | grep -i 'partner_portal_session=' | tail -n 1 | tr -d '\r')"

    if [ "$logout_status" = "303" ]; then
      pass "POST /portal/logout returns 303"
    else
      fail "POST /portal/logout returned ${logout_status}, expected 303"
    fi

    if printf "%s" "$logout_location" | grep -Fq "/portal/login"; then
      pass "POST /portal/logout redirects to /portal/login"
    else
      fail "POST /portal/logout redirect target was '${logout_location}', expected /portal/login"
    fi

    if [ -n "$logout_cookie_line" ]; then
      pass "POST /portal/logout sets partner_portal_session cookie"
      logout_cookie_lower="$(printf "%s" "$logout_cookie_line" | tr '[:upper:]' '[:lower:]')"
      if printf "%s" "$logout_cookie_lower" | grep -Fq "max-age=0"; then
        pass "Logout clears cookie with Max-Age=0"
      elif printf "%s" "$logout_cookie_lower" | grep -Eq 'expires=.*1970'; then
        pass "Logout clears cookie with past Expires"
      else
        fail "Logout cookie did not include Max-Age=0 or an expired Expires value"
      fi
    else
      fail "POST /portal/logout did not set partner_portal_session clearing cookie"
    fi
  fi

  POST_LOGOUT_HEADERS="$TMP_DIR/post-logout.headers"

  if run_curl "GET" "$BASE_URL/portal" "$POST_LOGOUT_HEADERS" "/dev/null" -b "$COOKIE_JAR" -c "$COOKIE_JAR"; then
    post_logout_status="$(http_status "$POST_LOGOUT_HEADERS")"
    post_logout_location="$(header_last_value "$POST_LOGOUT_HEADERS" "Location")"

    case "$post_logout_status" in
      303|307|308)
        if printf "%s" "$post_logout_location" | grep -Fq "/portal/login"; then
          pass "GET /portal after logout redirects to /portal/login"
        else
          fail "GET /portal after logout redirected to '${post_logout_location}', expected /portal/login"
        fi
        ;;
      *)
        fail "GET /portal after logout returned ${post_logout_status}, expected redirect to /portal/login"
        ;;
    esac
  fi
else
  echo "INFO: PARTNER_PORTAL_TOKEN not provided, skipping login/logout checks"
fi

echo "Summary: ${PASS_COUNT} passed, ${FAIL_COUNT} failed"

if [ "$FAIL_COUNT" -gt 0 ]; then
  exit 1
fi

exit 0