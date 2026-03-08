"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Section } from "@/components/ui/section";
import { trackEvent } from "@/lib/analytics";

type PublicMetricsResponse = {
  simulator_requests_24h: number;
  active_partner_keys: number;
  receipts_generated_total: number;
  preview_mode?: boolean;
};

const fallbackMetrics: PublicMetricsResponse = {
  simulator_requests_24h: 0,
  active_partner_keys: 0,
  receipts_generated_total: 0,
  preview_mode: true,
};

function formatCount(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function PublicUsageSnapshot() {
  const [metrics, setMetrics] = useState<PublicMetricsResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadMetrics = async () => {
      try {
        const response = await fetch("/api/public-metrics", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`public metrics fetch failed (${response.status})`);
        }

        const data = (await response.json()) as PublicMetricsResponse;
        if (!cancelled) {
          setMetrics(data);
          trackEvent("public_metrics_visible", { location: "atf_snapshot" });
        }
      } catch {
        if (!cancelled) {
          setMetrics(fallbackMetrics);
        }
      }
    };

    void loadMetrics();
    return () => {
      cancelled = true;
    };
  }, []);

  const current = metrics ?? fallbackMetrics;

  return (
    <Section divider className="fade-in-up">
      <div className="mb-8 max-w-3xl">
        <h2 className="text-4xl font-bold tracking-tight text-accent-300">
          Live Operational Snapshot
        </h2>
        <p className="mt-3 text-base text-slate-300">Aggregated, non-identifiable metrics.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Simulator requests (24h)</p>
          <p className="mt-3 text-4xl font-bold text-slate-100">{formatCount(current.simulator_requests_24h)}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Active partner keys</p>
          <p className="mt-3 text-4xl font-bold text-slate-100">{formatCount(current.active_partner_keys)}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Total receipts generated</p>
          <p className="mt-3 text-4xl font-bold text-slate-100">{formatCount(current.receipts_generated_total)}</p>
        </Card>
      </div>
      {current.preview_mode ? (
        <p className="mt-4 text-sm text-slate-400">Preview mode enabled while metrics source is initializing.</p>
      ) : null}
    </Section>
  );
}
