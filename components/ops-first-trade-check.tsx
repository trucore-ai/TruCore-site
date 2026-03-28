"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

interface StageResult {
  name: string;
  status: "ok" | "error" | "skipped";
  failure_class: string | null;
  detail: string;
}

interface CheckSummary {
  passed: number;
  failed: number;
  skipped: number;
}

interface CheckData {
  checked_at: string;
  stages: StageResult[];
  summary: CheckSummary;
}

interface ApiResponse {
  status: "ok" | "degraded" | "error";
  data?: CheckData;
  error?: string;
}

function StatusBadge({ status }: { status: "ok" | "error" | "skipped" }) {
  const styles = {
    ok: "bg-green-500/20 text-green-400 border-green-500/30",
    error: "bg-red-500/20 text-red-400 border-red-500/30",
    skipped: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  };

  const labels = {
    ok: "OK",
    error: "Error",
    skipped: "Skipped",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

function OverallStatusBadge({ status }: { status: "ok" | "degraded" | "error" }) {
  const styles = {
    ok: "bg-green-500/20 text-green-400 border-green-500/30",
    degraded: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    error: "bg-red-500/20 text-red-400 border-red-500/30",
  };

  const labels = {
    ok: "Healthy",
    degraded: "Degraded",
    error: "Unhealthy",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

function formatStageName(name: string): string {
  return name
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatTs(ts: string | null): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleString();
}

async function fetchFirstTradeCheck(
  opsKey: string,
): Promise<ApiResponse | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    const res = await fetch("/api/ops/first-trade-check", {
      method: "GET",
      cache: "no-store",
      headers: { "x-ops-key": opsKey },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok && res.status !== 503) return null;

    const body = (await res.json()) as ApiResponse;
    return body;
  } catch {
    return null;
  }
}

/**
 * Ops-only panel that displays the first-trade reliability check results.
 * Hidden entirely when no ops key is provided or fetch fails.
 */
export function OpsFirstTradeCheck({ opsKey }: { opsKey: string }) {
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetchFirstTradeCheck(opsKey).then((response) => {
      if (cancelled) return;

      if (response) {
        setResult(response);
      } else {
        setError(true);
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [opsKey]);

  if (error) return null;

  return (
    <Card>
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-accent-300">
          First Trade Check{" "}
          <span className="text-base font-normal text-slate-400">(Ops)</span>
        </h2>
        {!loading && result && <OverallStatusBadge status={result.status} />}
      </div>

      {loading ? (
        <p className="mt-3 text-lg text-slate-400">Running check...</p>
      ) : result?.error ? (
        <p className="mt-3 text-lg text-red-400">
          Check failed: {result.error}
        </p>
      ) : result?.data ? (
        <>
          {/* Summary row */}
          <div className="mt-4 flex gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium text-green-400">
                {result.data.summary.passed}
              </span>
              <span className="text-slate-400">passed</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-red-400">
                {result.data.summary.failed}
              </span>
              <span className="text-slate-400">failed</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-yellow-400">
                {result.data.summary.skipped}
              </span>
              <span className="text-slate-400">skipped</span>
            </div>
          </div>

          {/* Stage details */}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400">
                  <th className="pb-2 pr-4 font-medium">Stage</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 pr-4 font-medium">Failure Class</th>
                  <th className="pb-2 font-medium">Detail</th>
                </tr>
              </thead>
              <tbody>
                {result.data.stages.map((stage) => (
                  <tr key={stage.name} className="border-b border-slate-800">
                    <td className="py-2 pr-4 font-medium text-slate-200">
                      {formatStageName(stage.name)}
                    </td>
                    <td className="py-2 pr-4">
                      <StatusBadge status={stage.status} />
                    </td>
                    <td className="py-2 pr-4 font-mono text-xs text-slate-400">
                      {stage.failure_class ?? "—"}
                    </td>
                    <td className="py-2 text-slate-300">{stage.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-3 text-xs text-slate-500">
            Checked at {formatTs(result.data.checked_at)}
          </p>
        </>
      ) : null}

      <p className="mt-3 text-xs text-slate-500">
        Validates the first protected trade customer journey. See ops runbook
        for interpretation.
      </p>
    </Card>
  );
}
