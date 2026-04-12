import type { Metadata } from "next";
import Link from "next/link";
import { HeadingAnchor } from "@/components/heading-anchor";
import { CopyBlock } from "@/components/copy-block";

export const metadata: Metadata = {
  title: "API Key Lifecycle — Customer Guide",
  description:
    "Create, store, scope, rotate, and revoke ATF API keys. Operational guide for TruCore customers.",
  robots: { index: false, follow: false },
};

/* ── Constants (mirror /customer/keys page) ── */

const ATF_BASE_URL = "https://api.trucore.xyz";
const ATF_MCP_ENDPOINT = `${ATF_BASE_URL}/mcp/v1`;
const ATF_AUTH_HEADER = "X-API-Key";
const ATF_ENV_VAR = "ATF_API_KEY";
const ATF_ENV_FILE_PATH = "~/.openclaw/secrets/atf.env";
const ATF_SOURCE_COMMAND = "source ~/.openclaw/secrets/atf.env";

/* ── Scope reference ── */

const SCOPES = [
  {
    scope: "atf:probe",
    grants: "Submit transaction intents for policy evaluation without execution.",
  },
  {
    scope: "atf:simulate",
    grants: "Run deterministic simulations against configured policies.",
  },
  {
    scope: "atf:verify",
    grants: "Verify receipt hashes and confirm prior decisions.",
  },
  {
    scope: "atf:explain",
    grants: "Retrieve human-readable explanations of policy decisions.",
  },
  {
    scope: "atf:mcp",
    grants: "Access MCP tooling endpoint. Required for any MCP integration.",
  },
] as const;

/* ── Page ── */

