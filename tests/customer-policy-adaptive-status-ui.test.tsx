/**
 * customer-policy-adaptive-status-ui.test.tsx
 *
 * Focused tests for the adaptive status/activity mapping used by /customer/policies.
 */

import { describe, expect, it } from "vitest";

import { deriveAdaptiveStatusView } from "@/lib/policy-adaptive-status";

describe("deriveAdaptiveStatusView", () => {
  it("maps empty/no-event state cleanly", () => {
    const status = deriveAdaptiveStatusView({
      mode: "recommend",
      eligible: true,
      eligible_fields: ["max_slippage_bps"],
      scope: "same_market_next_transaction",
      bounded: true,
      pending_overlays: 0,
      latest_event: null,
    });

    expect(status.modeLabel).toBe("Recommend");
    expect(status.scopeLabel).toBe("Same market · next transaction");
    expect(status.boundedLabel).toBe("Bounded");
    expect(status.eligibilityLabel).toBe("Eligible");
    expect(status.eligibleFieldLabels).toEqual(["Max slippage"]);
    expect(status.pendingLabel).toBe("No pending overlay");
    expect(status.expectation).toMatch(/surface a recommendation/i);
    expect(status.latestEvent).toBeNull();
  });

  it("maps queued overlay state honestly", () => {
    const status = deriveAdaptiveStatusView({
      mode: "auto_bounded",
      eligible: true,
      eligible_fields: ["max_slippage_bps"],
      scope: "same_market_next_transaction",
      bounded: true,
      pending_overlays: 1,
      latest_event: null,
    });

    expect(status.pendingCount).toBe(1);
    expect(status.pendingLabel).toBe("Pending next-trade adjustment");
    expect(status.pendingDetail).toMatch(/queued/i);
    expect(status.expectation).toMatch(/queued bounded overlay/i);
  });

  it("maps recommendation-only latest events with field and before-after values", () => {
    const status = deriveAdaptiveStatusView({
      mode: "recommend",
      eligible: true,
      eligible_fields: ["max_slippage_bps"],
      scope: "same_market_next_transaction",
      bounded: true,
      pending_overlays: 0,
      latest_event: {
        event: "recommendation_produced",
        at: 1_713_607_200,
        field: "max_slippage_bps",
        current: 500,
        recommended: 525,
        reason: "recent_slippage_pressure",
      },
    });

    expect(status.latestEvent).toMatchObject({
      statusLabel: "Recommendation only",
      fieldLabel: "Max slippage",
      changeLabel: "500 bps → 525 bps",
      occurredAt: 1_713_607_200,
    });
    expect(status.latestEvent?.detail).toMatch(/slippage pressure/i);
  });

  it("maps overlay-applied events without inventing unsupported detail", () => {
    const status = deriveAdaptiveStatusView({
      mode: "auto_bounded",
      eligible: true,
      eligible_fields: ["max_slippage_bps"],
      scope: "same_market_next_transaction",
      bounded: true,
      pending_overlays: 0,
      latest_event: {
        event: "adaptive_override_applied",
        at: 1_713_607_201,
        overrides: { max_slippage_bps: 525 },
      },
    });

    expect(status.latestEvent).toMatchObject({
      statusLabel: "Overlay applied",
      fieldLabel: "Max slippage",
      changeLabel: "Set to 525 bps",
      occurredAt: 1_713_607_201,
    });
    expect(status.latestEvent?.detail).toMatch(/durable defaults/i);
  });

  it("falls back gracefully when latest_event has limited detail", () => {
    const status = deriveAdaptiveStatusView({
      mode: "recommend",
      eligible: false,
      eligible_fields: [],
      scope: "same_market_next_transaction",
      bounded: true,
      pending_overlays: 0,
      latest_event: {
        event: "backend_custom_event",
      },
    });

    expect(status.eligibilityLabel).toBe("Read-only on current plan");
    expect(status.latestEvent).toMatchObject({
      statusLabel: "Event recorded",
      title: "backend custom event",
    });
    expect(status.latestEvent?.detail).toMatch(/did not include additional structured detail/i);
  });
});