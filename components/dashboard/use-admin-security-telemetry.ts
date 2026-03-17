/* ────────────────────────────────────────────────────────────────
 *  useAdminSecurityTelemetry — shared client-side hook for admin
 *  security telemetry data.
 *
 *  Deduplicates fetches so both PublicSurfaceHealth and
 *  AdminDegradedTelemetry consume the same data without
 *  independent requests to /api/admin/security.
 *
 *  Features:
 *  - Auto-refresh polling (default 30 s, configurable)
 *  - Manual refresh() with overlap protection
 *  - Retains last known good data on failure
 *  - Safe generic error state — no secrets/details leaked
 * ──────────────────────────────────────────────────────────── */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Full shape returned by /api/admin/security (fields consumed by panels). */
export interface AdminSecurityData {
  uptime_seconds: number;
  session_store_size: number;
  revoked_session_count: number;
  admin_page_degraded_total: number;
  admin_page_degraded_by_page: Record<string, number>;
  admin_action_degraded_total: number;
  admin_action_degraded_by_action: Record<string, number>;
  admin_api_degraded_total: number;
  admin_api_degraded_by_route: Record<string, number>;
  agent_route_rate_limited_total: number;
  agent_route_rate_limited_by_route: Record<string, number>;
  public_route_rate_limited_total: number;
  public_route_rate_limited_by_route: Record<string, number>;
}

export interface AdminSecurityTelemetryState {
  data: AdminSecurityData | null;
  loading: boolean;
  refreshing: boolean;
  error: boolean;
  lastUpdated: Date | null;
  refresh: () => void;
}

/** Default polling interval in milliseconds. */
const POLL_INTERVAL_MS = 30_000;

export function useAdminSecurityTelemetry(): AdminSecurityTelemetryState {
  const [data, setData] = useState<AdminSecurityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  /** Guard against overlapping fetches. */
  const inflightRef = useRef(false);
  /** Mounted guard for safe state updates. */
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
      const res = await fetch("/api/admin/security", {
        credentials: "same-origin",
      });
      if (!res.ok) {
        if (mountedRef.current) setError(true);
        return;
      }
      const json = await res.json();
      if (mountedRef.current) {
        setData({
          uptime_seconds: json.uptime_seconds ?? 0,
          session_store_size: json.session_store_size ?? 0,
          revoked_session_count: json.revoked_session_count ?? 0,
          admin_page_degraded_total: json.admin_page_degraded_total ?? 0,
          admin_page_degraded_by_page: json.admin_page_degraded_by_page ?? {},
          admin_action_degraded_total: json.admin_action_degraded_total ?? 0,
          admin_action_degraded_by_action: json.admin_action_degraded_by_action ?? {},
          admin_api_degraded_total: json.admin_api_degraded_total ?? 0,
          admin_api_degraded_by_route: json.admin_api_degraded_by_route ?? {},
          agent_route_rate_limited_total: json.agent_route_rate_limited_total ?? 0,
          agent_route_rate_limited_by_route: json.agent_route_rate_limited_by_route ?? {},
          public_route_rate_limited_total: json.public_route_rate_limited_total ?? 0,
          public_route_rate_limited_by_route: json.public_route_rate_limited_by_route ?? {},
        });
        setError(false);
        setLastUpdated(new Date());
      }
    } catch {
      // Retain last known good data; surface generic error flag only when
      // there is no previous data.
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

  /* ── initial fetch + polling ── */
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