export default function KeyLifecycleGuide() {
  return (
    <article className="space-y-10">
      {/* ── Header ── */}
      <header className="space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
          Customer Guide
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-accent-200 sm:text-5xl">
          API Key Lifecycle
        </h1>
        <p className="max-w-3xl text-lg leading-relaxed text-slate-300">
          Create, store, scope, rotate, and revoke API keys for your ATF
          integrations. This guide covers the operational side — for conceptual
          background, see{" "}
          <Link
            href="/docs/auth"
            className="font-semibold text-primary-200 transition-colors hover:text-primary-100"
          >
            Auth &amp; API Keys
          </Link>{" "}
          in the public docs.
        </p>
        <div className="gradient-divider mt-2" aria-hidden="true" />
      </header>

      {/* ── What this guide covers ── */}
      <section className="space-y-4">
        <HeadingAnchor id="overview">What this guide covers</HeadingAnchor>
        <p className="text-slate-300">
          API keys authenticate your bots, agents, and CLI sessions to ATF
          protect and execution endpoints. Each key has a label, a purpose tag,
          a set of scopes, and a secret that is shown exactly once.
        </p>
        <p className="text-slate-300">
          This guide walks through every stage of an API key&apos;s life:
          creation → secure storage → environment setup → scope selection →
          rotation → revocation. All actions are available in your{" "}
          <Link
            href="/customer/keys"
            className="font-semibold text-primary-200 hover:text-primary-100"
          >
            Keys dashboard
          </Link>
          .
        </p>
      </section>

      {/* ── How API keys fit into ATF ── */}
      <section className="space-y-4">
        <HeadingAnchor id="how-keys-fit">
          How API keys fit into ATF
        </HeadingAnchor>
        <p className="text-slate-300">
          ATF uses two forms of authentication. Knowing when to use each avoids
          the most common integration mistake.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.08] text-left text-slate-400">
                <th className="pb-2 pr-6 font-medium">Credential</th>
                <th className="pb-2 pr-6 font-medium">Header</th>
                <th className="pb-2 font-medium">Used for</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              <tr className="border-b border-white/[0.04]">
                <td className="py-2.5 pr-6 text-slate-200">API Key</td>
                <td className="py-2.5 pr-6">
                  <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs font-mono text-slate-200">
                    X-API-Key
                  </code>
                </td>
                <td className="py-2.5">
                  Protect, execute, verify, MCP tools (bot/agent requests)
                </td>
              </tr>
              <tr>
                <td className="py-2.5 pr-6 text-slate-200">JWT Token</td>
                <td className="py-2.5 pr-6">
                  <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs font-mono text-slate-200">
                    Authorization: Bearer
                  </code>
                </td>
                <td className="py-2.5">
                  Key management, receipts, dashboard, account settings
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm text-slate-400">
          Your bot sends requests with the{" "}
          <code className="font-mono text-slate-300">X-API-Key</code> header.
          You manage keys in the portal using your JWT. Never put your JWT in
          a bot configuration.
        </p>
      </section>

      {/* ── Creating a key ── */}
      <section className="space-y-4">
        <HeadingAnchor id="creating-a-key">Creating a key</HeadingAnchor>
        <p className="text-slate-300">
          Open your{" "}
          <Link
            href="/customer/keys"
            className="font-semibold text-primary-200 hover:text-primary-100"
          >
            Keys dashboard
          </Link>{" "}
          and click <strong className="text-slate-100">Create API Key</strong>.
        </p>

        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 space-y-3">
          <h3 className="text-base font-bold text-accent-300">
            Fields you&apos;ll set
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.08] text-left text-slate-400">
                  <th className="pb-2 pr-6 font-medium">Field</th>
                  <th className="pb-2 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody className="text-slate-300">
                <tr className="border-b border-white/[0.04]">
                  <td className="py-2 pr-6 text-slate-200">Label</td>
                  <td className="py-2">
                    Optional, up to 64 characters. Use a descriptive name like{" "}
                    <code className="text-xs font-mono text-slate-400">
                      production-arb-bot
                    </code>{" "}
                    or{" "}
                    <code className="text-xs font-mono text-slate-400">
                      staging-mcp
                    </code>
                    .
                  </td>
                </tr>
                <tr className="border-b border-white/[0.04]">
                  <td className="py-2 pr-6 text-slate-200">Purpose</td>
                  <td className="py-2">
                    General, REST API, Bot&nbsp;/&nbsp;Agent, or MCP Integration.
                    Sets an audit-trail label and guides scope defaults.
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pr-6 text-slate-200">Scopes</td>
                  <td className="py-2">
                    Select individual scopes or leave empty to inherit all scopes
                    available on your plan tier.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <h3 className="text-lg font-bold text-accent-300">
          Test key shortcut
        </h3>
        <p className="text-slate-300">
          Click <strong className="text-slate-100">Create test key</strong> to
          generate a key pre-configured with label{" "}
          <code className="text-xs font-mono text-slate-400">test-bot</code>,
          purpose <em>Bot&nbsp;/&nbsp;Agent</em>, and all four test scopes
          (<code className="text-xs font-mono text-slate-400">atf:probe</code>,{" "}
          <code className="text-xs font-mono text-slate-400">atf:simulate</code>,{" "}
          <code className="text-xs font-mono text-slate-400">atf:verify</code>,{" "}
          <code className="text-xs font-mono text-slate-400">atf:explain</code>
          ). This is the fastest way to start testing.
        </p>

        <h3 className="text-lg font-bold text-accent-300">Prerequisites</h3>
        <ul className="ml-5 list-disc space-y-1 text-slate-300">
          <li>
            <strong className="text-slate-200">Verified email</strong> — key
            creation, rotation, and revocation all require a verified email
            address. Visit your{" "}
            <Link
              href="/customer/dashboard"
              className="font-semibold text-primary-200 hover:text-primary-100"
            >
              dashboard
            </Link>{" "}
            to check or resend verification.
          </li>
        </ul>
      </section>

      {/* ── Storing a key safely ── */}
      <section className="space-y-4">
        <HeadingAnchor id="storing-a-key">Storing a key safely</HeadingAnchor>

        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
          <p className="text-sm font-semibold text-amber-200">
            Your secret is shown exactly once.
          </p>
          <p className="mt-1 text-sm text-amber-300/80">
            When you create or rotate a key, the secret is displayed a single
            time and then cryptographically hashed. If you close the dialog
            without copying it, there is no way to retrieve the secret. You
            will need to rotate the key to get a new one.
          </p>
        </div>

        <h3 className="text-lg font-bold text-accent-300">
          Recommended: local secret file
        </h3>
        <p className="text-slate-300">
          Store your secret in a dedicated file outside your project tree so it
          is never committed to version control:
        </p>
        <CopyBlock
          label="Create the secret file"
          value={`mkdir -p ~/.openclaw/secrets\nchmod 700 ~/.openclaw/secrets\n\ncat > ${ATF_ENV_FILE_PATH} << 'EOF'\n# ATF customer API key\nexport ${ATF_ENV_VAR}=<paste-your-secret-here>\nexport ATF_BASE_URL=${ATF_BASE_URL}\nexport ATF_MCP_ENDPOINT=${ATF_MCP_ENDPOINT}\nEOF\n\nchmod 600 ${ATF_ENV_FILE_PATH}`}
        />
        <CopyBlock
          label="Load before running your bot"
          value={ATF_SOURCE_COMMAND}
          helperText="Add this line to your bot's start script or shell profile so the key is available automatically."
        />

        <h3 className="text-lg font-bold text-accent-300">
          Other environments
        </h3>
        <ul className="ml-5 list-disc space-y-1 text-sm text-slate-300">
          <li>
            <strong className="text-slate-200">CI/CD</strong> — Use your
            provider&apos;s secret store (GitHub Actions secrets, GitLab CI/CD
            variables, etc.) and inject{" "}
            <code className="font-mono text-slate-400">{ATF_ENV_VAR}</code>{" "}
            as an environment variable.
          </li>
          <li>
            <strong className="text-slate-200">Docker</strong> — Pass the key
            at runtime with{" "}
            <code className="font-mono text-slate-400">
              -e {ATF_ENV_VAR}
            </code>{" "}
            or a Docker secret. Never bake it into an image layer.
          </li>
          <li>
            <strong className="text-slate-200">Kubernetes</strong> — Store in
            a Secret object and mount as an environment variable in your pod
            spec.
          </li>
        </ul>
      </section>

      {/* ── Using your key ── */}
      <section className="space-y-4">
        <HeadingAnchor id="using-your-key">
          Using your key in integrations
        </HeadingAnchor>

        <p className="text-slate-300">
          All bot- and agent-facing requests use the{" "}
          <code className="font-mono text-slate-200">{ATF_AUTH_HEADER}</code>{" "}
          header. The snippets below assume you have loaded your secret into{" "}
          <code className="font-mono text-slate-400">
            ${"{"}
            {ATF_ENV_VAR}
            {"}"}
          </code>
          .
        </p>

        <CopyBlock
          label="REST — probe a swap intent"
          value={`curl -sS ${ATF_BASE_URL}/v1/intents \\\n  -H "${ATF_AUTH_HEADER}: $${ATF_ENV_VAR}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"intent_type":"swap","input_mint":"So111...","output_mint":"EPjFW...","amount":1000000,"slippage_bps":50}'`}
        />
        <CopyBlock
          label="MCP — JSON-RPC tool call"
          value={`curl -sS ${ATF_MCP_ENDPOINT} \\\n  -H "${ATF_AUTH_HEADER}: $${ATF_ENV_VAR}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"probe_transaction","arguments":{"intent_type":"swap","input_mint":"So111...","output_mint":"EPjFW...","amount":1000000,"slippage_bps":50}}}'`}
        />
        <CopyBlock
          label="CLI — load key and run"
          value={`${ATF_SOURCE_COMMAND}\natf doctor          # verify connectivity\natf trade simulate  # run a simulation`}
        />

        <h3 className="text-lg font-bold text-accent-300">
          Self-verification checklist
        </h3>
        <p className="text-sm text-slate-400">
          After setting up your key, run these three checks to confirm it works
          end-to-end:
        </p>
        <div className="space-y-2">
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.01] px-4 py-3">
            <p className="text-xs font-semibold text-emerald-300">
              1. API check
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              POST{" "}
              <code className="font-mono text-primary-300">
                /v1/receipts/verify
              </code>{" "}
              with your key. HTTP 200 with{" "}
              <code className="font-mono text-primary-300">
                valid:false, reason:signature_invalid
              </code>{" "}
              means auth succeeded and reached protected logic.
            </p>
          </div>
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.01] px-4 py-3">
            <p className="text-xs font-semibold text-emerald-300">
              2. MCP check
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              POST to{" "}
              <code className="font-mono text-primary-300">
                {ATF_MCP_ENDPOINT}
              </code>{" "}
              with method{" "}
              <code className="font-mono text-primary-300">tools/call</code>,
              tool{" "}
              <code className="font-mono text-primary-300">
                explain_decision
              </code>
              , argument{" "}
              <code className="font-mono text-primary-300">
                decision_source: &quot;verify&quot;
              </code>
              . Response should contain{" "}
              <code className="font-mono text-primary-300">
                isError:false
              </code>
              .
            </p>
          </div>
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.01] px-4 py-3">
            <p className="text-xs font-semibold text-emerald-300">
              3. CLI check
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              Run{" "}
              <code className="font-mono text-primary-300">
                {ATF_SOURCE_COMMAND} &amp;&amp; atf doctor
              </code>
              . A passing result confirms credential and RPC connectivity.
            </p>
          </div>
        </div>
      </section>

      {/* ── Scope selection ── */}
      <section className="space-y-4">
        <HeadingAnchor id="scope-selection">
          Scope selection and least-privilege
        </HeadingAnchor>
        <p className="text-slate-300">
          Scopes control which ATF capabilities a key can access. Granting only
          the scopes your integration needs reduces blast radius if a key is
          compromised.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.08] text-left text-slate-400">
                <th className="pb-2 pr-6 font-medium">Scope</th>
                <th className="pb-2 font-medium">Grants</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {SCOPES.map((s) => (
                <tr
                  key={s.scope}
                  className="border-b border-white/[0.04]"
                >
                  <td className="py-2 pr-6">
                    <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs font-mono text-slate-200">
                      {s.scope}
                    </code>
                  </td>
                  <td className="py-2">{s.grants}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 className="text-lg font-bold text-accent-300">
          Recommended scope sets
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.01] px-4 py-3">
            <p className="text-xs font-semibold text-slate-200">
              API / CLI testing
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {["atf:probe", "atf:simulate", "atf:verify", "atf:explain"].map(
                (s) => (
                  <code
                    key={s}
                    className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[10px] text-slate-400"
                  >
                    {s}
                  </code>
                ),
              )}
            </div>
          </div>
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.01] px-4 py-3">
            <p className="text-xs font-semibold text-slate-200">
              MCP integration
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {[
                "atf:probe",
                "atf:simulate",
                "atf:verify",
                "atf:explain",
                "atf:mcp",
              ].map((s) => (
                <code
                  key={s}
                  className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[10px] text-slate-400"
                >
                  {s}
                </code>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
          <p className="text-sm text-amber-200">
            If you select <strong>MCP Integration</strong> as purpose and your
            scope selection does not include{" "}
            <code className="font-mono text-xs">atf:mcp</code>, it will be
            added automatically. MCP requests without this scope are rejected.
          </p>
        </div>

        <h3 className="text-lg font-bold text-accent-300">
          Scope guidance
        </h3>
        <ul className="ml-5 list-disc space-y-1 text-sm text-slate-300">
          <li>
            <strong className="text-slate-200">
              One key per environment
            </strong>{" "}
            — create separate keys for development, staging, and production.
            Label them clearly.
          </li>
          <li>
            <strong className="text-slate-200">
              Start narrow, widen if needed
            </strong>{" "}
            — begin with only{" "}
            <code className="font-mono text-xs text-slate-400">
              atf:probe
            </code>{" "}
            +{" "}
            <code className="font-mono text-xs text-slate-400">
              atf:simulate
            </code>
            . Add scopes as your integration matures.
          </li>
          <li>
            <strong className="text-slate-200">
              If a request gets a 403
            </strong>{" "}
            — check whether the key&apos;s scopes cover the endpoint. Missing
            scopes are the most common cause of 403 errors after a key is
            confirmed active.
          </li>
        </ul>
      </section>

      {/* ── Rotation ── */}
      <section className="space-y-4">
        <HeadingAnchor id="rotation">Rotation workflow</HeadingAnchor>
        <p className="text-slate-300">
          Rotation is an atomic operation: ATF revokes the old key and issues a
          new one in a single step. The old key stops working immediately.
        </p>

        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 space-y-3">
          <h3 className="text-base font-bold text-accent-300">Steps</h3>
          <ol className="ml-5 list-decimal space-y-2 text-slate-300">
            <li>
              Open your{" "}
              <Link
                href="/customer/keys"
                className="font-semibold text-primary-200 hover:text-primary-100"
              >
                Keys dashboard
              </Link>
              .
            </li>
            <li>
              Find the key to rotate and click{" "}
              <strong className="text-slate-100">Rotate</strong>.
            </li>
            <li>
              Confirm the action. The old key is revoked and a new secret is
              displayed.
            </li>
            <li>
              <strong className="text-amber-200">
                Copy the new secret immediately
              </strong>{" "}
              — it is shown only once.
            </li>
            <li>
              Update your env file, CI secrets, or bot config with the new
              secret.
            </li>
            <li>Re-run the self-verification checklist above.</li>
          </ol>
        </div>

        <h3 className="text-lg font-bold text-accent-300">
          When to rotate
        </h3>
        <ul className="ml-5 list-disc space-y-1 text-sm text-slate-300">
          <li>
            <strong className="text-slate-200">Immediately</strong> — if you
            suspect a secret has been exposed (committed to git, logged,
            shared in plaintext).
          </li>
          <li>
            <strong className="text-slate-200">Periodically</strong> — as a
            hygiene practice. A 90-day cadence is a reasonable starting point
            for production keys.
          </li>
          <li>
            <strong className="text-slate-200">Team changes</strong> — when a
            team member with access to secrets leaves.
          </li>
        </ul>

        <div className="rounded-lg border border-white/[0.06] bg-white/[0.01] px-4 py-3">
          <p className="text-sm text-slate-400">
            <strong className="text-slate-300">Rotation ≠ downtime</strong>{" "}
            — if you can deploy the new secret before the rotation, create a{" "}
            <em>second</em> key with the same scopes, deploy it, then revoke
            the original. This achieves zero-downtime credential refresh.
          </p>
        </div>
      </section>

      {/* ── Revocation ── */}
      <section className="space-y-4">
        <HeadingAnchor id="revocation">Revocation workflow</HeadingAnchor>
        <p className="text-slate-300">
          Revocation permanently deactivates a key. Requests using a revoked
          key are rejected immediately. There is no undo.
        </p>

        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 space-y-3">
          <h3 className="text-base font-bold text-accent-300">Steps</h3>
          <ol className="ml-5 list-decimal space-y-2 text-slate-300">
            <li>
              Open your{" "}
              <Link
                href="/customer/keys"
                className="font-semibold text-primary-200 hover:text-primary-100"
              >
                Keys dashboard
              </Link>
              .
            </li>
            <li>
              Find the key to revoke and click{" "}
              <strong className="text-slate-100">Revoke</strong>.
            </li>
            <li>
              Confirm the action. The key is deactivated immediately.
            </li>
          </ol>
        </div>

        <h3 className="text-lg font-bold text-accent-300">
          When to revoke vs. rotate
        </h3>
        <ul className="ml-5 list-disc space-y-1 text-sm text-slate-300">
          <li>
            <strong className="text-slate-200">Revoke</strong> when the key
            is no longer needed (decomissioned bot, closed environment, test
            cleanup).
          </li>
          <li>
            <strong className="text-slate-200">Rotate</strong> when the key
            is still needed but the secret must change (exposure incident,
            periodic hygiene).
          </li>
        </ul>
      </section>

      {/* ── Common mistakes ── */}
      <section className="space-y-4">
        <HeadingAnchor id="troubleshooting">
          Common mistakes and troubleshooting
        </HeadingAnchor>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.08] text-left text-slate-400">
                <th className="pb-2 pr-6 font-medium">Symptom</th>
                <th className="pb-2 font-medium">Likely cause &amp; fix</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              <tr className="border-b border-white/[0.04]">
                <td className="py-2.5 pr-6 text-slate-200">
                  401 Unauthorized
                </td>
                <td className="py-2.5">
                  Key is missing, malformed, or revoked. Confirm the key is
                  active in your{" "}
                  <Link
                    href="/customer/keys"
                    className="text-primary-300 hover:text-primary-200"
                  >
                    dashboard
                  </Link>{" "}
                  and that you are sending the full secret in the{" "}
                  <code className="font-mono text-xs">X-API-Key</code> header
                  (not the key ID).
                </td>
              </tr>
              <tr className="border-b border-white/[0.04]">
                <td className="py-2.5 pr-6 text-slate-200">
                  403 Forbidden
                </td>
                <td className="py-2.5">
                  Key is active but lacks the required scope. Check the key&apos;s
                  scopes against the endpoint&apos;s requirements. Add the
                  missing scope by creating a new key or rotating with broader
                  scopes.
                </td>
              </tr>
              <tr className="border-b border-white/[0.04]">
                <td className="py-2.5 pr-6 text-slate-200">
                  429 Too Many Requests
                </td>
                <td className="py-2.5">
                  Rate limit hit. Wait and retry with exponential backoff. Key
                  management endpoints are rate-limited independently from
                  protect/execute.
                </td>
              </tr>
              <tr className="border-b border-white/[0.04]">
                <td className="py-2.5 pr-6 text-slate-200">
                  &quot;Email not verified&quot;
                </td>
                <td className="py-2.5">
                  Key creation, rotation, and revocation require a verified
                  email. Visit your{" "}
                  <Link
                    href="/customer/dashboard"
                    className="text-primary-300 hover:text-primary-200"
                  >
                    dashboard
                  </Link>{" "}
                  to verify.
                </td>
              </tr>
              <tr className="border-b border-white/[0.04]">
                <td className="py-2.5 pr-6 text-slate-200">
                  &quot;Key limit reached&quot;
                </td>
                <td className="py-2.5">
                  Your plan tier has a maximum number of active keys. Revoke
                  unused keys to free a slot, or{" "}
                  <Link
                    href="/docs/upgrade"
                    className="text-primary-300 hover:text-primary-200"
                  >
                    request an upgrade
                  </Link>
                  .
                </td>
              </tr>
              <tr>
                <td className="py-2.5 pr-6 text-slate-200">
                  Lost secret
                </td>
                <td className="py-2.5">
                  Secrets cannot be retrieved after creation. Rotate the key to
                  get a new secret, then update your configuration.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Key hygiene ── */}
      <section className="space-y-4">
        <HeadingAnchor id="key-hygiene">Key hygiene checklist</HeadingAnchor>
        <ul className="ml-5 list-disc space-y-2 text-slate-300">
          <li>
            Give every key a descriptive label with the environment and
            purpose:{" "}
            <code className="text-xs font-mono text-slate-400">
              prod-arb-bot
            </code>
            ,{" "}
            <code className="text-xs font-mono text-slate-400">
              staging-mcp
            </code>
            ,{" "}
            <code className="text-xs font-mono text-slate-400">
              dev-testing
            </code>
            .
          </li>
          <li>
            Review the <em>Last Used</em> column in your dashboard
            periodically. Keys unused for an extended period are candidates for
            revocation.
          </li>
          <li>
            Never share a key across multiple bots if they run in different
            trust domains. Separate keys let you revoke one without disrupting
            the other.
          </li>
          <li>
            After a team member leaves, rotate every key they had access to.
          </li>
          <li>
            Store secrets in a secret manager or env file — never hardcode them
            in source files, commit them to git, or log them.
          </li>
        </ul>
      </section>

      {/* ── Next steps ── */}
      <section className="glass-panel rounded-xl p-7">
        <HeadingAnchor id="next-steps">Next steps</HeadingAnchor>
        <ul className="mt-3 space-y-2 text-slate-400">
          <li>
            <Link
              href="/docs/auth"
              className="font-semibold text-primary-200 hover:text-primary-100"
            >
              Auth &amp; API Keys
            </Link>{" "}
            — public conceptual reference for signup, login, and key
            management endpoints.
          </li>
          <li>
            <Link
              href="/customer/keys"
              className="font-semibold text-primary-200 hover:text-primary-100"
            >
              Keys dashboard
            </Link>{" "}
            — manage your keys now.
          </li>
          <li>
            <Link
              href="/docs/guide"
              className="font-semibold text-primary-200 hover:text-primary-100"
            >
              Customer Guides overview
            </Link>{" "}
            — see all available operational guides.
          </li>
          <li>
            <Link
              href="/docs/plans"
              className="font-semibold text-primary-200 hover:text-primary-100"
            >
              Plans &amp; Feature Tiers
            </Link>{" "}
            — understand scope availability and rate limits by plan.
          </li>
        </ul>
      </section>
    </article>
  );
}
