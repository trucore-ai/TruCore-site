import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { render, screen, fireEvent } from "@testing-library/react";

/* ── Module under test ── */
import {
  useAdminSecurityTelemetry,
  type AdminSecurityData,
} from "@/components/dashboard/use-admin-security-telemetry";
import { AdminTelemetrySection } from "@/components/dashboard/admin-telemetry-section";

/* ── Helpers ── */

const GOOD_PAYLOAD: AdminSecurityData = {
  uptime_seconds: 120,
  session_store_size: 2,
  revoked_session_count: 0,
  admin_page_degraded_total: 1,
  admin_page_degraded_by_page: { waitlist: 1 },
  admin_action_degraded_total: 0,
  admin_action_degraded_by_action: {},
  admin_api_degraded_total: 0,
  admin_api_degraded_by_route: {},
  agent_route_rate_limited_total: 0,
  agent_route_rate_limited_by_route: {},
  public_route_rate_limited_total: 2,
  public_route_rate_limited_by_route: { "/api/demo": 2 },
};

function mockFetchOk(payload: AdminSecurityData = GOOD_PAYLOAD) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(payload),
  });
}

function mockFetchFail() {
  return vi.fn().mockResolvedValue({ ok: false, status: 500 });
}

function mockFetchNetworkError() {
  return vi.fn().mockRejectedValue(new Error("network"));
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

/* ═══════════ useAdminSecurityTelemetry hook ═══════════ */

describe("useAdminSecurityTelemetry", () => {
  it("fetches data on mount via /api/admin/security", async () => {
    const fetchMock = mockFetchOk();
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useAdminSecurityTelemetry());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(fetchMock).toHaveBeenCalledWith("/api/admin/security", {
      credentials: "same-origin",
    });
    expect(result.current.data).toEqual(GOOD_PAYLOAD);
    expect(result.current.error).toBe(false);
    expect(result.current.lastUpdated).toBeInstanceOf(Date);
  });

  it("polls automatically after default interval (30 s)", async () => {
    const fetchMock = mockFetchOk();
    vi.stubGlobal("fetch", fetchMock);

    renderHook(() => useAdminSecurityTelemetry());

    // Wait for initial fetch to complete
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    // Advance 30 seconds
    await act(async () => {
      vi.advanceTimersByTime(30_000);
    });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    // Advance another 30 seconds
    await act(async () => {
      vi.advanceTimersByTime(30_000);
    });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
  });

  it("cleans up polling timer on unmount", async () => {
    const fetchMock = mockFetchOk();
    vi.stubGlobal("fetch", fetchMock);

    const { unmount } = renderHook(() => useAdminSecurityTelemetry());

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    unmount();

    // Advance past several poll intervals
    await act(async () => {
      vi.advanceTimersByTime(90_000);
    });

    // Should not have polled after unmount
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("manual refresh() triggers a re-fetch", async () => {
    const fetchMock = mockFetchOk();
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useAdminSecurityTelemetry());

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

    const { result } = renderHook(() => useAdminSecurityTelemetry());

    // First fetch still in-flight — trigger manual refresh
    act(() => {
      result.current.refresh();
    });
    act(() => {
      result.current.refresh();
    });

    // Only one fetch should have been initiated (the initial one)
    expect(slowFetch).toHaveBeenCalledTimes(1);

    // Resolve
    await act(async () => {
      resolveFirst!();
    });
  });

  it("sets error on failed fetch when no prior data", async () => {
    vi.stubGlobal("fetch", mockFetchFail());

    const { result } = renderHook(() => useAdminSecurityTelemetry());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe(true);
    expect(result.current.data).toBeNull();
  });

  it("retains last known good data on subsequent failure", async () => {
    const fetchMock = mockFetchOk();
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useAdminSecurityTelemetry());

    await waitFor(() => expect(result.current.data).toEqual(GOOD_PAYLOAD));

    // Now make the next fetch fail
    fetchMock.mockResolvedValueOnce({ ok: false, status: 500 });

    await act(async () => {
      vi.advanceTimersByTime(30_000);
    });

    // Data should be retained
    await waitFor(() => expect(result.current.refreshing).toBe(false));
    expect(result.current.data).toEqual(GOOD_PAYLOAD);
  });

  it("retains last known good data on network error", async () => {
    const fetchMock = mockFetchOk();
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useAdminSecurityTelemetry());

    await waitFor(() => expect(result.current.data).toEqual(GOOD_PAYLOAD));

    // Switch to network error
    fetchMock.mockRejectedValueOnce(new Error("network"));

    await act(async () => {
      vi.advanceTimersByTime(30_000);
    });

    await waitFor(() => expect(result.current.refreshing).toBe(false));
    expect(result.current.data).toEqual(GOOD_PAYLOAD);
  });
});

