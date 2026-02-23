import { sha256 } from "@/lib/hash";

export type SimRequest = {
  action: string;
  token_in: string;
  token_out: string;
  amount: number;
  max_slippage_bps: number;
  ttl_seconds: number;
};

export type SimStatus = "allowed" | "denied";

export type SimResult = {
  status: SimStatus;
  reason: string;
  invariant_checks: string[];
  receipt_hash: string;
};

const MAX_AMOUNT = 1000;
const MAX_SLIPPAGE_BPS = 300;
const MAX_TTL_SECONDS = 300;

export function isSimRequest(value: unknown): value is SimRequest {
  if (!value || typeof value !== "object") {
    return false;
  }

  const input = value as Record<string, unknown>;
  return (
    typeof input.action === "string" &&
    typeof input.token_in === "string" &&
    typeof input.token_out === "string" &&
    typeof input.amount === "number" &&
    Number.isFinite(input.amount) &&
    typeof input.max_slippage_bps === "number" &&
    Number.isFinite(input.max_slippage_bps) &&
    typeof input.ttl_seconds === "number" &&
    Number.isFinite(input.ttl_seconds)
  );
}

export function normalizeSimRequest(input: SimRequest): SimRequest {
  return {
    action: input.action,
    token_in: input.token_in,
    token_out: input.token_out,
    amount: input.amount,
    max_slippage_bps: input.max_slippage_bps,
    ttl_seconds: input.ttl_seconds,
  };
}

export function simulatePolicy(input: SimRequest): SimResult {
  const normalized = normalizeSimRequest(input);

  const checks = [
    normalized.amount <= MAX_AMOUNT
      ? `amount <= ${MAX_AMOUNT}: pass`
      : `amount <= ${MAX_AMOUNT}: fail`,
    normalized.max_slippage_bps <= MAX_SLIPPAGE_BPS
      ? `max_slippage_bps <= ${MAX_SLIPPAGE_BPS}: pass`
      : `max_slippage_bps <= ${MAX_SLIPPAGE_BPS}: fail`,
    normalized.ttl_seconds <= MAX_TTL_SECONDS
      ? `ttl_seconds <= ${MAX_TTL_SECONDS}: pass`
      : `ttl_seconds <= ${MAX_TTL_SECONDS}: fail`,
  ];

  if (normalized.amount > MAX_AMOUNT) {
    return {
      status: "denied",
      reason: `Amount exceeds max demo limit (${MAX_AMOUNT}).`,
      invariant_checks: checks,
      receipt_hash: sha256(JSON.stringify(normalized)),
    };
  }

  if (normalized.max_slippage_bps > MAX_SLIPPAGE_BPS) {
    return {
      status: "denied",
      reason: `Slippage exceeds max demo limit (${MAX_SLIPPAGE_BPS} bps).`,
      invariant_checks: checks,
      receipt_hash: sha256(JSON.stringify(normalized)),
    };
  }

  if (normalized.ttl_seconds > MAX_TTL_SECONDS) {
    return {
      status: "denied",
      reason: `TTL exceeds max demo limit (${MAX_TTL_SECONDS} seconds).`,
      invariant_checks: checks,
      receipt_hash: sha256(JSON.stringify(normalized)),
    };
  }

  return {
    status: "allowed",
    reason: "Request satisfies demo policy limits.",
    invariant_checks: checks,
    receipt_hash: sha256(JSON.stringify(normalized)),
  };
}