/* ────────────────────────────────────────────────────────────────
 *  PortalFirstProtectedTrade — quick-copy activation block
 *
 *  Gives portal users a practical "do this next" starting point
 *  by surfacing the canonical curl command from the documented
 *  first-protected-trade flow with a copy affordance.
 *
 *  Visibility by activation state:
 *    zero_activity  → prominent (accent border)
 *    early_activity → standard (subtle border)
 *    active_usage   → hidden
 *
 *  Uses the existing CopyBlock component for clipboard interaction.
 * ──────────────────────────────────────────────────────────── */

"use client";

import Link from "next/link";
import { CopyBlock } from "@/components/copy-block";
import type { PortalActivationState } from "@/lib/portal-activation";

type Props = {
  activationState: PortalActivationState;
};

const CURL_SNIPPET = `curl -sS https://api.trucore.xyz/v1/bot/protect \\
  -H "Content-Type: application/json" \\
  -d '{
    "chain_id": "solana",
    "intent_type": "swap",
    "intent": {
      "type": "swap",
      "in_mint": "So11111111111111111111111111111111111111112",
      "out_mint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      "amount_in": 1000000,
      "slippage_bps": 50,
      "agent_id": "my-bot-v1"
    }
  }'`;

export function PortalFirstProtectedTrade({ activationState }: Props) {
  if (activationState === "active_usage") {
    return null;
  }

  const isZero = activationState === "zero_activity";

  return (
    <section
      className={`space-y-3 rounded-xl border p-5 ${
        isZero
          ? "border-accent-500/30 bg-accent-500/[0.04]"
          : "border-white/10 bg-white/[0.02]"
      }`}
    >
      <div className="space-y-1">
        <h2
          className={`text-lg font-semibold ${
            isZero ? "text-accent-200" : "text-slate-200"
          }`}
        >
          First protected trade
        </h2>
        <p className="text-sm text-slate-300">
          Use this as a starting point to run or adapt your first ATF-protected
          flow. For full setup and walkthroughs, use the linked guides.
        </p>
      </div>

      <CopyBlock
        label="curl — protect a swap intent"
        value={CURL_SNIPPET}
        copyButtonLabel="Copy"
        helperText="Replace the endpoint with your local instance if running locally. This command sends a swap intent to the firewall and returns a permit or denial with reason codes."
      />

      <div className="flex flex-wrap gap-4 pt-1 text-sm">
        <Link
          href="/docs/first-protected-trade"
          className="font-medium text-accent-300 underline decoration-accent-300/30 underline-offset-2 transition-colors hover:text-accent-200 hover:decoration-accent-200/50"
        >
          First protected trade guide
        </Link>
        <Link
          href="/docs/5-minute-quickstart"
          className="font-medium text-slate-400 underline decoration-slate-500/30 underline-offset-2 transition-colors hover:text-slate-300 hover:decoration-slate-400/50"
        >
          5-minute quickstart
        </Link>
      </div>
    </section>
  );
}
