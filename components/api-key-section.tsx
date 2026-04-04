"use client";

import { useEffect, useState } from "react";
import { trackEvent } from "@/lib/track";
import { createApiKey } from "@/lib/api";

const DEMO_API_KEY = "demo_test_key";

type KeyState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "real"; key: string }
  | { status: "demo" };

function buildCurlExample(key: string): string {
  return `curl -X POST https://api.trucore.xyz/v1/intents/approve \\
  -H "Authorization: Bearer ${key}" \\
  -H "Content-Type: application/json" \\
  -d '{ "sample": "intent" }'`;
}

export function ApiKeySection() {
  const [keyState, setKeyState] = useState<KeyState>({ status: "idle" });
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedRequest, setCopiedRequest] = useState(false);

  useEffect(() => {
    trackEvent("view_api_key_section");
  }, []);

  async function handleGetKey() {
    setKeyState({ status: "loading" });
    try {
      const data = await createApiKey();
      setKeyState({ status: "real", key: data.api_key });
      trackEvent("api_key_created", { source: "try_page", real: true });
    } catch {
      // Graceful fallback: show demo key with clear labelling.
      setKeyState({ status: "demo" });
      trackEvent("api_key_created", { source: "try_page", real: false });
    }
  }

  const displayKey =
    keyState.status === "real"
      ? keyState.key
      : keyState.status === "demo"
        ? DEMO_API_KEY
        : null;

  const curlExample = buildCurlExample(
    keyState.status === "real" ? keyState.key : DEMO_API_KEY,
  );

  function handleCopyKey() {
    if (!displayKey) return;
    navigator.clipboard.writeText(displayKey).then(() => {
      setCopiedKey(true);
      trackEvent("copy_api_key");
      setTimeout(() => setCopiedKey(false), 2000);
    });
  }

  function handleCopyRequest() {
    navigator.clipboard.writeText(curlExample).then(() => {
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
        To run real protected transactions, you use an API key. Generate a real
        key and send your first request in minutes.
      </p>

      {/* API Key block */}
      <div className="mt-8">
        {keyState.status === "idle" && (
          <button
            type="button"
            onClick={handleGetKey}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-primary-300/40 bg-primary-500/20 px-5 py-3 text-sm font-semibold text-primary-100 transition-colors hover:bg-primary-500/30"
          >
            Get Free API Key
          </button>
        )}

        {keyState.status === "loading" && (
          <button
            type="button"
            disabled
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-primary-300/20 bg-primary-500/10 px-5 py-3 text-sm font-medium text-primary-300 opacity-70 cursor-not-allowed"
          >
            Generating…
          </button>
        )}

        {(keyState.status === "real" || keyState.status === "demo") && (
          <>
            <div className="flex items-center gap-2 mb-2">
              <p className="text-sm font-semibold text-slate-200">
                {keyState.status === "real" ? "Your API Key" : "Test API Key"}
              </p>
              {keyState.status === "real" ? (
                <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-300">
                  active
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-xs font-medium text-amber-300">
                  demo
                </span>
              )}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <code
                role="button"
                tabIndex={0}
                onClick={handleCopyKey}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleCopyKey(); } }}
                className="flex-1 rounded-lg border border-white/[0.08] bg-neutral-950/70 px-4 py-3 font-mono text-sm text-primary-200 break-all cursor-pointer transition-colors hover:border-primary-300/30 hover:bg-primary-500/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
                title="Click to copy"
              >
                {displayKey}
              </code>
              <button
                type="button"
                onClick={handleCopyKey}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-primary-300/20 bg-primary-500/10 px-4 py-3 text-sm font-medium text-primary-200 transition-colors hover:bg-primary-500/20 sm:w-auto"
              >
                {copiedKey ? (
                  <>
                    <svg className="h-4 w-4 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    Copied
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                    Copy Key
                  </>
                )}
              </button>
            </div>
            {keyState.status === "real" ? (
              <p className="mt-2 text-xs text-emerald-400">
                This is a real API key. Keep it secure. It is already active
                and ready to use.
              </p>
            ) : (
              <p className="mt-2 text-xs text-amber-400">
                Backend unavailable — showing demo key. Try again later for a
                real key.
              </p>
            )}
          </>
        )}
      </div>

      {/* curl example — always visible once a key is shown */}
      {(keyState.status === "real" || keyState.status === "demo") && (
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
            {curlExample}
          </pre>
        </div>
      )}

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
