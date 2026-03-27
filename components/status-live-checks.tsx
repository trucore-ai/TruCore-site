"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type StatusLevel = "loading" | "ok" | "warn" | "down";

type LiveCheck = {
  label: string;
  level: StatusLevel;
  details: string;
};

type SnapshotPayload = {
  ok: boolean;
  ts: string;
  commit: string | null;
  env: string | null;
  firewall_api?: {
    configured: boolean;
    reachable: boolean;
  };
};

function formatTimestamp(value: Date | null) {
  if (!value) return "Never";
  return value.toLocaleString();
}

export function StatusLiveChecks() {
  const [checks, setChecks] = useState<LiveCheck[]>([
    { label: "Website", level: "loading", details: "Checking page response" },
    {
      label: "Waitlist API",
      level: "loading",
      details: "Checking waitlist workflow readiness",
    },
    {
      label: "Health Endpoint",
      level: "loading",
      details: "Checking /api/health",
    },
    {
      label: "Firewall API",
      level: "loading",
      details: "Checking backend reachability",
    },
  ]);
  const [snapshot, setSnapshot] = useState<SnapshotPayload | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const runChecks = useCallback(async () => {
    setIsLoading(true);

    const websiteProbe = fetch("/", {
      method: "GET",
      cache: "no-store",
      headers: { "x-trucore-status-probe": "website" },
    });

    const healthProbe = fetch("/api/health", {
      method: "GET",
      cache: "no-store",
      headers: { "x-trucore-status-probe": "health" },
    });

    const snapshotProbe = fetch("/api/status", {
      method: "GET",
      cache: "no-store",
      headers: { "x-trucore-status-probe": "status" },
    });

    const [websiteResult, healthResult, snapshotResult] = await Promise.allSettled([
      websiteProbe,
      healthProbe,
      snapshotProbe,
    ]);

    let websiteOk = false;
    let healthOk = false;
    let snapshotOk = false;
    let snapshotData: SnapshotPayload | null = null;

    if (websiteResult.status === "fulfilled") {
      websiteOk = websiteResult.value.ok;
    }

    if (healthResult.status === "fulfilled") {
      healthOk = healthResult.value.ok;
    }

    if (snapshotResult.status === "fulfilled") {
      snapshotOk = snapshotResult.value.ok;
      if (snapshotResult.value.ok) {
        snapshotData = (await snapshotResult.value.json()) as SnapshotPayload;
        setSnapshot(snapshotData);
      }
    } else {
      setSnapshot(null);
    }

    const firewallConfigured = snapshotData?.firewall_api?.configured ?? false;
    const firewallReachable = snapshotData?.firewall_api?.reachable ?? false;

    const nextChecks: LiveCheck[] = [
      {
        label: "Website",
        level: websiteOk ? "ok" : "down",
        details: websiteOk ? "Page responded successfully" : "Page probe failed",
      },
      {
        label: "Waitlist API",
        level:
          websiteOk && (healthOk || snapshotOk)
            ? "ok"
            : websiteOk || healthOk || snapshotOk
              ? "warn"
              : "down",
        details:
          websiteOk && (healthOk || snapshotOk)
            ? "Workflow reachable through app services"
            : "Partial signal from service probes",
      },
      {
        label: "Health Endpoint",
        level: healthOk ? "ok" : "down",
        details: healthOk ? "/api/health responded with 200" : "/api/health probe failed",
      },
      {
        label: "Firewall API",
        level: !snapshotOk
          ? "down"
          : firewallReachable
            ? "ok"
            : firewallConfigured
              ? "warn"
              : "down",
        details: !snapshotOk
          ? "Unable to retrieve backend status"
          : firewallReachable
            ? "Backend reachable and responding"
            : firewallConfigured
              ? "Configured but not responding"
              : "Not configured",
      },
    ];

    setChecks(nextChecks);
    setLastChecked(new Date());
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void runChecks();
    }, 0);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [runChecks]);

  const hasFailures = useMemo(
    () => checks.some((check) => check.level === "down"),
    [checks],
  );

  const statusBadge = useMemo(() => {
    if (isLoading) {
      return {
        label: "Checking",
        className: "border-orange-500/40 bg-orange-500/15 text-orange-200",
      };
    }

    if (hasFailures) {
      return {
        label: "Degraded",
        className: "border-red-500/40 bg-red-500/15 text-red-200",
      };
    }

    return {
      label: "Operational",
      className: "border-emerald-500/40 bg-emerald-500/15 text-emerald-200",
    };
  }, [hasFailures, isLoading]);

  const indicatorClass = (level: StatusLevel) => {
    const base = "h-2 w-2 rounded-full";

    if (level === "ok") return `${base} bg-emerald-400`;
    if (level === "warn") return `${base} bg-orange-400`;
    if (level === "down") return `${base} bg-red-400`;
    return `${base} bg-orange-300`;
  };

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-accent-300">Current Status</h2>
        <Badge className={statusBadge.className}>{statusBadge.label}</Badge>
      </div>

      <p className="mt-3 text-lg text-slate-300">
        Automatic browser probes for website reachability and service endpoints.
      </p>

      <div className="mt-5 space-y-3">
        {checks.map((check) => (
          <div
            key={check.label}
            className="glass-panel flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-background px-6 py-4 shadow-sm transition-all duration-150 hover:shadow-md"
          >
            <div className="min-w-0">
              <p className="text-base font-semibold text-slate-200">{check.label}</p>
              <p className="text-sm text-slate-400 break-words">{check.details}</p>
            </div>
            <span className="inline-flex items-center gap-2 whitespace-nowrap text-sm text-slate-300">
              <span aria-hidden="true" className={indicatorClass(check.level)} />
              {check.level === "ok"
                ? "Healthy"
                : check.level === "warn"
                  ? "Partial"
                  : check.level === "down"
                    ? "Failed"
                    : "Checking"}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <Button
          type="button"
          variant="secondary"
          className="text-sm"
          onClick={() => {
            void runChecks();
          }}
          disabled={isLoading}
        >
          {isLoading ? "Checking..." : "Retry checks"}
        </Button>
        <p className="text-sm text-slate-400">
          Last checked: {formatTimestamp(lastChecked)}
        </p>
      </div>

      {snapshot && (
        <p className="mt-4 text-sm text-slate-400">
          Snapshot: env {snapshot.env ?? "unknown"}, commit {snapshot.commit?.slice(0, 7) ?? "n/a"}, ts {snapshot.ts}
        </p>
      )}
    </Card>
  );
}