import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { render, screen, fireEvent } from "@testing-library/react";

/* ── Module under test ── */
import { useLatencyMetrics } from "@/components/dashboard/use-latency-metrics";
import { LatencyDashboard } from "@/components/dashboard/latency-dashboard";
import type { LatencyMetrics } from "@/lib/dashboard-client";

/* ── Helpers ── */

const GOOD_PAYLOAD: LatencyMetrics = {
  observation_count: 1500,
  window: "rolling_5min",
  overall: {
    total_ms: { p50: 12.3, p95: 45.6, p99: 78.9 },
    policy_eval_ms: { p50: 5.1, p95: 15.2, p99: 25.3 },
    rpc_total_time_ms: { p50: 3.0, p95: 10.0, p99: 20.0 },
    cache_lookup_ms: { p50: 0.2, p95: 0.5, p99: 1.0 },
    eval_cache_lookup_ms: { p50: 0.1, p95: 0.3, p99: 0.5 },
  },
  by_mode: {
    strict: {
      observation_count: 400,
      total_ms: { p50: 15.0, p95: 50.0, p99: 90.0 },
      cache_hits: 100,
      eval_cache_hits: 50,
      turbo_fast_path_hits: 0,
    },
    balanced: {
      observation_count: 600,
      total_ms: { p50: 12.0, p95: 40.0, p99: 70.0 },
      cache_hits: 200,
      eval_cache_hits: 80,
      turbo_fast_path_hits: 0,
    },
    turbo: {
      observation_count: 500,
      total_ms: { p50: 5.0, p95: 15.0, p99: 25.0 },
      cache_hits: 300,
      eval_cache_hits: 100,
      turbo_fast_path_hits: 280,
    },
  },
  cache_summary: {
    cache_hits: 600,
    cache_misses: 900,
    eval_cache_hits: 230,
    turbo_fast_path_hits: 280,
    rpc_calls_avg: 1.2,
  },
};

const EMPTY_PAYLOAD: LatencyMetrics = {
  observation_count: 0,
  window: "rolling_5min",
  overall: {
    total_ms: { p50: 0, p95: 0, p99: 0 },
    policy_eval_ms: { p50: 0, p95: 0, p99: 0 },
    rpc_total_time_ms: { p50: 0, p95: 0, p99: 0 },
  },
};

function mockFetchOk(payload: LatencyMetrics = GOOD_PAYLOAD) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(payload),
  });
}

function mockFetchFail() {
  return vi.fn().mockResolvedValue({ ok: false, status: 502 });
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

/* ═══════════ useLatencyMetrics hook ═══════════ */

describe("useLatencyMetrics", () => {
  it("fetches data on mount via /api/admin/latency", async () => {
    const fetchMock = mockFetchOk();
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useLatencyMetrics());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(fetchMock).toHaveBeenCalledWith("/api/admin/latency", {
      credentials: "same-origin",
    });
    expect(result.current.data).toEqual(GOOD_PAYLOAD);
    expect(result.current.error).toBe(false);
    expect(result.current.lastUpdated).toBeInstanceOf(Date);
  });

  it("polls automatically after 30 s", async () => {
    const fetchMock = mockFetchOk();
    vi.stubGlobal("fetch", fetchMock);

    renderHook(() => useLatencyMetrics());

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    await act(async () => {
      vi.advanceTimersByTime(30_000);
    });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });

  it("cleans up polling timer on unmount", async () => {
    const fetchMock = mockFetchOk();
    vi.stubGlobal("fetch", fetchMock);

    const { unmount } = renderHook(() => useLatencyMetrics());
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    unmount();

    await act(async () => {
      vi.advanceTimersByTime(90_000);
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("manual refresh() triggers a re-fetch", async () => {
    const fetchMock = mockFetchOk();
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useLatencyMetrics());
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    await act(async () => {
      result.current.refresh();
    });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });

  it("avoids overlapping refreshes", async () => {
    let resolveFirst: (() => void) | undefined;
    const slowFetch = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFirst = () =>
            resolve({ ok: true, json: () => Promise.resolve(GOOD_PAYLOAD) });
        }),
    );
    vi.stubGlobal("fetch", slowFetch);

    const { result } = renderHook(() => useLatencyMetrics());

    act(() => {
      result.current.refresh();
    });
    act(() => {
      result.current.refresh();
    });

    expect(slowFetch).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveFirst!();
    });
  });

  it("sets error on failed fetch when no prior data", async () => {
    vi.stubGlobal("fetch", mockFetchFail());

    const { result } = renderHook(() => useLatencyMetrics());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe(true);
    expect(result.current.data).toBeNull();
  });

  it("retains last known good data on subsequent failure", async () => {
    const fetchMock = mockFetchOk();
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useLatencyMetrics());
    await waitFor(() => expect(result.current.data).toEqual(GOOD_PAYLOAD));

    fetchMock.mockResolvedValueOnce({ ok: false, status: 502 });

    await act(async () => {
      vi.advanceTimersByTime(30_000);
    });

    await waitFor(() => expect(result.current.refreshing).toBe(false));
    expect(result.current.data).toEqual(GOOD_PAYLOAD);
  });
});

