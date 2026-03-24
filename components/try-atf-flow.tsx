"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trackEvent } from "@/lib/analytics";

// ---------------------------------------------------------------------------
// Same-origin proxy routes used for sandbox calls (avoids CORS on api.trucore.xyz)
// ---------------------------------------------------------------------------

const SANDBOX_API = "/api/sandbox";

// ---------------------------------------------------------------------------
// Internal funnel telemetry (POST to /api/events)
// ---------------------------------------------------------------------------

function sendFunnelEvent(
  event: string,
  meta?: { decision?: string },
) {
  try {
    fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event,
        page: "/try",
        ...meta,
      }),
    }).catch(() => {
      /* fire-and-forget */
    });
  } catch {
    /* never break UI */
  }
}

type PolicyResult = {
  policy: string;
  result: string;
  reason: string;
};

type SandboxReceipt = {
  receipt_id: string;
  timestamp: number;
  decision: string;
  execution_mode: string;
  content_hash: string;
  intent_summary: {
    input_mint: string | null;
    output_mint: string | null;
    amount_lamports: number | null;
    protocol: string | null;
  };
  protected_by: string;
  public_sandbox: boolean;
  mock_note: string;
};

type SampleIntentResponse = {
  intent: {
    input_mint: string;
    output_mint: string;
    amount_lamports: number;
    slippage_bps: number;
    protocol: string;
    action: string;
  };
  description: string;
  public_sandbox: boolean;
};

type ProtectResponse = {
  decision: string;
  policy_breakdown: PolicyResult[];
  receipt: SandboxReceipt;
  public_sandbox: boolean;
  execution_mode: string;
};

type Step = "idle" | "intent-loaded" | "protected";

