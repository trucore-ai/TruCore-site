"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

interface FunnelTotals {
  dashboard_viewed: number;
  sample_intent_loaded: number;
  protect_dry_run_started: number;
  protect_dry_run_completed: number;
  execute_sample_started: number;
  execute_sample_completed: number;
  receipt_viewed: number;
  receipt_verified: number;
}

interface FunnelConversion {
  dashboard_to_sample: number;
  sample_to_protect_start: number;
  protect_start_to_complete: number;
  protect_to_execute_start: number;
  execute_start_to_complete: number;
  execute_to_receipt: number;
  receipt_to_verify: number;
}

interface FunnelData {
  totals: FunnelTotals;
  conversion: FunnelConversion;
  biggest_dropoff: string;
  event_count: number;
  oldest_event_age_ms: number | null;
}

interface ApiResponse {
  status: "ok" | "error";
  data?: FunnelData;
  error?: string;
}

const STAGE_LABELS: Record<keyof FunnelTotals, string> = {
  dashboard_viewed: "Dashboard Viewed",
  sample_intent_loaded: "Sample Intent Loaded",
  protect_dry_run_started: "Protect Started",
  protect_dry_run_completed: "Protect Completed",
  execute_sample_started: "Execute Started",
  execute_sample_completed: "Execute Completed",
  receipt_viewed: "Receipt Viewed",
  receipt_verified: "Receipt Verified",
};

function formatDuration(ms: number | null): string {
  if (ms === null) return "—";
  const hours = Math.floor(ms / 3_600_000);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h`;
  const minutes = Math.floor(ms / 60_000);
  return `${minutes}m`;
}

function ConversionBadge({ pct }: { pct: number }) {
  let colorClass = "text-green-400";
  if (pct < 50) colorClass = "text-red-400";
  else if (pct < 75) colorClass = "text-yellow-400";

  return (
    <span className={`ml-2 text-sm ${colorClass}`}>
      {pct > 0 ? `${pct}%` : "—"}
    </span>
  );
}

async function fetchJourneyFunnel(opsKey: string): Promise<ApiResponse | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    const res = await fetch("/api/ops/journey-funnel", {
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
 * Ops-only panel that displays the first-trade journey funnel metrics.
 * Hidden entirely when no ops key is provided or fetch fails.
 */
export function OpsJourneyFunnel({ opsKey }: { opsKey: string }) {
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetchJourneyFunnel(opsKey).then((response) => {
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

  const data = result?.data;

  // Calculate conversion percentages for display
  const stages: Array<{
    key: keyof FunnelTotals;
    count: number;
    conversion: number | null;
  }> = data
    ? [
        { key: "dashboard_viewed", count: data.totals.dashboard_viewed, conversion: null },
        {
          key: "sample_intent_loaded",
          count: data.totals.sample_intent_loaded,
          conversion: data.conversion.dashboard_to_sample,
        },
        {
          key: "protect_dry_run_started",
          count: data.totals.protect_dry_run_started,
          conversion: data.conversion.sample_to_protect_start,
        },
        {
          key: "protect_dry_run_completed",
          count: data.totals.protect_dry_run_completed,
          conversion: data.conversion.protect_start_to_complete,
        },
        {
          key: "execute_sample_started",
          count: data.totals.execute_sample_started,
          conversion: data.conversion.protect_to_execute_start,
        },
        {
          key: "execute_sample_completed",
          count: data.totals.execute_sample_completed,
          conversion: data.conversion.execute_start_to_complete,
        },
        {
          key: "receipt_viewed",
          count: data.totals.receipt_viewed,
          conversion: data.conversion.execute_to_receipt,
        },
        {
          key: "receipt_verified",
          count: data.totals.receipt_verified,
          conversion: data.conversion.receipt_to_verify,
        },
      ]
    : [];

  return (
    <Card>
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-accent-300">
          First Trade Funnel{" "}
          <span className="text-base font-normal text-slate-400">(Ops)</span>
        </h2>
      </div>

      {loading ? (
        <div className="mt-4 flex items-center gap-2 text-slate-400">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
          Loading funnel data...
        </div>
      ) : !data ? (
        <p className="mt-4 text-sm text-slate-400">
          Could not load funnel data.
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          {/* Summary Row */}
          <div className="flex flex-wrap gap-4 text-sm text-slate-300">
            <div>
              <span className="font-medium text-slate-400">Events:</span>{" "}
              {data.event_count.toLocaleString()}
            </div>
            <div>
              <span className="font-medium text-slate-400">Oldest:</span>{" "}
              {formatDuration(data.oldest_event_age_ms)}
            </div>
            <div>
              <span className="font-medium text-slate-400">Biggest Drop:</span>{" "}
              <span className="text-yellow-400">{data.biggest_dropoff}</span>
            </div>
          </div>

          {/* Funnel Stages */}
          <div className="space-y-2">
            {stages.map((stage, idx) => (
              <div
                key={stage.key}
                className="flex items-center justify-between rounded bg-white/[0.03] px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className="w-4 text-center text-xs text-slate-500">
                    {idx + 1}
                  </span>
                  <span className="text-sm text-slate-200">
                    {STAGE_LABELS[stage.key]}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">
                    {stage.count.toLocaleString()}
                  </span>
                  {stage.conversion !== null && (
                    <ConversionBadge pct={stage.conversion} />
                  )}
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-slate-500">
            Counts are unique sessions per stage. Conversion % is relative to
            previous stage. Data retained for 7 days in memory.
          </p>
        </div>
      )}
    </Card>
  );
}
