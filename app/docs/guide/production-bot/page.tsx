import type { Metadata } from "next";
import Link from "next/link";
import { HeadingAnchor } from "@/components/heading-anchor";
import { CopyBlock } from "@/components/copy-block";

export const metadata: Metadata = {
  title: "Production Bot Configuration — Customer Guide",
  description:
    "Configure your bot for production: environment setup, key strategy, readiness checks, rate-limit-aware polling, webhook handling, receipt verification, and safe rollout patterns.",
  robots: { index: false, follow: false },
};

/* ── Production checklist ── */

type CheckItem = {
  item: string;
  detail: string;
  category: "blocking" | "recommended" | "optional";
  guideRef?: { label: string; href: string };
};

const PRODUCTION_CHECKLIST: CheckItem[] = [
  {
    item: "API key created and stored securely",
    detail:
      "Generate a dedicated production key at /customer/keys. Store it in a secrets manager or environment variable — never in source code.",
    category: "blocking",
    guideRef: { label: "Key Lifecycle", href: "/docs/guide/key-lifecycle" },
  },
  {
    item: "Key scoped to minimum required permissions",
    detail:
      "Start with atf:probe and atf:simulate. Add atf:verify only if your bot verifies receipts. Add atf:mcp only if using the MCP surface.",
    category: "blocking",
    guideRef: { label: "Key Lifecycle", href: "/docs/guide/key-lifecycle" },
  },
  {
    item: "Separate keys for each environment",
    detail:
      "Use distinct keys for development, staging, and production. Never reuse a production key in test environments.",
    category: "blocking",
    guideRef: { label: "Key Lifecycle", href: "/docs/guide/key-lifecycle" },
  },
  {
    item: "atf doctor passes all checks",
    detail:
      "Run atf doctor --pretty in your production environment. All checks should pass (✓). Resolve any errors (✗) before going live.",
    category: "blocking",
    guideRef: { label: "Readiness", href: "/docs/guide/readiness" },
  },
  {
    item: "RPC endpoint reachable with acceptable latency",
    detail:
      "Run atf rpc ping. Latency under 200ms is recommended. Confirm your RPC provider supports your expected request volume.",
    category: "blocking",
    guideRef: { label: "Readiness", href: "/docs/guide/readiness" },
  },
  {
    item: "Dry-run trade succeeds end-to-end",
    detail:
      "Run atf trade --dry-run before any live trade. Confirms API connectivity, policy evaluation, and receipt generation without execution.",
    category: "blocking",
  },
  {
    item: "Rate-limit backoff implemented",
    detail:
      "Your bot must handle 429 responses with exponential backoff and jitter. Hardcoded retries without backoff will exhaust your quota.",
    category: "blocking",
    guideRef: { label: "Rate Limits", href: "/docs/guide/rate-limits" },
  },
  {
    item: "Receipt storage configured",
    detail:
      "Save every receipt (ALLOWED and DENIED) to durable storage. Receipts are your audit trail and dispute evidence.",
    category: "blocking",
    guideRef: { label: "Receipts", href: "/docs/guide/receipts-ops" },
  },
  {
    item: "Webhook endpoint configured (if using async notifications)",
    detail:
      "Register a webhook, verify HMAC signatures, and implement idempotent processing with event_id deduplication.",
    category: "recommended",
    guideRef: { label: "Webhooks", href: "/docs/guide/webhooks" },
  },
  {
    item: "Health-check polling in place",
    detail:
      "Poll GET /health at startup and periodically. If unhealthy, pause trading and alert — do not retry blindly.",
    category: "recommended",
    guideRef: { label: "Readiness", href: "/docs/guide/readiness" },
  },
  {
    item: "Key rotation schedule documented",
    detail:
      "Plan quarterly key rotation as a baseline. Document the rotation procedure so it can be executed under pressure.",
    category: "recommended",
    guideRef: { label: "Key Lifecycle", href: "/docs/guide/key-lifecycle" },
  },
  {
    item: "Monitoring and alerting active",
    detail:
      "Track X-RateLimit-Remaining headers, webhook delivery failures, and health endpoint responses. Alert before limits are hit.",
    category: "recommended",
    guideRef: { label: "Rate Limits", href: "/docs/guide/rate-limits" },
  },
];

/* ── Bot loop phases ── */

type LoopPhase = {
  phase: string;
  description: string;
  failBehavior: string;
};

