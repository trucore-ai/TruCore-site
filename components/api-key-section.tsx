"use client";

import { useEffect, useState } from "react";
import { trackEvent } from "@/lib/track";

const DEMO_API_KEY = "demo_test_key";

const CURL_EXAMPLE = `curl -X POST https://api.trucore.xyz/v1/intents/approve \\
  -H "Authorization: Bearer demo_test_key" \\
  -H "Content-Type: application/json" \\
  -d '{ "sample": "intent" }'`;

export function ApiKeySection() {
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedRequest, setCopiedRequest] = useState(false);

  useEffect(() => {
    trackEvent("view_api_key_section");
  }, []);

  function handleCopyKey() {
    navigator.clipboard.writeText(DEMO_API_KEY).then(() => {
      setCopiedKey(true);
      trackEvent("copy_api_key");
      setTimeout(() => setCopiedKey(false), 2000);
    });
  }

  function handleCopyRequest() {
    navigator.clipboard.writeText(CURL_EXAMPLE).then(() => {
      setCopiedRequest(true);
      trackEvent("copy_request");
      setTimeout(() => setCopiedRequest(false), 2000);
    });
  }

  return (
    <section
      id="api-key"
      className="rounded-2xl border border-primary-300/20 bg-primary-500/[0.04] px-6 py-10 sm:px-10"
    >
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary-200">
        Developer Access
      </p>
      <h2 className="mt-3 text-3xl font-bold tracking-tight text-accent-200 sm:text-4xl">
        Use ATF with Your Own Requests
      </h2>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-300">
        To run real protected transactions, you use an API key. Start with a
        test key and send your first request in minutes.
      </p>

      {/* API Key block */}
      <div className="mt-8">
        <div className="flex items-center gap-2 mb-2">
          <p className="text-sm font-semibold text-slate-200">
            Test API Key
          </p>
          <span className="inline-flex items-center rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-xs font-medium text-amber-300">
            limited
          </span>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <code className="flex-1 rounded-lg border border-white/[0.08] bg-neutral-950/70 px-4 py-3 font-mono text-sm text-primary-200">
            ATF_API_KEY=demo_test_key
          </code>
          <button
            type="button"
            onClick={handleCopyKey}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-primary-300/20 bg-primary-500/10 px-4 py-3 text-sm font-medium text-primary-200 transition-colors hover:bg-primary-500/20 sm:w-auto"
          >
            {copiedKey ? "Copied" : "Copy API Key"}
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Test key is rate-limited and for development use only.
        </p>
      </div>

      {/* curl example */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <p className="text-sm font-semibold text-slate-200">
            First Real Request
          </p>
          <button
            type="button"
            onClick={handleCopyRequest}
            className="inline-flex items-center gap-1.5 rounded-md border border-primary-300/20 bg-primary-500/10 px-3 py-1.5 text-xs font-medium text-primary-200 transition-colors hover:bg-primary-500/20"
          >
            {copiedRequest ? "Copied" : "Copy Request"}
          </button>
        </div>
        <pre className="overflow-x-auto rounded-lg border border-white/[0.08] bg-neutral-950/70 px-4 py-4 font-mono text-xs leading-relaxed text-slate-300 whitespace-pre-wrap">
          {CURL_EXAMPLE}
        </pre>
      </div>

      {/* What you get back */}
      <div className="mt-8">
        <p className="text-sm font-semibold text-slate-200">
          What You Receive
        </p>
        <ul className="mt-3 space-y-2">
          <li className="flex items-start gap-2 text-sm text-slate-300">
            <span className="mt-1.5 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-300" />
            <span>
              <span className="font-medium text-slate-200">decision</span> -
              allow or deny
            </span>
          </li>
          <li className="flex items-start gap-2 text-sm text-slate-300">
            <span className="mt-1.5 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-300" />
            <span>
              <span className="font-medium text-slate-200">
                policy breakdown
              </span>{" "}
              - which rules matched and why
            </span>
          </li>
          <li className="flex items-start gap-2 text-sm text-slate-300">
            <span className="mt-1.5 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-300" />
            <span>
              <span className="font-medium text-slate-200">receipt</span> -
              verification hash proving what happened
            </span>
          </li>
        </ul>
      </div>
    </section>
  );
}
