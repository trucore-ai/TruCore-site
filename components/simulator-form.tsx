"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";
import type { SimRequest, SimResult } from "@/lib/simulator";
import { SimulatorResult } from "@/components/simulator-result";

const DEFAULT_REQUEST: SimRequest = {
  action: "swap",
  token_in: "SOL",
  token_out: "USDC",
  amount: 10,
  max_slippage_bps: 100,
  ttl_seconds: 60,
};

const EXAMPLE_ALLOWED_RESPONSE = {
  ok: true,
  input: DEFAULT_REQUEST,
  result: {
    status: "allowed",
    reason: "Request satisfies demo policy limits.",
    invariant_checks: [
      "amount <= 1000: pass",
      "max_slippage_bps <= 300: pass",
      "ttl_seconds <= 300: pass",
    ],
    receipt_hash: "9d9e34f2df6dd5ecf0988cb3af0ea4ab60431b64d7d5e3b35d0972ce4e4c986f",
  },
};

const EXAMPLE_DENIED_RESPONSE = {
  ok: true,
  input: {
    ...DEFAULT_REQUEST,
    amount: 5000,
  },
  result: {
    status: "denied",
    reason: "Amount exceeds max demo limit (1000).",
    invariant_checks: [
      "amount <= 1000: fail",
      "max_slippage_bps <= 300: pass",
      "ttl_seconds <= 300: pass",
    ],
    receipt_hash: "6a35d7ccf355c0c914c0211d57ade2b0f7c69fd6cfce147f31e2f44f62e558f3",
  },
};

const SCENARIOS: Record<string, { label: string; request: SimRequest }> = {
  "valid-swap": {
    label: "Valid swap",
    request: DEFAULT_REQUEST,
  },
  "exceeds-amount": {
    label: "Exceeds amount",
    request: {
      ...DEFAULT_REQUEST,
      amount: 5000,
    },
  },
  "high-slippage": {
    label: "High slippage",
    request: {
      ...DEFAULT_REQUEST,
      max_slippage_bps: 500,
    },
  },
};

type SimulateApiResponse = {
  ok: boolean;
  error?: string;
  result?: SimResult;
};

type RateLimitMetadata = {
  limit: string;
  remaining: string;
  reset: string;
};

function getRateLimitMetadata(headers: Headers): RateLimitMetadata | null {
  const limit = headers.get("x-ratelimit-limit");
  const remaining = headers.get("x-ratelimit-remaining");
  const reset = headers.get("x-ratelimit-reset");

  if (!limit || !remaining || !reset) {
    return null;
  }

  return {
    limit,
    remaining,
    reset,
  };
}

function ExampleCard({
  title,
  payload,
}: {
  title: string;
  payload: unknown;
}) {
  const [copied, setCopied] = useState(false);
  const content = useMemo(() => JSON.stringify(payload, null, 2), [payload]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-neutral-950/70 p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-100">{title}</p>
        <button
          type="button"
          onClick={handleCopy}
          className="rounded border border-primary-300/40 bg-primary-500/10 px-2 py-1 text-xs font-medium text-primary-100 transition-colors hover:bg-primary-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
        >
          {copied ? "Copied" : "Copy JSON"}
        </button>
      </div>
      <pre className="max-h-64 overflow-auto text-xs text-slate-200">{content}</pre>
    </div>
  );
}

