import type { AdaptivePilStatus, AutoDynamicPilMode } from "@/lib/customer-auth";

export type AdaptiveTone = "emerald" | "amber" | "slate";

export interface AdaptiveLatestEventView {
  statusLabel: string;
  statusTone: AdaptiveTone;
  title: string;
  fieldLabel: string | null;
  changeLabel: string | null;
  detail: string;
  occurredAt: number | null;
}

export interface AdaptiveStatusView {
  modeLabel: string;
  modeTone: AdaptiveTone;
  scopeLabel: string;
  boundedLabel: string;
  boundedTone: AdaptiveTone;
  eligibilityLabel: string;
  eligibilityTone: AdaptiveTone;
  eligibleFieldLabels: string[];
  pendingCount: number;
  pendingLabel: string;
  pendingTone: AdaptiveTone;
  pendingDetail: string;
  expectation: string;
  latestEvent: AdaptiveLatestEventView | null;
}

const MODE_LABELS: Record<AutoDynamicPilMode, string> = {
  off: "Off",
  recommend: "Recommend",
  auto_bounded: "Auto (bounded)",
};

const FIELD_LABELS: Record<string, string> = {
  max_slippage_bps: "Max slippage",
  max_notional_usd: "Max transaction value (USD)",
  max_value_sol: "Max value (SOL)",
  require_simulation_success: "Simulation requirement",
};

const RECOMMENDATION_REASON_COPY: Record<string, string> = {
  stable_market_no_change:
    "Recent same-market activity looked stable, so the current bounded setting still fits the next trade.",
  recent_slippage_pressure:
    "Recent same-market trades showed slippage pressure, so the next trade may receive a slightly wider bounded cap.",
  recent_slippage_headroom:
    "Recent same-market trades showed slippage headroom, so the next trade may receive a tighter bounded cap.",
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function prettify(value: string): string {
  return value.replace(/_/g, " ");
}

export function formatAdaptiveFieldLabel(field: string): string {
  return FIELD_LABELS[field] ?? prettify(field);
}

function formatAdaptiveValue(field: string | null, value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    if (field === "max_slippage_bps") return `${value.toLocaleString()} bps`;
    if (field === "max_notional_usd") return `$${value.toLocaleString()}`;
    if (field === "max_value_sol") return `${value.toLocaleString()} SOL`;
    return value.toLocaleString();
  }

  if (typeof value === "boolean") {
    return value ? "Required" : "Optional";
  }

  return null;
}

function modeTone(mode: AutoDynamicPilMode): AdaptiveTone {
  if (mode === "auto_bounded") return "emerald";
  if (mode === "recommend") return "amber";
  return "slate";
}

function expectationCopy(mode: AutoDynamicPilMode, pendingCount: number): string {
  if (pendingCount > 0) {
    return "On the next same-market transaction, the backend may consume a queued bounded overlay before it expires.";
  }
  if (mode === "recommend") {
    return "On the next qualifying transaction, the backend can surface a recommendation without changing your saved defaults.";
  }
  if (mode === "auto_bounded") {
    return "On the next qualifying transaction, the backend may queue or apply a bounded same-market adjustment if conditions justify it.";
  }
  return "With adaptive mode off, the next transaction will use your current effective policy without adaptive overlays.";
}

function deriveRecommendationEventView(event: Record<string, unknown>): AdaptiveLatestEventView {
  const field = asString(event.field);
  const current = asNumber(event.current);
  const recommended = asNumber(event.recommended);
  const reason = asString(event.reason);
  const fieldLabel = field ? formatAdaptiveFieldLabel(field) : null;

  let title = "Bounded recommendation prepared";
  if (current !== null && recommended !== null) {
    if (recommended > current) title = "Higher bound recommended";
    else if (recommended < current) title = "Tighter bound recommended";
    else title = "Current bound confirmed";
  }

  const changeLabel =
    current !== null && recommended !== null
      ? `${formatAdaptiveValue(field, current)} → ${formatAdaptiveValue(field, recommended)}`
      : recommended !== null
        ? `Target ${formatAdaptiveValue(field, recommended)}`
        : null;

  return {
    statusLabel: "Recommendation only",
    statusTone: "amber",
    title,
    fieldLabel,
    changeLabel,
    detail:
      (reason && RECOMMENDATION_REASON_COPY[reason]) ??
      "The backend generated a bounded recommendation for the next same-market transaction.",
    occurredAt: asNumber(event.at),
  };
}

