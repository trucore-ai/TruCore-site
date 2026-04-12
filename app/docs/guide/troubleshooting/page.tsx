import type { Metadata } from "next";
import Link from "next/link";
import { HeadingAnchor } from "@/components/heading-anchor";

export const metadata: Metadata = {
  title: "Troubleshooting — Customer Guide",
  description:
    "Diagnose and resolve common ATF integration issues. Symptom-driven error classification with recovery steps.",
  robots: { index: false, follow: false },
};

/* ── Symptom categories ── */

type Symptom = {
  symptom: string;
  cause: string;
  action: string;
  strategy: "retry" | "fix-config" | "rotate" | "wait" | "upgrade" | "contact-support";
};

/* ── 1. Authentication & key errors ── */

const AUTH_KEY_SYMPTOMS: Symptom[] = [
  {
    symptom: "401 Unauthorized on every API call",
    cause: "API key missing from the request, malformed, or revoked.",
    action:
      "Confirm you have an active key at /customer/keys. Verify the X-API-Key header contains the full secret (not the key ID).",
    strategy: "fix-config",
  },
  {
    symptom: "403 Forbidden despite valid key",
    cause: "Key is active but lacks a required scope for the endpoint.",
    action:
      "Check key scopes in /customer/keys. Compare against endpoint requirements in the API Key Lifecycle guide.",
    strategy: "fix-config",
  },
  {
    symptom: '"Email not verified" error on key creation',
    cause: "Key creation, rotation, and revocation require a verified email address.",
    action:
      "Check your inbox for the verification email. Use the resend button in the dashboard banner if needed.",
    strategy: "fix-config",
  },
  {
    symptom: '"Key limit reached" when creating a new key',
    cause: "Your plan tier has a maximum number of active keys.",
    action:
      "Revoke unused keys at /customer/keys, or request a plan upgrade at /docs/upgrade.",
    strategy: "upgrade",
  },
  {
    symptom: "Lost API key secret",
    cause: "Secrets are shown once at creation and cannot be retrieved afterward.",
    action:
      "Rotate the key to generate a new secret. The old secret is invalidated immediately.",
    strategy: "rotate",
  },
  {
    symptom: "Redirected to /login unexpectedly",
    cause: "Session expired or was invalidated (e.g., password change, account action).",
    action:
      "Sign in again. If this keeps happening, clear browser cookies for trucore.xyz and retry.",
    strategy: "retry",
  },
];

/* ── 2. Rate-limit & quota errors ── */

const RATE_LIMIT_SYMPTOMS: Symptom[] = [
  {
    symptom: "429 Too Many Requests with Retry-After header",
    cause: "Per-endpoint rate limit hit (requests per minute).",
    action:
      "Honor the Retry-After value. Implement exponential backoff with jitter. See the Rate Limits guide.",
    strategy: "wait",
  },
  {
    symptom: "429 without Retry-After header",
    cause: "Daily plan quota exhausted (protect calls, execution calls, or stored receipts).",
    action:
      "Check usage meters in /customer/dashboard. Wait for midnight UTC reset, or upgrade your plan.",
    strategy: "wait",
  },
  {
    symptom: "X-ATF-Quota-Warning header on 200 responses",
    cause: "Approaching daily plan quota limit.",
    action:
      "Reduce call frequency proactively. Review usage in /customer/dashboard to see how close you are.",
    strategy: "fix-config",
  },
  {
    symptom: "Consistent 429 despite low request volume",
    cause: "Requests share an IP-based bucket (corporate NAT, VPN, cloud egress).",
    action:
      "Authenticate with an API key to get a per-key bucket (120 req/min vs 30 req/min for anonymous).",
    strategy: "fix-config",
  },
  {
    symptom: "Usage meter at 100% — \"Limit reached\" in dashboard",
    cause: "Daily plan quota fully consumed.",
    action:
      "All further requests will receive 429 until midnight UTC. Upgrade plan for higher limits.",
    strategy: "upgrade",
  },
];

/* ── 3. Connectivity & health errors ── */

