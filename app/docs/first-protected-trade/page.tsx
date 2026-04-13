import type { Metadata } from "next";
import Link from "next/link";
import { HeadingAnchor } from "@/components/heading-anchor";
import { CopyBlock } from "@/components/copy-block";
import { AtfCopyCommand } from "@/components/atf-copy-command";
import { SafeToTryBanner, DemoVsRealBlock, WhatHappensBlock } from "@/components/safe-to-try-banner";
import { getAtfCliVersion } from "@/lib/version";

export const metadata: Metadata = {
  title: "First Protected Trade - Golden Path | TruCore",
  description:
    "Protect your first bot intent in minutes. Submit a swap, receive a receipt, verify the hash. HTTP, Python, TypeScript, CLI, and OpenClaw paths.",
  keywords: [
    "first protected trade",
    "golden path",
    "ATF quickstart",
    "bot protect",
    "swap receipt",
    "deterministic verification",
    "AI agent transaction",
    "TruCore ATF",
  ],
  openGraph: {
    title: "First Protected Trade - Golden Path | TruCore",
    description:
      "Submit a swap intent, receive a tamper-evident receipt, and verify the hash. Five integration paths: HTTP, Python, TypeScript, CLI, and OpenClaw.",
    url: "https://trucore.xyz/docs/first-protected-trade",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "First Protected Trade - Golden Path | TruCore",
    description:
      "Protect your first bot intent in minutes with deterministic receipts and hash verification.",
    images: ["/opengraph-image"],
  },
  alternates: {
    canonical: "https://trucore.xyz/docs/first-protected-trade",
  },
};

const cliVersion = getAtfCliVersion();

const INTENT_JSON = `{
  "chain_id": "solana",
  "intent_type": "swap",
  "intent": {
    "type": "swap",
    "in_mint": "So11111111111111111111111111111111111111112",
    "out_mint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    "amount_in": 1000000,
    "slippage_bps": 50,
    "agent_id": "my-bot-v1"
  },
  "metadata": {
    "agent_version": "1.0.0",
    "session_id": "golden-path-001"
  }
}`;

const CURL_PROTECT = `BASE_URL="\${BASE_URL:-https://api.trucore.xyz}"

curl -sS "$BASE_URL/v1/bot/protect" \\
  -H "Content-Type: application/json" \\
  -d '{
    "chain_id": "solana",
    "intent_type": "swap",
    "intent": {
      "type": "swap",
      "in_mint": "So11111111111111111111111111111111111111112",
      "out_mint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      "amount_in": 1000000,
      "slippage_bps": 50,
      "agent_id": "my-bot-v1"
    }
  }'`;

const PYTHON_EXAMPLE = `"""protect_golden.py - zero-dependency protect call."""
import json, urllib.request

BASE_URL = "https://api.trucore.xyz"  # or http://localhost:8000
INTENT = {
    "chain_id": "solana",
    "intent_type": "swap",
    "intent": {
        "type": "swap",
        "in_mint": "So11111111111111111111111111111111111111112",
        "out_mint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        "amount_in": 1000000,
        "slippage_bps": 50,
        "agent_id": "my-bot-v1",
    },
}

req = urllib.request.Request(
    f"{BASE_URL}/v1/bot/protect",
    data=json.dumps(INTENT).encode(),
    headers={"Content-Type": "application/json"},
)
with urllib.request.urlopen(req, timeout=20) as resp:
    result = json.loads(resp.read())

print(json.dumps(result, indent=2))
if result.get("allow"):
    print(f"ALLOWED - receipt hash: {result['receipt']['content_hash']}")
else:
    print(f"DENIED - reason codes: {result.get('reason_codes', [])}")`;

