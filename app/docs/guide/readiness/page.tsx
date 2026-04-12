import type { Metadata } from "next";
import Link from "next/link";
import { HeadingAnchor } from "@/components/heading-anchor";
import { CopyBlock } from "@/components/copy-block";

export const metadata: Metadata = {
  title: "Readiness & Health Checks — Customer Guide",
  description:
    "Understand what ready means for your ATF integration, run CLI doctor, verify API health, and troubleshoot common readiness failures.",
  robots: { index: false, follow: false },
};

/* ── Constants (grounded in current product behavior) ── */

const ATF_BASE_URL = "https://api.trucore.xyz";
const ATF_HEALTH_ENDPOINT = `${ATF_BASE_URL}/health`;
const ATF_HEALTH_DEPS_ENDPOINT = `${ATF_BASE_URL}/health/deps`;

/* ── Readiness stages ── */

const READINESS_STAGES = [
  {
    stage: "Account created",
    signal: "You can sign in to the TruCore portal.",
    check: "Visit /customer/dashboard — if you see the onboarding stepper, your account exists.",
    status: "baseline",
  },
  {
    stage: "API key configured",
    signal: "An active API key exists and is stored in your environment.",
    check: "Run atf whoami — it should return your tenant ID and email.",
    status: "baseline",
  },
  {
    stage: "Integration reachable",
    signal: "Your environment can reach the ATF API and any configured RPC endpoints.",
    check: "Run atf doctor — all connectivity checks should pass.",
    status: "operational",
  },
  {
    stage: "Production-ready",
    signal: "You have run a test request, verified a receipt, and confirmed policy behavior.",
    check: "Dashboard activation stepper shows all three steps complete.",
    status: "production",
  },
] as const;

/* ── Readiness signals table ── */

const READINESS_SIGNALS = [
  {
    signal: "API key active",
    tool: "atf whoami",
    pass: "Returns tenant_id, email, cluster.",
    fail: "Error: invalid or revoked key.",
    category: "Identity",
  },
  {
    signal: "API reachable",
    tool: "atf health",
    pass: 'Returns {"healthy": true}.',
    fail: "Connection refused or timeout.",
    category: "Connectivity",
  },
  {
    signal: "RPC connectivity",
    tool: "atf rpc ping",
    pass: "Returns latency and block number for configured chain.",
    fail: "RPC timeout or connection error.",
    category: "Connectivity",
  },
  {
    signal: "Environment valid",
    tool: "atf doctor",
    pass: "All checks pass (✓). No errors.",
    fail: "One or more checks show ✗ or ⚠.",
    category: "Environment",
  },
  {
    signal: "Dependencies available",
    tool: "GET /health/deps",
    pass: 'evaluator_mode is "active".',
    fail: 'evaluator_mode is "unsupported" or "invalid_config".',
    category: "Dependencies",
  },
  {
    signal: "Test request succeeded",
    tool: "Dashboard activation stepper",
    pass: "Step 2 shows ✓ (totalRequests > 0).",
    fail: "Step 2 is still current or upcoming.",
    category: "Activation",
  },
  {
    signal: "First trade protected",
    tool: "Dashboard activation stepper",
    pass: "Step 3 shows ✓ (active_usage state).",
    fail: "Step 3 is still current or upcoming.",
    category: "Activation",
  },
] as const;

/* ── Doctor check categories ── */

const DOCTOR_CHECKS = [
  {
    check: "CLI version",
    description: "Confirms the installed CLI version matches the latest release.",
    example: "✓ CLI version: 1.4.2 (latest)",
  },
  {
    check: "API key",
    description: "Validates that ATF_API_KEY is set and the key is active (not revoked or expired).",
    example: "✓ API key: configured (tenant: acme-prod)",
  },
  {
    check: "API connectivity",
    description: "Sends a health check request to the ATF API and measures latency.",
    example: "✓ API connectivity: 42ms (healthy)",
  },
  {
    check: "RPC endpoint",
    description: "Pings the configured RPC endpoint and reports block height and latency.",
    example: "✓ RPC endpoint: 18ms (block 19284756)",
  },
  {
    check: "Configuration",
    description: "Validates the local configuration file (~/.openclaw/config.yaml) is present and parseable.",
    example: "✓ Configuration: valid (profile: default)",
  },
  {
    check: "Policy",
    description: "Checks whether a policy file is configured and passes validation.",
    example: "⚠ Policy: not configured (optional — only needed for local evaluation)",
  },
] as const;

