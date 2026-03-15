import type { Metadata } from "next";
import Link from "next/link";
import { CopyBlock } from "@/components/copy-block";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";

export const metadata: Metadata = {
  title: "Protected Swap Example",
  description:
    "Runnable example showing the full ATF execution lifecycle: protect, send, and verify a swap intent.",
};

/* ── canonical curl from docs/first-protected-trade ── */
const CURL_PROTECT = `curl -sS https://api.trucore.xyz/v1/bot/protect \\
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

export default function ProtectedSwapExamplePage() {
  return (
    <Container>
      <Section className="fade-in-up">
        <div className="max-w-3xl space-y-10">
          {/* ── Header ── */}
          <div className="space-y-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
              Runnable Example
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-accent-200 sm:text-6xl">
              Protected Swap Example
            </h1>
            <p className="text-xl leading-[1.5] text-slate-300">
              This example shows how an agent or trading bot routes a
              transaction through the Agent Transaction Firewall before
              execution.
            </p>
            <p className="text-sm text-slate-500">
              The full lifecycle is three steps:{" "}
              <span className="font-semibold text-slate-400">protect</span> →{" "}
              <span className="font-semibold text-slate-400">send</span> →{" "}
              <span className="font-semibold text-slate-400">verify</span>.
            </p>
          </div>

          {/* ── Step 1: Protect ── */}
          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-slate-100">
              Step 1: Protect the swap intent
            </h2>
            <p className="text-sm leading-relaxed text-slate-400">
              Send the swap intent to the ATF. The firewall evaluates the
              intent against the active policy and returns a permit or denial
              with reason codes.
            </p>
            <CopyBlock
              label="curl — protect a swap intent"
              value={CURL_PROTECT}
              copyButtonLabel="Copy"
              helperText="Replace the endpoint with your local instance if running locally."
            />
          </section>

          {/* ── Step 2: Send ── */}
          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-slate-100">
              Step 2: Send the transaction{" "}
              <span className="text-base font-normal text-slate-500">
                (optional)
              </span>
            </h2>
            <p className="text-sm leading-relaxed text-slate-400">
              After the firewall returns a permit, your bot or agent signs and
              submits the transaction to the network. This step is handled
              entirely by your execution layer — no wallet integration is
              required from the ATF side.
            </p>
            <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-4">
              <p className="text-sm text-slate-400">
                The ATF does not sign or broadcast transactions. It validates
                intent and produces a receipt. Your bot retains full control of
                signing and submission.
              </p>
            </div>
          </section>

          {/* ── Step 3: Verify ── */}
          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-slate-100">
              Step 3: Verify the execution receipt
            </h2>
            <p className="text-sm leading-relaxed text-slate-400">
              Every protected execution produces a deterministic receipt. You
              can verify the receipt independently to confirm the execution
              occurred under the declared policy.
            </p>
            <p className="text-sm text-slate-400">
              Use the{" "}
              <Link
                href="/verify"
                className="font-semibold text-primary-200 underline decoration-primary-300/30 underline-offset-2 transition-colors hover:text-primary-100 hover:decoration-primary-200/50"
              >
                Verify Receipt
              </Link>{" "}
              page to paste any receipt hash and confirm its integrity.
            </p>
          </section>

          {/* ── Visual flow ── */}
          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-slate-100">
              Execution flow
            </h2>
            <div className="rounded-xl border border-white/[0.08] bg-neutral-950/70 p-6 font-mono text-sm leading-loose text-slate-300">
              <p>Agent</p>
              <p className="text-slate-600">&nbsp;&nbsp; ↓</p>
              <p>ATF protect</p>
              <p className="text-slate-600">&nbsp;&nbsp; ↓</p>
              <p>Policy validation</p>
              <p className="text-slate-600">&nbsp;&nbsp; ↓</p>
              <p>Execution receipt</p>
              <p className="text-slate-600">&nbsp;&nbsp; ↓</p>
              <p>Verify</p>
            </div>
          </section>

          {/* ── Navigation links ── */}
          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-slate-100">
              Next steps
            </h2>
            <ul className="list-disc space-y-2 pl-5 text-sm text-slate-400">
              <li>
                <Link
                  href="/docs/first-protected-trade"
                  className="font-medium text-accent-300 underline decoration-accent-300/30 underline-offset-2 transition-colors hover:text-accent-200 hover:decoration-accent-200/50"
                >
                  First protected trade guide
                </Link>{" "}
                — full walkthrough with policy setup
              </li>
              <li>
                <Link
                  href="/builders"
                  className="font-medium text-accent-300 underline decoration-accent-300/30 underline-offset-2 transition-colors hover:text-accent-200 hover:decoration-accent-200/50"
                >
                  For bot builders
                </Link>{" "}
                — integration paths and audience-specific guidance
              </li>
              <li>
                <Link
                  href="/verify"
                  className="font-medium text-accent-300 underline decoration-accent-300/30 underline-offset-2 transition-colors hover:text-accent-200 hover:decoration-accent-200/50"
                >
                  Verify receipt
                </Link>{" "}
                — independent hash verification utility
              </li>
            </ul>
          </section>
        </div>
      </Section>
    </Container>
  );
}
