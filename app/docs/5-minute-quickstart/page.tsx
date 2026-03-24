"use client";

import Link from "next/link";
import { CopyBlock } from "@/components/copy-block";
import { trackEvent } from "@/lib/analytics";
import { HeadingAnchor } from "@/components/heading-anchor";
import { SingleCommandQuickstart } from "@/components/single-command-quickstart";
import { SafeToTryBanner } from "@/components/safe-to-try-banner";

const CURL_EXAMPLE = `BASE_URL="${"${BASE_URL:-http://127.0.0.1:3000}"}"
curl -sS "$BASE_URL/api/simulate" \\
  -H "Content-Type: application/json" \\
  -d '{
    "action": "swap",
    "token_in": "SOL",
    "token_out": "USDC",
    "amount": 10,
    "max_slippage_bps": 100,
    "ttl_seconds": 60
  }'`;

export default function DocsFiveMinuteQuickstartPage() {
  return (
    <article className="space-y-10">
      <header className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Quickstart</p>
        <h1 className="text-4xl font-bold tracking-tight text-accent-200 sm:text-5xl">
          5-Minute Developer Quickstart
        </h1>
        <p className="max-w-3xl text-lg leading-relaxed text-slate-300">
          Run one command to see a deterministic decision and receipt.
        </p>
        <SafeToTryBanner />
      </header>

      <SingleCommandQuickstart location="quickstart" showV1StabilityContract />

      <section className="space-y-4">
        <HeadingAnchor id="get-an-api-key">1. Get an API Key</HeadingAnchor>
        <p className="text-slate-300">Request a partner key from TruCore for higher quota and partner onboarding.</p>
        <p className="text-slate-300">
          You can also use the public tier without a key at 30 requests per minute.
        </p>
        <p className="text-slate-300">
          Already have a key?{" "}
          <Link
            href="/portal"
            className="font-semibold text-primary-100 transition-colors hover:text-primary-200"
          >
            Open your portal
          </Link>{" "}
          to see your keys and usage, or skip to{" "}
          <Link
            href="/docs/first-protected-trade"
            className="font-semibold text-primary-100 transition-colors hover:text-primary-200"
          >
            First Protected Trade
          </Link>
          .
        </p>
      </section>

      <section className="space-y-4">
        <HeadingAnchor id="make-a-request">2. Make a Request</HeadingAnchor>
        <CopyBlock
          label="curl"
          value={CURL_EXAMPLE}
          copyButtonLabel="Copy command"
          helperText="Runs locally by default. Set BASE_URL=https://trucore.xyz to run against production."
          onCopy={() => trackEvent("quickstart_copy_curl_click", { location: "docs_5_minute_quickstart" })}
        />
        <p className="text-slate-300">Rate-limit headers returned by the API:</p>
        <ul className="space-y-2 text-slate-300">
          <li>
            <code className="font-mono text-slate-200">X-RateLimit-Limit</code>
          </li>
          <li>
            <code className="font-mono text-slate-200">X-RateLimit-Remaining</code>
          </li>
          <li>
            <code className="font-mono text-slate-200">X-RateLimit-Reset</code>
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <HeadingAnchor id="what-you-should-see">3. What You Should See</HeadingAnchor>
        <ul className="space-y-2 text-slate-300">
          <li>
            <code className="font-mono text-slate-200">status</code> returns allowed or denied.
          </li>
          <li>
            <code className="font-mono text-slate-200">receipt_hash</code> gives a deterministic digest for the decision.
          </li>
          <li>
            <code className="font-mono text-slate-200">invariant_checks</code> lists each invariant check outcome.
          </li>
        </ul>
        <p className="text-slate-300">
          For field-level contract details, see{" "}
          <Link
            href="/docs/permit-schema-v1"
            className="font-semibold text-primary-100 transition-colors hover:text-primary-200"
          >
            Permit Schema v1
          </Link>
          {" "}and compare against the{" "}
          <Link
            href="/demo-policy"
            className="font-semibold text-primary-100 transition-colors hover:text-primary-200"
          >
            Demo Policy
          </Link>
          .
        </p>
      </section>

      <section className="space-y-4">
        <HeadingAnchor id="why-this-matters">4. Why This Matters</HeadingAnchor>
        <p className="text-slate-300">
          ATF enforces policy before execution and generates deterministic receipts for auditability.
        </p>
        <p className="text-slate-300">
          <strong className="text-slate-100">Ready to protect a real bot intent?</strong>{" "}
          Follow the{" "}
          <Link
            href="/docs/first-protected-trade"
            className="font-semibold text-primary-100 transition-colors hover:text-primary-200"
          >
            First Protected Trade
          </Link>
          {" "}guide for the full protect → receipt → verify flow with HTTP, Python, TypeScript, CLI, or OpenClaw.
        </p>
        <p className="text-slate-300">
          Continue with{" "}
          <Link
            href="/docs/atf-architecture"
            className="font-semibold text-primary-100 transition-colors hover:text-primary-200"
          >
            ATF Architecture &amp; Enforcement Model
          </Link>
          {" "}for threat model and invariant details.
        </p>
        <p className="text-slate-300">
          Category definition: {" "}
          <Link
            href="/agent-transaction-firewall"
            className="font-semibold text-primary-100 transition-colors hover:text-primary-200"
          >
            Agent Transaction Firewall
          </Link>
          .
        </p>
      </section>
    </article>
  );
}
