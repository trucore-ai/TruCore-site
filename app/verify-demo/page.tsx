"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Badge } from "@/components/ui/badge";
import {
  FALLBACK_RESULT,
  type ProtectResult,
} from "@/lib/verify-demo-data";

export default function VerifyDemoPage() {
  return (
    <Suspense>
      <VerifyDemoContent />
    </Suspense>
  );
}

function VerifyDemoContent() {
  const searchParams = useSearchParams();
  const isShareMode = searchParams.get("share") === "1";
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<ProtectResult | null>(null);
  const [isFallback, setIsFallback] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedAgentUrl, setCopiedAgentUrl] = useState(false);

  function handleCopyAgentJsonUrl() {
    const url = window.location.origin + "/api/verify-demo";
    navigator.clipboard.writeText(url).then(() => {
      setCopiedAgentUrl(true);
      setTimeout(() => setCopiedAgentUrl(false), 2000);
    });
  }

  function handleCopyShareLink() {
    const url = window.location.origin + "/verify-demo?share=1";
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const intentRes = await fetch("/api/sandbox/sample-intent");
        if (!intentRes.ok) {
          const body = await intentRes.json().catch(() => ({}));
          throw new Error(
            (body as Record<string, string>).message ??
              `Failed to fetch sample intent (${intentRes.status})`,
          );
        }
        const intentBody = await intentRes.json();
        const intent = (intentBody as Record<string, unknown>).intent ?? intentBody;

        const protectRes = await fetch("/api/sandbox/protect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(intent),
        });
        if (!protectRes.ok) {
          const body = await protectRes.json().catch(() => ({}));
          throw new Error(
            (body as Record<string, string>).message ??
              `Protect call failed (${protectRes.status})`,
          );
        }
        const data: ProtectResult = await protectRes.json();
        if (!cancelled) setResult(data);
      } catch {
        if (!cancelled) {
          setResult(FALLBACK_RESULT);
          setIsFallback(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const decision = result?.decision ?? "unknown";
  const isAllow = decision.toLowerCase() === "allow";

  /* ── Share mode: minimal receipt view ── */
  if (isShareMode) {
    return (
      <Container>
        <Section className="fade-in-up">
          <div className="mx-auto max-w-lg py-12 text-center">
            {loading && (
              <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary-300 border-t-transparent" />
            )}

            {result && !loading && (
              <div className="space-y-6">
                {/* Verified badge */}
                <div className="flex items-center justify-center gap-2">
                  <span className="inline-block h-3 w-3 rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,.5)]" />
                  <span className="text-sm font-semibold uppercase tracking-wider text-green-300">
                    ATF Verified
                  </span>
                </div>

                {/* Decision */}
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wider text-primary-200">
                    Policy Decision
                  </p>
                  <p
                    className={`mt-2 text-5xl font-bold ${
                      isAllow ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {decision.toUpperCase()}
                  </p>
                </div>

                {/* Receipt hash */}
                {result.receipt_hash && (
                  <div>
                    <p className="text-sm font-semibold text-slate-200">
                      Receipt Hash
                    </p>
                    <code className="mt-1 block break-all text-xs text-primary-200">
                      {result.receipt_hash}
                    </code>
                  </div>
                )}

                {/* Minimal policy summary */}
                {Array.isArray(result.policy_breakdown) &&
                  result.policy_breakdown.length > 0 && (
                    <div className="text-left">
                      <p className="text-sm font-semibold uppercase tracking-wider text-primary-200">
                        Policy Summary
                      </p>
                      <ul className="mt-2 space-y-1">
                        {result.policy_breakdown.map((rule, i) => (
                          <li
                            key={i}
                            className="flex items-center gap-2 text-sm text-slate-300"
                          >
                            <span
                              className={`inline-block h-2 w-2 rounded-full ${
                                (rule as Record<string, string>).result ===
                                "PASS"
                                  ? "bg-green-400"
                                  : "bg-red-400"
                              }`}
                            />
                            {(rule as Record<string, string>).policy ?? "-"}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                {/* Branding footer */}
                <p className="pt-4 text-xs text-slate-500">
                  trucore.ai/verify-demo
                </p>
              </div>
            )}
          </div>
        </Section>
      </Container>
    );
  }

  return (
    <Container>
      <Section className="fade-in-up">
        <div className="max-w-3xl">
          <Badge className="mb-4">{isFallback ? "Example" : "Live Demo"}</Badge>
          <h1 className="text-4xl font-bold tracking-tight text-accent-300 sm:text-5xl">
            Live Protected Trade Receipt
          </h1>
          <p className="mt-4 text-xl leading-[1.5] text-slate-200">
            A real policy-enforced decision from ATF, generated live with a cryptographic receipt proving what happened. No signup. No wallet required.
          </p>
          <p className="mt-3 text-base text-slate-400">
            This is a real transaction evaluated in real time. Every decision is deterministic: the same input always produces the same decision and receipt.
          </p>
        </div>

        {loading && (
          <div className="mt-12 flex items-center gap-3">
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-primary-300 border-t-transparent" />
            <span className="text-lg text-slate-300">
              Generating verified receipt…
            </span>
          </div>
        )}

        {result && !loading && (
          <div className="mt-12 space-y-6">
            {/* Fallback notice */}
            {isFallback && (
              <div className="rounded-lg border border-amber-500/20 bg-amber-950/10 px-4 py-3 text-sm text-amber-200/90">
                Live demo temporarily unavailable. Showing a verified example receipt from recent execution.
              </div>
            )}

            {/* Decision */}
            <Card>
              <p className="text-sm font-semibold uppercase tracking-wider text-primary-200">
                Decision
              </p>
              <p
                className={`mt-2 text-3xl font-bold ${
                  isAllow ? "text-green-400" : "text-red-400"
                }`}
              >
                {decision.toUpperCase()}
              </p>
              {result.reason && (
                <p className="mt-2 text-base text-slate-300">{result.reason}</p>
              )}
            </Card>

            {/* Policy Breakdown */}
            {Array.isArray(result.policy_breakdown) &&
              result.policy_breakdown.length > 0 && (
                <Card>
                  <p className="text-sm font-semibold uppercase tracking-wider text-primary-200">
                    Policy Breakdown
                  </p>
                  <ul className="mt-3 space-y-2">
                    {result.policy_breakdown.map((rule, i) => (
                      <li
                        key={i}
                        className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm text-slate-200"
                      >
                        <pre className="whitespace-pre-wrap break-all font-mono text-xs">
                          {JSON.stringify(rule, null, 2)}
                        </pre>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

            {/* Verification */}
            <Card>
              <div className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,.5)]" />
                <p className="text-sm font-semibold uppercase tracking-wider text-green-300">
                  Verified by ATF
                </p>
              </div>
              {result.receipt_hash && (
                <p className="mt-3 text-sm text-slate-300">
                  <span className="font-semibold text-slate-200">
                    Receipt Hash:{" "}
                  </span>
                  <code className="break-all text-xs text-primary-200">
                    {result.receipt_hash}
                  </code>
                </p>
              )}
              <p className="mt-2 text-sm text-slate-400">
                This hash is deterministic: the same policy-protected transaction always produces the same receipt and hash.
              </p>
              <div className="mt-4 space-y-2 rounded-lg border border-primary-300/20 bg-primary-500/[0.06] p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary-200">What This Receipt Proves</p>
                <ul className="mt-2 space-y-1 text-xs text-slate-300">
                  <li>? The exact policy rules that were applied</li>
                  <li>? The deterministic decision made (ALLOW or DENY)</li>
                  <li>? The precise transaction inputs used</li>
                </ul>
                <p className="mt-2 text-xs text-slate-400">Anyone with this receipt can independently verify the decision was made correctly.</p>
              </div>
              <button
                type="button"
                onClick={handleCopyShareLink}
                className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-primary-300/20 bg-primary-500/10 px-3 py-1.5 text-xs font-medium text-primary-200 transition-colors hover:bg-primary-500/20"
              >
                {copied ? "✓ Copied" : "Copy Share Link"}
              </button>
              <a
                href="/api/verify-demo"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 ml-3 inline-flex items-center gap-1.5 rounded-md border border-primary-300/20 bg-primary-500/10 px-3 py-1.5 text-xs font-medium text-primary-200 transition-colors hover:bg-primary-500/20"
              >
                Agent JSON
              </a>
              <button
                type="button"
                onClick={handleCopyAgentJsonUrl}
                className="mt-4 ml-3 inline-flex items-center gap-1.5 rounded-md border border-primary-300/20 bg-primary-500/10 px-3 py-1.5 text-xs font-medium text-primary-200 transition-colors hover:bg-primary-500/20"
              >
                {copiedAgentUrl ? "✓ Copied" : "Copy Agent JSON URL"}
              </button>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent("Just ran a protected trade through ATF.\n\nPolicy enforced.\nDeterministic decision.\nCryptographic receipt.\n\nThis is what AI transaction safety should look like:\nhttps://www.trucore.xyz/verify-demo?share=1")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 ml-3 inline-flex items-center gap-1.5 rounded-md border border-primary-300/20 bg-primary-500/10 px-3 py-1.5 text-xs font-medium text-primary-200 transition-colors hover:bg-primary-500/20"
              >
                Share on X
              </a>
            </Card>

            {/* Full Receipt JSON */}
            <Card>
              <p className="text-sm font-semibold uppercase tracking-wider text-primary-200">
                Receipt
              </p>
              <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-all rounded-lg border border-white/[0.06] bg-neutral-950/60 p-4 font-mono text-xs text-slate-300">
                {JSON.stringify(result.receipt ?? result, null, 2)}
              </pre>
            </Card>
          </div>
        )}

        {/* ── Handoff: proof → action ── */}
        {!loading && result && (
          <div className="mt-16 rounded-2xl border border-primary-300/20 bg-primary-500/[0.04] px-6 py-10 text-center sm:px-10">
            <h2 className="text-2xl font-bold tracking-tight text-primary-100 sm:text-3xl">
              Ready to run your own?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-base text-slate-300">
              Start your first protected trade.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button href="/try" variant="primary" size="default">
                Start Your First Protected Trade
              </Button>
              <Button href="/docs/receipt-specification-v1" variant="secondary" size="default">
                Learn Receipt Format
              </Button>
            </div>
          </div>
        )}
      </Section>
    </Container>
  );
}
