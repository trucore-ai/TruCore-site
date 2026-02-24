"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { trackEvent } from "@/lib/analytics";
import { HeadingAnchor } from "@/components/heading-anchor";

const CURL_EXAMPLE = `curl -X POST https://trucore.xyz/api/simulate \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{
    "action": "swap",
    "token_in": "SOL",
    "token_out": "USDC",
    "amount": 10,
    "max_slippage_bps": 100,
    "ttl_seconds": 60
  }'`;

export default function DocsFiveMinuteQuickstartPage() {
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (!isCopied) {
      return;
    }

    const timer = window.setTimeout(() => setIsCopied(false), 1600);
    return () => window.clearTimeout(timer);
  }, [isCopied]);

  async function handleCopyCurl() {
    try {
      await navigator.clipboard.writeText(CURL_EXAMPLE);
      setIsCopied(true);
      trackEvent("quickstart_copy_curl_click", { location: "docs_5_minute_quickstart" });
    } catch {
      setIsCopied(false);
    }
  }

  return (
    <article className="space-y-10">
      <header className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Quickstart</p>
        <h1 className="text-4xl font-bold tracking-tight text-slate-100 sm:text-5xl">
          5-Minute Developer Quickstart
        </h1>
        <p className="max-w-3xl text-lg leading-relaxed text-slate-300">
          Start with a key, run one request, and verify deterministic policy output in minutes.
        </p>
      </header>

      <section className="space-y-4">
        <HeadingAnchor id="get-an-api-key">1. Get an API Key</HeadingAnchor>
        <p className="text-slate-300">Request a partner key from TruCore for higher quota and partner onboarding.</p>
        <p className="text-slate-300">
          You can also use the public tier without a key at 30 requests per minute.
        </p>
      </section>

      <section className="space-y-4">
        <HeadingAnchor id="make-a-request">2. Make a Request</HeadingAnchor>
        <div className="rounded-xl border border-white/10 bg-neutral-950/70 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold uppercase tracking-[0.1em] text-slate-400">curl</p>
            <button
              type="button"
              onClick={handleCopyCurl}
              className="inline-flex items-center justify-center rounded-lg border border-primary-300/40 bg-primary-500/15 px-3 py-2 text-xs font-semibold text-primary-100 transition-colors hover:bg-primary-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
            >
              {isCopied ? "Copied" : "Copy"}
            </button>
          </div>
          <pre className="overflow-x-auto font-mono text-sm leading-relaxed text-slate-200">
            <code>{CURL_EXAMPLE}</code>
          </pre>
        </div>
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
        <HeadingAnchor id="understand-result">3. Understand the Result</HeadingAnchor>
        <ul className="space-y-2 text-slate-300">
          <li>
            <code className="font-mono text-slate-200">status</code> tells you if the request was allowed or denied.
          </li>
          <li>
            <code className="font-mono text-slate-200">invariant_checks</code> shows each deterministic check outcome.
          </li>
          <li>
            <code className="font-mono text-slate-200">receipt_hash</code> is the tamper-evident digest for the decision.
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <HeadingAnchor id="why-this-matters">4. Why This Matters</HeadingAnchor>
        <p className="text-slate-300">
          ATF enforces policy before execution and generates deterministic receipts for auditability.
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