function deriveAppliedEventView(event: Record<string, unknown>): AdaptiveLatestEventView {
  const overrides = asRecord(event.overrides);
  const overrideEntry = overrides
    ? Object.entries(overrides).find(([, value]) => value !== undefined)
    : undefined;
  const field = overrideEntry?.[0] ?? null;
  const fieldLabel = field ? formatAdaptiveFieldLabel(field) : null;
  const overrideValue = overrideEntry ? formatAdaptiveValue(field, overrideEntry[1]) : null;

  return {
    statusLabel: "Overlay applied",
    statusTone: "emerald",
    title: fieldLabel ? `${fieldLabel} temporarily adjusted` : "Adaptive overlay applied",
    fieldLabel,
    changeLabel: overrideValue ? `Set to ${overrideValue}` : null,
    detail:
      "A queued bounded override was applied to the next matching transaction and did not change your durable defaults.",
    occurredAt: asNumber(event.at),
  };
}

function deriveExpiredEventView(event: Record<string, unknown>): AdaptiveLatestEventView {
  const reason = asString(event.reason);
  return {
    statusLabel: "Overlay expired",
    statusTone: "slate",
    title: "Queued overlay expired",
    fieldLabel: null,
    changeLabel: null,
    detail:
      reason === "expired_before_use"
        ? "A queued bounded override expired before a matching transaction used it."
        : "A queued adaptive overlay expired before it could be used.",
    occurredAt: asNumber(event.at),
  };
}

function deriveLatestEventView(event: unknown): AdaptiveLatestEventView | null {
  const record = asRecord(event);
  if (!record) return null;

  const eventName = asString(record.event);
  if (eventName === "recommendation_produced") return deriveRecommendationEventView(record);
  if (eventName === "adaptive_override_applied") return deriveAppliedEventView(record);
  if (eventName === "adaptive_override_expired") return deriveExpiredEventView(record);

  return {
    statusLabel: "Event recorded",
    statusTone: "slate",
    title: eventName ? prettify(eventName) : "Adaptive activity recorded",
    fieldLabel: null,
    changeLabel: null,
    detail:
      "The backend reported adaptive activity, but the current payload did not include additional structured detail for display.",
    occurredAt: asNumber(record.at),
  };
}

export function deriveAdaptiveStatusView(adaptive?: AdaptivePilStatus): AdaptiveStatusView {
  const mode = adaptive?.mode ?? "off";
  const eligible = Boolean(adaptive?.eligible);
  const pendingCount = typeof adaptive?.pending_overlays === "number" ? adaptive.pending_overlays : 0;
  const eligibleFieldLabels = Array.isArray(adaptive?.eligible_fields)
    ? adaptive.eligible_fields
        .filter((field): field is string => typeof field === "string" && field.length > 0)
        .map((field) => formatAdaptiveFieldLabel(field))
    : [];

  const pendingLabel =
    pendingCount > 0
      ? pendingCount === 1
        ? "Pending next-trade adjustment"
        : `${pendingCount} pending next-trade adjustments`
      : "No pending overlay";

  const pendingDetail =
    pendingCount > 0
      ? pendingCount === 1
        ? "A bounded same-market override is queued for the next matching transaction."
        : "Bounded same-market overrides are queued for the next matching transactions."
      : mode === "off"
        ? "Adaptive mode is off, so no next-trade overlay is currently queued."
        : "No bounded overlay is currently queued for the next matching transaction.";

  return {
    modeLabel: MODE_LABELS[mode] ?? prettify(mode),
    modeTone: modeTone(mode),
    scopeLabel:
      adaptive?.scope === "same_market_next_transaction"
        ? "Same market · next transaction"
        : typeof adaptive?.scope === "string"
          ? prettify(adaptive.scope)
          : "Unknown",
    boundedLabel: adaptive?.bounded ? "Bounded" : "Unbounded",
    boundedTone: adaptive?.bounded ? "emerald" : "slate",
    eligibilityLabel: eligible ? "Eligible" : "Read-only on current plan",
    eligibilityTone: eligible ? "emerald" : "slate",
    eligibleFieldLabels,
    pendingCount,
    pendingLabel,
    pendingTone: pendingCount > 0 ? "amber" : "slate",
    pendingDetail,
    expectation: expectationCopy(mode, pendingCount),
    latestEvent: deriveLatestEventView(adaptive?.latest_event),
  };
}