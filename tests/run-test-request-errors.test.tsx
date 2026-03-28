import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";

vi.mock("@/lib/verify-demo-data", () => ({
  FALLBACK_RESULT: {
    decision: "ALLOW",
    receipt_hash: "fallback_hash",
    policy_breakdown: [
      { policy: "slippage_guard", result: "PASS", reason: "within tolerance" },
    ],
  },
}));

import RunTestRequest from "@/components/run-test-request";

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("RunTestRequest — error mapping", () => {
  it("shows network error message on fetch failure", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(
      new TypeError("Failed to fetch"),
    );

    render(<RunTestRequest apiKey="key_1" />);
    const btn = screen.getByRole("button", { name: /run test request/i });
    fireEvent.click(btn);

    await waitFor(() => {
      expect(
        screen.getByText(/couldn't reach the sandbox service/i),
      ).toBeInTheDocument();
    });

    // Raw "Failed to fetch" should NOT appear
    expect(screen.queryByText("Failed to fetch")).not.toBeInTheDocument();
  });

  it("shows rate-limit message on 429", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "rate_limited" }), {
        status: 429,
      }),
    );

    render(<RunTestRequest apiKey="key_1" />);
    fireEvent.click(
      screen.getByRole("button", { name: /run test request/i }),
    );

    await waitFor(() => {
      expect(
        screen.getByText(/rate limit reached/i),
      ).toBeInTheDocument();
    });
  });

  it("shows upstream unavailable message on 502", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({ error: "upstream_unavailable" }),
        { status: 502 },
      ),
    );

    render(<RunTestRequest apiKey="key_1" />);
    fireEvent.click(
      screen.getByRole("button", { name: /run test request/i }),
    );

    await waitFor(() => {
      expect(
        screen.getByText(/sandbox is temporarily unavailable/i),
      ).toBeInTheDocument();
    });
  });

  it("shows invalid response message on bad JSON", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("not json", {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    render(<RunTestRequest apiKey="key_1" />);
    fireEvent.click(
      screen.getByRole("button", { name: /run test request/i }),
    );

    await waitFor(() => {
      expect(
        screen.getByText(/invalid response from the sandbox/i),
      ).toBeInTheDocument();
    });
  });
});
