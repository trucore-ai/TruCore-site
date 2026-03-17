# Security Hardening Phase — Closeout & Launch-Readiness

## 1. Overview

Prompts 31–63 hardened TruCore-site across five areas:

- **Admin / control-plane**: fail-closed auth, session lifecycle, degraded rendering, CSRF enforcement, audit logging
- **Public API surface**: per-route rate limiting, response-shape normalization, cache-header hardening, sensitive-info leak prevention
- **Abuse controls**: IP hashing (no raw storage), login throttle, Retry-After semantics, per-route buckets
- **Security observability**: Prometheus-format counters+gauges, structured security logging, admin telemetry UI with auto-refresh
- **Regression coverage**: perimeter regression suite, banned-pattern scanning, unit tests for every security module

All changes are operator-facing. No marketing features were introduced.


## 2. Admin / Control-Plane Protections

### Authentication & sessions

| Property | Value |
|---|---|
| Token signing | HMAC-SHA256 via `createHmac('sha256', secret)` |
| Comparison | `timingSafeEqual()` (constant-time) |
| Cookie flags | HttpOnly, Secure (prod), SameSite=strict, path=/admin |
| Absolute lifetime | 3 600 s (1 hour) |
| Idle timeout | 900 s (15 min) |
| Last-seen throttle | 60 s (avoids write amplification) |
| GC interval | 300 s (opportunistic) |
| Revoked retention | 2× max age (reuse detection) |

Session store: in-memory `Map<token, {issuedAt, lastSeenAt, revokedAt}>`. Tokens are never logged or exposed in URLs.

### Fail-closed enforcement layers

1. **Middleware** (`middleware.ts`) — checks cookie presence on `/admin/*`; missing cookie → redirect to `/admin/login`. Runs on edge runtime.
2. **Layout guard** (`app/admin/layout.tsx`) — calls `getAdminSessionFromCookies()` before rendering any admin page. Invalid session → redirect.
3. **API wrapper** (`lib/admin-api-auth.ts` / `withAdminApiAuth()`) — validates session + CSRF origin on mutations. Denial returns generic **404** (not 401).
4. **Server-action wrapper** (`lib/admin-action-auth.ts` / `withAdminAction()`) — validates session; catches inner errors and returns `{ error: "temporarily_unavailable" }`.

### Error leakage guarantees

- Auth denial: always 404, never 401/403
- Inner errors: `admin_action_degraded` / `admin_api_degraded` logged; response is `{ error: "temporarily_unavailable" }`
- No stack traces, DSN, SQL, or internal URLs exposed

### Degraded rendering

Known admin pages (`waitlist`, `csp`, `usage`, `metrics`, `audit`, `acquisition`, `keys`) render `AdminDegradedState` when the database or upstream is unavailable. Degraded events are counted per page via an allowlisted map.

### Login flow hardening

- CSRF Origin check (`isOriginValid()`)
- Per-IP login throttle: 5 failures in 10 min → 15 min cooldown
- Constant-time key validation (`isAdminKeyValid()`)
- POST returns 303 See Other (redirect, not 200)
- Inline HTML form (no external script/style deps)

### Audit log

Persisted to `admin_audit_log` table. Fields: `id`, `created_at`, `action`, `target_email`, `metadata`. Never stores secrets. Failures swallowed so audit never breaks flows. Bounded read: clamped to 1–200 entries (default 50).

### Key principles

- **Zero-trust backend failures**: every layer independently validates; if any upstream is unreachable the response is safe-static.
- **Safe operator-facing states only**: the admin never sees raw exceptions, stack traces, or database errors.


## 3. Public API Surface Protections

### Rate limiting

All limits are **process-local** sliding-window, implemented in `lib/rate-limit.ts`.

| Route | Key | Limit | Window |
|---|---|---|---|
| `/api/simulate` (public) | `simulate:public:${sha256(ip)}` | 30 req | 60 s |
| `/api/simulate` (keyed) | `simulate:key:${apiKeyId}` | 120 req | 60 s |
| `/api/public-metrics` | `public-metrics:${sha256(ip)}` | 30 req | 60 s |
| `/api/health` | `health:${sha256(ip)}` | 60 req | 60 s |

Dual-tier on `/api/simulate`: unauthenticated callers hit the public tier; requests with a valid API key get the higher tier.

### Response headers

- `Cache-Control: no-store` on all admin API, rate-limited, and public endpoint responses
- `X-Content-Type-Options: nosniff` on admin API responses
- `Referrer-Policy: same-origin` on admin API responses

### Response-shape normalization

All public JSON responses follow the same contract:

```json
{ "ok": false, "error": "firewall_api_error", "message": "..." }
```

No raw exception objects, framework errors, or upstream details are ever returned.

### Sensitive-info leak removal

- Database errors → sanitized `firewall_api_error`
- Network timeouts → `firewall_api_unreachable` (502)
- Misconfiguration → `firewall_api_unconfigured` (503)
- Firewall upstream timeout: 8 000 ms hard cap


## 4. Abuse Protection Model

### IP hashing

Raw IPs are **never stored or logged**. Two hash forms are used:

| Context | Hash | Length |
|---|---|---|
| Rate-limit bucket keys | `sha256(ip)` | full |
| Login throttle keys | `sha256(ip).slice(0, 16)` | 16 hex chars |
| Log fingerprints | `sha256(ip).slice(0, 12)` | 12 hex chars |

IP extraction (`lib/security/origin.ts`): `x-forwarded-for` (first entry) → `x-real-ip` → `"unknown"`.

### Per-route rate limits

See table in §3. Each route has its own bucket namespace. Buckets are keyed by hashed IP (or API key ID for keyed tiers).

### Login throttle

| Parameter | Value |
|---|---|
| Max failures | 5 |
| Failure window | 600 000 ms (10 min) |
| Cooldown | 900 000 ms (15 min) |

Per-IP isolation: different IPs never interfere. Successful login clears the failure record.

### Retry-After semantics

429 responses include:

- `Retry-After: <seconds>` — computed from `resetEpochSeconds - now`
- `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

### What this mitigates

- **Scraping**: public-metrics and health rate-capped per IP
- **Brute-force**: login throttle with IP-keyed cooldown
- **Spam / automation**: simulate route has low public ceiling; legitimate integrators use keyed tier
- **Credential stuffing**: constant-time comparison + cooldown prevent timing and volume attacks


## 5. Security Observability

### Prometheus metrics (`lib/security-metrics.ts`)

**Counters (10):**

| Metric | Description |
|---|---|
| `trucore_admin_login_success_total` | Successful admin logins |
| `trucore_admin_login_failure_total` | Rejected login attempts |
| `trucore_admin_login_rate_limited_total` | Throttled login attempts |
| `trucore_admin_csrf_origin_rejected_total` | CSRF Origin mismatches |
| `trucore_admin_route_denied_total` | Middleware rejections |
| `trucore_admin_api_denied_total` | API handler rejections |
| `trucore_admin_action_denied_total` | Server-action rejections |
| `trucore_admin_session_expired_total` | Absolute lifetime expirations |
| `trucore_admin_session_idle_timeout_total` | Idle timeout expirations |
| `trucore_admin_revoked_session_rejected_total` | Revoked-session reuse attempts |

**Gauges (3):**

| Metric | Description |
|---|---|
| `trucore_admin_session_store_size` | Current session count |
| `trucore_admin_revoked_session_count` | Revoked sessions retained |
| `trucore_security_uptime_seconds` | Process uptime |

Serialized in Prometheus text exposition format (`text/plain; version=0.0.4`). 10-second in-memory cache TTL to avoid repeated serialization. Missing counters emit `0`.

### Structured security logging (`lib/security-log.ts`)

Format:

```
[security] <ISO-timestamp> | event=<name> | ip_hash=<12-hex> | req=<id> | ...
```

19 tracked event types across five categories: login lifecycle, session lifecycle, admin denial, admin degradation, and public/agent rate limiting.

### Allowlists for labels

Counters and log labels are gated by hardcoded allowlists:

- `KNOWN_ADMIN_PAGES`: waitlist, csp, usage, metrics, audit, acquisition, keys
- `KNOWN_ADMIN_ACTIONS`: set_signup_status, update_admin_notes, export_design_partners_csv
- `KNOWN_ADMIN_API_ROUTES`: keys/create, keys/revoke, keys/issue-for-partner, …
- `KNOWN_AGENT_ROUTES`: agent/dashboard, agent/tenant, agent/stream

Unknown labels are rejected — prevents unbounded cardinality and noise injection.

### Admin telemetry UI

`AdminTelemetrySection` (`components/dashboard/admin-telemetry-section.tsx`) is an auto-refreshing client component rendered on the admin metrics page. It fetches `/api/metrics` and displays:

- Admin page / mutation / API stability
- Agent and public route abuse indicators
- Session gauges

**Design constraints**: aggregate-only (no per-user or per-IP data), no sensitive data exposure, polling-based refresh.


## 6. Regression Coverage

### Test suites

| Suite | File | Covers |
|---|---|---|
| Admin auth | `lib/admin-auth.test.ts` | Session validation, key matching, token lifecycle |
| Admin action auth | `lib/admin-action-auth.test.ts` | Denial response, inner-error catch, degraded logging |
| Admin API auth | `lib/admin-api-auth.test.ts` | 404-on-denial, CSRF validation, header hardening |
| Admin layout | `app/admin/layout.test.tsx` | Redirect on invalid session, render on valid |
| Origin validation | `tests/origin-validation.test.ts` | GET/HEAD bypass, POST/PUT/PATCH/DELETE require Origin, fail-closed on missing |
| Rate limiting | `lib/rate-limit.test.ts` | Under/over limit, key isolation, window reset |
| Login throttle | `lib/login-throttle.test.ts` | Failure counting, cooldown trigger, IP isolation, time advance, clear |
| Security log | `lib/security-log.test.ts` | Log format, no raw IPs, counter increments |
| Security metrics | `lib/security-metrics.test.ts` | Prometheus format, all 13 metrics present, fail-closed defaults |
| Telemetry refresh | `tests/admin-telemetry-refresh.test.tsx` | Auto-refresh lifecycle, panel rendering |
| Auth telemetry | `tests/admin-auth-telemetry.test.ts` | Telemetry counter integration with auth events |
| **Perimeter regression** | `tests/perimeter-security-regression.test.ts` | Cross-cutting invariants (see below) |

### Banned-pattern scanning

The perimeter regression suite defines `BANNED_PATTERNS` — a list of regex patterns that must never appear in any response body facing an unauthenticated or end-user caller:

```
postgres://, DATABASE_URL, ECONNREFUSED, password, SELECT/INSERT,
relation … does not exist, stack-trace frames, Bearer, .pem, DSN, 127.0.0.x:port
```

`assertNoBannedPatterns(text, label)` is run against every degraded response, error response, and public-surface output in the suite.


## 7. Known Limitations

These are intentional or infrastructure-level constraints — not defects.

| Limitation | Impact | Mitigation path |
|---|---|---|
| **Process-local rate limits** | Counters reset on deploy / cold start; no cross-instance aggregation | Edge rate limiting or Prometheus aggregation post-launch |
| **No cross-instance session aggregation** | Each isolate has its own session store | External session store (Redis) if horizontal scaling is needed |
| **Polling-based telemetry** | Admin metrics page is not real-time; refresh interval set client-side | WebSocket push or SSE if sub-second visibility is required |
| **No persistence of security counters** | Prometheus metrics reset on restart | Export to external Prometheus / Grafana for persistence |
| **Public routes intentionally unauthenticated** | `/api/simulate`, `/api/health`, `/api/public-metrics` accept anonymous traffic | By design — rate limits guard against abuse |
| **NAT / shared-IP throttle collisions** | Users behind the same NAT share a login-throttle bucket | Acceptable trade-off; cooldown is 15 min, not permanent |


## 8. Launch-Readiness Checklist

### Before broader release

- [ ] All required env vars set in production (`ADMIN_DASHBOARD_KEY`, `RECEIPT_SIGNING_KEY`)
- [ ] `ATF_E2E_TEST_SECRET` is **not** set in production
- [ ] Admin auth tested manually (login → session → logout)
- [ ] Rate limits verified in staging (hit `/api/health` 61× in 60 s → expect 429)
- [ ] Public endpoints tested for safe failure responses (kill upstream → expect `{ ok: false, error: "..." }`)
- [ ] Admin telemetry page visible and auto-refreshing
- [ ] No sensitive data in logs (grep production logs for banned patterns)
- [ ] Build, lint, and all test suites green
- [ ] CLI / docs aligned with deployed version
- [ ] CSP headers reviewed and enforced

### Recommended (pre- or post-launch)

- [ ] External uptime monitoring configured (health endpoint)
- [ ] Basic alerting thresholds defined (e.g. `login_failure_total` spike)
- [ ] Manual pen-test of admin login flow
- [ ] Review `Retry-After` behavior from client perspective


## 9. Future Hardening (Post-Launch)

- **Edge / proxy rate limiting**: move throttle enforcement upstream (Vercel Edge Middleware, Cloudflare, etc.) for cross-instance aggregation
- **Prometheus + Grafana**: scrape `/api/admin/security` for persistent time-series and dashboards
- **Alerting on degraded states**: fire alerts when `admin_page_degraded` or `admin_api_degraded` counters rise
- **Dependency / supply-chain audit**: periodic `npm audit`, lock-file review, Dependabot or Renovate
- **Periodic security review cadence**: quarterly review of this document against the live codebase
