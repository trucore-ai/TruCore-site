/**
 * Shared data structures for the /verify-demo page and its
 * machine-readable JSON output mode (?format=json).
 */

export type ProtectResult = {
  decision: string;
  reason?: string;
  policy_breakdown?: Record<string, unknown>[];
  receipt?: Record<string, unknown>;
  receipt_hash?: string;
  [key: string]: unknown;
};

/* ── Fallback verified receipt ── */
export const FALLBACK_RESULT: ProtectResult = {
  decision: "ALLOW",
  policy_breakdown: [
    {
      policy: "token_allowlist",
      result: "PASS",
      reason:
        "Both input (SOL) and output (USDC) mints are on the approved token allowlist.",
    },
    {
      policy: "amount_cap",
      result: "PASS",
      reason:
        "Requested amount of 1 000 000 lamports (0.001 SOL) is within the 0.01 SOL sandbox cap.",
    },
    {
      policy: "slippage_guard",
      result: "PASS",
      reason: "Slippage of 50 bps (0.5%) is within the 300 bps maximum.",
    },
  ],
  receipt: {
    receipt_id: "a1c3e5f7-2b4d-4e6f-8a0c-9d1b3e5f7a2c",
    timestamp: 1742900400,
    decision: "ALLOW",
    execution_mode: "mock",
    content_hash:
      "b7e23ec29af22b0b4e41da31e868d57226121c84b0b0a35e6e1b97f1d1282e56",
    intent_summary: {
      input_mint: "So11111111111111111111111111111111111111112",
      output_mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      amount_lamports: 1000000,
      protocol: "jupiter",
    },
    protected_by: "ATF",
    public_sandbox: true,
    mock_note:
      "This is a sandbox evaluation - no on-chain transaction was sent.",
  },
  receipt_hash:
    "b7e23ec29af22b0b4e41da31e868d57226121c84b0b0a35e6e1b97f1d1282e56",
  public_sandbox: true,
  execution_mode: "mock",
};

/* ── JSON output structure for agents ── */
export type VerifyDemoJson = {
  status: "verified";
  decision: "ALLOW" | "DENY";
  receipt_hash: string;
  policy_summary: { rule: string; result: string }[];
  source: "trucore_atf";
  verifiable: true;
  mode: "live" | "fallback";
  receipt_id?: string;
  content_hash?: string;
  intent_summary?: Record<string, unknown>;
};

export function buildVerifyJson(
  data: ProtectResult,
  mode: "live" | "fallback",
): VerifyDemoJson {
  const decision = (data.decision ?? "DENY").toUpperCase() as "ALLOW" | "DENY";

  const policy_summary = Array.isArray(data.policy_breakdown)
    ? data.policy_breakdown.map((rule) => ({
        rule: String(
          (rule as Record<string, unknown>).policy ?? "unknown",
        ),
        result: String(
          (rule as Record<string, unknown>).result ?? "unknown",
        ).toLowerCase(),
      }))
    : [];

  const receipt = data.receipt as Record<string, unknown> | undefined;

  const json: VerifyDemoJson = {
    status: "verified",
    decision,
    receipt_hash: data.receipt_hash ?? "",
    policy_summary,
    source: "trucore_atf",
    verifiable: true,
    mode,
  };

  if (receipt?.receipt_id) json.receipt_id = String(receipt.receipt_id);
  if (receipt?.content_hash) json.content_hash = String(receipt.content_hash);
  if (receipt?.intent_summary && typeof receipt.intent_summary === "object") {
    json.intent_summary = receipt.intent_summary as Record<string, unknown>;
  }

  return json;
}
