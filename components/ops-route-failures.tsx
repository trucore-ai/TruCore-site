"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

interface RouteFailureStat {
  route: string;
  count: number;
  total_count: number;
  last_failure_ts: number | null;
  last_alert_ts: number | null;
}

interface ApiResponse {
  status: string;
  data?: { routes: RouteFailureStat[] };
}

function formatTs(ts: number | null): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleString();
}

async function fetchRouteFailures(
  opsKey: string,
): Promise<RouteFailureStat[] | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5_000);

    const res = await fetch("/api/ops/route-failures", {
      method: "GET",
      cache: "no-store",
      headers: { "x-ops-key": opsKey },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) return null;

    const body = (await res.json()) as ApiResponse;
    if (body.status === "ok" && body.data) return body.data.routes;
    return null;
  } catch {
    return null;
  }
}

/**
 * Ops-only panel that fetches /api/ops/route-failures when an ops key
 * is available. Hidden entirely when no key is provided or fetch fails.
 */
export function OpsRouteFailures({ opsKey }: { opsKey: string }) {
  const [routes, setRoutes] = useState<RouteFailureStat[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchRouteFailures(opsKey).then((result) => {
      if (cancelled) return;
      if (result) {
        setRoutes(result);
      } else {
        setError(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [opsKey]);

  if (error) return null;
  if (routes === null) return null;

  return (
    <Card>
      <h2 className="text-3xl font-bold text-accent-300">
        Recent Route Failures{" "}
        <span className="text-base font-normal text-slate-400">(Ops)</span>
      </h2>

      {routes.length === 0 ? (
        <p className="mt-3 text-lg text-slate-300">No recent failures.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400">
                <th className="pb-2 pr-4 font-medium">Route</th>
                <th className="pb-2 pr-4 font-medium">Window</th>
                <th className="pb-2 pr-4 font-medium">Total</th>
                <th className="pb-2 pr-4 font-medium">Last Failure</th>
                <th className="pb-2 font-medium">Last Alert</th>
              </tr>
            </thead>
            <tbody>
              {routes.map((r) => (
                <tr key={r.route} className="border-b border-slate-800">
                  <td className="py-2 pr-4 font-mono text-slate-200">
                    /api/{r.route}
                  </td>
                  <td className="py-2 pr-4 text-slate-300">{r.count}</td>
                  <td className="py-2 pr-4 text-slate-300">{r.total_count}</td>
                  <td className="py-2 pr-4 text-slate-300">
                    {formatTs(r.last_failure_ts)}
                  </td>
                  <td className="py-2 text-slate-300">
                    {formatTs(r.last_alert_ts)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-3 text-xs text-slate-500">
        Aggregated in-memory stats. Resets on process restart.
      </p>
    </Card>
  );
}