export function TryAtfFlow() {
  const [step, setStep] = useState<Step>("idle");
  const [intent, setIntent] = useState<SampleIntentResponse | null>(null);
  const [result, setResult] = useState<ProtectResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Track page view once on mount
  useEffect(() => {
    trackEvent("try_page_viewed");
    sendFunnelEvent("try_page_viewed");
  }, []);

  async function handleSampleIntent() {
    setError(null);
    setLoading(true);
    trackEvent("try_sample_clicked");
    sendFunnelEvent("try_sample_clicked");
    try {
      const res = await fetch(`${SANDBOX_API}/sample-intent`);
      if (res.status === 429) {
        setError("Rate limit reached. Please wait a moment and try again.");
        return;
      }
      if (res.status === 502) {
        setError("The sandbox API is temporarily unavailable. Please try again in a moment.");
        return;
      }
      if (!res.ok) {
        setError(`Request failed (${res.status})`);
        return;
      }
      const data: SampleIntentResponse = await res.json();
      setIntent(data);
      setStep("intent-loaded");
      trackEvent("try_atf_sample_intent");
      sendFunnelEvent("try_sample_loaded");
    } catch {
      setError("Could not reach the sandbox. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleProtect() {
    if (!intent) return;
    setError(null);
    setLoading(true);
    trackEvent("try_protect_clicked");
    sendFunnelEvent("try_protect_clicked");
    try {
      const res = await fetch(`${SANDBOX_API}/protect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(intent.intent),
      });
      if (res.status === 429) {
        setError("Rate limit reached. Please wait a moment and try again.");
        sendFunnelEvent("try_protect_failed");
        return;
      }
      if (res.status === 502) {
        setError("The sandbox API is temporarily unavailable. Please try again in a moment.");
        sendFunnelEvent("try_protect_failed");
        return;
      }
      if (!res.ok) {
        setError(`Request failed (${res.status})`);
        sendFunnelEvent("try_protect_failed");
        return;
      }
      const data: ProtectResponse = await res.json();
      setResult(data);
      setStep("protected");
      trackEvent("try_atf_protect", { decision: data.decision });
      sendFunnelEvent("try_protect_succeeded", {
        decision: data.decision,
      });
    } catch {
      setError("Could not reach the sandbox. Please check your connection and try again.");
      sendFunnelEvent("try_protect_failed");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setStep("idle");
    setIntent(null);
    setResult(null);
    setError(null);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* ── Step 1: Generate Sample ── */}
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary-200">
          Step 1
        </p>
        <h3 className="text-xl font-bold text-accent-300">
          Generate a sample trade
        </h3>
        <Button
          onClick={handleSampleIntent}
          disabled={loading || step !== "idle"}
          className={
            step === "idle"
              ? "bg-accent-500 text-neutral-950 hover:bg-accent-400"
              : "bg-neutral-800 text-slate-400 cursor-default"
          }
        >
          {loading && step === "idle"
            ? "Loading..."
            : step === "idle"
              ? "Load Sample Trade"
              : "Sample loaded ✓"}
        </Button>

        {intent && (
          <Card className="mt-3">
            <p className="mb-2 text-sm font-semibold text-slate-100">
              Sample Intent
            </p>
            <p className="text-sm text-slate-300">{intent.description}</p>
            <pre className="mt-2 max-h-48 overflow-auto rounded bg-neutral-900/60 p-3 text-xs text-slate-200">
              {JSON.stringify(intent.intent, null, 2)}
            </pre>
          </Card>
        )}
      </div>

      {/* ── Step 2: Simulate Protection ── */}
      {step !== "idle" && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-200">
            Step 2
          </p>
          <h3 className="text-xl font-bold text-accent-300">
            Protect this trade
          </h3>
          <Button
            onClick={handleProtect}
            disabled={loading || step === "protected"}
            className={
              step === "intent-loaded"
                ? "bg-accent-500 text-neutral-950 hover:bg-accent-400"
                : "bg-neutral-800 text-slate-400 cursor-default"
            }
          >
            {loading && step === "intent-loaded"
              ? "Evaluating..."
              : step === "protected"
                ? "Protection complete \u2713"
                : "Run Protection"}
          </Button>
        </div>
      )}

      {/* ── Step 3: Results ── */}
      {result && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-200">
            Step 3
          </p>
          <h3 className="text-xl font-bold text-accent-300">
            Receipt &amp; policy breakdown
          </h3>

          {/* Decision */}
          <Card>
            <div className="flex items-center gap-3">
              <span
                className={`inline-block rounded-full px-3 py-1 text-sm font-bold ${
                  result.decision === "ALLOW"
                    ? "bg-green-900/50 text-green-300"
                    : "bg-red-900/50 text-red-300"
                }`}
              >
                {result.decision}
              </span>
              <span className="text-sm text-slate-400">
                Execution mode: {result.execution_mode}
              </span>
            </div>
          </Card>

          {/* Policy Breakdown */}
          <Card>
            <p className="mb-3 text-sm font-semibold text-slate-100">
              Policy Breakdown
            </p>
            <div className="space-y-2">
              {result.policy_breakdown.map((p) => (
                <div
                  key={p.policy}
                  className="flex items-start gap-3 text-sm"
                >
                  <span
                    className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-xs font-bold ${
                      p.result === "PASS"
                        ? "bg-green-900/40 text-green-300"
                        : "bg-red-900/40 text-red-300"
                    }`}
                  >
                    {p.result}
                  </span>
                  <div>
                    <span className="font-medium text-slate-200">
                      {p.policy}
                    </span>
                    <p className="text-slate-400">{p.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Receipt */}
          <Card>
            <p className="mb-2 text-sm font-semibold text-slate-100">
              Receipt
            </p>
            <pre className="max-h-64 overflow-auto rounded bg-neutral-900/60 p-3 text-xs text-slate-200">
              {JSON.stringify(result.receipt, null, 2)}
            </pre>
          </Card>

          {/* CTA */}
          <div className="rounded-xl border border-accent-500/30 bg-accent-500/5 p-6">
            <p className="text-lg font-semibold text-accent-300">
              Your first receipt is ready.
            </p>
            <p className="mt-2 text-sm text-slate-300">
              This was a sandbox trade. Create an account to protect real trades,
              store receipts, and get your API key.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <Link
                href="/signup"
                onClick={() => {
                  trackEvent("try_signup_cta_clicked");
                  sendFunnelEvent("try_signup_cta_clicked");
                }}
                className="inline-flex items-center justify-center rounded-xl bg-accent-500 px-8 py-3 text-base font-semibold text-neutral-950 transition-colors hover:bg-accent-400"
              >
                Create Free Account
              </Link>
              <Link
                href="/docs/getting-started"
                onClick={() => {
                  trackEvent("try_docs_cta_clicked");
                  sendFunnelEvent("try_docs_cta_clicked");
                }}
                className="inline-flex items-center text-sm font-semibold text-primary-200 transition-colors hover:text-primary-100"
              >
                Read how it works &rarr;
              </Link>
            </div>
          </div>

          {/* Reset */}
          <div className="text-center">
            <button
              type="button"
              onClick={handleReset}
              className="text-sm text-slate-400 transition-colors hover:text-slate-200"
            >
              Start over
            </button>
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <Card className="border-red-500/30 bg-red-950/20">
          <p className="text-sm font-medium text-red-300">{error}</p>
        </Card>
      )}
    </div>
  );
}