const NODE_EXAMPLE = `// protect_golden.mjs - zero-dependency protect call (Node 18+)
const BASE_URL = process.env.BASE_URL ?? "https://api.trucore.xyz";
const intent = {
  chain_id: "solana",
  intent_type: "swap",
  intent: {
    type: "swap",
    in_mint: "So11111111111111111111111111111111111111112",
    out_mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    amount_in: 1_000_000,
    slippage_bps: 50,
    agent_id: "my-bot-v1",
  },
};

const res = await fetch(\`\${BASE_URL}/v1/bot/protect\`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(intent),
});
const result = await res.json();
console.log(JSON.stringify(result, null, 2));

if (result.allow) {
  console.log("ALLOWED - receipt hash:", result.receipt.content_hash);
} else {
  console.log("DENIED - reason codes:", result.reason_codes);
}`;

const RESPONSE_ALLOWED = `{
  "allow": true,
  "reason_codes": [],
  "warnings": [],
  "receipt": {
    "decision": "approved",
    "reasons": [],
    "content_hash": "a1b2c3d4e5f6...64-char-hex-string",
    "hash_version": "1",
    "timestamp_utc": "2026-03-14T00:00:00+00:00",
    "chain_id": "solana",
    "intent_type": "swap"
  },
  "venue": "jupiter"
}`;

const RESPONSE_DENIED = `{
  "allow": false,
  "reason_codes": ["DEX_SLIPPAGE_TOO_HIGH"],
  "receipt": {
    "decision": "denied",
    "reasons": ["DEX_SLIPPAGE_TOO_HIGH"],
    "content_hash": "f9e8d7c6b5a4...64-char-hex-string",
    "hash_version": "1"
  }
}`;

const VERIFY_CURL = `curl -sS "$BASE_URL/v1/receipts/verify" \\
  -H "Content-Type: application/json" \\
  -d '{"content_hash": "a1b2c3d4e5f6..."}'`;