const CONNECTIVITY_SYMPTOMS: Symptom[] = [
  {
    symptom: "atf doctor shows ✗ API key",
    cause: "ATF_API_KEY environment variable not set, empty, or the key has been revoked.",
    action:
      "Visit /customer/keys, confirm you have an active key, re-export it to your environment.",
    strategy: "fix-config",
  },
  {
    symptom: "atf doctor shows ✗ API connectivity",
    cause: "Firewall, proxy, or DNS blocking outbound HTTPS to api.trucore.xyz.",
    action:
      'Verify with: curl https://api.trucore.xyz/health — should return {"healthy": true}. Check proxy and corporate firewall rules.',
    strategy: "fix-config",
  },
  {
    symptom: "atf doctor shows ✗ RPC endpoint",
    cause: "RPC URL misconfigured, RPC provider down, or rate-limited by the provider.",
    action:
      "Run atf rpc ping to test connectivity. Check your RPC provider dashboard for outages or limits.",
    strategy: "fix-config",
  },
  {
    symptom: "Connection refused from atf health or API calls",
    cause: "The ATF API is unreachable from your network.",
    action:
      "Check DNS resolution for api.trucore.xyz. If behind a VPN, ensure it allows outbound HTTPS on port 443.",
    strategy: "fix-config",
  },
  {
    symptom: '"Service temporarily unavailable" in the dashboard',
    cause: "ATF API returned a transient error during a dashboard data fetch.",
    action:
      "Wait a moment and refresh the page. If persistent, check API health status.",
    strategy: "retry",
  },
  {
    symptom: '"Network issue detected" in the dashboard',
    cause: "Browser failed to reach the API (DNS, proxy, or local network issue).",
    action:
      "Check your internet connection and browser network settings. Try a different network.",
    strategy: "fix-config",
  },
];

/* ── 4. Trade flow errors ── */

const TRADE_FLOW_SYMPTOMS: Symptom[] = [
  {
    symptom: '"Trade was denied by protection policies"',
    cause: "The ATF policy engine evaluated the trade intent and returned a DENIED decision.",
    action:
      "Review the denial reason in the receipt. Check your policy configuration — the intent may violate slippage, allowlist, or cooldown rules.",
    strategy: "fix-config",
  },
  {
    symptom: '"Trade stopped during generate step"',
    cause: "Intent generation failed before policy evaluation could begin.",
    action:
      "Retry the request. If it fails again, check that the trade parameters (token pair, amount, chain) are valid.",
    strategy: "retry",
  },
  {
    symptom: '"Trade stopped during protect step"',
    cause: "The policy evaluation request failed (network, timeout, or malformed intent).",
    action:
      "Retry once. If the error persists, check API connectivity with atf doctor.",
    strategy: "retry",
  },
  {
    symptom: '"Trade stopped during execute step"',
    cause: "Policy approved the trade, but execution failed (RPC error, insufficient balance, or transaction rejected).",
    action:
      "Check your wallet balance and RPC connectivity. The receipt records that protection was approved — the issue is on-chain execution.",
    strategy: "fix-config",
  },
  {
    symptom: "Decision badge shows UNKNOWN",
    cause: "The backend returned an unrecognized decision variant (timeout, empty, or internal error during evaluation).",
    action:
      "This usually indicates a transient evaluation failure. Retry the trade. If persistent, check API health.",
    strategy: "retry",
  },
];

/* ── 5. Receipt & verification errors ── */

const RECEIPT_SYMPTOMS: Symptom[] = [
  {
    symptom: '"No receipts yet" in the receipts page',
    cause: "No protected trade has been executed with the current API key.",
    action:
      "Run a dry-run trade: atf trade --dry-run or use the dashboard quick-trade panel. A receipt appears after the request completes.",
    strategy: "fix-config",
  },
  {
    symptom: 'Verify button shows "Tampered"',
    cause: "The content_hash does not match the recomputed hash of the decision-relevant fields.",
    action:
      "Copy the full receipt JSON and verify it on the /verify page for diagnostics. If the receipt was manually modified, this is expected.",
    strategy: "fix-config",
  },
  {
    symptom: "Verification request failed",
    cause: "Network error, session expired, or ATF API temporarily unreachable.",
    action:
      "Refresh the page and retry. If persistent, check API health.",
    strategy: "retry",
  },
  {
    symptom: "Receipt detail panel is empty",
    cause: "The detail fetch failed (network or authorization error).",
    action:
      "Click the receipt row again to retry. Check the browser console for errors if it persists.",
    strategy: "retry",
  },
  {
    symptom: "Content hash missing from receipt detail",
    cause: "Legacy receipts created before content hashing was introduced lack this field.",
    action:
      "Verification and proof export are unavailable for these receipts. Newer receipts include content_hash by default.",
    strategy: "fix-config",
  },
  {
    symptom: "CLI verify exits with code 1 on a known-good receipt",
    cause: "Receipt JSON was reformatted, or hash algorithm version mismatch (v0 vs v1).",
    action:
      "Run atf receipts hash --file receipt.json to see both v0 and v1 computed hashes and compare against stored values.",
    strategy: "fix-config",
  },
];

/* ── 6. Webhook errors ── */

