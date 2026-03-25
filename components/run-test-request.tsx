"use client";

import { useState } from "react";
import { FALLBACK_RESULT, type ProtectResult } from "@/lib/verify-demo-data";

const SAMPLE_INTENT = {
  input_mint: "So11111111111111111111111111111111111111112",
  output_mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  amount_lamports: 1000000,
  protocol: "jupiter",
  max_slippage_bps: 50,
};

const ATF_ENDPOINT = "https://api.trucore.xyz/sandbox/protect";

function buildCurlSnippet(key?: string | null): string {
  const keyValue = key || "YOUR_API_KEY";
  const body = JSON.stringify(SAMPLE_INTENT, null, 2);
  return [
    `curl -X POST ${ATF_ENDPOINT} \\`,
    `  -H "Content-Type: application/json" \\`,
    `  -H "x-api-key: ${keyValue}" \\`,
    `  -d '${body}'`,
  ].join("\n");
}

type Status = "idle" | "loading" | "success" | "error";

export default function RunTestRequest({ apiKey }: { apiKey?: string | null }) {
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<ProtectResult | null>(null);
  const [isFallback, setIsFallback] = useState(false);
  const [snippetCopied, setSnippetCopied] = useState(false);

  async function handleCopySnippet() {
    try {
      await navigator.clipboard.writeText(buildCurlSnippet(apiKey));
      setSnippetCopied(true);
      setTimeout(() => setSnippetCopied(false), 2000);
    } catch {
      /* clipboard errors are non-blocking */
    }
  }

  async function handleRun() {
    setStatus("loading");
    setResult(null);
    setIsFallback(false);

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (apiKey) {
        headers["X-API-Key"] = apiKey;
      }

      const res = await fetch("/api/sandbox/protect", {
        method: "POST",
        headers,
        body: JSON.stringify(SAMPLE_INTENT),
      });

      if (!res.ok) throw new Error(`Request failed (${res.status})`);

      const data: ProtectResult = await res.json();
      setResult(data);
      setIsFallback(false);
      setStatus("success");
    } catch {
      setResult(FALLBACK_RESULT);
      setIsFallback(true);
      setStatus("error");
    }
  }

  const decision = result?.decision?.toUpperCase();
  const isAllow = decision === "ALLOW";
  const breakdown = Array.isArray(result?.policy_breakdown)
    ? (result.policy_breakdown as Array<{
        policy: string;
        result: string;
        reason: string;
      }>)
    : [];

  return (
    <section className="rounded-xl border border-primary-400/20 bg-primary-500/5 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-medium text-slate-300">
            Quick Test
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Run a sample SOL → USDC protect request against the ATF sandbox.
          </p>
        </div>
        <button
          onClick={handleRun}
          disabled={status === "loading"}
          className="shrink-0 rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-primary-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === "loading" ? "Running test request\u2026" : "Run Test Request"}
        </button>
      </div>

      {/* Result display */}
      {result && (
        <div className="rounded-lg border border-white/10 bg-neutral-900 p-4 space-y-3">
          {/* Fallback notice */}
          {isFallback && (
            <p className="text-[10px] text-amber-400">
              Sandbox unavailable — showing a verified example response.
            </p>
          )}

          {/* Decision + receipt_hash */}
          <div className="flex items-center justify-between">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                isAllow
                  ? "bg-emerald-500/20 text-emerald-300"
                  : "bg-red-500/20 text-red-300"
              }`}
            >
              {decision}
            </span>
            {result.receipt_hash && (
              <span className="text-[10px] text-slate-500 font-mono truncate max-w-[220px]">
                {result.receipt_hash}
              </span>
            )}
          </div>

          {/* Policy breakdown */}
          {breakdown.length > 0 && (
            <div className="space-y-1">
              {breakdown.map((p) => (
                <div
                  key={p.policy}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-slate-300 font-mono">{p.policy}</span>
                  <span
                    className={
                      p.result === "PASS"
                        ? "text-emerald-400"
                        : "text-red-400"
                    }
                  >
                    {p.result}
                  </span>
                </div>
              ))}
            </div>
          )}

          <p className="text-[10px] text-slate-500 italic">
            Protected by ATF &middot; Sandbox evaluation
          </p>
        </div>
      )}

      {/* Integration snippet — shown only after a real success */}
      {status === "success" && result && !isFallback && (
        <div className="rounded-lg border border-white/10 bg-neutral-950/70 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-300">
              Use this request in your integration
            </h3>
            <button
              onClick={handleCopySnippet}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[11px] font-semibold text-slate-400 transition-all hover:border-primary-300/30 hover:bg-primary-500/10 hover:text-primary-200"
            >
              {snippetCopied ? "✓ Copied" : "Copy curl"}
            </button>
          </div>

          <pre className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950 px-3 py-2 font-mono text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
            {buildCurlSnippet(apiKey)}
          </pre>

          {!apiKey && (
            <p className="text-[10px] text-slate-500">
              Replace <span className="font-mono text-amber-400">YOUR_API_KEY</span> with the key issued to your account.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