export function SimulatorForm() {
  const searchParams = useSearchParams();
  const [jsonInput, setJsonInput] = useState(JSON.stringify(DEFAULT_REQUEST, null, 2));
  const [result, setResult] = useState<SimResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rateLimit, setRateLimit] = useState<RateLimitMetadata | null>(null);
  const [simulationAttempted, setSimulationAttempted] = useState(false);

  useEffect(() => {
    const scenarioKey = searchParams.get("scenario");
    if (!scenarioKey) {
      return;
    }

    const selected = SCENARIOS[scenarioKey];
    if (!selected) {
      return;
    }

    setJsonInput(JSON.stringify(selected.request, null, 2));
    setResult(null);
    setError(null);
    setRateLimit(null);
    setSimulationAttempted(false);
  }, [searchParams]);

  function handleScenarioSelect(scenarioKey: string) {
    const selected = SCENARIOS[scenarioKey];
    if (!selected) {
      return;
    }

    setJsonInput(JSON.stringify(selected.request, null, 2));
    setResult(null);
    setError(null);
    setRateLimit(null);
    setSimulationAttempted(false);
  }

  async function handleSimulate() {
    setError(null);
    setResult(null);
    setRateLimit(null);
    setSimulationAttempted(false);

    let parsedBody: unknown;
    try {
      parsedBody = JSON.parse(jsonInput);
    } catch {
      setError("Input must be valid JSON before simulation.");
      return;
    }

    setIsLoading(true);
    trackEvent("simulator_run_click", { location: "simulator_page" });

    try {
      const response = await fetch("/api/simulate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify(parsedBody),
      });

      const rateLimitMetadata = getRateLimitMetadata(response.headers);
      setRateLimit(rateLimitMetadata);
      setSimulationAttempted(true);

      if (rateLimitMetadata) {
        trackEvent("simulator_rate_limit_visible", {
          location: "simulator_page",
          limit: rateLimitMetadata.limit,
          remaining: rateLimitMetadata.remaining,
        });
      }

      const payload = (await response.json()) as SimulateApiResponse;

      if (!response.ok || !payload.ok || !payload.result) {
        if (payload.error === "rate_limited") {
          setError("Rate limit reached, please wait a moment and try again.");
        } else if (payload.error === "invalid_request") {
          setError("Request must include action, token_in, token_out, amount, max_slippage_bps, ttl_seconds.");
        } else if (payload.error === "invalid_json") {
          setError("Request body is not valid JSON.");
        } else {
          setError("Simulation failed. Please retry.");
        }
        return;
      }

      setResult(payload.result);
    } catch {
      setError("Unable to reach simulator endpoint.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="text-lg font-semibold text-slate-100">JSON Input Editor</h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(SCENARIOS).map(([scenarioKey, scenario]) => (
              <button
                key={scenarioKey}
                type="button"
                onClick={() => handleScenarioSelect(scenarioKey)}
                className="rounded-lg border border-primary-300/40 bg-primary-500/10 px-3 py-1.5 text-sm font-medium text-primary-100 transition-colors hover:bg-primary-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
              >
                {scenario.label}
              </button>
            ))}
          </div>
          <textarea
            value={jsonInput}
            onChange={(event) => setJsonInput(event.target.value)}
            rows={16}
            className="w-full resize-y rounded border border-white/10 bg-neutral-950/70 p-3 font-mono text-sm text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
            aria-label="Simulator JSON input"
            spellCheck={false}
          />
          <Button type="button" onClick={handleSimulate} disabled={isLoading} className="text-base">
            {isLoading ? "Simulating..." : "Simulate"}
          </Button>
        </section>

        <section className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <div className="rounded-lg border border-white/10 bg-neutral-950/60 p-3">
            <p className="text-sm font-semibold text-slate-100">What just happened?</p>
            <ul className="mt-2 space-y-1 text-sm text-slate-300">
              <li>Invariant checks are evaluated against the submitted request.</li>
              <li>The decision is deterministic for the same input payload.</li>
              <li>A receipt hash is generated as a tamper-evident record.</li>
            </ul>
          </div>
          <h2 className="text-lg font-semibold text-slate-100">Result</h2>
          <SimulatorResult
            result={result}
            error={error}
            isLoading={isLoading}
            rateLimit={rateLimit}
            simulationAttempted={simulationAttempted}
          />
          <a
            href="/docs/5-minute-quickstart"
            className="inline-flex items-center text-sm font-semibold text-primary-200 transition-colors hover:text-primary-100"
          >
            See how this fits into production &rarr;
          </a>
        </section>
      </div>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold text-slate-100">Copyable JSON Examples</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          <ExampleCard title="Request Example" payload={DEFAULT_REQUEST} />
          <ExampleCard title="Allowed Response Example" payload={EXAMPLE_ALLOWED_RESPONSE} />
          <ExampleCard title="Denied Response Example" payload={EXAMPLE_DENIED_RESPONSE} />
        </div>
      </section>
    </div>
  );
}