const WEBHOOK_SYMPTOMS: Symptom[] = [
  {
    symptom: "Webhook created but no deliveries arrive",
    cause: "Endpoint URL not reachable from ATF servers, or firewall blocking inbound POST.",
    action:
      "Verify the URL is publicly accessible over HTTPS. Check firewall/WAF rules allow POST from ATF IPs.",
    strategy: "fix-config",
  },
  {
    symptom: "Signature verification fails on every delivery",
    cause: "Wrong secret, or verifying parsed JSON instead of raw body bytes.",
    action:
      "Use the secret returned at creation (or after rotation). Verify against the raw request body, not parsed JSON.",
    strategy: "fix-config",
  },
  {
    symptom: "Deliveries stuck in 'failed' with 4xx errors",
    cause: "Endpoint returns a non-429 4xx (e.g., 401, 403, 404). These are not retried.",
    action:
      "Fix the endpoint error. Use the retry button or wait for the next event to trigger a new delivery.",
    strategy: "fix-config",
  },
  {
    symptom: "Events appear in the deadletter queue",
    cause: "8 consecutive delivery attempts failed for those events.",
    action:
      "Fix the endpoint issue first, then retry deadlettered deliveries via the API.",
    strategy: "fix-config",
  },
  {
    symptom: "Webhook status changed to 'failing'",
    cause: "25+ consecutive delivery failures triggered auto-disable.",
    action:
      "Fix the endpoint. The next successful delivery re-enables the webhook and resets the failure counter.",
    strategy: "fix-config",
  },
  {
    symptom: "Receiving duplicate webhook events",
    cause: "At-least-once delivery — network issues can cause re-delivery.",
    action:
      "Deduplicate using the X-FW-Event-Id header. Store processed event IDs and skip duplicates.",
    strategy: "fix-config",
  },
];

/* ── 7. Dashboard & activation errors ── */

const DASHBOARD_SYMPTOMS: Symptom[] = [
  {
    symptom: "Dashboard stepper stuck on Step 1",
    cause: "No API key has been created yet, or the key was created but not claimed.",
    action:
      "Visit /customer/keys and create a new key. The secret is shown once — save it immediately.",
    strategy: "fix-config",
  },
  {
    symptom: "Dashboard stepper stuck on Step 2",
    cause: "No API requests have been made with your key.",
    action:
      'Run a test request: atf trade --dry-run or use the "Run a test request" panel in the dashboard.',
    strategy: "fix-config",
  },
  {
    symptom: '"We couldn\'t load your dashboard" error',
    cause: "Both dashboard data and activation state fetches failed.",
    action:
      "Check your internet connection and try again. If the API is reachable but the dashboard fails, clear your browser cache.",
    strategy: "retry",
  },
  {
    symptom: "Email verification banner persists",
    cause: "Email address has not been verified yet.",
    action:
      "Check your inbox (including spam) for the verification email. Use the resend button in the banner if needed.",
    strategy: "fix-config",
  },
  {
    symptom: "atf bot preflight fails",
    cause: "One or more pre-session checks failed (key, connectivity, or policy).",
    action:
      "Run atf doctor first to identify the specific failing check, then resolve it before retrying preflight.",
    strategy: "fix-config",
  },
];

/* ── Strategy labels ── */

const STRATEGY_LABELS: Record<Symptom["strategy"], { label: string; color: string }> = {
  retry: { label: "Retry", color: "text-sky-400" },
  wait: { label: "Wait", color: "text-amber-400" },
  "fix-config": { label: "Fix config", color: "text-orange-400" },
  rotate: { label: "Rotate key", color: "text-violet-400" },
  upgrade: { label: "Upgrade plan", color: "text-emerald-400" },
  "contact-support": { label: "Contact support", color: "text-red-400" },
};

/* ── Section definitions ── */

const SECTIONS = [
  {
    id: "auth-keys",
    title: "Authentication & key problems",
    guide: { label: "API Key Lifecycle guide", href: "/docs/guide/key-lifecycle" },
    symptoms: AUTH_KEY_SYMPTOMS,
  },
  {
    id: "rate-limits",
    title: "Rate-limit & quota problems",
    guide: { label: "Rate Limits & Recovery guide", href: "/docs/guide/rate-limits" },
    symptoms: RATE_LIMIT_SYMPTOMS,
  },
  {
    id: "connectivity",
    title: "Connectivity & health problems",
    guide: { label: "Readiness & Health Checks guide", href: "/docs/guide/readiness" },
    symptoms: CONNECTIVITY_SYMPTOMS,
  },
  {
    id: "trade-flow",
    title: "Trade flow failures",
    guide: null,
    symptoms: TRADE_FLOW_SYMPTOMS,
  },
  {
    id: "receipts",
    title: "Receipt & verification problems",
    guide: { label: "Receipt Operations guide", href: "/docs/guide/receipts-ops" },
    symptoms: RECEIPT_SYMPTOMS,
  },
  {
    id: "webhooks",
    title: "Webhook delivery problems",
    guide: { label: "Webhook Setup & Debugging guide", href: "/docs/guide/webhooks" },
    symptoms: WEBHOOK_SYMPTOMS,
  },
  {
    id: "dashboard",
    title: "Dashboard & activation problems",
    guide: { label: "Readiness & Health Checks guide", href: "/docs/guide/readiness" },
    symptoms: DASHBOARD_SYMPTOMS,
  },
] as const;