/* ── Troubleshooting table ── */

const TROUBLESHOOTING = [
  {
    symptom: "atf doctor shows ✗ API key",
    cause: "ATF_API_KEY not set, empty, or key has been revoked.",
    fix: "Visit /customer/keys, confirm you have an active key, and re-export it to your environment.",
  },
  {
    symptom: "atf doctor shows ✗ API connectivity",
    cause: "Firewall, proxy, or DNS blocking outbound HTTPS to api.trucore.xyz.",
    fix: "Verify that curl https://api.trucore.xyz/health returns {\"healthy\": true}. Check proxy settings and corporate firewall rules.",
  },
  {
    symptom: "atf doctor shows ✗ RPC endpoint",
    cause: "RPC URL misconfigured, RPC provider down, or rate-limited by the RPC provider.",
    fix: "Run atf rpc ping to confirm. Check your RPC provider dashboard for outages or rate limits.",
  },
  {
    symptom: "atf health returns connection refused",
    cause: "The ATF API is unreachable from your network.",
    fix: "Check DNS resolution for api.trucore.xyz. If behind a VPN, ensure the VPN allows outbound HTTPS.",
  },
  {
    symptom: "GET /health/deps shows evaluator_mode: unsupported",
    cause: "The evaluator engine dependency is unavailable in the current deployment.",
    fix: "This is typically a transient state during deployment. Retry in a few minutes. If persistent, contact support.",
  },
  {
    symptom: "Dashboard stepper stuck on Step 1",
    cause: "No API key has been created yet, or the key was created but not claimed.",
    fix: "Visit /customer/keys and create a new key. The secret is shown once — save it immediately.",
  },
  {
    symptom: "Dashboard stepper stuck on Step 2",
    cause: "No API requests have been made with your key.",
    fix: "Run a test request: atf trade --dry-run or use the \"Run a test request\" panel in the dashboard.",
  },
  {
    symptom: "atf bot preflight fails",
    cause: "One or more pre-session checks failed (key, connectivity, or policy).",
    fix: "Run atf doctor first to identify the specific failing check, then address it before retrying preflight.",
  },
] as const;

/* ── Pre-flight checklist ── */

const PREFLIGHT_CHECKLIST = [
  {
    item: "API key is active and scoped correctly",
    detail: "Confirm with atf whoami. Key should have at least atf:probe and atf:verify scopes.",
  },
  {
    item: "Environment variable is set in the execution context",
    detail: "ATF_API_KEY must be available to the process that will call ATF (shell, container, CI runner).",
  },
  {
    item: "atf doctor passes all checks",
    detail: "Run atf doctor --pretty. Address any ✗ errors. Warnings (⚠) are informational but should be reviewed.",
  },
  {
    item: "RPC endpoint is reachable",
    detail: "Run atf rpc ping. Latency under 200ms is recommended for production use.",
  },
  {
    item: "Test request has succeeded",
    detail: "Run atf trade --dry-run to confirm end-to-end policy evaluation without execution.",
  },
  {
    item: "Receipt verification works",
    detail: "Verify at least one receipt with atf verify <receipt_id> or in the /customer/receipts UI.",
  },
  {
    item: "Webhook endpoint configured (if using webhooks)",
    detail: "Create a webhook in the API and confirm delivery with a test event before relying on async notifications.",
  },
  {
    item: "Production policy reviewed",
    detail: "If using a custom policy, run atf policy validate and atf policy test to confirm behavior matches expectations.",
  },
] as const;

/* ── Page ── */

