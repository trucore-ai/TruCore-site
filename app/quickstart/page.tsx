import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Card } from "@/components/ui/card";
import { CopyBlock } from "@/components/copy-block";

export const metadata: Metadata = {
  title: "Quickstart — Protect Your First Transaction | TruCore",
  description:
    "Run a protected transaction through ATF in under 60 seconds. Copy-paste examples for intent protection, execution, and receipt verification.",
};

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

const CLI_EXECUTE = `atf bot send --tx-base64 <BASE64_TX_FROM_STEP_1>`;

export default function QuickstartPage() {
  return (
    <Container>
      {/* ── Hero ── */}
      <Section id="hero" className="fade-in-up">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary-200">
            Quickstart
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-accent-200 sm:text-5xl">
            Quickstart — Protect Your First Transaction
          </h1>
          <p className="mt-6 text-xl leading-[1.6] text-slate-200">
            Run a protected transaction through ATF in under 60 seconds.
          </p>
        </div>
      </Section>

      {/* ── Step 1 — Protect intent ── */}
      <Section id="step-1" divider className="fade-in-up fade-delay-1">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight text-accent-300">
            <span className="mr-2 font-mono text-sm text-primary-200">01</span>
            Protect intent
          </h2>
          <p className="mt-4 text-lg leading-[1.5] text-slate-300">
            Submit a swap intent to the ATF protect endpoint. The firewall
            evaluates it against your active policies and returns a permit or
            denial.
          </p>
          <div className="mt-6">
            <CopyBlock
              label="curl — POST /v1/bot/protect"
              value={CURL_PROTECT}
              copyButtonLabel="Copy"
            />
          </div>
        </div>
      </Section>

      {/* ── Step 2 — Execute transaction ── */}
      <Section id="step-2" divider className="fade-in-up fade-delay-2">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight text-accent-300">
            <span className="mr-2 font-mono text-sm text-primary-200">02</span>
            Execute transaction
          </h2>
          <p className="mt-4 text-lg leading-[1.5] text-slate-300">
            Once the intent is approved, execute the transaction using the ATF
            CLI. Pass the base64-encoded transaction payload returned from
            step&nbsp;1.
          </p>
          <div className="mt-6">
            <CopyBlock
              label="CLI — send the approved transaction"
              value={CLI_EXECUTE}
              copyButtonLabel="Copy"
            />
          </div>
        </div>
      </Section>

      {/* ── Step 3 — Verify receipt ── */}
      <Section id="step-3" divider className="fade-in-up fade-delay-3">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight text-accent-300">
            <span className="mr-2 font-mono text-sm text-primary-200">03</span>
            Verify receipt
          </h2>
          <p className="mt-4 text-lg leading-[1.5] text-slate-300">
            Every executed transaction produces a deterministic receipt. Verify
            it independently to confirm the transaction matched the approved
            intent.
          </p>
          <Card className="mt-6">
            <p className="text-base text-slate-200">
              Open the{" "}
              <Link
                href="/verify"
                className="font-medium text-accent-300 underline decoration-accent-300/30 underline-offset-2 transition-colors hover:text-accent-200 hover:decoration-accent-200/50"
              >
                Receipt Verification
              </Link>{" "}
              page and paste the receipt hash returned from step&nbsp;2 to
              confirm execution integrity.
            </p>
          </Card>
        </div>
      </Section>

      {/* ── Next steps ── */}
      <Section id="next-steps" divider className="fade-in-up fade-delay-4">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight text-accent-300">
            Next Steps
          </h2>
          <ul className="mt-6 space-y-3 text-lg text-slate-300">
            <li>
              <Link
                href="/examples/protected-swap"
                className="font-medium text-accent-300 underline decoration-accent-300/30 underline-offset-2 transition-colors hover:text-accent-200 hover:decoration-accent-200/50"
              >
                Protected Swap Example
              </Link>{" "}
              — end-to-end walkthrough of a shielded swap
            </li>
            <li>
              <Link
                href="/integrations/bot"
                className="font-medium text-accent-300 underline decoration-accent-300/30 underline-offset-2 transition-colors hover:text-accent-200 hover:decoration-accent-200/50"
              >
                Bot Integration Guide
              </Link>{" "}
              — wire ATF into your trading bot
            </li>
            <li>
              <Link
                href="/how-it-works"
                className="font-medium text-accent-300 underline decoration-accent-300/30 underline-offset-2 transition-colors hover:text-accent-200 hover:decoration-accent-200/50"
              >
                How ATF Works
              </Link>{" "}
              — architecture overview and execution flow
            </li>
          </ul>
        </div>
      </Section>
    </Container>
  );
}
