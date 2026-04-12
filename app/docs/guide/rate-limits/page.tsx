import type { Metadata } from "next";
import Link from "next/link";
import { HeadingAnchor } from "@/components/heading-anchor";
import { CopyBlock } from "@/components/copy-block";

export const metadata: Metadata = {
  title: "Rate Limits & Recovery — Customer Guide",
  description:
    "Read rate-limit headers, implement exponential backoff, and recover gracefully when ATF limits are hit.",
  robots: { index: false, follow: false },
};

/* ── Constants (grounded in current product behavior) ── */

const ATF_BASE_URL = "https://api.trucore.xyz";

/* ── Per-endpoint rate limits ── */

const ENDPOINT_LIMITS = [
  {
    endpoint: "/api/simulate",
    auth: "None (public)",
    limit: "30 req / min",
    key: "Hashed IP",
    notes: "Anonymous protect and simulate calls.",
  },
  {
    endpoint: "/api/simulate",
    auth: "X-API-Key",
    limit: "120 req / min",
    key: "API key ID",
    notes: "Authenticated protect and simulate calls.",
  },
  {
    endpoint: "Key management",
    auth: "Session",
    limit: "30 mutations / min",
    key: "Session ID",
    notes: "Create, revoke, and rotate API keys.",
  },
] as const;

/* ── Plan quotas ── */

const PLAN_QUOTAS = [
  {
    resource: "Protect calls / day",
    free: "100",
    pro: "5,000",
    enterprise: "1,000,000",
  },
  {
    resource: "Execution calls / day",
    free: "10",
    pro: "500",
    enterprise: "100,000",
  },
  {
    resource: "Stored receipts",
    free: "100",
    pro: "10,000",
    enterprise: "10,000,000",
  },
] as const;

/* ── Rate-limit response headers ── */

const HEADERS = [
  {
    header: "X-RateLimit-Limit",
    type: "Integer",
    description: "Maximum requests allowed in the current window.",
  },
  {
    header: "X-RateLimit-Remaining",
    type: "Integer",
    description:
      "Requests remaining before the limit resets. Reaches 0 when the limit is hit.",
  },
  {
    header: "X-RateLimit-Reset",
    type: "Unix epoch (seconds)",
    description:
      "Timestamp when the current rate-limit window resets and the counter returns to the limit.",
  },
  {
    header: "Retry-After",
    type: "Integer (seconds)",
    description:
      "Present only on 429 responses. Seconds to wait before sending the next request.",
  },
  {
    header: "X-ATF-Quota-Warning",
    type: "String",
    description:
      "Returned when daily plan quota usage approaches the limit. Indicates you should slow down or upgrade.",
  },
] as const;

/* ── Troubleshooting rows ── */

const TROUBLESHOOTING = [
  {
    symptom: "429 with Retry-After header",
    cause: "Per-endpoint rate limit hit (requests/min).",
    fix: "Honor Retry-After. Implement exponential backoff with jitter.",
  },
  {
    symptom: "429 without Retry-After",
    cause: "Daily plan quota exhausted.",
    fix: "Check your dashboard usage meters. Wait for midnight UTC reset or upgrade your plan.",
  },
  {
    symptom: "X-ATF-Quota-Warning header on 200 response",
    cause: "Approaching daily plan quota limit.",
    fix: "Reduce call frequency. Check /customer/dashboard for current usage.",
  },
  {
    symptom: "X-RateLimit-Remaining is 0 but no 429 yet",
    cause: "Window is about to reset. Next request will trigger 429 if sent before reset.",
    fix: "Wait until X-RateLimit-Reset epoch passes before resuming.",
  },
  {
    symptom: "429 on key management endpoints",
    cause: "Key create/revoke/rotate mutation limit hit (30/min).",
    fix: "Space out key operations. Key management and API calls use separate buckets.",
  },
  {
    symptom: "Consistent 429 despite low request volume",
    cause: "IP shared with other users (corporate NAT, VPN, cloud egress).",
    fix: "Authenticate with an API key to get a per-key bucket (120 req/min vs 30 req/min).",
  },
] as const;

/* ── Page ── */