const BOT_LOOP_PHASES: LoopPhase[] = [
  {
    phase: "1. Health check",
    description:
      "Call GET /health at startup. If unhealthy, do not start trading. Log and wait.",
    failBehavior: "Abort startup. Retry after 30 seconds.",
  },
  {
    phase: "2. Preflight",
    description:
      "Run atf bot preflight (or equivalent API call) once per session. Validates key, connectivity, RPC, and policy.",
    failBehavior: "Do not start session. Fix the failing check first.",
  },
  {
    phase: "3. Protect intent",
    description:
      'Call POST /v1/bot/protect for every trade intent before execution. Inspect the "status" field in the response.',
    failBehavior: "If DENIED, do not execute. Save the denial receipt.",
  },
  {
    phase: "4. Execute (ALLOWED only)",
    description:
      "Sign and submit the transaction only if the protect call returned ALLOWED. Never skip the protect step.",
    failBehavior: "If submission fails, save the error alongside the receipt.",
  },
  {
    phase: "5. Save receipt",
    description:
      "Persist the full receipt JSON (ALLOWED and DENIED) to durable storage. Include the exit code or HTTP status.",
    failBehavior: "If storage fails, log the receipt to stdout as a fallback.",
  },
  {
    phase: "6. Backoff on rate limit",
    description:
      "If a 429 is returned, honor the Retry-After header. Apply exponential backoff with jitter.",
    failBehavior: "Pause the trading loop. Resume after the backoff period.",
  },
];

/* ── Rollout stages ── */

type RolloutStage = {
  stage: string;
  description: string;
  keyAction: string;
};

const ROLLOUT_STAGES: RolloutStage[] = [
  {
    stage: "1. Dry-run on devnet",
    description:
      "Use atf trade --dry-run with a devnet profile. Confirm policy evaluation, receipt generation, and error handling.",
    keyAction: "Verify receipt content_hash is generated and valid.",
  },
  {
    stage: "2. Dry-run on mainnet",
    description:
      "Switch to your mainnet profile but keep --dry-run. Confirm the same behavior with production RPC and policy.",
    keyAction: "Verify latency is acceptable and no unexpected denials occur.",
  },
  {
    stage: "3. Small live trade",
    description:
      "Execute a single small trade (minimum viable amount). Verify the receipt, confirm it appears in your receipt store.",
    keyAction: "Verify the receipt in /customer/receipts or via the CLI.",
  },
  {
    stage: "4. Gradual volume increase",
    description:
      "Increase trade frequency gradually. Monitor rate-limit headers and quota usage in the dashboard.",
    keyAction: "Confirm X-RateLimit-Remaining stays above your safety threshold.",
  },
  {
    stage: "5. Full production",
    description:
      "Enable the bot at full intended volume. Webhooks (if configured) will deliver real-time status. Health checks run continuously.",
    keyAction: "Confirm monitoring captures all expected events.",
  },
];

/* ── Environment setup ── */

type EnvVar = {
  name: string;
  purpose: string;
  example: string;
  required: boolean;
};

const ENV_VARS: EnvVar[] = [
  {
    name: "ATF_API_KEY",
    purpose: "Authenticates your bot to the ATF API. Included in every request as the X-API-Key header.",
    example: "sk_prod_aBcDeFgHiJkLmNoPqRsTuVwXyZ012345",
    required: true,
  },
  {
    name: "ATF_BASE_URL",
    purpose: "ATF API base URL. Defaults to https://api.trucore.xyz if not set.",
    example: "https://api.trucore.xyz",
    required: false,
  },
  {
    name: "ATF_RPC_URL",
    purpose: "RPC endpoint for on-chain operations. Used by the CLI and local simulation.",
    example: "https://rpc.helius.xyz/?api-key=YOUR_KEY",
    required: true,
  },
  {
    name: "ATF_PROFILE",
    purpose: "Named CLI profile. Use separate profiles for dev/staging/prod to avoid key and endpoint cross-contamination.",
    example: "prod",
    required: false,
  },
  {
    name: "ATF_RECEIPTS_DIR",
    purpose: "Directory for receipt storage. Must be on durable storage (not /tmp).",
    example: "/var/data/atf/receipts",
    required: false,
  },
];

/* ── Scope reference (minimal) ── */

type ScopeRow = {
  scope: string;
  grants: string;
  botNeed: "required" | "recommended" | "optional";
};

const SCOPE_REFERENCE: ScopeRow[] = [
  {
    scope: "atf:probe",
    grants: "Health checks, readiness, preflight, and intent simulation.",
    botNeed: "required",
  },
  {
    scope: "atf:simulate",
    grants: "Full protect calls — policy evaluation and receipt generation.",
    botNeed: "required",
  },
  {
    scope: "atf:verify",
    grants: "Receipt verification and content_hash recomputation.",
    botNeed: "recommended",
  },
  {
    scope: "atf:explain",
    grants: "Denial reason codes and human-readable explanations.",
    botNeed: "recommended",
  },
  {
    scope: "atf:mcp",
    grants: "Model Context Protocol tool surface access.",
    botNeed: "optional",
  },
];

/* ── Page ── */

