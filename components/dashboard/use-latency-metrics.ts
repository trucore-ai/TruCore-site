/* ────────────────────────────────────────────────────────────────
 *  useLatencyMetrics — client-side hook for ATF latency data.
 *
 *  Fetches /api/admin/latency on mount and polls every 30 s.
 *  Retains last known good data on failure.
 *  Prevents overlapping fetches.
 * ──────────────────────────────────────────────────────────── */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { LatencyMetrics } from "@/lib/dashboard-client";

export interface LatencyMetricsState {
  data: LatencyMetrics | null;
  loading: boolean;
  refreshing: boolean;
  error: boolean;
  lastUpdated: Date | null;
  refresh: () => void;
}

const POLL_INTERVAL_MS = 30_000;

export function useLatencyMetrics(): LatencyMetricsState {
  const [data, setData] = useState<LatencyMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const inflightRef = useRef(false);
  const mountedRef = useRef(true);

  const doFetch = useCallback(async (isInitial: boolean) => {
    if (inflightRef.current) return;
    inflightRef.current = true;

    if (isInitial) {
      if (mountedRef.current) setLoading(true);
    } else {
      if (mountedRef.current) setRefreshing(true);
    }

    try {
      const res = await fetch("/api/admin/latency", {
        credentials: "same-origin",
      });
      if (!res.ok) {
        if (mountedRef.current) setError(true);
        return;
      }
      const json = await res.json();
      if (mountedRef.current) {
        setData(json as LatencyMetrics);
        setError(false);
        setLastUpdated(new Date());
      }
    } catch {
      if (mountedRef.current && data === null) setError(true);
    } finally {
      inflightRef.current = false;
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    doFetch(true);

    const timer = setInterval(() => {
      doFetch(false);
    }, POLL_INTERVAL_MS);

    return () => {
      mountedRef.current = false;
      clearInterval(timer);
    };
  }, [doFetch]);

  const refresh = useCallback(() => {
    doFetch(false);
  }, [doFetch]);

  return { data, loading, refreshing, error, lastUpdated, refresh };
}