export default function RateLimitsGuide() {
  return (
    <article className="space-y-10">
      {/* ── Header ── */}
      <header className="space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
          Customer Guide
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-accent-200 sm:text-5xl">
          Rate Limits &amp; Recovery
        </h1>
        <p className="max-w-3xl text-lg leading-relaxed text-slate-300">
          Understand how ATF rate limits and plan quotas work, read the
          response headers, implement safe retry patterns, and recover
          gracefully when limits are hit. For plan tiers and daily quotas,
          see{" "}
          <Link
            href="/docs/plans"
            className="font-semibold text-primary-200 transition-colors hover:text-primary-100"
          >
            Plans &amp; Feature Tiers
          </Link>{" "}
          in the public docs.
        </p>
        <div className="gradient-divider mt-2" aria-hidden="true" />
      </header>

      {/* ── 1. Overview ── */}
      <section className="space-y-4">
        <HeadingAnchor id="overview">What this guide covers</HeadingAnchor>
        <p className="text-slate-300">
          ATF enforces two layers of limits to protect service quality:
        </p>
        <ul className="ml-5 list-disc space-y-2 text-slate-300">
          <li>
            <strong className="text-slate-200">Per-endpoint rate limits</strong>{" "}
            — short-window caps (requests per minute) applied to every API
            call. These prevent burst abuse and keep latency predictable.
          </li>
          <li>
            <strong className="text-slate-200">Plan quotas</strong> — daily
            caps on protect calls, execution calls, and stored receipts. These
            are tied to your plan tier and reset at midnight UTC.
          </li>
        </ul>
        <p className="text-slate-300">
          Both layers return structured headers so your code can react
          proactively instead of retrying blind. This guide explains exactly
          how to read those headers, what each 429 response means, and how to
          build retry logic that keeps your bots running smoothly.
        </p>
      </section>

      {/* ── 2. How rate limits fit into ATF ── */}
      <section className="space-y-4">
        <HeadingAnchor id="how-limits-work">
          How rate limits fit into ATF
        </HeadingAnchor>
        <p className="text-slate-300">
          Every request to the ATF API passes through a token-bucket rate
          limiter before reaching the policy engine. When the bucket is empty,
          you receive a <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-sm text-slate-200">429 Too Many Requests</code>{" "}
          response with headers telling you exactly when to retry.
        </p>
        <p className="text-slate-300">
          The rate-limit bucket is separate from plan quotas. You can hit a
          per-minute rate limit long before your daily plan quota is exhausted,
          or exhaust your daily quota without ever triggering the per-minute
          limiter. Understanding this distinction is the key to writing
          resilient integrations.
        </p>
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-5 text-sm text-slate-300">
          <p className="font-semibold text-slate-200">Quick mental model</p>
          <ul className="ml-5 mt-2 list-disc space-y-1">
            <li>
              <strong className="text-slate-200">Rate limit</strong> = &quot;slow
              down&quot; — you are sending too fast in this minute.
            </li>
            <li>
              <strong className="text-slate-200">Plan quota</strong> = &quot;stop
              for the day&quot; — you have used your daily allowance.
            </li>
          </ul>
        </div>
      </section>

      {/* ── 3. Per-endpoint rate limits ── */}
      <section className="space-y-4">
        <HeadingAnchor id="endpoint-limits">
          Per-endpoint rate limits
        </HeadingAnchor>
        <p className="text-slate-300">
          The following limits are enforced on a sliding one-minute window.
          Authenticated requests (with a valid{" "}
          <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-sm text-slate-200">
            X-API-Key
          </code>{" "}
          header) get a 4× higher allowance because the bucket is keyed to your
          API key instead of your IP address.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-slate-400">
                <th className="pb-2 pr-4 font-medium">Endpoint</th>
                <th className="pb-2 pr-4 font-medium">Auth</th>
                <th className="pb-2 pr-4 font-medium">Limit</th>
                <th className="pb-2 pr-4 font-medium">Bucket key</th>
                <th className="pb-2 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {ENDPOINT_LIMITS.map((row, i) => (
                <tr key={i} className="border-b border-white/[0.04]">
                  <td className="py-2.5 pr-4 font-mono text-xs text-slate-200">
                    {row.endpoint}
                  </td>
                  <td className="py-2.5 pr-4">{row.auth}</td>
                  <td className="py-2.5 pr-4 font-mono text-xs">
                    {row.limit}
                  </td>
                  <td className="py-2.5 pr-4">{row.key}</td>
                  <td className="py-2.5 text-slate-400">{row.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-slate-400">
          Key management endpoints (create, revoke, rotate) share a single
          mutation bucket separate from the simulate/protect API. You cannot
          exhaust your protect budget by managing keys, or vice versa.
        </p>
      </section>

      {/* ── 4. Plan quotas ── */}
      <section className="space-y-4">
        <HeadingAnchor id="plan-quotas">Plan quotas</HeadingAnchor>
        <p className="text-slate-300">
          Daily quotas are determined by your plan tier. These reset at{" "}
          <strong className="text-slate-200">midnight UTC</strong> every day.
          When you approach a limit, ATF adds an{" "}
          <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-sm text-slate-200">
            X-ATF-Quota-Warning
          </code>{" "}
          header to successful responses. Exceeding a daily quota may result in
          429 responses depending on enforcement mode.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-slate-400">
                <th className="pb-2 pr-4 font-medium">Resource</th>
                <th className="pb-2 pr-4 font-medium">Free</th>
                <th className="pb-2 pr-4 font-medium">Pro</th>
                <th className="pb-2 font-medium">Enterprise</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {PLAN_QUOTAS.map((row) => (
                <tr key={row.resource} className="border-b border-white/[0.04]">
                  <td className="py-2.5 pr-4 text-slate-200">
                    {row.resource}
                  </td>
                  <td className="py-2.5 pr-4">{row.free}</td>
                  <td className="py-2.5 pr-4">{row.pro}</td>
                  <td className="py-2.5">{row.enterprise}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-slate-400">
          Your current usage is visible on the{" "}
          <Link
            href="/customer/dashboard"
            className="font-semibold text-primary-200 hover:text-primary-100"
          >
            customer dashboard
          </Link>
          . Usage meters show protect calls, execution calls, and stored
          receipts with warning indicators when approaching the limit.
        </p>
      </section>

      {/* ── 5. Reading rate-limit headers ── */}
      <section className="space-y-4">
        <HeadingAnchor id="headers">Reading rate-limit headers</HeadingAnchor>
        <p className="text-slate-300">
          Every response from the simulate/protect API includes rate-limit
          headers, whether the request succeeds or is rejected. Parse these in
          your client to make informed retry decisions.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-slate-400">
                <th className="pb-2 pr-4 font-medium">Header</th>
                <th className="pb-2 pr-4 font-medium">Type</th>
                <th className="pb-2 font-medium">Description</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {HEADERS.map((row) => (
                <tr key={row.header} className="border-b border-white/[0.04]">
                  <td className="py-2.5 pr-4 font-mono text-xs text-slate-200">
                    {row.header}
                  </td>
                  <td className="py-2.5 pr-4 whitespace-nowrap">
                    {row.type}
                  </td>
                  <td className="py-2.5 text-slate-400">{row.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-slate-300 mt-2">
          Example response headers on a successful request:
        </p>
        <CopyBlock
          label="Example 200 response headers"
          value={`HTTP/1.1 200 OK
X-RateLimit-Limit: 120
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1744502460`}
        />
        <p className="text-slate-300 mt-2">
          Example response headers on a rate-limited request:
        </p>
        <CopyBlock
          label="Example 429 response headers"
          value={`HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 120
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1744502460
Retry-After: 23`}
        />
      </section>

      {/* ── 6. The 429 response body ── */}
      <section className="space-y-4">
        <HeadingAnchor id="response-body">
          The 429 response body
        </HeadingAnchor>
        <p className="text-slate-300">
          When a rate limit is exceeded, the API returns a JSON body with a
          machine-readable error code and the number of seconds to wait:
        </p>
        <CopyBlock
          label="429 response body"
          value={`{
  "ok": false,
  "error": "rate_limited",
  "message": "Rate limit exceeded. Please retry after the reset window.",
  "retry_after_seconds": 23
}`}
        />
        <p className="text-slate-300">
          The{" "}
          <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-sm text-slate-200">
            retry_after_seconds
          </code>{" "}
          field in the body matches the{" "}
          <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-sm text-slate-200">
            Retry-After
          </code>{" "}
          header. Use whichever is easier to parse in your client.
        </p>
      </section>

      {/* ── 7. Burst vs steady-state ── */}
      <section className="space-y-4">
        <HeadingAnchor id="burst-vs-steady">
          Burst vs steady-state behavior
        </HeadingAnchor>
        <p className="text-slate-300">
          ATF uses a token-bucket algorithm for per-endpoint limits. At the
          start of each one-minute window, the bucket refills to the full
          limit. This means:
        </p>
        <ul className="ml-5 list-disc space-y-2 text-slate-300">
          <li>
            <strong className="text-slate-200">Burst is allowed</strong> — you
            can send all 120 keyed requests at the beginning of the window if
            your workflow needs it.
          </li>
          <li>
            <strong className="text-slate-200">
              But the bucket does not refill gradually
            </strong>{" "}
            — once you exhaust the window, you must wait for the full reset.
            There are no partial refills mid-window.
          </li>
          <li>
            <strong className="text-slate-200">Steady-state pacing</strong> is
            safer — spreading requests evenly (e.g. 2 per second for 120/min)
            avoids hitting the wall and makes backoff less likely.
          </li>
        </ul>
        <p className="text-slate-300">
          Plan quotas behave differently: they are a simple daily counter that
          increments with every call. There is no burst concept for daily
          quotas — every call counts equally regardless of timing.
        </p>
      </section>

      {/* ── 8. Implementing backoff ── */}
      <section className="space-y-4">
        <HeadingAnchor id="backoff">
          Retry pattern: exponential backoff with jitter
        </HeadingAnchor>
        <p className="text-slate-300">
          When you receive a 429, use the{" "}
          <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-sm text-slate-200">
            Retry-After
          </code>{" "}
          header (or{" "}
          <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-sm text-slate-200">
            retry_after_seconds
          </code>{" "}
          from the body) as the minimum wait time. Layer exponential backoff on
          top for successive failures, with jitter to avoid thundering-herd
          effects.
        </p>
        <CopyBlock
          label="TypeScript: exponential backoff with jitter"
          value={`async function callWithBackoff(
  fn: () => Promise<Response>,
  maxRetries = 5,
): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fn();

    if (res.status !== 429) return res;

    // Use Retry-After header if present, otherwise exponential backoff
    const retryAfter = res.headers.get("Retry-After");
    const baseWait = retryAfter
      ? Number(retryAfter) * 1000
      : Math.min(1000 * 2 ** attempt, 60_000);

    // Add random jitter (0–25% of base wait) to avoid thundering herd
    const jitter = Math.random() * baseWait * 0.25;
    const waitMs = baseWait + jitter;

    console.warn(
      \`Rate limited (attempt \${attempt + 1}/\${maxRetries + 1}). \` +
        \`Waiting \${Math.round(waitMs / 1000)}s before retry.\`,
    );

    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  throw new Error("Max retries exceeded after repeated 429 responses.");
}`}
        />
        <p className="text-slate-300">
          This pattern works for both per-endpoint rate limits (short waits)
          and daily quota limits (longer waits or stop-until-reset). The key
          rules:
        </p>
        <ol className="ml-5 list-decimal space-y-2 text-slate-300">
          <li>
            <strong className="text-slate-200">
              Always honor Retry-After
            </strong>{" "}
            — never retry sooner than the server tells you to.
          </li>
          <li>
            <strong className="text-slate-200">Cap the maximum wait</strong>{" "}
            — 60 seconds is a reasonable ceiling for per-endpoint limits. For
            daily quota exhaustion, stop entirely and alert your operations
            team.
          </li>
          <li>
            <strong className="text-slate-200">Add jitter</strong> — without
            jitter, bots sharing a rate-limit bucket will retry at the exact
            same time and re-trigger the limit.
          </li>
          <li>
            <strong className="text-slate-200">
              Set a retry ceiling
            </strong>{" "}
            — 5 retries is a reasonable default. If you are still getting 429s
            after 5 attempts, the issue is likely a daily quota limit, not a
            transient spike.
          </li>
        </ol>
      </section>

      {/* ── 9. Reading headers proactively ── */}
      <section className="space-y-4">
        <HeadingAnchor id="proactive">
          Using headers proactively
        </HeadingAnchor>
        <p className="text-slate-300">
          You do not have to wait for a 429 to manage your rate. Every
          successful response includes{" "}
          <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-sm text-slate-200">
            X-RateLimit-Remaining
          </code>{" "}
          and{" "}
          <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-sm text-slate-200">
            X-RateLimit-Reset
          </code>
          . A well-designed client reads these on every response and slows down
          before hitting the wall:
        </p>
        <CopyBlock
          label="TypeScript: proactive rate-limit awareness"
          value={`function shouldThrottle(res: Response): number | null {
  const remaining = Number(res.headers.get("X-RateLimit-Remaining"));
  const resetEpoch = Number(res.headers.get("X-RateLimit-Reset"));

  if (Number.isNaN(remaining) || Number.isNaN(resetEpoch)) return null;

  // If fewer than 5 requests remain, pace until reset
  if (remaining < 5) {
    const msUntilReset = resetEpoch * 1000 - Date.now();
    return Math.max(msUntilReset / Math.max(remaining, 1), 0);
  }

  return null; // No throttling needed
}`}
        />
        <p className="text-sm text-slate-400">
          Similarly, if you see the{" "}
          <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-sm text-slate-200">
            X-ATF-Quota-Warning
          </code>{" "}
          header on a 200 response, your daily quota is approaching the limit.
          This is the time to reduce call volume or alert operations — not wait
          for a hard-stop 429.
        </p>
      </section>

      {/* ── 10. Common 429 causes ── */}
      <section className="space-y-4">
        <HeadingAnchor id="common-causes">
          Common 429 causes
        </HeadingAnchor>
        <ul className="ml-5 list-disc space-y-2 text-slate-300">
          <li>
            <strong className="text-slate-200">Polling too aggressively</strong>{" "}
            — calling protect/simulate in a tight loop without pacing. Spread
            calls to at most 2 per second for keyed requests.
          </li>
          <li>
            <strong className="text-slate-200">
              Unauthenticated requests from a shared IP
            </strong>{" "}
            — the public bucket is 30 req/min per IP. Behind a corporate NAT
            or cloud proxy, multiple users share that budget. Authenticate
            with an API key to get a per-key bucket (120/min).
          </li>
          <li>
            <strong className="text-slate-200">
              Retry storms after a transient failure
            </strong>{" "}
            — if a 502/503 triggers immediate retries from multiple bots, the
            burst can exhaust the rate limit. Always use backoff — even for
            non-429 errors.
          </li>
          <li>
            <strong className="text-slate-200">Daily quota exhaustion</strong>{" "}
            — the Free plan allows 100 protect calls and 10 execution calls per
            day. Bots running continuously can exhaust this quickly. Monitor
            usage on the{" "}
            <Link
              href="/customer/dashboard"
              className="font-semibold text-primary-200 hover:text-primary-100"
            >
              dashboard
            </Link>{" "}
            and upgrade if needed.
          </li>
          <li>
            <strong className="text-slate-200">
              Key management rate limit
            </strong>{" "}
            — automated key rotation scripts can hit the 30 mutations/min limit
            if rotating many keys at once. Space rotations across multiple
            minutes.
          </li>
        </ul>
      </section>

      {/* ── 11. Troubleshooting ── */}
      <section className="space-y-4">
        <HeadingAnchor id="troubleshooting">Troubleshooting</HeadingAnchor>
        <p className="text-slate-300">
          Use the table below to diagnose specific rate-limit scenarios.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-slate-400">
                <th className="pb-2 pr-4 font-medium">Symptom</th>
                <th className="pb-2 pr-4 font-medium">Likely cause</th>
                <th className="pb-2 font-medium">Fix</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {TROUBLESHOOTING.map((row, i) => (
                <tr key={i} className="border-b border-white/[0.04]">
                  <td className="py-2.5 pr-4 text-slate-200">
                    {row.symptom}
                  </td>
                  <td className="py-2.5 pr-4">{row.cause}</td>
                  <td className="py-2.5 text-slate-400">{row.fix}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── 12. Rate-limit hygiene checklist ── */}
      <section className="space-y-4">
        <HeadingAnchor id="checklist">Rate-limit hygiene checklist</HeadingAnchor>
        <ul className="ml-5 list-disc space-y-2 text-slate-300">
          <li>
            <strong className="text-slate-200">Authenticate all requests</strong>{" "}
            — use an API key to get the 120/min per-key bucket instead of
            30/min per-IP. See the{" "}
            <Link
              href="/docs/guide/key-lifecycle"
              className="font-semibold text-primary-200 hover:text-primary-100"
            >
              Key Lifecycle guide
            </Link>{" "}
            for setup instructions.
          </li>
          <li>
            <strong className="text-slate-200">Parse headers on every response</strong>{" "}
            — track{" "}
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-sm text-slate-200">
              X-RateLimit-Remaining
            </code>{" "}
            and slow down before hitting 0.
          </li>
          <li>
            <strong className="text-slate-200">Monitor daily usage</strong>{" "}
            — check the{" "}
            <Link
              href="/customer/dashboard"
              className="font-semibold text-primary-200 hover:text-primary-100"
            >
              customer dashboard
            </Link>{" "}
            regularly. Set up alerts when usage meters turn amber.
          </li>
          <li>
            <strong className="text-slate-200">
              Implement backoff for all errors
            </strong>{" "}
            — not just 429. A 502 or 503 followed by immediate retry can
            trigger rate limits as a secondary effect.
          </li>
          <li>
            <strong className="text-slate-200">
              Add jitter to retry loops
            </strong>{" "}
            — prevents synchronized retries across multiple bots.
          </li>
          <li>
            <strong className="text-slate-200">
              Separate concerns
            </strong>{" "}
            — key management and API calls use independent rate-limit buckets.
            A burst of protect calls will not affect your ability to rotate
            keys.
          </li>
          <li>
            <strong className="text-slate-200">
              Watch for quota warnings
            </strong>{" "}
            — when you see{" "}
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-sm text-slate-200">
              X-ATF-Quota-Warning
            </code>{" "}
            on a 200 response, reduce call frequency or plan an upgrade.
          </li>
        </ul>
      </section>

      {/* ── 13. Next steps ── */}
      <section className="space-y-4">
        <HeadingAnchor id="next-steps">Next steps</HeadingAnchor>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/docs/plans"
            className="group rounded-lg border border-white/10 p-5 transition-colors hover:border-white/20"
          >
            <h3 className="font-bold text-accent-300 group-hover:text-accent-200">
              Plans &amp; Feature Tiers &rarr;
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              Full plan comparison with daily quotas and feature availability.
            </p>
          </Link>
          <Link
            href="/docs/guide/key-lifecycle"
            className="group rounded-lg border border-white/10 p-5 transition-colors hover:border-white/20"
          >
            <h3 className="font-bold text-accent-300 group-hover:text-accent-200">
              API Key Lifecycle &rarr;
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              Create, scope, rotate, and revoke your API keys.
            </p>
          </Link>
          <Link
            href="/customer/dashboard"
            className="group rounded-lg border border-white/10 p-5 transition-colors hover:border-white/20"
          >
            <h3 className="font-bold text-accent-300 group-hover:text-accent-200">
              Customer Dashboard &rarr;
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              Live usage meters, plan info, and account status.
            </p>
          </Link>
          <Link
            href="/docs/guide"
            className="group rounded-lg border border-white/10 p-5 transition-colors hover:border-white/20"
          >
            <h3 className="font-bold text-accent-300 group-hover:text-accent-200">
              All Customer Guides &rarr;
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              Browse all operational guides for TruCore ATF.
            </p>
          </Link>
        </div>
      </section>
    </article>
  );
}