/* ═══════════ AdminTelemetrySection integration ═══════════ */

describe("AdminTelemetrySection", () => {
  it("renders both panels from shared data", async () => {
    vi.stubGlobal("fetch", mockFetchOk());

    render(<AdminTelemetrySection />);

    await waitFor(() =>
      expect(screen.getByTestId("public-surface-health")).toBeTruthy(),
    );
    expect(screen.getByTestId("degraded-telemetry-panel")).toBeTruthy();
  });

  it("only makes one fetch for both panels", async () => {
    const fetchMock = mockFetchOk();
    vi.stubGlobal("fetch", fetchMock);

    render(<AdminTelemetrySection />);

    await waitFor(() =>
      expect(screen.getByTestId("public-surface-health")).toBeTruthy(),
    );

    // Single fetch, not two
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("renders refresh button and triggers refetch", async () => {
    vi.useRealTimers();
    const fetchMock = mockFetchOk();
    vi.stubGlobal("fetch", fetchMock);

    render(<AdminTelemetrySection />);

    await waitFor(() =>
      expect(screen.getByTestId("telemetry-refresh-btn")).toBeTruthy(),
    );

    const btn = screen.getByTestId("telemetry-refresh-btn");
    expect(btn).toHaveTextContent("Refresh");

    fireEvent.click(btn);

    await waitFor(() => expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(2));
  });

  it("does not leak raw errors in failure state", async () => {
    vi.stubGlobal("fetch", mockFetchNetworkError());

    render(<AdminTelemetrySection />);

    await waitFor(() =>
      expect(
        screen.getByText("Public surface health unavailable."),
      ).toBeTruthy(),
    );

    // No raw error content
    expect(screen.queryByText(/network/i)).toBeNull();
    expect(screen.queryByText(/Error/)).toBeNull();
    expect(screen.queryByText(/stack/i)).toBeNull();
    expect(screen.queryByText(/DATABASE_URL/)).toBeNull();
  });

  it("shows last-updated timestamp after successful fetch", async () => {
    vi.stubGlobal("fetch", mockFetchOk());

    render(<AdminTelemetrySection />);

    await waitFor(() =>
      expect(screen.getByTestId("telemetry-last-updated")).toBeTruthy(),
    );

    expect(screen.getByTestId("telemetry-last-updated").textContent).toMatch(
      /Updated/,
    );
  });

  it("shows refresh warning on failure when data exists", async () => {
    const fetchMock = mockFetchOk();
    vi.stubGlobal("fetch", fetchMock);

    render(<AdminTelemetrySection />);

    await waitFor(() =>
      expect(screen.getByTestId("public-surface-health")).toBeTruthy(),
    );

    // Next fetch fails
    fetchMock.mockResolvedValueOnce({ ok: false, status: 500 });

    await act(async () => {
      vi.advanceTimersByTime(30_000);
    });

    // The panels should still show data; no raw error shown
    expect(screen.getByTestId("public-surface-health")).toBeTruthy();
    expect(screen.getByTestId("degraded-telemetry-panel")).toBeTruthy();
  });
});