export default function ProductionBotGuide() {
  return (
    <article className="space-y-10">
      {/* ── Header ── */}
      <header className="space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
          Customer Guide
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-accent-200 sm:text-5xl">
          Production Bot Configuration
        </h1>
        <p className="max-w-3xl text-lg leading-relaxed text-slate-300">
          Move your bot from &ldquo;it works in dev&rdquo; to &ldquo;it runs
          safely in production.&rdquo; This guide covers environment setup, key
          strategy, readiness checks, rate-limit-aware operation, receipt
          handling, and safe rollout patterns. For first-time setup, see{" "}
          <Link
            href="/docs/hello-world-bot"
            className="font-semibold text-primary-200 transition-colors hover:text-primary-100"
          >
            Hello-World Bot
          </Link>{" "}
          and{" "}
          <Link
            href="/docs/first-protected-trade"
            className="font-semibold text-primary-200 transition-colors hover:text-primary-100"
          >
            First Protected Trade
          </Link>{" "}
          in the public docs.
        </p>
        <div className="gradient-divider mt-2" aria-hidden="true" />
      </header>

      {/* ── What this guide is for ── */}
      <section className="space-y-4">
        <HeadingAnchor id="overview">What this guide is for</HeadingAnchor>
        <p className="text-slate-300">
          You have a working bot. It calls the ATF API, receives decisions, and
          maybe even submits a trade. This guide takes you from that point to a
          production-grade setup — one that handles failures, respects rate
          limits, stores receipts, and can be rolled out safely without
          surprises.
        </p>
        <p className="text-slate-300">
          All guidance here is grounded in current product behavior. No
          speculative features are referenced.
        </p>
      </section>

      {/* ── What "production-ready" means ── */}
      <section className="space-y-4">
        <HeadingAnchor id="production-ready">
          What &ldquo;production-ready&rdquo; means in ATF
        </HeadingAnchor>
        <p className="text-slate-300">
          A production-ready bot is not just one that completes trades. It is
          one where:
        </p>
        <ul className="ml-5 list-disc space-y-2 text-slate-300">
          <li>
            <strong className="text-slate-200">Every trade is protected</strong>
            {" "}— the bot never submits a transaction without first calling{" "}
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
              /v1/bot/protect
            </code>.
          </li>
          <li>
            <strong className="text-slate-200">Denials are respected</strong>
            {" "}— a DENIED decision means the transaction is not submitted.
            The denial receipt is saved for audit.
          </li>
          <li>
            <strong className="text-slate-200">Failures are fail-closed</strong>
            {" "}— if the ATF API is unreachable or returns an error, the bot
            does not execute. It waits and retries.
          </li>
          <li>
            <strong className="text-slate-200">Receipts are stored</strong>
            {" "}— every decision (ALLOWED and DENIED) produces a receipt that
            is persisted to durable storage.
          </li>
          <li>
            <strong className="text-slate-200">Rate limits are respected</strong>
            {" "}— the bot monitors quota headers and backs off before hitting
            the limit.
          </li>
          <li>
            <strong className="text-slate-200">Secrets are managed</strong>
            {" "}— API keys are in environment variables or a secrets manager,
            never committed to source code.
          </li>
        </ul>
      </section>

      {/* ── Production checklist ── */}
      <section className="space-y-4">
        <HeadingAnchor id="checklist">
          Production readiness checklist
        </HeadingAnchor>
        <p className="text-slate-300">
          Complete every <strong className="text-red-300">blocking</strong> item
          before your first live trade. Address{" "}
          <strong className="text-amber-300">recommended</strong> items before
          scaling to full volume.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-slate-400">
                <th className="pb-2 pr-4 font-medium">Priority</th>
                <th className="pb-2 pr-4 font-medium">Item</th>
                <th className="pb-2 pr-4 font-medium">Detail</th>
                <th className="pb-2 font-medium">Guide</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {PRODUCTION_CHECKLIST.map((row) => (
                <tr
                  key={row.item}
                  className="border-b border-white/[0.04]"
                >
                  <td className="py-2.5 pr-4">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                        row.category === "blocking"
                          ? "border border-red-500/20 bg-red-500/10 text-red-400"
                          : row.category === "recommended"
                            ? "border border-amber-500/20 bg-amber-500/10 text-amber-400"
                            : "border border-slate-500/20 bg-slate-500/10 text-slate-400"
                      }`}
                    >
                      {row.category}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 font-medium text-slate-200">
                    {row.item}
                  </td>
                  <td className="py-2.5 pr-4">{row.detail}</td>
                  <td className="py-2.5">
                    {row.guideRef ? (
                      <Link
                        href={row.guideRef.href}
                        className="text-primary-200 hover:text-primary-100"
                      >
                        {row.guideRef.label} &rarr;
                      </Link>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Environment and secret setup ── */}
      <section className="space-y-4">
        <HeadingAnchor id="environment">
          Environment and secret setup
        </HeadingAnchor>
        <p className="text-slate-300">
          Your bot needs a small set of environment variables. These should live
          in your secrets manager, CI/CD vault, or a{" "}
          <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
            .env
          </code>{" "}
          file that is excluded from version control.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-slate-400">
                <th className="pb-2 pr-4 font-medium">Variable</th>
                <th className="pb-2 pr-4 font-medium">Purpose</th>
                <th className="pb-2 pr-4 font-medium">Required</th>
                <th className="pb-2 font-medium">Example</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {ENV_VARS.map((row) => (
                <tr
                  key={row.name}
                  className="border-b border-white/[0.04]"
                >
                  <td className="py-2.5 pr-4">
                    <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
                      {row.name}
                    </code>
                  </td>
                  <td className="py-2.5 pr-4">{row.purpose}</td>
                  <td className="py-2.5 pr-4">
                    {row.required ? (
                      <span className="text-red-300">Yes</span>
                    ) : (
                      <span className="text-slate-500">No</span>
                    )}
                  </td>
                  <td className="py-2.5">
                    <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
                      {row.example}
                    </code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <CopyBlock
          label="Minimal .env file"
          value={`# ATF production bot — keep out of source control
ATF_API_KEY=sk_prod_YOUR_KEY_HERE
ATF_RPC_URL=https://rpc.helius.xyz/?api-key=YOUR_RPC_KEY
ATF_PROFILE=prod
ATF_RECEIPTS_DIR=./atf_receipts`}
        />
        <div className="rounded-lg border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm text-red-200">
          <strong>Security rule:</strong> Never commit API keys or RPC
          credentials to version control. Add{" "}
          <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
            .env
          </code>{" "}
          to your <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
            .gitignore
          </code>.
          For production deployments, use a secrets manager (Vault, AWS Secrets
          Manager, GCP Secret Manager, or your platform&apos;s equivalent).
        </div>
      </section>

      {/* ── Key strategy and least privilege ── */}
      <section className="space-y-4">
        <HeadingAnchor id="key-strategy">
          Key strategy and least privilege
        </HeadingAnchor>
        <p className="text-slate-300">
          ATF uses scope-based API keys. Each key can be restricted to only the
          operations your bot needs. The principle is simple:{" "}
          <strong className="text-slate-200">
            grant the minimum scopes required for your use case.
          </strong>
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-slate-400">
                <th className="pb-2 pr-4 font-medium">Scope</th>
                <th className="pb-2 pr-4 font-medium">Grants</th>
                <th className="pb-2 font-medium">Bot need</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {SCOPE_REFERENCE.map((row) => (
                <tr
                  key={row.scope}
                  className="border-b border-white/[0.04]"
                >
                  <td className="py-2.5 pr-4">
                    <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
                      {row.scope}
                    </code>
                  </td>
                  <td className="py-2.5 pr-4">{row.grants}</td>
                  <td className="py-2.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                        row.botNeed === "required"
                          ? "border border-red-500/20 bg-red-500/10 text-red-400"
                          : row.botNeed === "recommended"
                            ? "border border-amber-500/20 bg-amber-500/10 text-amber-400"
                            : "border border-slate-500/20 bg-slate-500/10 text-slate-400"
                      }`}
                    >
                      {row.botNeed}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="rounded-lg border border-sky-500/20 bg-sky-500/[0.06] px-4 py-3 text-sm text-sky-200">
          <strong>Tip:</strong> A typical production bot needs only{" "}
          <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
            atf:probe
          </code>{" "}
          +{" "}
          <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
            atf:simulate
          </code>
          . Start there and add scopes only as your workflow requires them. See
          the{" "}
          <Link
            href="/docs/guide/key-lifecycle"
            className="underline hover:text-sky-100"
          >
            Key Lifecycle guide
          </Link>{" "}
          for detailed scope management.
        </div>

        <h3
          id="key-per-env"
          className="text-lg font-bold tracking-tight text-accent-300"
        >
          One key per environment
        </h3>
        <p className="text-slate-300">
          Create separate API keys for development, staging, and production.
          This prevents accidental production trades from test environments and
          gives you per-environment audit trails.
        </p>
        <CopyBlock
          label="Profile-based key isolation"
          value={`# Set up profiles for each environment
atf config set --profile dev   api_key sk_dev_...
atf config set --profile stage api_key sk_stage_...
atf config set --profile prod  api_key sk_prod_...

# Use the correct profile at runtime
ATF_PROFILE=prod atf bot preflight`}
        />
      </section>

      {/* ── Readiness and preflight ── */}
      <section className="space-y-4">
        <HeadingAnchor id="readiness">
          Readiness and preflight checks
        </HeadingAnchor>
        <p className="text-slate-300">
          Before your bot starts trading, it should confirm that the ATF API
          is healthy and the bot&apos;s configuration is valid. Two tools exist
          for this:
        </p>
        <ul className="ml-5 list-disc space-y-2 text-slate-300">
          <li>
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
              atf doctor
            </code>{" "}
            — validates your full environment (key, API, RPC, config, policy).
          </li>
          <li>
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
              atf bot preflight
            </code>{" "}
            — runs doctor checks plus bot-specific session validation.
          </li>
        </ul>
        <CopyBlock
          label="Bot startup sequence"
          value={`# 1. Run preflight before starting trading session
atf bot preflight

# 2. If preflight passes, start the bot
# 3. If it fails, fix the reported issue before continuing`}
        />
        <p className="text-slate-300">
          For HTTP-based bots, call{" "}
          <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
            GET /health
          </code>{" "}
          at startup and periodically during operation. If the health check
          fails, pause all trading activity until it recovers.
        </p>
        <CopyBlock
          label="Health check (HTTP)"
          value={`curl -s https://api.trucore.xyz/health | jq .
# Expected: { "status": "ok", "result": { "healthy": true } }`}
        />
        <div className="rounded-lg border border-sky-500/20 bg-sky-500/[0.06] px-4 py-3 text-sm text-sky-200">
          <strong>Fail-closed principle:</strong> If a health check fails or
          times out, treat it as a DENY. Do not fall through to executing
          unprotected trades. See the{" "}
          <Link
            href="/docs/guide/readiness"
            className="underline hover:text-sky-100"
          >
            Readiness guide
          </Link>{" "}
          for the full list of readiness signals and doctor checks.
        </div>
      </section>

      {/* ── Rate-limit-aware polling ── */}
      <section className="space-y-4">
        <HeadingAnchor id="rate-limits">
          Rate-limit-aware polling
        </HeadingAnchor>
        <p className="text-slate-300">
          Every ATF API response includes rate-limit headers. Your bot should
          read and respect them to avoid 429 errors and quota exhaustion.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-slate-400">
                <th className="pb-2 pr-4 font-medium">Header</th>
                <th className="pb-2 font-medium">Meaning</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              <tr className="border-b border-white/[0.04]">
                <td className="py-2.5 pr-4">
                  <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
                    X-RateLimit-Limit
                  </code>
                </td>
                <td className="py-2.5">Maximum requests allowed in the current window.</td>
              </tr>
              <tr className="border-b border-white/[0.04]">
                <td className="py-2.5 pr-4">
                  <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
                    X-RateLimit-Remaining
                  </code>
                </td>
                <td className="py-2.5">Requests remaining before you hit the limit.</td>
              </tr>
              <tr className="border-b border-white/[0.04]">
                <td className="py-2.5 pr-4">
                  <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
                    X-RateLimit-Reset
                  </code>
                </td>
                <td className="py-2.5">Unix timestamp when the current window resets.</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4">
                  <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
                    Retry-After
                  </code>
                </td>
                <td className="py-2.5">Seconds to wait before retrying (only on 429 responses).</td>
              </tr>
            </tbody>
          </table>
        </div>
        <CopyBlock
          label="Backoff with jitter (TypeScript)"
          value={`async function protectWithBackoff(
  intent: Record<string, unknown>,
  maxRetries = 3,
): Promise<Record<string, unknown>> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch("https://api.trucore.xyz/v1/bot/protect", {
      method: "POST",
      headers: {
        "X-API-Key": process.env.ATF_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ intent }),
    });

    if (res.status !== 429) return res.json();

    // Honor Retry-After, or fall back to exponential backoff
    const retryAfter = res.headers.get("Retry-After");
    const baseDelay = retryAfter
      ? Number(retryAfter) * 1000
      : 1000 * 2 ** attempt;
    const jitter = Math.random() * 500;
    await new Promise((r) => setTimeout(r, baseDelay + jitter));
  }
  throw new Error("Rate limit exceeded after max retries");
}`}
        />
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3 text-sm text-amber-200">
          <strong>Proactive approach:</strong> Check{" "}
          <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
            X-RateLimit-Remaining
          </code>{" "}
          on every response. If it drops below 10% of your limit, slow down
          voluntarily — don&apos;t wait for a 429. See the{" "}
          <Link
            href="/docs/guide/rate-limits"
            className="underline hover:text-amber-100"
          >
            Rate Limits guide
          </Link>{" "}
          for full backoff strategies and plan-specific quota details.
        </div>
      </section>

      {/* ── Webhook and receipt handling ── */}
      <section className="space-y-4">
        <HeadingAnchor id="webhooks-receipts">
          Webhook and receipt handling
        </HeadingAnchor>

        <h3
          id="receipt-handling"
          className="text-lg font-bold tracking-tight text-accent-300"
        >
          Receipt storage
        </h3>
        <p className="text-slate-300">
          Every call to{" "}
          <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
            /v1/bot/protect
          </code>{" "}
          returns a receipt, whether the decision is ALLOWED or DENIED.
          Production bots must persist every receipt:
        </p>
        <CopyBlock
          label="Save receipt (Python)"
          value={`import json, os, time

def save_receipt(receipt: dict, receipts_dir: str = "./atf_receipts"):
    os.makedirs(receipts_dir, exist_ok=True)
    ts = int(time.time())
    label = receipt.get("status", "unknown").lower()
    path = os.path.join(receipts_dir, f"{ts}_{label}.json")
    with open(path, "w") as f:
        json.dump(receipt, f, indent=2)
    return path`}
        />
        <p className="text-slate-300">
          Receipts are your audit trail, dispute evidence, and the basis for
          post-trade verification. See the{" "}
          <Link
            href="/docs/guide/receipts-ops"
            className="font-semibold text-primary-200 hover:text-primary-100"
          >
            Receipt Operations guide
          </Link>{" "}
          for verification workflows and export options.
        </p>

        <h3
          id="webhook-monitoring"
          className="text-lg font-bold tracking-tight text-accent-300"
        >
          Webhooks for real-time monitoring
        </h3>
        <p className="text-slate-300">
          Webhooks are optional but recommended for production bots. They
          deliver asynchronous notifications for events your bot might miss in
          the synchronous flow — delivery failures, quota warnings, health
          changes, and more.
        </p>
        <p className="text-slate-300">
          Key events for production bots:
        </p>
        <ul className="ml-5 list-disc space-y-1 text-slate-300">
          <li>
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
              firewall.deny
            </code>{" "}
            — a trade was denied (useful for alerts)
          </li>
          <li>
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
              usage.threshold
            </code>{" "}
            — approaching daily quota limit
          </li>
          <li>
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
              system.health_changed
            </code>{" "}
            — service health state change
          </li>
          <li>
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
              agent.expiry_warning
            </code>{" "}
            — agent or permit approaching expiration
          </li>
        </ul>
        <p className="text-slate-300">
          All webhook deliveries must be signature-verified (HMAC-SHA256) and
          deduplicated by event_id. See the{" "}
          <Link
            href="/docs/guide/webhooks"
            className="font-semibold text-primary-200 hover:text-primary-100"
          >
            Webhook Setup guide
          </Link>{" "}
          for complete configuration and verification code.
        </p>
      </section>

      {/* ── Before first live trade ── */}
      <section className="space-y-4">
        <HeadingAnchor id="before-first-trade">
          Before your first live trade
        </HeadingAnchor>
        <p className="text-slate-300">
          This is the sequence to follow before executing your first real
          transaction in production:
        </p>
        <ol className="ml-5 list-decimal space-y-3 text-slate-300">
          <li>
            <strong className="text-slate-200">Switch to production profile</strong>
            {" "}—{" "}
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
              ATF_PROFILE=prod
            </code>{" "}
            (or set via config). Confirm with{" "}
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
              atf whoami
            </code>.
          </li>
          <li>
            <strong className="text-slate-200">Run preflight</strong>
            {" "}—{" "}
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
              atf bot preflight
            </code>{" "}
            must pass all checks.
          </li>
          <li>
            <strong className="text-slate-200">Execute a dry-run trade</strong>
            {" "}—{" "}
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
              atf trade --dry-run
            </code>{" "}
            confirms policy evaluation and receipt generation without real
            execution.
          </li>
          <li>
            <strong className="text-slate-200">Verify the dry-run receipt</strong>
            {" "}—{" "}
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
              atf verify &lt;receipt_id&gt;
            </code>{" "}
            or verify in{" "}
            <Link
              href="/customer/receipts"
              className="font-semibold text-primary-200 hover:text-primary-100"
            >
              /customer/receipts
            </Link>.
          </li>
          <li>
            <strong className="text-slate-200">Execute a small live trade</strong>
            {" "}— minimum viable amount. Verify the resulting receipt appears
            in your receipt store.
          </li>
          <li>
            <strong className="text-slate-200">Confirm monitoring is active</strong>
            {" "}— verify that webhooks (if configured) deliver events and
            that your alerting pipeline triggers as expected.
          </li>
        </ol>
      </section>

      {/* ── Steady-state bot loop ── */}
      <section className="space-y-4">
        <HeadingAnchor id="bot-loop">
          Steady-state bot loop
        </HeadingAnchor>
        <p className="text-slate-300">
          Once past the first-trade sequence, a production bot should follow
          this loop for every intent it processes:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-slate-400">
                <th className="pb-2 pr-4 font-medium">Phase</th>
                <th className="pb-2 pr-4 font-medium">Description</th>
                <th className="pb-2 font-medium">On failure</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {BOT_LOOP_PHASES.map((row) => (
                <tr
                  key={row.phase}
                  className="border-b border-white/[0.04]"
                >
                  <td className="py-2.5 pr-4 font-medium text-slate-200 whitespace-nowrap">
                    {row.phase}
                  </td>
                  <td className="py-2.5 pr-4">{row.description}</td>
                  <td className="py-2.5 text-amber-300">{row.failBehavior}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <CopyBlock
          label="Minimal bot loop (Python)"
          value={`import json, os, time, urllib.request

API_KEY = os.environ["ATF_API_KEY"]
BASE_URL = os.environ.get("ATF_BASE_URL", "https://api.trucore.xyz")
RECEIPTS_DIR = os.environ.get("ATF_RECEIPTS_DIR", "./atf_receipts")

def check_health() -> bool:
    try:
        req = urllib.request.Request(f"{BASE_URL}/health")
        resp = json.loads(urllib.request.urlopen(req, timeout=10).read())
        return resp.get("result", {}).get("healthy", False)
    except Exception:
        return False

def protect(intent: dict) -> dict:
    req = urllib.request.Request(
        f"{BASE_URL}/v1/bot/protect",
        data=json.dumps({"intent": intent}).encode(),
        headers={"X-API-Key": API_KEY, "Content-Type": "application/json"},
    )
    return json.loads(urllib.request.urlopen(req, timeout=30).read())

def save_receipt(receipt: dict) -> str:
    os.makedirs(RECEIPTS_DIR, exist_ok=True)
    ts = int(time.time())
    label = receipt.get("status", "unknown").lower()
    path = os.path.join(RECEIPTS_DIR, f"{ts}_{label}.json")
    with open(path, "w") as f:
        json.dump(receipt, f, indent=2)
    return path

# --- Startup ---
if not check_health():
    raise SystemExit("ATF API not healthy — aborting startup")

# --- Trading loop ---
for intent in your_intent_source():
    receipt = protect(intent)
    save_receipt(receipt)

    if receipt.get("status") == "ALLOW":
        sign_and_submit(intent)
    else:
        print(f"DENIED: {receipt.get('reason_codes', [])}")`}
        />
      </section>

      {/* ── Safe rollout patterns ── */}
      <section className="space-y-4">
        <HeadingAnchor id="rollout">
          Safe rollout patterns
        </HeadingAnchor>
        <p className="text-slate-300">
          Never go from zero to full production volume in one step. A staged
          rollout limits blast radius and gives you time to validate behavior
          at each tier.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-slate-400">
                <th className="pb-2 pr-4 font-medium">Stage</th>
                <th className="pb-2 pr-4 font-medium">Description</th>
                <th className="pb-2 font-medium">Key action</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {ROLLOUT_STAGES.map((row) => (
                <tr
                  key={row.stage}
                  className="border-b border-white/[0.04]"
                >
                  <td className="py-2.5 pr-4 font-medium text-slate-200 whitespace-nowrap">
                    {row.stage}
                  </td>
                  <td className="py-2.5 pr-4">{row.description}</td>
                  <td className="py-2.5">{row.keyAction}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3
          id="key-rotation"
          className="text-lg font-bold tracking-tight text-accent-300"
        >
          Key rotation during rollout
        </h3>
        <p className="text-slate-300">
          If you need to rotate a key during production operation:
        </p>
        <ol className="ml-5 list-decimal space-y-2 text-slate-300">
          <li>
            <strong className="text-slate-200">Create</strong> a new key at{" "}
            <Link
              href="/customer/keys"
              className="font-semibold text-primary-200 hover:text-primary-100"
            >
              /customer/keys
            </Link>{" "}
            with the same scopes as the old key.
          </li>
          <li>
            <strong className="text-slate-200">Deploy</strong> the new key to
            your bot&apos;s environment (secrets manager, env var).
          </li>
          <li>
            <strong className="text-slate-200">Verify</strong> the new key
            works: run{" "}
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
              atf whoami
            </code>{" "}
            and{" "}
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
              atf trade --dry-run
            </code>.
          </li>
          <li>
            <strong className="text-slate-200">Revoke</strong> the old key.
            This is immediate and irreversible.
          </li>
        </ol>
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3 text-sm text-amber-200">
          <strong>Note:</strong> Secrets are shown once at creation. Copy and
          store the new key before navigating away. The old key stops working
          immediately upon revocation. Plan a brief maintenance window or
          implement zero-downtime rotation by supporting two active keys during
          the transition.
        </div>
      </section>

      {/* ── Monitoring and recovery ── */}
      <section className="space-y-4">
        <HeadingAnchor id="monitoring">
          Monitoring and recovery basics
        </HeadingAnchor>
        <p className="text-slate-300">
          Production bots should monitor three signal categories:
        </p>

        <h3
          id="monitor-health"
          className="text-lg font-bold tracking-tight text-accent-300"
        >
          1. Health signals
        </h3>
        <ul className="ml-5 list-disc space-y-1 text-slate-300">
          <li>
            Poll{" "}
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
              GET /health
            </code>{" "}
            every 30–60 seconds. Alert if unhealthy for 2+ consecutive checks.
          </li>
          <li>
            Subscribe to{" "}
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
              system.health_changed
            </code>{" "}
            webhooks if available.
          </li>
        </ul>

        <h3
          id="monitor-quota"
          className="text-lg font-bold tracking-tight text-accent-300"
        >
          2. Quota signals
        </h3>
        <ul className="ml-5 list-disc space-y-1 text-slate-300">
          <li>
            Read{" "}
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
              X-RateLimit-Remaining
            </code>{" "}
            on every response. Alert when below 10% of your limit.
          </li>
          <li>
            Watch for{" "}
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
              X-ATF-Quota-Warning
            </code>{" "}
            headers on 200 responses — they appear before you hit the daily cap.
          </li>
          <li>
            Check the usage meter in{" "}
            <Link
              href="/customer/dashboard"
              className="font-semibold text-primary-200 hover:text-primary-100"
            >
              /customer/dashboard
            </Link>{" "}
            periodically.
          </li>
        </ul>

        <h3
          id="monitor-denials"
          className="text-lg font-bold tracking-tight text-accent-300"
        >
          3. Denial signals
        </h3>
        <ul className="ml-5 list-disc space-y-1 text-slate-300">
          <li>
            Log every DENIED receipt with its reason codes. A sudden spike in
            denials usually means a configuration change or policy drift.
          </li>
          <li>
            Use{" "}
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
              atf tx explain --reason-codes &lt;codes&gt;
            </code>{" "}
            to get human-readable explanations.
          </li>
          <li>
            Subscribe to{" "}
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
              firewall.deny
            </code>{" "}
            webhooks for real-time denial alerts.
          </li>
        </ul>

        <h3
          id="recovery"
          className="text-lg font-bold tracking-tight text-accent-300"
        >
          Recovery patterns
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-slate-400">
                <th className="pb-2 pr-4 font-medium">Scenario</th>
                <th className="pb-2 pr-4 font-medium">Action</th>
                <th className="pb-2 font-medium">Guide reference</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              <tr className="border-b border-white/[0.04]">
                <td className="py-2.5 pr-4 font-medium text-slate-200">API returns 429</td>
                <td className="py-2.5 pr-4">Backoff using Retry-After. Do not retry immediately.</td>
                <td className="py-2.5">
                  <Link href="/docs/guide/rate-limits" className="text-primary-200 hover:text-primary-100">
                    Rate Limits &rarr;
                  </Link>
                </td>
              </tr>
              <tr className="border-b border-white/[0.04]">
                <td className="py-2.5 pr-4 font-medium text-slate-200">API returns 401/403</td>
                <td className="py-2.5 pr-4">Check key validity and scopes at /customer/keys.</td>
                <td className="py-2.5">
                  <Link href="/docs/guide/key-lifecycle" className="text-primary-200 hover:text-primary-100">
                    Key Lifecycle &rarr;
                  </Link>
                </td>
              </tr>
              <tr className="border-b border-white/[0.04]">
                <td className="py-2.5 pr-4 font-medium text-slate-200">API unreachable</td>
                <td className="py-2.5 pr-4">Pause trading. Run atf doctor. Check network and DNS.</td>
                <td className="py-2.5">
                  <Link href="/docs/guide/readiness" className="text-primary-200 hover:text-primary-100">
                    Readiness &rarr;
                  </Link>
                </td>
              </tr>
              <tr className="border-b border-white/[0.04]">
                <td className="py-2.5 pr-4 font-medium text-slate-200">Sudden denial spike</td>
                <td className="py-2.5 pr-4">Review denial reason codes. Check for policy changes.</td>
                <td className="py-2.5">
                  <Link href="/docs/guide/troubleshooting" className="text-primary-200 hover:text-primary-100">
                    Troubleshooting &rarr;
                  </Link>
                </td>
              </tr>
              <tr className="border-b border-white/[0.04]">
                <td className="py-2.5 pr-4 font-medium text-slate-200">Key compromised</td>
                <td className="py-2.5 pr-4">Revoke immediately. Create new key. Redeploy.</td>
                <td className="py-2.5">
                  <Link href="/docs/guide/key-lifecycle" className="text-primary-200 hover:text-primary-100">
                    Key Lifecycle &rarr;
                  </Link>
                </td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 font-medium text-slate-200">Webhook delivery failures</td>
                <td className="py-2.5 pr-4">Check webhook status. Inspect dead-letter queue for dropped events.</td>
                <td className="py-2.5">
                  <Link href="/docs/guide/webhooks" className="text-primary-200 hover:text-primary-100">
                    Webhooks &rarr;
                  </Link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Related guides ── */}
      <section className="space-y-4">
        <HeadingAnchor id="related-guides">
          Related guides
        </HeadingAnchor>
        <p className="text-slate-300">
          This guide is intentionally concise — it covers the production
          configuration workflow and delegates detail to specialized guides.
          Use the links below to go deeper on any topic:
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            {
              title: "API Key Lifecycle",
              href: "/docs/guide/key-lifecycle",
              description: "Create, rotate, revoke, and scope API keys.",
            },
            {
              title: "Rate Limits & Recovery",
              href: "/docs/guide/rate-limits",
              description: "Backoff strategies, quota monitoring, and plan limits.",
            },
            {
              title: "Webhook Setup & Debugging",
              href: "/docs/guide/webhooks",
              description: "Configure, verify, and troubleshoot webhook delivery.",
            },
            {
              title: "Readiness & Health Checks",
              href: "/docs/guide/readiness",
              description: "Doctor checks, health endpoints, and bot preflight.",
            },
            {
              title: "Receipt Operations",
              href: "/docs/guide/receipts-ops",
              description: "Verify, export, and build audit trails from receipts.",
            },
            {
              title: "Troubleshooting",
              href: "/docs/guide/troubleshooting",
              description: "Symptom-driven error diagnosis and recovery steps.",
            },
          ].map((guide) => (
            <Link key={guide.href} href={guide.href} className="block">
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 transition-colors hover:border-white/[0.12]">
                <h3 className="text-sm font-bold text-accent-300">
                  {guide.title}
                </h3>
                <p className="mt-1 text-xs text-slate-400">
                  {guide.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
        <p className="text-slate-300">
          For public documentation (concepts, spec references, tutorials), see
          the{" "}
          <Link
            href="/docs"
            className="font-semibold text-primary-200 hover:text-primary-100"
          >
            Documentation hub
          </Link>
          . For CLI-specific workflows, see{" "}
          <Link
            href="/docs/cli/guides/production-bot-basics"
            className="font-semibold text-primary-200 hover:text-primary-100"
          >
            Production Bot Basics (CLI guide)
          </Link>
          .
        </p>
      </section>
    </article>
  );
}