/* ── Quick-reference decision matrix ── */

const DECISION_MATRIX = [
  {
    situation: "Transient API error (5xx, timeout, network)",
    action: "Retry with exponential backoff",
    strategy: "retry" as const,
  },
  {
    situation: "429 with Retry-After header",
    action: "Wait the indicated seconds, then retry",
    strategy: "wait" as const,
  },
  {
    situation: "429 without Retry-After (daily quota)",
    action: "Wait for midnight UTC reset or upgrade plan",
    strategy: "wait" as const,
  },
  {
    situation: "401 or 403 on API calls",
    action: "Check key validity and scopes at /customer/keys",
    strategy: "fix-config" as const,
  },
  {
    situation: "Key secret lost or possibly compromised",
    action: "Rotate key immediately — old secret is invalidated",
    strategy: "rotate" as const,
  },
  {
    situation: "Plan limit reached (keys, quota, receipts)",
    action: "Revoke unused resources or request a plan upgrade",
    strategy: "upgrade" as const,
  },
  {
    situation: "Issue persists after all self-serve steps",
    action: "File a support request via /feedback with details",
    strategy: "contact-support" as const,
  },
];

/* ── Page ── */

export default function TroubleshootingGuide() {
  return (
    <article className="space-y-10">
      {/* ── Header ── */}
      <header className="space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
          Customer Guide
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-accent-200 sm:text-5xl">
          Troubleshooting
        </h1>
        <p className="max-w-3xl text-lg leading-relaxed text-slate-300">
          Diagnose and resolve the most common ATF integration issues. This
          guide is organized by symptom &mdash; find what you see, understand
          the likely cause, and follow the recovery step. For deeper
          operational detail, each section links to the relevant{" "}
          <Link
            href="/docs/guide"
            className="font-semibold text-primary-200 transition-colors hover:text-primary-100"
          >
            customer guide
          </Link>
          .
        </p>
        <div className="gradient-divider mt-2" aria-hidden="true" />
      </header>

      {/* ── How to use this guide ── */}
      <section className="space-y-4">
        <HeadingAnchor id="how-to-use">How to use this guide</HeadingAnchor>
        <ol className="ml-5 list-decimal space-y-2 text-slate-300">
          <li>
            <strong className="text-slate-200">Find your symptom</strong> &mdash;
            scroll to the matching category below, or use browser search
            (Ctrl+F / Cmd+F) for the error message you see.
          </li>
          <li>
            <strong className="text-slate-200">Check the likely cause</strong> &mdash;
            each row explains why this happens.
          </li>
          <li>
            <strong className="text-slate-200">Follow the next step</strong> &mdash;
            the action column tells you exactly what to do. The strategy badge
            tells you the kind of recovery: retry, wait, fix config, rotate
            key, upgrade plan, or contact support.
          </li>
          <li>
            <strong className="text-slate-200">Go deeper if needed</strong> &mdash;
            each section links to the full operational guide for that topic.
          </li>
        </ol>
      </section>

      {/* ── Decision matrix ── */}
      <section className="space-y-4">
        <HeadingAnchor id="decision-matrix">
          Quick-reference: what to do next
        </HeadingAnchor>
        <p className="text-slate-300">
          If you are unsure which section applies, use this table to choose
          the right recovery strategy based on what you are seeing.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-slate-400">
                <th className="pb-2 pr-4 font-medium">Situation</th>
                <th className="pb-2 pr-4 font-medium">What to do</th>
                <th className="pb-2 font-medium">Strategy</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {DECISION_MATRIX.map((row) => (
                <tr
                  key={row.situation}
                  className="border-b border-white/[0.04]"
                >
                  <td className="py-2.5 pr-4">{row.situation}</td>
                  <td className="py-2.5 pr-4">{row.action}</td>
                  <td className="py-2.5">
                    <span
                      className={`rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-xs font-medium ${STRATEGY_LABELS[row.strategy].color}`}
                    >
                      {STRATEGY_LABELS[row.strategy].label}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Symptom sections ── */}
      {SECTIONS.map((section) => (
        <section key={section.id} className="space-y-4">
          <HeadingAnchor id={section.id}>{section.title}</HeadingAnchor>
          {section.guide && (
            <p className="text-sm text-slate-400">
              Full operational detail:{" "}
              <Link
                href={section.guide.href}
                className="font-semibold text-primary-200 hover:text-primary-100"
              >
                {section.guide.label} →
              </Link>
            </p>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-left text-slate-400">
                  <th className="pb-2 pr-4 font-medium">Symptom</th>
                  <th className="pb-2 pr-4 font-medium">Likely cause</th>
                  <th className="pb-2 pr-4 font-medium">Next step</th>
                  <th className="pb-2 font-medium">Strategy</th>
                </tr>
              </thead>
              <tbody className="text-slate-300">
                {section.symptoms.map((row) => (
                  <tr
                    key={row.symptom}
                    className="border-b border-white/[0.04]"
                  >
                    <td className="py-2.5 pr-4 font-medium text-slate-200">
                      {row.symptom}
                    </td>
                    <td className="py-2.5 pr-4">{row.cause}</td>
                    <td className="py-2.5 pr-4">{row.action}</td>
                    <td className="py-2.5">
                      <span
                        className={`whitespace-nowrap rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-xs font-medium ${STRATEGY_LABELS[row.strategy].color}`}
                      >
                        {STRATEGY_LABELS[row.strategy].label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      {/* ── When to contact support ── */}
      <section className="space-y-4">
        <HeadingAnchor id="when-to-contact-support">
          When to contact support
        </HeadingAnchor>
        <p className="text-slate-300">
          Most issues are self-serve. Contact support only when:
        </p>
        <ul className="ml-5 list-disc space-y-2 text-slate-300">
          <li>
            You have followed every step in the relevant section above and the
            issue persists.
          </li>
          <li>
            The symptom does not match any row in this guide and is not
            explained by the{" "}
            <Link
              href="/docs/guide"
              className="font-semibold text-primary-200 hover:text-primary-100"
            >
              customer guides
            </Link>
            .
          </li>
          <li>
            You suspect a service-side issue (e.g., API healthy but returning
            unexpected errors for all users).
          </li>
          <li>
            You need to report a potential security issue &mdash; see the{" "}
            <Link
              href="/docs/auth"
              className="font-semibold text-primary-200 hover:text-primary-100"
            >
              Auth &amp; API Keys
            </Link>{" "}
            page for responsible disclosure.
          </li>
        </ul>
        <p className="text-slate-300">
          Submit a request via{" "}
          <Link
            href="/feedback"
            className="font-semibold text-primary-200 hover:text-primary-100"
          >
            feedback
          </Link>{" "}
          with the symptom, error message, and the steps you have already
          tried. This helps the team resolve your issue faster.
        </p>
      </section>

      {/* ── Related guides ── */}
      <section className="glass-panel rounded-xl p-7">
        <HeadingAnchor id="related-guides">Related guides</HeadingAnchor>
        <ul className="mt-3 space-y-2 text-slate-300">
          <li>
            <Link
              href="/docs/guide/key-lifecycle"
              className="font-semibold text-primary-200 hover:text-primary-100"
            >
              API Key Lifecycle
            </Link>{" "}
            &mdash; create, rotate, revoke, and scope API keys
          </li>
          <li>
            <Link
              href="/docs/guide/rate-limits"
              className="font-semibold text-primary-200 hover:text-primary-100"
            >
              Rate Limits &amp; Recovery
            </Link>{" "}
            &mdash; headers, backoff strategies, and quota management
          </li>
          <li>
            <Link
              href="/docs/guide/webhooks"
              className="font-semibold text-primary-200 hover:text-primary-100"
            >
              Webhook Setup &amp; Debugging
            </Link>{" "}
            &mdash; endpoints, signatures, delivery lifecycle, and deadletter
          </li>
          <li>
            <Link
              href="/docs/guide/readiness"
              className="font-semibold text-primary-200 hover:text-primary-100"
            >
              Readiness &amp; Health Checks
            </Link>{" "}
            &mdash; CLI doctor, RPC connectivity, and integration readiness
          </li>
          <li>
            <Link
              href="/docs/guide/receipts-ops"
              className="font-semibold text-primary-200 hover:text-primary-100"
            >
              Receipt Operations
            </Link>{" "}
            &mdash; browse, verify, export, and troubleshoot receipts
          </li>
        </ul>
      </section>
    </article>
  );
}
