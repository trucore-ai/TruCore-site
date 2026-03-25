import type { Metadata } from "next";
import Link from "next/link";
import { HeadingAnchor } from "@/components/heading-anchor";
import { CopyBlock } from "@/components/copy-block";

export const metadata: Metadata = {
  title: "Getting Started - ATF Developer Guide",
  description:
    "Create an account, get an API key, and protect your first trade with the Agent Transaction Firewall in minutes.",
};

const SIGNUP_CURL = `curl -sS https://api.trucore.xyz/auth/signup \\
  -H "Content-Type: application/json" \\
  -d '{"email": "you@example.com", "password": "your-secure-password"}'`;

const SIGNUP_RESPONSE = `{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "tenant_id": "cust_a1b2c3d4e5f6",
  "api_key": "atf_live_...",
  "email_verified": false
}`;

const PROTECT_CURL = `curl -sS https://api.trucore.xyz/v1/bot/protect \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: atf_live_YOUR_KEY" \\
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

const PROTECT_RESPONSE = `{
  "allow": true,
  "reason_codes": [],
  "receipt": {
    "decision": "approved",
    "content_hash": "a1b2c3d4...64-char-hex",
    "hash_version": "1",
    "timestamp_utc": "2026-03-21T00:00:00+00:00",
    "chain_id": "solana",
    "intent_type": "swap"
  },
  "venue": "jupiter"
}`;

const VERIFY_CURL = `curl -sS https://api.trucore.xyz/v1/receipts/verify \\
  -H "Content-Type: application/json" \\
  -d '{"content_hash": "a1b2c3d4...64-char-hex"}'`;

export default function GettingStartedPage() {
  return (
    <article className="space-y-10">
      <header className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
          Developer Guide
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-accent-200 sm:text-5xl">
          Getting Started with ATF
        </h1>
        <p className="max-w-3xl text-lg leading-relaxed text-slate-300">
          From signup to your first verified receipt in five steps.
          No credit card required. Free tier includes 100 protect calls per day.
        </p>
      </header>

      {/* ── What is ATF ── */}
      <section className="space-y-4">
        <HeadingAnchor id="what-is-atf">What is the Agent Transaction Firewall?</HeadingAnchor>
        <p className="text-slate-300">
          ATF is a <strong className="text-slate-100">zero-trust policy enforcement layer</strong> for
          autonomous trading bots and AI agents. Before your bot executes a swap, lending deposit,
          or perpetuals trade, ATF evaluates the intent against configurable policies and returns a
          deterministic, tamper-evident receipt.
        </p>
        <ul className="space-y-2 text-slate-300">
          <li><strong className="text-slate-100">Protect</strong> - submit an intent, get an allow/deny decision with reasons</li>
          <li><strong className="text-slate-100">Receipt</strong> - every decision produces a content-hashed receipt you can verify</li>
          <li><strong className="text-slate-100">Verify</strong> - confirm receipt integrity anytime via API or CLI</li>
          <li><strong className="text-slate-100">Fail-closed</strong> - if ATF can&apos;t evaluate, the trade is denied (never silently approved)</li>
        </ul>
        <p className="text-slate-400">
          Currently supporting <strong className="text-slate-300">Solana</strong> (Jupiter, Raydium, Orca swaps &amp; lending protocols).
          Base and Hyperliquid support is in development.
        </p>
      </section>

      {/* ── Step 1: Create Account ── */}
      <section className="space-y-4">
        <HeadingAnchor id="create-account">Step 1: Create Your Account</HeadingAnchor>
        <p className="text-slate-300">
          Sign up at{" "}
          <Link href="/signup" className="font-semibold text-primary-200 hover:text-primary-100">
            trucore.xyz/signup
          </Link>{" "}
          or use the API directly:
        </p>
        <CopyBlock label="bash" value={SIGNUP_CURL} />
        <p className="text-slate-300">
          You&apos;ll receive a JWT token, your tenant ID, and your first API key:
        </p>
        <CopyBlock label="json" value={SIGNUP_RESPONSE} />
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
          <p className="text-sm text-amber-200">
            <strong>Save your API key.</strong> The plaintext secret is shown only once.
            You can create additional keys in the{" "}
            <Link href="/portal" className="font-semibold text-primary-200 hover:text-primary-100">
              developer portal
            </Link>.
          </p>
        </div>
      </section>

      {/* ── Step 2: Verify Email ── */}
      <section className="space-y-4">
        <HeadingAnchor id="verify-email">Step 2: Verify Your Email</HeadingAnchor>
        <p className="text-slate-300">
          Check your inbox for a verification email and click the link, or confirm via API:
        </p>
        <CopyBlock
          label="bash"
          value={`curl -sS https://api.trucore.xyz/auth/verify-email/confirm \\
  -H "Content-Type: application/json" \\
  -d '{"token": "TOKEN_FROM_EMAIL"}'`}
        />
        <p className="text-slate-400">
          Verification tokens expire after 24 hours. You can request a new one from{" "}
          <code className="font-mono text-slate-300">POST /auth/verify-email/request</code> with your JWT.
        </p>
      </section>

      {/* ── Step 3: Protect ── */}
      <section className="space-y-4">
        <HeadingAnchor id="first-protect">Step 3: Run Your First Protected Trade</HeadingAnchor>
        <p className="text-slate-300">
          Submit a swap intent to the protect endpoint. ATF evaluates it against policies and returns a decision:
        </p>
        <CopyBlock label="bash" value={PROTECT_CURL} />
        <p className="text-slate-300">If the intent passes policy checks:</p>
        <CopyBlock label="json" value={PROTECT_RESPONSE} />
        <div className="flex flex-wrap items-center gap-3 text-lg font-semibold text-slate-200">
          <span className="rounded-lg border border-primary-400/30 bg-primary-500/10 px-3 py-1.5">Intent</span>
          <span className="text-slate-500">&rarr;</span>
          <span className="rounded-lg border border-primary-400/30 bg-primary-500/10 px-3 py-1.5">Policy Check</span>
          <span className="text-slate-500">&rarr;</span>
          <span className="rounded-lg border border-accent-400/30 bg-accent-500/10 px-3 py-1.5">Decision + Receipt</span>
          <span className="text-slate-500">&rarr;</span>
          <span className="rounded-lg border border-accent-400/30 bg-accent-500/10 px-3 py-1.5">Verify</span>
        </div>
      </section>

      {/* ── Step 4: Verify ── */}
      <section className="space-y-4">
        <HeadingAnchor id="verify-receipt">Step 4: Verify the Receipt</HeadingAnchor>
        <p className="text-slate-300">
          Every decision (allow or deny) produces a <code className="font-mono text-slate-200">content_hash</code>.
          Verify it to confirm the receipt hasn&apos;t been tampered with:
        </p>
        <CopyBlock label="bash" value={VERIFY_CURL} />
        <p className="text-slate-400">
          Or use the CLI: <code className="font-mono text-slate-300">atf verify &lt;receipt-id&gt;</code>
        </p>
      </section>

      {/* ── Step 5: Mock vs Real ── */}
      <section className="space-y-4">
        <HeadingAnchor id="mock-vs-real">Step 5: Understand Mock vs Real Execution</HeadingAnchor>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-white/10 p-5 space-y-2">
            <h3 className="text-lg font-bold text-accent-300">Mock Mode</h3>
            <p className="text-sm text-slate-300">
              The onboarding flow and <code className="font-mono text-slate-200">POST /onboarding/execute-sample</code> use
              mock execution by default. Policies are evaluated, receipts are generated,
              but no on-chain transaction is sent.
            </p>
            <p className="text-sm text-slate-400">
              Good for: testing integration, validating policy behavior, development.
            </p>
          </div>
          <div className="rounded-lg border border-white/10 p-5 space-y-2">
            <h3 className="text-lg font-bold text-accent-300">Real Execution</h3>
            <p className="text-sm text-slate-300">
              When you connect a wallet and use the production protect endpoint,
              ATF evaluates real intents. If approved, your bot signs and sends the
              transaction on-chain. The finalization step records the on-chain tx hash
              in the receipt.
            </p>
            <p className="text-sm text-slate-400">
              Good for: production bots, real trading, audit trails.
            </p>
          </div>
        </div>
      </section>

      {/* ── Next Steps ── */}
      <section className="space-y-4">
        <HeadingAnchor id="next-steps">Next Steps</HeadingAnchor>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/docs/first-protected-trade"
            className="group rounded-lg border border-white/10 p-5 transition-colors hover:border-white/20"
          >
            <h3 className="font-bold text-accent-300 group-hover:text-accent-200">First Protected Trade &rarr;</h3>
            <p className="mt-1 text-sm text-slate-400">HTTP, Python, TypeScript, CLI, and OpenClaw integration paths.</p>
          </Link>
          <Link
            href="/docs/surfaces"
            className="group rounded-lg border border-white/10 p-5 transition-colors hover:border-white/20"
          >
            <h3 className="font-bold text-accent-300 group-hover:text-accent-200">Integration Surfaces &rarr;</h3>
            <p className="mt-1 text-sm text-slate-400">API, CLI, and OpenClaw plugin - what&apos;s available and what&apos;s coming.</p>
          </Link>
          <Link
            href="/docs/plans"
            className="group rounded-lg border border-white/10 p-5 transition-colors hover:border-white/20"
          >
            <h3 className="font-bold text-accent-300 group-hover:text-accent-200">Plans &amp; Feature Tiers &rarr;</h3>
            <p className="mt-1 text-sm text-slate-400">Free, Pro, and Enterprise - limits, features, and how to upgrade.</p>
          </Link>
          <Link
            href="/docs/auth"
            className="group rounded-lg border border-white/10 p-5 transition-colors hover:border-white/20"
          >
            <h3 className="font-bold text-accent-300 group-hover:text-accent-200">Auth &amp; API Keys &rarr;</h3>
            <p className="mt-1 text-sm text-slate-400">Key creation, rotation, revocation, and account recovery.</p>
          </Link>
        </div>
      </section>
    </article>
  );
}