export default function FirstProtectedTradePage() {
  return (
    <article className="space-y-10">
      <header className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
          Golden Path
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-accent-200 sm:text-5xl">
          Your First Protected Trade
        </h1>
        <p className="max-w-3xl text-lg leading-relaxed text-slate-300">
          Submit a swap, receive a receipt, verify the hash. No new dependencies required.
        </p>
        <SafeToTryBanner />

        {/* ── Specification reference ── */}
        <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
          <p className="text-sm text-slate-300">
            <strong className="text-slate-100">See the specification:</strong>{" "}
            Receipt format and verification procedure are normatively defined in{" "}
            <a
              href="https://github.com/trucore-ai/atf-spec/blob/main/spec/receipt.md"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary-200 transition-colors hover:text-primary-100"
            >
              atf-spec &rarr; spec/receipt.md
            </a>
            {" "}and{" "}
            <a
              href="https://github.com/trucore-ai/atf-spec/blob/main/spec/verification.md"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary-200 transition-colors hover:text-primary-100"
            >
              spec/verification.md
            </a>
            .
          </p>
        </div>

        {/* ── Glossary callout ── */}
        <p className="text-sm text-slate-400">
          This page uses API-level terms (<code className="font-mono text-slate-300">allow</code>,{" "}
          <code className="font-mono text-slate-300">approved</code>). For the full mapping across
          spec, API, CLI, and UI see the{" "}
          <Link href="/docs/terminology-and-endpoints" className="text-primary-200 transition-colors hover:text-primary-100">
            terminology &amp; endpoint glossary
          </Link>.
        </p>
      </header>

      {/* ── Install ── */}
      <section className="rounded-xl border border-primary-300/20 bg-primary-500/5 p-6 space-y-4">
        <HeadingAnchor id="install">Install the CLI</HeadingAnchor>

        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary-200">Recommended: install globally</p>
            <AtfCopyCommand command={`npm install -g @trucore/atf@${cliVersion}`} testId="fpt-install-global" />
            <p className="mt-1 text-sm text-slate-400">Then run commands directly with <code className="font-mono text-slate-300">atf</code>.</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Alternative: run without installing</p>
            <AtfCopyCommand command={`npx @trucore/atf@${cliVersion} trade`} testId="fpt-install-npx" />
          </div>
        </div>
      </section>

      {/* ── Run Your First Protected Trade ── */}
      <section className="rounded-xl border border-accent-500/30 bg-accent-500/5 p-6 space-y-4">
        <HeadingAnchor id="run-first-trade">Run Your First Protected Trade</HeadingAnchor>
        <WhatHappensBlock />

        <div className="mt-4">
          <DemoVsRealBlock />
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">1. Try a protected trade</p>
            <AtfCopyCommand command="atf trade" testId="fpt-trade" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">2. Connect for real trades</p>
            <AtfCopyCommand command="atf setup" testId="fpt-setup" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">3. Check readiness</p>
            <AtfCopyCommand command="atf doctor" testId="fpt-doctor" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">4. Verify proof</p>
            <AtfCopyCommand command="atf verify <receipt-id>" testId="fpt-verify" />
          </div>
        </div>
      </section>

      {/* ── Who this is for ── */}
      <section className="space-y-4">
        <HeadingAnchor id="who-this-is-for">Who This Is For</HeadingAnchor>
        <ul className="space-y-2 text-slate-300">
          <li><strong className="text-slate-100">Trading bot developers</strong> protecting Jupiter, Raydium, or Orca swaps on Solana</li>
          <li><strong className="text-slate-100">AI agent builders</strong> adding policy-enforced guardrails before chain execution</li>
          <li><strong className="text-slate-100">Anyone</strong> who wants to verify that ATF evaluates, receipts, and enforces before a transaction lands</li>
        </ul>
      </section>

      {/* ── The Flow ── */}
      <section className="space-y-4">
        <HeadingAnchor id="the-flow">The Flow</HeadingAnchor>
        <div className="flex flex-wrap items-center gap-3 text-lg font-semibold text-slate-200">
          <span className="rounded-lg border border-primary-400/30 bg-primary-500/10 px-3 py-1.5">Intent</span>
          <span className="text-slate-500">&rarr;</span>
          <span className="rounded-lg border border-primary-400/30 bg-primary-500/10 px-3 py-1.5">Policy Check</span>
          <span className="text-slate-500">&rarr;</span>
          <span className="rounded-lg border border-accent-400/30 bg-accent-500/10 px-3 py-1.5">Decision + Receipt</span>
          <span className="text-slate-500">&rarr;</span>
          <span className="rounded-lg border border-accent-400/30 bg-accent-500/10 px-3 py-1.5">Verify</span>
        </div>
        <p className="text-slate-300">
          If <code className="font-mono text-slate-200">allow=true</code>, proceed to sign and send.
          If <code className="font-mono text-slate-200">allow=false</code>, abort (fail-closed).
          Either way, the receipt proves what ATF decided.
        </p>
      </section>

      {/* ── Step 1: Define Intent ── */}
      <section className="space-y-4">
        <HeadingAnchor id="define-intent">Step 1: Define Your Intent</HeadingAnchor>
        <p className="text-slate-300">
          A standard SOL &rarr; USDC swap on Jupiter. Every field is plain JSON, no SDK required.
        </p>
        <CopyBlock label="intent.json" value={INTENT_JSON} />
      </section>

      {/* ── Step 2: Protect ── */}
      <section className="space-y-6">
        <HeadingAnchor id="protect-intent">Step 2: Protect the Intent</HeadingAnchor>
        <p className="text-slate-300">Pick your preferred integration path. All produce the same response contract.</p>

        {/* ── Optional: MCP integration path ── */}
        <div className="rounded-lg border border-primary-300/20 bg-primary-950/10 p-4 space-y-2">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
            Building through MCP?
          </p>
          <p className="text-sm text-slate-300">
            If your agent runtime supports MCP, the hosted endpoint covers the
            full advisory-to-enforcement loop with five tools
            including <code className="font-mono text-slate-200">protect_transaction</code> and{" "}
            <code className="font-mono text-slate-200">verify_receipt</code>.
            See{" "}
            <Link
              href="/docs/mcp"
              className="font-semibold text-primary-100 underline underline-offset-2 transition-colors hover:text-primary-200"
            >
              MCP Integration
            </Link>{" "}
            for setup and the complete tool inventory.
            If you are not using MCP, continue with the HTTP or CLI paths below.
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-accent-300">HTTP (curl)</h3>
          <CopyBlock label="bash" value={CURL_PROTECT} />
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-accent-300">Python (zero dependencies)</h3>
          <CopyBlock label="python" value={PYTHON_EXAMPLE} />
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-accent-300">TypeScript / Node.js (zero dependencies)</h3>
          <CopyBlock label="javascript" value={NODE_EXAMPLE} />
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-accent-300">CLI</h3>
          <CopyBlock label="bash" value={`cat intent.json | atf bot protect --stdin`} />
          <p className="text-sm text-slate-400">
            Exit codes: <code className="font-mono text-slate-300">0</code> = ALLOW,{" "}
            <code className="font-mono text-slate-300">20</code> = DENY,{" "}
            <code className="font-mono text-slate-300">31</code> = CONFIG_ERROR.{" "}
            Install: <code className="font-mono text-slate-300">npm install -g @trucore/atf</code>, or run directly with <code className="font-mono text-slate-300">npx @trucore/atf</code>
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-accent-300">OpenClaw Plugin</h3>
          <p className="text-slate-300">
            If you use{" "}
            <Link href="/docs/openclaw-plugin" className="font-semibold text-primary-100 transition-colors hover:text-primary-200">
              OpenClaw
            </Link>
            , install the ATF plugin and call <code className="font-mono text-slate-200">atf_protect_intent</code> with the same intent shape.
          </p>
          <CopyBlock label="bash" value="openclaw plugins install @trucore/trucore-atf@0.2.11" />
        </div>
      </section>

      {/* ── Example Protected Execution ── */}
      <div className="mt-8 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-5">
        <h3 className="text-sm font-medium text-emerald-400">
          Example protected execution
        </h3>

        <ul className="mt-3 text-sm text-white/80 space-y-1">
          <li>SOL &rarr; USDC swap</li>
          <li>DEX: Jupiter</li>
          <li>Policy enforcement: enabled</li>
          <li>Execution receipt generated</li>
        </ul>

        <Link
          href="/verify"
          className="inline-block mt-4 text-sm text-emerald-400 hover:text-emerald-300"
        >
          Verify a receipt &rarr;
        </Link>
      </div>

      {/* ── Step 3: Read the Response ── */}
      <section className="space-y-6">
        <HeadingAnchor id="read-response">Step 3: Read the Response</HeadingAnchor>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.1em] text-green-400">Allowed</p>
            <pre className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4 text-sm text-slate-200">
              <code>{RESPONSE_ALLOWED}</code>
            </pre>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.1em] text-red-400">Denied</p>
            <pre className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4 text-sm text-slate-200">
              <code>{RESPONSE_DENIED}</code>
            </pre>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-bold text-accent-300">Key Fields</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-slate-300">
              <thead>
                <tr className="border-b border-white/10 text-left">
                  <th className="pb-2 pr-4 font-semibold text-slate-200">Field</th>
                  <th className="pb-2 font-semibold text-slate-200">Meaning</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <tr><td className="py-2 pr-4 font-mono text-slate-200">allow</td><td><code className="text-green-300">true</code> = proceed. <code className="text-red-300">false</code> = abort.</td></tr>
                <tr><td className="py-2 pr-4 font-mono text-slate-200">reason_codes</td><td>Empty on allow. Specific deny codes on deny.</td></tr>
                <tr><td className="py-2 pr-4 font-mono text-slate-200">receipt.content_hash</td><td>SHA-256 deterministic hash. Same input = same hash.</td></tr>
                <tr><td className="py-2 pr-4 font-mono text-slate-200">receipt.decision</td><td><code className="text-slate-200">&quot;approved&quot;</code> or <code className="text-slate-200">&quot;denied&quot;</code></td></tr>
                <tr><td className="py-2 pr-4 font-mono text-slate-200">venue</td><td>Detected DEX (jupiter, raydium, orca)</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Step 4: Verify the Receipt ── */}
      <section className="space-y-6">
        <HeadingAnchor id="verify-receipt">Step 4: Verify the Receipt</HeadingAnchor>
        <p className="text-slate-300">
          The receipt hash proves what ATF decided. Verify it independently using any of these methods:
        </p>

        <div className="space-y-4">
          <h3 className="text-lg font-bold text-accent-300">CLI</h3>
          <CopyBlock label="bash" value="atf receipts verify --hash a1b2c3d4e5f6...full_hash_here" />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold text-accent-300">HTTP</h3>
          <CopyBlock label="bash" value={VERIFY_CURL} />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold text-accent-300">Web</h3>
          <p className="text-slate-300">
            Paste the <code className="font-mono text-slate-200">content_hash</code> into the{" "}
            <Link href="/verify" className="font-semibold text-primary-100 transition-colors hover:text-primary-200">
              Receipt Verifier
            </Link>.
          </p>
        </div>

        <div className="mt-4 rounded-lg border border-white/10 bg-neutral-900/50 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm font-semibold text-green-400">What verification proves</p>
              <ul className="mt-2 space-y-1 text-sm text-slate-300">
                <li>Receipt content is intact (hash integrity)</li>
                <li>Decision fields are untampered (deterministic hash match)</li>
                <li>Decision is reproducible (same input = same hash)</li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-400">What verification does NOT prove</p>
              <ul className="mt-2 space-y-1 text-sm text-slate-300">
                <li>That the transaction was submitted to chain</li>
                <li>That on-chain result matched the intent</li>
              </ul>
              <p className="mt-2 text-xs text-slate-400">
                See{" "}
                <Link href="/docs/anchoring-roadmap" className="text-primary-200 hover:text-primary-100">Anchoring Roadmap</Link>{" "}
                for planned on-chain receipt anchoring.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Step 5: Success Markers ── */}
      <section className="space-y-4">
        <HeadingAnchor id="success-markers">Step 5: Success Markers</HeadingAnchor>
        <p className="text-slate-300">You have completed the golden path when:</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-slate-300">
            <thead>
              <tr className="border-b border-white/10 text-left">
                <th className="pb-2 pr-4 font-semibold text-slate-200">Marker</th>
                <th className="pb-2 font-semibold text-slate-200">How to Confirm</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <tr><td className="py-2 pr-4 text-green-400">&#x2713; Intent submitted</td><td>HTTP 200 received (or CLI exit code 0 / 20)</td></tr>
              <tr><td className="py-2 pr-4 text-green-400">&#x2713; Decision received</td><td><code className="font-mono text-slate-200">allow</code> field is true or false</td></tr>
              <tr><td className="py-2 pr-4 text-green-400">&#x2713; Receipt returned</td><td><code className="font-mono text-slate-200">content_hash</code> is a 64-character hex string</td></tr>
              <tr><td className="py-2 pr-4 text-green-400">&#x2713; Receipt verified</td><td>CLI verify returns valid, or web verifier shows check</td></tr>
              <tr><td className="py-2 pr-4 text-green-400">&#x2713; Deny codes understood</td><td>If denied, <code className="font-mono text-slate-200">reason_codes</code> lists violations</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ── What This Proves ── */}
      <section className="space-y-4">
        <HeadingAnchor id="what-this-proves">What This Proves</HeadingAnchor>
        <p className="text-lg text-slate-200">
          <strong>Your bot now has a policy-enforced firewall.</strong> Every intent is:
        </p>
        <ol className="list-decimal space-y-2 pl-6 text-slate-300">
          <li><strong className="text-slate-100">Evaluated</strong> against configurable policy (spend caps, slippage bounds, protocol allowlists)</li>
          <li><strong className="text-slate-100">Decided</strong> deterministically (same input &rarr; same output, every time)</li>
          <li><strong className="text-slate-100">Receipted</strong> with a tamper-evident SHA-256 hash</li>
          <li><strong className="text-slate-100">Verifiable</strong> independently by any party with the receipt</li>
        </ol>
      </section>

      {/* ── Hello-World Bot Tutorial callout ── */}
      <section className="rounded-lg border border-primary-300/20 bg-primary-300/5 p-5">
        <p className="text-sm font-semibold text-primary-200">
          Want the smallest possible before-and-after example?
        </p>
        <p className="mt-1 text-sm text-slate-300">
          The{" "}
          <Link
            href="/docs/hello-world-bot"
            className="font-semibold text-primary-200 transition-colors hover:text-primary-100"
          >
            hello-world bot tutorial
          </Link>
          {" "}shows a minimal Python bot first without ATF, then with ATF protection.
          Simulated execution, educational, and under 30 lines per script.
        </p>
      </section>

      {/* ── Next Steps ── */}
      <section className="space-y-4">
        <HeadingAnchor id="next-steps">Next Steps</HeadingAnchor>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { title: "Verification Deep Dive", href: "/docs/verify", desc: "What content_hash means and production verification patterns" },
            { title: "Integration Pattern", href: "/docs/integration-pattern", desc: "How agents call ATF before execution" },
            { title: "MCP Integration", href: "/docs/mcp", desc: "Hosted MCP endpoint with five tools for agent runtimes" },
            { title: "Policy Model", href: "/docs/policy-model", desc: "Allowlists, limits, slippage bounds, cooldowns" },
            { title: "CLI Reference", href: "/docs/cli", desc: "Full CLI for profiles, transactions, receipts, and more" },
            { title: "API Reference", href: "/docs/api", desc: "Public endpoints for simulation and receipt generation" },
            { title: "OpenClaw Plugin", href: "/docs/openclaw-plugin", desc: "Agent-native policy protection with 13 tools" },
            { title: "Receipt Specification", href: "/docs/receipt-specification-v1", desc: "Formal receipt contract, hash rules, version policy" },
            { title: "Receipt Verifier", href: "/verify", desc: "Paste a content_hash and verify it now" },
            { title: "Example Verified Receipt", href: "/r/example", desc: "A stable, canonical receipt you can inspect and share" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg border border-white/10 bg-neutral-900/50 p-4 transition-colors hover:border-primary-300/30"
            >
              <p className="font-semibold text-accent-300">{item.title}</p>
              <p className="mt-1 text-sm text-slate-400">{item.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Troubleshooting ── */}
      <section className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
        <p className="text-sm font-semibold text-amber-400">Wrong package name?</p>
        <p className="mt-1 text-sm text-slate-300">
          If you see <code className="font-mono text-slate-200">npm ERR! 404</code> for{" "}
          <code className="font-mono text-slate-200">@trucore/atf-cli</code>, use the correct package name:
        </p>
        <p className="mt-2 font-mono text-sm text-primary-200">
          npm install -g @trucore/atf
        </p>
        <p className="mt-1 text-xs text-slate-400">
          The published package is <code className="font-mono text-slate-300">@trucore/atf</code>. The binary is <code className="font-mono text-slate-300">atf</code>.
        </p>
      </section>

      {/* ── Integration help CTA ── */}
      <section className="rounded-xl border border-accent-500/30 bg-accent-500/10 p-6">
        <h2 className="text-xl font-bold text-accent-300">You protected a trade. Now verify it.</h2>
        <p className="mt-2 text-lg text-slate-200">
          Paste the <code className="font-mono text-slate-200">content_hash</code> from your receipt into the
          verification tool to confirm integrity and complete the golden path.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <Link
            href="/verify"
            className="inline-flex items-center rounded-xl bg-accent-500 px-6 py-3 text-lg font-semibold text-neutral-950 transition-colors hover:bg-accent-400"
          >
            Verify your receipt &rarr;
          </Link>
          <Link
            href="/portal"
            className="text-base font-semibold text-primary-200 transition-colors hover:text-primary-100"
          >
            Open your portal
          </Link>
        </div>
        <p className="mt-4 text-sm text-slate-400">
          Don&apos;t have access yet?{" "}
          <Link
            href="/atf/apply?intent=design_partner"
            className="font-semibold text-primary-200 transition-colors hover:text-primary-100"
          >
            Apply for early access
          </Link>{" "}
          or{" "}
          <Link
            href="/builders"
            className="font-semibold text-primary-200 transition-colors hover:text-primary-100"
          >
            see all builder paths
          </Link>
          .
        </p>
      </section>
    </article>
  );
}