export default function ReadinessGuide() {
  return (
    <article className="space-y-10">
      {/* ── Header ── */}
      <header className="space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
          Customer Guide
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-accent-200 sm:text-5xl">
          Readiness &amp; Health Checks
        </h1>
        <p className="max-w-3xl text-lg leading-relaxed text-slate-300">
          Understand what &ldquo;ready&rdquo; means for your ATF integration,
          run diagnostic commands, verify API health, and troubleshoot common
          readiness failures. For conceptual background, see{" "}
          <Link
            href="/docs/getting-started"
            className="font-semibold text-primary-200 transition-colors hover:text-primary-100"
          >
            Getting Started
          </Link>{" "}
          in the public docs.
        </p>
        <div className="gradient-divider mt-2" aria-hidden="true" />
      </header>

      {/* ── What this guide covers ── */}
      <section className="space-y-4">
        <HeadingAnchor id="overview">What this guide covers</HeadingAnchor>
        <p className="text-slate-300">
          &ldquo;Configured&rdquo; and &ldquo;ready&rdquo; are not the same
          thing. An API key can exist without being stored in the right
          environment. An endpoint can be resolvable without the upstream RPC
          being reachable. This guide walks through every readiness signal ATF
          exposes so you can distinguish between <em>account setup complete</em>
          {" "}and <em>genuinely production-ready</em>.
        </p>
        <p className="text-slate-300">
          You will learn to use the CLI doctor command, the API health
          endpoints, the bot preflight check, and the dashboard activation
          stepper — and what to do when any of them reports a problem.
        </p>
      </section>

      {/* ── What "ready" means in ATF ── */}
      <section className="space-y-4">
        <HeadingAnchor id="readiness-stages">
          What &ldquo;ready&rdquo; means in ATF
        </HeadingAnchor>
        <p className="text-slate-300">
          Readiness is not binary. ATF has four distinct stages, each building
          on the last. Most issues customers encounter come from assuming an
          earlier stage implies a later one.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-slate-400">
                <th className="pb-2 pr-6 font-medium">Stage</th>
                <th className="pb-2 pr-6 font-medium">Signal</th>
                <th className="pb-2 font-medium">How to check</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {READINESS_STAGES.map((row) => (
                <tr
                  key={row.stage}
                  className="border-b border-white/[0.04]"
                >
                  <td className="py-2.5 pr-6 font-medium text-slate-200">
                    {row.stage}
                  </td>
                  <td className="py-2.5 pr-6">{row.signal}</td>
                  <td className="py-2.5">
                    <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
                      {row.check}
                    </code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="rounded-lg border border-sky-500/20 bg-sky-500/[0.06] px-4 py-3 text-sm text-sky-200">
          <strong>Tip:</strong> The dashboard activation stepper maps directly
          to these stages. Step 1 covers key configuration, Step 2 confirms
          integration reachability via a test request, and Step 3 confirms
          production usage. See{" "}
          <Link href="#activation" className="underline hover:text-sky-100">
            Activation progress
          </Link>{" "}
          below.
        </div>
      </section>

      {/* ── Readiness signals you can check today ── */}
      <section className="space-y-4">
        <HeadingAnchor id="signals">
          Readiness signals you can check today
        </HeadingAnchor>
        <p className="text-slate-300">
          Every signal below is available today in the CLI, API, or dashboard.
          No additional setup is required.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-slate-400">
                <th className="pb-2 pr-4 font-medium">Signal</th>
                <th className="pb-2 pr-4 font-medium">Tool</th>
                <th className="pb-2 pr-4 font-medium">Pass</th>
                <th className="pb-2 font-medium">Fail</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {READINESS_SIGNALS.map((row) => (
                <tr
                  key={row.signal}
                  className="border-b border-white/[0.04]"
                >
                  <td className="py-2.5 pr-4 font-medium text-slate-200">
                    {row.signal}
                  </td>
                  <td className="py-2.5 pr-4">
                    <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
                      {row.tool}
                    </code>
                  </td>
                  <td className="py-2.5 pr-4 text-emerald-300">{row.pass}</td>
                  <td className="py-2.5 text-red-300">{row.fail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── CLI doctor ── */}
      <section className="space-y-4">
        <HeadingAnchor id="doctor">
          CLI doctor: your first readiness check
        </HeadingAnchor>
        <p className="text-slate-300">
          The <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-sm text-slate-200">atf doctor</code>{" "}
          command is the single fastest way to check your integration health.
          It runs six checks in sequence and reports a clear pass / warn / fail
          status for each.
        </p>
        <CopyBlock
          label="Run doctor"
          value="atf doctor --pretty"
        />
        <p className="text-slate-300">Example output:</p>
        <CopyBlock
          label="Doctor output"
          value={`ATF Doctor
──────────────────────────────────────────
  ✓  CLI version        1.4.2 (latest)
  ✓  API key            configured (tenant: acme-prod)
  ✓  API connectivity   42ms (healthy)
  ✓  RPC endpoint       18ms (block 19284756)
  ✓  Configuration      valid (profile: default)
  ⚠  Policy             not configured (optional)
──────────────────────────────────────────
  5 passed · 1 warning · 0 errors`}
        />

        <h3
          id="doctor-checks"
          className="text-lg font-bold tracking-tight text-accent-300"
        >
          What each check means
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-slate-400">
                <th className="pb-2 pr-4 font-medium">Check</th>
                <th className="pb-2 pr-4 font-medium">Description</th>
                <th className="pb-2 font-medium">Example output</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {DOCTOR_CHECKS.map((row) => (
                <tr
                  key={row.check}
                  className="border-b border-white/[0.04]"
                >
                  <td className="py-2.5 pr-4 font-medium text-slate-200">
                    {row.check}
                  </td>
                  <td className="py-2.5 pr-4">{row.description}</td>
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
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3 text-sm text-amber-200">
          <strong>Note:</strong> Warnings (⚠) are informational — they do not
          block usage. A policy warning means local evaluation is unavailable,
          but server-side evaluation still works. Errors (✗) require action
          before the integration can function.
        </div>
      </section>

      {/* ── API health endpoint ── */}
      <section className="space-y-4">
        <HeadingAnchor id="health-endpoint">
          API health endpoint
        </HeadingAnchor>
        <p className="text-slate-300">
          The ATF API exposes a health endpoint that does not require
          authentication. Use it to verify API reachability independently
          of your API key.
        </p>
        <CopyBlock
          label="Check API health"
          value={`curl -s ${ATF_HEALTH_ENDPOINT} | jq .`}
        />
        <p className="text-slate-300">Healthy response:</p>
        <CopyBlock
          label="Health response"
          value={`{
  "status": "ok",
  "result": {
    "healthy": true,
    "uap": {
      "enabled": true,
      "routes_loaded": true,
      "permit_store": "memory"
    }
  },
  "summary": "ATF API is healthy."
}`}
        />
        <p className="text-slate-300">
          If the response returns <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-sm text-slate-200">{`"healthy": true`}</code>,
          the API is accepting requests. If you cannot reach this endpoint at
          all, the issue is network-level (DNS, firewall, proxy), not API-level.
        </p>

        <h3
          id="health-deps"
          className="text-lg font-bold tracking-tight text-accent-300"
        >
          Dependency health
        </h3>
        <p className="text-slate-300">
          The dependency endpoint reports whether the evaluator engine and
          optional components are available. This is useful for diagnosing
          &ldquo;API is up but evaluations fail&rdquo; scenarios.
        </p>
        <CopyBlock
          label="Check dependency health"
          value={`curl -s ${ATF_HEALTH_DEPS_ENDPOINT} | jq .`}
        />
        <p className="text-slate-300">Example response:</p>
        <CopyBlock
          label="Dependency response"
          value={`{
  "status": "ok",
  "result": {
    "evaluator_mode": "active",
    "optional_dependencies": {
      "simulation_engine": true,
      "receipt_anchoring": true
    }
  },
  "summary": "Dependency posture: all systems operational."
}`}
        />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-slate-400">
                <th className="pb-2 pr-6 font-medium">evaluator_mode</th>
                <th className="pb-2 font-medium">Meaning</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              <tr className="border-b border-white/[0.04]">
                <td className="py-2.5 pr-6">
                  <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-emerald-300">
                    active
                  </code>
                </td>
                <td className="py-2.5">
                  Evaluator is running. Policy evaluation requests will succeed.
                </td>
              </tr>
              <tr className="border-b border-white/[0.04]">
                <td className="py-2.5 pr-6">
                  <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-amber-300">
                    unsupported
                  </code>
                </td>
                <td className="py-2.5">
                  Evaluator dependency is unavailable. Usually transient during
                  deployment — retry in a few minutes.
                </td>
              </tr>
              <tr>
                <td className="py-2.5 pr-6">
                  <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-red-300">
                    invalid_config
                  </code>
                </td>
                <td className="py-2.5">
                  Configuration error. Contact support if this persists.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ── RPC connectivity ── */}
      <section className="space-y-4">
        <HeadingAnchor id="rpc">RPC connectivity</HeadingAnchor>
        <p className="text-slate-300">
          If your integration submits on-chain transactions, ATF needs a
          reachable RPC endpoint. The CLI provides a dedicated connectivity
          check:
        </p>
        <CopyBlock label="RPC ping" value="atf rpc ping" />
        <p className="text-slate-300">
          A healthy response shows the current block number and round-trip
          latency. Latency under 200&thinsp;ms is recommended for production
          use. If this command fails, check:
        </p>
        <ul className="ml-5 list-disc space-y-1 text-slate-300">
          <li>
            Your RPC URL is correctly set in{" "}
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
              ~/.openclaw/config.yaml
            </code>{" "}
            or the <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
              ATF_RPC_URL
            </code> environment variable.
          </li>
          <li>
            Your RPC provider is operational (check their status page).
          </li>
          <li>
            You haven&apos;t exceeded the RPC provider&apos;s rate limits.
          </li>
        </ul>
      </section>

      {/* ── Bot preflight ── */}
      <section className="space-y-4">
        <HeadingAnchor id="preflight">Bot preflight checks</HeadingAnchor>
        <p className="text-slate-300">
          If you are building an automated bot or agent, the{" "}
          <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-sm text-slate-200">
            atf bot preflight
          </code>{" "}
          command runs a targeted readiness check before starting a session.
          It validates the same signals as{" "}
          <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-sm text-slate-200">
            atf doctor
          </code>{" "}
          but also checks bot-specific requirements like session configuration
          and policy availability.
        </p>
        <CopyBlock label="Bot preflight" value="atf bot preflight" />
        <p className="text-slate-300">
          The recommended integration pattern is:
        </p>
        <ol className="ml-5 list-decimal space-y-2 text-slate-300">
          <li>
            <strong className="text-slate-200">Setup:</strong>{" "}
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
              atf setup
            </code>{" "}
            — configure API key and environment.
          </li>
          <li>
            <strong className="text-slate-200">Verify identity:</strong>{" "}
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
              atf whoami
            </code>{" "}
            — confirm tenant and permissions.
          </li>
          <li>
            <strong className="text-slate-200">Preflight:</strong>{" "}
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
              atf bot preflight
            </code>{" "}
            — verify all pre-session requirements pass.
          </li>
          <li>
            <strong className="text-slate-200">Protect:</strong>{" "}
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
              atf bot protect
            </code>{" "}
            — start protecting transactions.
          </li>
        </ol>
        <div className="rounded-lg border border-sky-500/20 bg-sky-500/[0.06] px-4 py-3 text-sm text-sky-200">
          <strong>Tip:</strong> If preflight fails, run{" "}
          <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-sky-100">
            atf doctor
          </code>{" "}
          for a more detailed diagnostic. Doctor checks overlap with but are
          more granular than preflight.
        </div>
      </section>

      {/* ── Activation progress ── */}
      <section className="space-y-4">
        <HeadingAnchor id="activation">
          Activation progress in the dashboard
        </HeadingAnchor>
        <p className="text-slate-300">
          Your{" "}
          <Link
            href="/customer/dashboard"
            className="font-semibold text-primary-200 hover:text-primary-100"
          >
            customer dashboard
          </Link>{" "}
          displays a three-step activation stepper that tracks your
          journey from account creation to production readiness:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-slate-400">
                <th className="pb-2 pr-4 font-medium">Step</th>
                <th className="pb-2 pr-4 font-medium">Completion criteria</th>
                <th className="pb-2 font-medium">What it proves</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              <tr className="border-b border-white/[0.04]">
                <td className="py-2.5 pr-4 font-medium text-slate-200">
                  1. Get your API key
                </td>
                <td className="py-2.5 pr-4">
                  At least one active API key exists.
                </td>
                <td className="py-2.5">
                  Account and key configuration are done.
                </td>
              </tr>
              <tr className="border-b border-white/[0.04]">
                <td className="py-2.5 pr-4 font-medium text-slate-200">
                  2. Run a test request
                </td>
                <td className="py-2.5 pr-4">
                  At least one API request has been made (any endpoint).
                </td>
                <td className="py-2.5">
                  Integration is reachable and key works end-to-end.
                </td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 font-medium text-slate-200">
                  3. Protect your first trade
                </td>
                <td className="py-2.5 pr-4">
                  Activation state has reached{" "}
                  <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
                    active_usage
                  </code>{" "}
                  (10+ requests).
                </td>
                <td className="py-2.5">
                  Real traffic is flowing and ATF is protecting trades.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-slate-300">
          The stepper disappears once all three steps are complete. If you see
          the stepper, at least one step still needs attention — check which
          step is highlighted as &ldquo;current&rdquo; and follow the action
          it suggests.
        </p>
      </section>

      {/* ── Common readiness failure modes ── */}
      <section className="space-y-4">
        <HeadingAnchor id="troubleshooting">
          Common readiness failure modes
        </HeadingAnchor>
        <p className="text-slate-300">
          The table below covers the most frequently encountered readiness
          failures and their fixes.
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
              {TROUBLESHOOTING.map((row) => (
                <tr
                  key={row.symptom}
                  className="border-b border-white/[0.04]"
                >
                  <td className="py-2.5 pr-4 font-medium text-slate-200">
                    {row.symptom}
                  </td>
                  <td className="py-2.5 pr-4">{row.cause}</td>
                  <td className="py-2.5">{row.fix}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Pre-flight checklist ── */}
      <section className="space-y-4">
        <HeadingAnchor id="checklist">
          Pre-flight checklist before going live
        </HeadingAnchor>
        <p className="text-slate-300">
          Run through this checklist before enabling a bot, agent, or
          production system. Every item is checkable with existing tools.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-slate-400">
                <th className="w-8 pb-2 pr-2 font-medium">#</th>
                <th className="pb-2 pr-4 font-medium">Item</th>
                <th className="pb-2 font-medium">How to verify</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {PREFLIGHT_CHECKLIST.map((row, i) => (
                <tr
                  key={row.item}
                  className="border-b border-white/[0.04]"
                >
                  <td className="py-2.5 pr-2 text-slate-500">{i + 1}</td>
                  <td className="py-2.5 pr-4 font-medium text-slate-200">
                    {row.item}
                  </td>
                  <td className="py-2.5">{row.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-3 text-sm text-emerald-200">
          <strong>Quick version:</strong> If{" "}
          <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-emerald-100">
            atf doctor --pretty
          </code>{" "}
          passes all checks and the dashboard stepper shows all three steps
          complete, you are production-ready.
        </div>
      </section>

      {/* ── When readiness is degraded ── */}
      <section className="space-y-4">
        <HeadingAnchor id="degraded">
          When readiness is degraded
        </HeadingAnchor>
        <p className="text-slate-300">
          If a previously-healthy integration starts failing readiness checks,
          categorize the issue:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-slate-400">
                <th className="pb-2 pr-4 font-medium">Category</th>
                <th className="pb-2 pr-4 font-medium">Examples</th>
                <th className="pb-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              <tr className="border-b border-white/[0.04]">
                <td className="py-2.5 pr-4 font-medium text-emerald-300">
                  Transient
                </td>
                <td className="py-2.5 pr-4">
                  Brief API latency spike, RPC provider hiccup, evaluator
                  restart during deployment.
                </td>
                <td className="py-2.5">
                  Retry after 30–60 seconds. If the issue clears, no action
                  needed.
                </td>
              </tr>
              <tr className="border-b border-white/[0.04]">
                <td className="py-2.5 pr-4 font-medium text-amber-300">
                  Configuration drift
                </td>
                <td className="py-2.5 pr-4">
                  API key rotated but environment variable not updated, RPC URL
                  changed, config file overwritten.
                </td>
                <td className="py-2.5">
                  Run{" "}
                  <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
                    atf doctor
                  </code>{" "}
                  to pinpoint the drift. Update the affected configuration.
                </td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 font-medium text-red-300">
                  Upstream outage
                </td>
                <td className="py-2.5 pr-4">
                  ATF API down, RPC provider unreachable, DNS failure.
                </td>
                <td className="py-2.5">
                  Check the health endpoint directly:{" "}
                  <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
                    curl {ATF_HEALTH_ENDPOINT}
                  </code>.
                  If unreachable, monitor and retry. Check your RPC
                  provider&apos;s status page.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-slate-300">
          If you have{" "}
          <Link
            href="/docs/guide/webhooks"
            className="font-semibold text-primary-200 hover:text-primary-100"
          >
            webhooks configured
          </Link>
          , watch for{" "}
          <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-sm text-slate-200">
            agent.reconcile.healthy
          </code>{" "}
          events (opt-in) as an automated health signal. If the event stops
          arriving, your webhook endpoint may also be degraded — see the{" "}
          <Link
            href="/docs/guide/webhooks#troubleshooting"
            className="font-semibold text-primary-200 hover:text-primary-100"
          >
            webhook troubleshooting section
          </Link>
          .
        </p>
      </section>

      {/* ── Dry-run verification ── */}
      <section className="space-y-4">
        <HeadingAnchor id="dry-run">
          Using dry-run to verify without side effects
        </HeadingAnchor>
        <p className="text-slate-300">
          The safest way to verify end-to-end readiness is a dry-run
          trade. This exercises the full policy evaluation pipeline without
          submitting an on-chain transaction:
        </p>
        <CopyBlock label="Dry-run trade" value="atf trade --dry-run" />
        <p className="text-slate-300">
          A successful dry-run confirms: API key works, policy evaluator runs,
          and the result is a valid receipt you can verify. Dry-runs do not
          consume execution quota and do not emit webhook events.
        </p>
      </section>

      {/* ── Reconcile forward pointer ── */}
      <section className="space-y-4">
        <HeadingAnchor id="reconcile">
          Readiness and reconcile workflows
        </HeadingAnchor>
        <p className="text-slate-300">
          Readiness checks verify that your integration <em>can</em> operate.
          Reconcile workflows verify that it <em>did</em> operate correctly —
          comparing expected vs actual state after the fact. Reconcile is a
          more advanced operational topic that builds on readiness:
        </p>
        <ul className="ml-5 list-disc space-y-2 text-slate-300">
          <li>
            <strong className="text-slate-200">Readiness</strong> answers:
            &ldquo;Is my integration configured, reachable, and ready to
            process transactions?&rdquo;
          </li>
          <li>
            <strong className="text-slate-200">Reconcile</strong> answers:
            &ldquo;Did the transactions I processed match what was expected?
            Are there any state inconsistencies to resolve?&rdquo;
          </li>
        </ul>
        <p className="text-slate-300">
          If you receive{" "}
          <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-sm text-slate-200">
            agent.reconcile.repaired
          </code>{" "}
          or{" "}
          <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-sm text-slate-200">
            agent.reconcile.failed
          </code>{" "}
          webhook events, start by running the readiness checks in this guide
          to rule out configuration issues before investigating state
          discrepancies.
        </p>
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-3 text-sm text-slate-300">
          For full reconcile documentation — dry-run mode, drift detection,
          token rotation, recovery patterns, and webhook event handling — see
          the{" "}
          <Link
            href="/docs/guide/reconcile"
            className="font-semibold text-primary-200 hover:text-primary-100"
          >
            Reconcile &amp; State Recovery
          </Link>{" "}
          guide. Use this guide&apos;s readiness checks as your first
          diagnostic step when reconcile events indicate issues.
        </div>
      </section>

      {/* ── Next steps ── */}
      <section className="glass-panel rounded-xl p-7">
        <HeadingAnchor id="next-steps">Next steps</HeadingAnchor>
        <ul className="mt-4 space-y-3 text-slate-300">
          <li>
            <Link
              href="/docs/guide/key-lifecycle"
              className="font-semibold text-primary-200 hover:text-primary-100"
            >
              API Key Lifecycle
            </Link>{" "}
            — create, rotate, and scope keys for different environments.
          </li>
          <li>
            <Link
              href="/docs/guide/rate-limits"
              className="font-semibold text-primary-200 hover:text-primary-100"
            >
              Rate Limits &amp; Recovery
            </Link>{" "}
            — understand rate-limit headers and implement backoff.
          </li>
          <li>
            <Link
              href="/docs/guide/webhooks"
              className="font-semibold text-primary-200 hover:text-primary-100"
            >
              Webhook Setup &amp; Debugging
            </Link>{" "}
            — configure async notifications. The{" "}
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
              agent.reconcile.healthy
            </code>{" "}
            event acts as an automated readiness heartbeat.
          </li>
          <li>
            <Link
              href="/customer/dashboard"
              className="font-semibold text-primary-200 hover:text-primary-100"
            >
              Customer Dashboard
            </Link>{" "}
            — monitor activation progress and usage in real time.
          </li>
          <li>
            <Link
              href="/docs/guide"
              className="font-semibold text-primary-200 hover:text-primary-100"
            >
              All Customer Guides
            </Link>{" "}
            — return to the guides overview.
          </li>
        </ul>
      </section>
    </article>
  );
}
