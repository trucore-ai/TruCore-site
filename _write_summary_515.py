content = r"""============================================================
TRUCORE-SITE REPOSITORY -- FULL EXPLORATION SUMMARY
Date: 2026-03-28
============================================================

============================================================
1. TOP-LEVEL DIRECTORY STRUCTURE
============================================================

/TruCore-site/
  app/                  Next.js App Router -- all pages and API routes
  components/           Shared React components (~80 files)
  lib/                  Pure TypeScript helpers and server utilities (~90 files)
  tests/                Vitest unit/integration tests + e2e/ Playwright tests
  public/               Static assets
  content/              MDX content files (docs, blog)
  docs/                 Markdown documentation
  scripts/              Build/validation scripts (.mjs)
  packages/             Internal packages
  images/               Image assets
  ops/                  Ops-related files
  .github/              GitHub Actions CI config
  .vercel/              Vercel deployment config

Key config files:
  package.json          Project manifest and dependencies
  tsconfig.json         TypeScript config (strict mode, @/* path alias)
  next.config.ts        Next.js config
  tailwind.config.ts    Tailwind config
  vitest.config.ts      Test runner config
  playwright.config.ts  E2E config
  vercel.json           Vercel routing config
  .env.local.example    Env var template


============================================================
2. LIB/ DIRECTORY -- ALL FILES
============================================================

admin-action-auth.ts        admin-action-auth.test.ts
admin-api-auth.ts           admin-api-auth.test.ts
admin-auth.ts               admin-auth.test.ts
admin-constants.ts
agent-serializer.ts         agent-serializer.test.ts
agent-stream.ts             agent-stream.test.ts
analytics.ts                (Vercel Analytics wrapper -- see section 4)
anchor-preview.ts
api-keys.ts
api.ts
attention.ts
audit-log.ts
auth-errors.ts
blog.ts
changelog.ts
client/                     (client-only helpers)
csv.ts
customer-auth.ts            (auth + all customer API calls)
dashboard-client.ts         dashboard-client.test.ts
dashboard-queue.ts
demo-live.ts                demo-live.test.ts
demo-receipts.ts
docs/
docs-index.ts               docs-index.test.ts
docs-nav.ts
email.ts
feature-flags.ts
feedback-auth.ts            feedback-auth.test.ts
feedback-db.ts
freshness.ts
fs-helpers.ts
growth-triage.ts
hash.ts
hex.ts                      hex.test.ts
login-throttle.ts           login-throttle.test.ts
mdx.ts
motion-preference.ts        motion-preference.test.ts
one-line-quickstart.ts
ops-alerts.ts
ops-first-trade-check.ts
partner-portal.ts           partner-portal.test.ts
portal-activation.ts
premium-analytics.ts
primer-content.ts
proxy.test.ts
public-metrics.ts           public-metrics.test.ts
rate-limit.ts               rate-limit.test.ts
receipt-signature.ts        receipt-signature.test.ts
receipt-spec-constants.ts
receipt-verification.ts
roadmap.ts                  roadmap.test.ts
security/
security-headers.ts         security-headers.test.ts
security-log.ts             security-log.test.ts
security-metrics.ts         security-metrics.test.ts
security-signature.ts
server/
sha256.ts                   sha256.test.ts
share-utils.ts              (proof/share URL helpers -- see section 3)
simulator.ts                simulator.test.ts
tenant-interpretation.ts
test-gate.ts                test-gate.test.ts
track.ts                    (internal event tracker -- see section 4)
trend.ts
usage-meter.ts
utm.ts                      (UTM cookie attribution -- see section 4)
validation/
verify-demo-data.ts
verification-kit.ts         verification-kit.test.ts
version.ts                  version.test.ts
waitlist-config.ts          waitlist-config.test.ts
waitlist-store.ts           waitlist-store.test.ts
whitepaper-content.ts
whitepaper-pdf.ts


============================================================
3. LIB/SHARE-UTILS.TS -- FULL CONTENT
============================================================

  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://trucore.xyz";

  export function buildVerifyUrl(hash: string): string {
    return `${BASE_URL}/verify?hash=${encodeURIComponent(hash.trim())}&from=share`;
  }

  export function buildOgPreviewUrl(hash: string): string {
    return `${BASE_URL}/api/og/receipt?hash=${encodeURIComponent(hash.trim())}`;
  }

  export interface ProofBundle {
    verifyUrl: string;
    ogPreviewUrl: string;
  }

  export function buildProofBundle(hash: string): ProofBundle {
    const trimmed = hash.trim();
    return {
      verifyUrl: buildVerifyUrl(trimmed),
      ogPreviewUrl: buildOgPreviewUrl(trimmed),
    };
  }

  export function buildTwitterUrl(url: string): string {
    const text = `This trade was protected by TruCore. Verify it yourself: ${url}`;
    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  }

  export function buildTelegramUrl(url: string): string {
    const text = "This trade was protected by TruCore. Verify it yourself:";
    return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
  }


============================================================
4. COMPONENTS/ DIRECTORY -- ALL FILES
============================================================

admin-create-key-form.tsx, api-key-section.tsx, atf-comparison.tsx,
atf-copy-command.tsx, atf-design-partner-cta.tsx, atf-designed-for.tsx,
atf-lifecycle-diagram.tsx, atf-readiness.tsx, atf-roadmap.tsx,
atf-v1-scope.tsx, blog-filter-bar.tsx, blog-post-card.tsx, copy-block.tsx,
dashboard/ (sub-components), demo-live-stream.tsx,
design-partner-apply-form.tsx, docs/ (sub-components), docs-search.tsx,
docs-sidebar.tsx, ecosystem-integrations.tsx, enforcement-proof-section.tsx,
evidence-metrics-section.tsx, feedback/ (sub-components),
heading-anchor.tsx, header-auth-actions.tsx, hero-background-pulses.tsx,
home/ (sub-components), mdx-components.tsx, metrics-summary-card.tsx,
moat-signal-strip.tsx, motion-toggle.tsx, ops-first-trade-check.tsx,
ops-first-trade-check-loader.tsx, ops-route-failures.tsx,
ops-route-failures-loader.tsx, partner-issue-key-button.tsx,
partner-portal-link-button.tsx, pdf-integrity-verifier.tsx,
pilot-kpi-strip.tsx, portal-activation-guide.tsx,
portal-activation-progress.tsx, portal-create-key-guide.tsx,
portal-first-protected-trade.tsx, portal-premium-section.tsx,
portal-verify-panel.tsx, pricing-nav-link.tsx,
production-readiness-strip.tsx,
proof-links-card.tsx        (proof URL copy card -- see section 6),
public-metrics-strip.tsx, public-usage-snapshot.tsx,
receipt-share-actions.tsx   (share/social component -- see section 5),
receipt-viewer.tsx, receipts-list.tsx, release-badge.tsx,
risk-boundary-block.tsx, roadmap-phase.tsx, roadmap-status-badge.tsx,
run-test-request.tsx, safe-to-try-banner.tsx, scroll-link.tsx,
security-commitments.tsx, security-integrity-strip.tsx,
sha256-info-popover.tsx, simulate-verify-execute-flow.tsx,
simulator-form.tsx, simulator-result.tsx, single-command-quickstart.tsx,
skip-link.tsx, spec-code-block.tsx, spec-section.tsx, status/,
tracked-link.tsx            (analytics-instrumented anchor -- see section 4),
transparency-metrics.tsx, trust-strip.tsx, try-atf-flow.tsx,
ui/ (generic primitives: container, section, etc.),
verify-page-cta.tsx, verify-receipt-form.tsx,
whitepaper-hash-panel.tsx, why-now-section.tsx


============================================================
5. COMPONENTS/RECEIPT-SHARE-ACTIONS.TSX -- FULL CONTENT
============================================================

"use client"
Imports: buildTelegramUrl, buildTwitterUrl, buildVerifyUrl from @/lib/share-utils

Props:
  hash: string
  className?: string
  title?: string           default: "Share this receipt"
  subtext?: string         default: "Anyone can independently verify this transaction"
  copyLabel?: string       default: "Copy Link"
  ogPreviewLabel?: string  default: "Open OG Preview"
  twitterLabel?: string    default: "Twitter"
  telegramLabel?: string   default: "Telegram"
  includeSocial?: boolean  default: true

data-testid attributes:
  "receipt-share-actions"     -- wrapper div
  "copy-share-link-button"    -- copies buildVerifyUrl(hash) to clipboard
  "open-og-preview-link"      -- <a href="/api/og/receipt?hash=..."> opens new tab
  "twitter-share-link"        -- buildTwitterUrl(verifyUrl)
  "telegram-share-link"       -- buildTelegramUrl(verifyUrl)

Behavior: copied state shows "Copied" label for 1800ms, then resets.
verifyUrl = buildVerifyUrl(hash.trim())
ogPreviewPath = /api/og/receipt?hash=<encoded hash>


============================================================
6. COMPONENTS/PROOF-LINKS-CARD.TSX -- FULL CONTENT
============================================================

"use client"
Imports: buildProofBundle from @/lib/share-utils; trackEvent from @/lib/track

Props: { hash: string; title?: string; compact?: boolean }

Renders two copyable URL rows:
  Row 1 label "verify url"     -> buildProofBundle(hash).verifyUrl
  Row 2 label "og preview url" -> buildProofBundle(hash).ogPreviewUrl

On copy events fire:
  trackEvent("proof_verify_url_copied", { surface: "proof_links_card" })
  trackEvent("proof_og_url_copied",     { surface: "proof_links_card" })

Returns null if hash.trim() is empty.
compact=true: reduced padding, no footer text.

data-testid attributes:
  "proof-links-card"
  "proof-verify-url"       -- <code> with verify URL
  "copy-verify-url-button"
  "proof-og-url"           -- <code> with OG preview URL
  "copy-og-url-button"


============================================================
7. APP/API/OG/RECEIPT/ROUTE.TSX -- FULL CONTENT
============================================================

export const runtime = "edge"
Size: 1200x630 (next/og ImageResponse)

Types:
  ReceiptPreviewData { decision: "ALLOW"|"DENY"|"UNKNOWN"; hashPreview: string; timestamp: string; verified: boolean }
  VerificationResponse { valid: boolean; decision?: "ALLOW"|"DENY" }

Constants:
  VERIFICATION_TIMEOUT_MS = 500

Env flags:
  OG_REAL_VERIFICATION_ENABLED="true" -> enables live backend verification
  ATF_API_URL                         -> backend base URL

Hash sanitization (sanitizeHash):
  - Strips, lowercases, validates /^[a-f0-9]{1,64}$/
  - Returns null on any invalid input

Hash display (formatHashPreview):
  - length <= 16: return as-is
  - else: first8...last8

Deterministic fallback (derivePreviewData):
  - decision = parseInt(hash.slice(0,2), 16) % 5 === 0 ? "DENY" : "ALLOW"
  - timestamp = new Date().toISOString().split("T")[0]  (YYYY-MM-DD)
  - verified = false

Real verification (fetchVerification):
  - GET {ATF_API_URL}/v1/receipts/verify?hash=<encoded hash>
  - AbortController with 500ms timeout
  - Only passes valid + decision fields through sanitizeVerificationResponse
  - Returns null on timeout, network error, non-2xx, invalid body

getPreviewData logic:
  1. OG_REAL_VERIFICATION_ENABLED != "true" -> derivePreviewData
  2. No ATF_API_URL -> derivePreviewData
  3. fetchVerification success with valid+decision -> { verified: true, decision from backend }
  4. fetchVerification returns valid=false -> { decision: "UNKNOWN", verified: true }
  5. fetchVerification returns null -> derivePreviewData

ReceiptOgCard design:
  Background: linear-gradient(160deg, rgba(11,18,32,1) 0%, rgba(5,10,20,1) 70%)
  Header: "TruCore" (left) / "Agent Transaction Firewall" (right)
  Status badge: colored dot + ALLOWED/DENIED/UNKNOWN label
    ALLOW  -> green (rgba(34,197,94,...))
    DENY   -> red   (rgba(239,68,68,...))
    UNKNOWN -> slate (rgba(148,163,184,...))
  Headline:
    ALLOW   -> "Protected Trade Verified"
    DENY    -> "Transaction Blocked by Policy"
    UNKNOWN -> "Receipt Status Unavailable"
  Receipt info row: hash preview (monospace) + Date column
  Trust strip: Evaluated / Enforced / Recorded (green checkmarks)
  Footer: "Verify at trucore.xyz" + "Tamper-evident" shield pill

FallbackOgCard (no hash / invalid hash):
  Same dark layout
  Headline: "Verify Protected Trades"
  Subheadline: "Validate receipts from policy-governed AI agent transactions..."
  Trust strip: same 3 labels
  Footer: "trucore.xyz/verify"

Cache-Control headers:
  verified=true  -> public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400
  verified=false -> public, max-age=300,  s-maxage=300,  stale-while-revalidate=3600
  error catch    -> public, max-age=300,  s-maxage=300

GET export:
  searchParams.get("hash") -> sanitizeHash -> getPreviewData or null
  Returns ImageResponse(ReceiptOgCard | FallbackOgCard, { ...SIZE, headers })


============================================================
8. APP/VERIFY/PAGE.TSX -- FULL CONTENT SUMMARY
============================================================

Type: async Server Component

Imports:
  VerifyReceiptForm, ReceiptShareActions, ProofLinksCard,
  TrackedLink, VerifyPageCta, Container, Section

URL params:
  hash         -> pre-fills VerifyReceiptForm
  from         -> "verify"|"receipts"|"portal"|"share"
  autofetchSig -> "1" triggers auto signature fetch in form

generateMetadata (dynamic, async):
  OG image URL:
    with hash    -> /api/og/receipt?hash=<encoded>
    without hash -> /api/og/receipt
  title/description differ for isFromShare (from==="share")
  twitter:card = summary_large_image always

Shared receipt layout (isFromShare=true):
  1. Pill badge + h1 "This trade was protected by TruCore"
  2. "What does verification prove?" explainer card
  3. "What happened here" list (3 checkmarks)
  4. VerifyReceiptForm (initialHash filled)
  5. ReceiptShareActions + ProofLinksCard (if hash present)
  6. Primary CTA: "Run your first protected trade" + VerifyPageCta
  7. "Explore further" grid (4 cards)

Direct verification layout (isFromShare=false):
  1. "Verification Utility" label + h1 "Verify Receipt Hash"
  2. "What does verification prove?" explainer card
  3. "What verification is useful for" bullet list
  4. Cold-traffic nudge ("Don't have a receipt yet?")
  5. VerifyReceiptForm (initialHash filled if present)
  6. ReceiptShareActions + ProofLinksCard (if hash present)
  7. "What to do next" grid (4 cards:
     First protected trade / Your portal / Receipt spec / For bot builders)


============================================================
9. APP/CUSTOMER/DASHBOARD/PAGE.TSX -- FULL CONTENT SUMMARY
============================================================

"use client" -- ~1300 line client component

Key imports from @/lib/customer-auth:
  isLoggedIn, getApiKey, fetchDashboard, clearAuth,
  fetchSampleIntent, simulateProtection, executeSample,
  fetchActivation, markActivationStep, fetchReceipts,
  requestVerificationEmail, fetchUpgradeRequests, ApiError

Also imports: buildVerifyUrl, ProofLinksCard, RunTestRequest

State inventory:
  data: DashboardData | null
  loadState: "loading"|"ready"|"ready_empty"|"error"
  dashboardDataError: string (scoped -- only affects data sections)
  activation: ActivationState | null
  activationLoading, activationBootstrapped
  obStep: 0|1|2|3|4
  obIntent, obDryRun, obReceipt: step result objects
  obLoading, obError
  receiptCount, recentReceipt
  pendingUpgrade: UpgradeRequestData | null
  emailVerified: boolean
  copied, shareLinkCopied, receiptCopied: clipboard feedback flags
  resending, resendSuccess: email resend flags

Initial load:
  - Parallel: fetchDashboard() + fetchActivation() + fetchReceipts({limit:1}) + fetchUpgradeRequests()
  - loadState logic: both fail -> "error"; dashboard fails + activation ok -> "ready_empty" + scoped error
  - stepFromActivation(): maps steps_completed set to 0-4

4-step onboarding flow:
  Step 0 (Generate):  fetchSampleIntent()       -> markActivationStep("sample_generated")
  Step 1 (Simulate):  simulateProtection(intent) -> markActivationStep("dry_run_completed")
  Step 2 (Execute):   executeSample(intent)      -> markActivationStep("execution_completed")
  Step 3 (Receipt):   display receipt + trust card

Post-completion trust card shows:
  receipt_id | decision badge | executionTime | verification available
  Real execution: tx_signature + Solana Explorer link
  Execution error: red error banner

Post-completion actions:
  "View protected trade receipts" -> /customer/receipts
  "View Receipt" -> /verify?hash=<receiptId>&from=share
  "Share Receipt" -> clipboard.writeText(buildVerifyUrl(receiptId))
  "Preview Share Card" -> <a href="/api/og/receipt?hash=..." target="_blank">
  "Run another trade" -> resets obStep to 0

ProofLinksCard (compact) rendered below actions when receiptId available.

Error classifier (classifyError):
  rate_limited -> "Too many requests. Please wait a moment."
  network      -> "Network issue detected. Check your connection."
  unavailable  -> "Service temporarily unavailable. Please try again shortly."
  unknown      -> "Something went wrong. Please try again."

Sections:
  1. Header: email, plan tier, "Sign out" button
  2. Error/retry banner (global)
  3. Welcome banner (ready_empty)
  4. Email verification banner + resend
  5. First Protected Trade section (primary hero)
  6. API Key card (copy-once display)
  7. Plan and Usage (3x UsageMeter: protect/execution/receipts)
  8. Pending upgrade notice
  9. Account details (tenant info)


============================================================
10. APP/CUSTOMER/RECEIPTS/PAGE.TSX -- FULL CONTENT SUMMARY
============================================================

"use client" -- ~500 line client component

Imports from @/lib/customer-auth:
  isLoggedIn, clearAuth, fetchReceipts, fetchReceiptDetail, verifyReceipt

Also imports: ProofLinksCard

ReceiptSummary type:
  receipt_id, created_at (epoch), decision, dry_run, content_hash,
  protected_by, summary, intent_type

State:
  receipts: ReceiptSummary[] (sorted newest-first by created_at)
  loading, error
  selectedId, detail, detailLoading, detailError
  verifyStatus: "idle"|"loading"|"verified"|"tampered"|"error"
  jsonCopied

Loads fetchReceipts({ limit: 20 }) on mount; redirects to /login on 401.

Table columns: Receipt ID (first8...last6) | Decision badge | Timestamp | Mode (mock/real badge)
Row click: toggles detail panel (click same row to close)

Detail panel:
  Buttons: "Copy JSON" (disabled if no detail) | "Verify Receipt" (-> verifyReceipt(selectedId))
  Verify response: reads res.verified ?? res.valid ?? res.matches ?? false
  Sections:
    - Policy breakdown table (policy: string, result: "PASS"|"FAIL")
    - Metadata dl: content_hash, protected_by
    - Full receipt JSON in <pre>
    - ProofLinksCard compact (keyed on content_hash)


============================================================
11. TELEMETRY PATTERN
============================================================

--- Channel 1: Vercel Analytics (lib/analytics.ts) ---
  import { track } from "@vercel/analytics";
  export function trackEvent(name: string, props?: Record<string, string|number|boolean>) {
    try { track(name, props); } catch { /* silent */ }
  }
  Used by: TrackedLink, verify-page components, onboarding CTAs

--- Channel 2: Internal POST /api/track (lib/track.ts) ---
  export function trackEvent(name: string, meta?: Record<string, string|number|boolean>) {
    fetch("/api/track", { method: "POST", body: JSON.stringify({ name, meta, ts: Date.now() }) });
  }
  Fire-and-forget. Server route validates against allowlist of ~20 names.
  Logs to console (Vercel log drain / grep). No storage, no PII.
  Used by: ProofLinksCard

/api/track allowlist:
  page_view, cta_home_primary, cta_home_secondary, cta_try_primary,
  cta_try_verify_demo, cta_verify_to_trade, entered_verify_demo,
  completed_verify_demo, clicked_start_trade, view_api_key_section,
  copy_api_key, copy_request (and others)

TrackedLink component:
  Props: href, children, eventName, eventProps, className, target, rel
  onClick -> analytics.trackEvent(eventName, eventProps)
  Includes focus-visible ring styling for a11y

UTM attribution (lib/utm.ts):
  Cookie name: "trucore_utm", TTL: 7 days, max value length: 120 chars
  Fields: utm_source, utm_medium, utm_campaign, utm_term, utm_content
  parseUtmFromUrl(URLSearchParams) -> UtmPayload | null
  parseUtmCookieValue(string) -> UtmPayload | null
  getUtmFromCookies() -> async via next/headers cookies()
  setUtmCookie(NextResponse, UtmPayload) -> attaches to response


============================================================
12. TESTS/ DIRECTORY -- ALL FILES
============================================================

~65 Vitest test files including:
  proof-links-card.test.tsx, receipt-og.test.ts, receipt-og-real.test.ts,
  receipt-sharing.test.ts, receipt-sharing-ui.test.tsx,
  receipt-signature.test.ts, receipts-verify-live-paths.test.ts,
  verify-page-conversion.test.tsx, first-trade-receipt-trust-loop.test.tsx,
  first-use-dashboard-ux.test.tsx, customer-dashboard-states.test.tsx,
  customer-authenticated-data-paths.test.ts,
  dashboard-auth.test.ts, dashboard-client.test.ts,
  dashboard-components.test.tsx, admin-api-hardening.test.ts,
  admin-auth-telemetry.test.ts, admin-degraded-rendering.test.tsx,
  admin-mutation-hardening.test.ts, agent-route-hardening.test.ts,
  security-headers.test.ts, perimeter-security-regression.test.ts,
  portal-security-headers.test.ts, portal-cookie-flags.test.ts,
  simulate-route.test.ts, simulator.test.ts, version.test.ts,
  version-contract.test.ts, hardcoded-version-guard.test.ts,
  public-route-hardening.test.ts, public-surface-health.test.ts,
  verification-kit.test.ts, verify-receipt-version.test.ts, ...

  helpers/  -- test utility helpers
  setup.ts  -- Vitest global setup (jsdom, jest-dom matchers)

  e2e/      -- Playwright E2E tests


============================================================
13. PACKAGE.JSON -- DEPENDENCIES
============================================================

Runtime:
  next 16.1.6, react 19.2.3, react-dom 19.2.3
  @vercel/analytics ^1.6.1
  @neondatabase/serverless ^1.0.2   (Neon Postgres)
  @mdx-js/loader ^3.1.1, @next/mdx ^16.1.6
  @react-three/drei ^10.7.7, @react-three/fiber ^9.5.0
  @react-three/postprocessing ^3.0.4, three ^0.183.1
  gray-matter ^4.0.3, pdf-lib ^1.17.1
  vanilla-tilt ^1.8.1, zod 3.24.4

Dev:
  typescript ^5, vitest ^4.0.18, @vitest/coverage-v8 ^4.0.18
  @playwright/test ^1.58.2
  @testing-library/react ^16.3.2, @testing-library/jest-dom ^6.9.1
  jsdom ^28.1.0, tailwindcss ^3.4.17
  eslint ^9, eslint-config-next 16.1.6
  @next/bundle-analyzer ^16.1.6, @lhci/cli ^0.15.1

Scripts:
  npm run dev        -> next dev
  npm run build      -> next build
  npm test           -> vitest
  npm run test:e2e   -> playwright test
  npm run ci         -> lint + test + test:e2e


============================================================
14. TSCONFIG.JSON
============================================================

  target: ES2017
  strict: true
  moduleResolution: bundler
  jsx: react-jsx
  incremental: true
  paths: { "@/*": ["./*"] }   (all imports use @/ alias from workspace root)
  include: next-env.d.ts, **/*.ts, **/*.tsx, **/*.mts


============================================================
15. APP/ KEY ROUTE STRUCTURE
============================================================

Pages:
  /                -> app/page.tsx
  /verify          -> app/verify/page.tsx
  /customer/dashboard   -> app/customer/dashboard/page.tsx
  /customer/receipts    -> app/customer/receipts/page.tsx
  /customer/keys        -> app/customer/keys/
  /portal, /verify-demo, /docs, /blog, /pricing, /signup, /login
  /quickstart, /builders, /status, /try, /demo, /upgrade

API routes:
  /api/og/receipt         -> route.tsx (edge, ImageResponse)
  /api/track              -> route.ts  (internal analytics ingest)
  /api/verify-receipt, /api/receipt-signature, /api/public-receipts
  /api/simulate, /api/keys, /api/customer/, /api/dashboard, /api/admin/
  /api/telemetry, /api/health, /api/status, /api/metrics
  /api/public-metrics, /api/auth/, /api/events, /api/portal/
  /api/ops/, /api/agent/, /api/sandbox/, /api/demo-live
  /api/verify-receipt-signature, /api/onboarding
  app/robots.ts, app/sitemap.ts


============================================================
RISKS / FOLLOW-UPS
============================================================

1. P2: OG card decision is DETERMINISTIC from hash byte 0
   (firstByte % 5 === 0 -> DENY else ALLOW) unless both
   OG_REAL_VERIFICATION_ENABLED=true and ATF_API_URL are set.
   In production without these env vars the social card does not
   reflect actual receipt outcomes.

2. P2: Internal /api/track allowlist (~20 event names) covers only
   homepage/CTA funnels. Receipt share events (proof_verify_url_copied,
   proof_og_url_copied) use Vercel Analytics only -- no server-side
   log drain capture. Gap in funnel visibility.

3. P2: buildTwitterUrl hardcodes twitter.com -- should be updated to
   x.com for current platform branding and link resolution.

4. P3: lib/track.ts and lib/analytics.ts both export trackEvent with
   different signatures and different targets. ProofLinksCard uses
   lib/track (internal POST); TrackedLink uses lib/analytics (Vercel).
   Fragile for new contributors who may import from the wrong module.

5. P3: OG fallback cache is 5 min (max-age=300); verified receipt
   cache is 1 hour. Since receipts are immutable this is safe, but
   CDN corrections take up to 1 hour.

6. P3: Dashboard page builds verifyUrl and ogPreviewUrl inline:
   `/verify?hash=${encodeURIComponent(id)}&from=share`
   `/api/og/receipt?hash=${encodeURIComponent(id)}`
   instead of using buildVerifyUrl / buildOgPreviewUrl from share-utils.
   Duplicates logic; risk of divergence if URL patterns change.

7. P4: No Telegram share button on dashboard post-execution flow.
   ReceiptShareActions supports Telegram but is only rendered on
   /verify, not /customer/dashboard. Consistency gap in viral loop.

8. P4: receipt-og-real.test.ts and receipt-og.test.ts test next/og
   edge route in Vitest. ImageResponse from next/og can fail without
   proper edge runtime mocking. Worth auditing these test depths.
"""

with open("/home/kontractkoder/repo/agent-transaction-firewall/SUMMARY.txt", "w") as f:
    f.write(content)

print("Done")