/* ═══════════ LatencyDashboard component ═══════════ */

describe("LatencyDashboard", () => {
  it("renders overall latency table with percentiles", async () => {
    vi.stubGlobal("fetch", mockFetchOk());

    render(<LatencyDashboard />);

    await waitFor(() =>
      expect(screen.getByTestId("latency-overall")).toBeTruthy(),
    );

    // Check key labels
    expect(screen.getByText("Total")).toBeTruthy();
    expect(screen.getByText("Policy Eval")).toBeTruthy();
    expect(screen.getByText("RPC Total")).toBeTruthy();
    // Secondary breakdowns
    expect(screen.getByText("Cache Lookup")).toBeTruthy();
    expect(screen.getByText("Eval Cache Lookup")).toBeTruthy();
  });

  it("renders mode comparison cards for strict/balanced/turbo", async () => {
    vi.stubGlobal("fetch", mockFetchOk());

    render(<LatencyDashboard />);

    await waitFor(() =>
      expect(screen.getByTestId("latency-mode-comparison")).toBeTruthy(),
    );

    expect(screen.getByText("Strict")).toBeTruthy();
    expect(screen.getByText("Balanced")).toBeTruthy();
    expect(screen.getByText("Turbo")).toBeTruthy();
  });

  it("renders cache effectiveness section", async () => {
    vi.stubGlobal("fetch", mockFetchOk());

    render(<LatencyDashboard />);

    await waitFor(() =>
      expect(screen.getByTestId("latency-cache-effectiveness")).toBeTruthy(),
    );

    expect(screen.getByText("Cache Hit Rate")).toBeTruthy();
    expect(screen.getByText("RPC Calls Avg")).toBeTruthy();
    // "Eval Cache Hits" and "Turbo Fast-Path" also appear in mode cards,
    // so verify via testid container
    const cacheSection = screen.getByTestId("latency-cache-effectiveness");
    expect(cacheSection.textContent).toContain("Eval Cache Hits");
    expect(cacheSection.textContent).toContain("Turbo Fast-Path");
  });

  it("renders window context note", async () => {
    vi.stubGlobal("fetch", mockFetchOk());

    render(<LatencyDashboard />);

    await waitFor(() =>
      expect(screen.getByTestId("latency-window-note")).toBeTruthy(),
    );

    expect(screen.getByTestId("latency-window-note").textContent).toContain(
      "rolling_5min",
    );
  });

  it("shows empty state when observation_count is 0", async () => {
    vi.stubGlobal("fetch", mockFetchOk(EMPTY_PAYLOAD));

    render(<LatencyDashboard />);

    await waitFor(() =>
      expect(screen.getByTestId("latency-empty")).toBeTruthy(),
    );

    expect(screen.getByText("No latency observations yet")).toBeTruthy();
  });

  it("shows degraded state on fetch failure", async () => {
    vi.stubGlobal("fetch", mockFetchFail());

    render(<LatencyDashboard />);

    await waitFor(() =>
      expect(
        screen.getByText("Latency Metrics temporarily unavailable"),
      ).toBeTruthy(),
    );
  });

  it("shows loading skeleton initially", () => {
    // Never-resolving fetch to keep loading state
    vi.stubGlobal(
      "fetch",
      vi.fn().mockReturnValue(new Promise(() => {})),
    );

    render(<LatencyDashboard />);

    expect(screen.getByTestId("latency-loading")).toBeTruthy();
  });

  it("renders refresh button and triggers refetch", async () => {
    vi.useRealTimers();
    const fetchMock = mockFetchOk();
    vi.stubGlobal("fetch", fetchMock);

    render(<LatencyDashboard />);

    await waitFor(() =>
      expect(screen.getByTestId("latency-refresh-btn")).toBeTruthy(),
    );

    const btn = screen.getByTestId("latency-refresh-btn");
    expect(btn).toHaveTextContent("Refresh");

    fireEvent.click(btn);

    await waitFor(() => expect(fetchMock.mock.calls.length).toBeGreaterThan(1));
  });

  it("does not expose sensitive data in any rendered output", async () => {
    vi.stubGlobal("fetch", mockFetchOk());

    const { container } = render(<LatencyDashboard />);

    await waitFor(() =>
      expect(screen.getByTestId("latency-overall")).toBeTruthy(),
    );

    const html = container.innerHTML;
    // No tokens, secrets, IPs, or backend URLs
    expect(html).not.toContain("api_key");
    expect(html).not.toContain("token");
    expect(html).not.toContain("secret");
    expect(html).not.toContain("password");
    expect(html).not.toContain("127.0.0.1");
  });

  it("displays only aggregate data", async () => {
    vi.stubGlobal("fetch", mockFetchOk());

    render(<LatencyDashboard />);

    await waitFor(() =>
      expect(screen.getByTestId("latency-dashboard")).toBeTruthy(),
    );

    // Verify observation count is shown (text split across elements)
    const dashboard = screen.getByTestId("latency-dashboard");
    expect(dashboard.textContent).toContain("1.5K observations");
  });
});
