import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";

export const metadata: Metadata = {
  title: "Bot Integration Guide | TruCore",
  description:
    "Learn how trading bots and agent frameworks integrate with the Agent Transaction Firewall (ATF) via hosted MCP, REST API, or OpenClaw plugin for policy-enforced, receipt-backed execution.",
};

export default function BotIntegrationGuidePage() {
  return (
    <Container>
      {/* ── Hero ── */}
      <Section className="fade-in-up">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary-200">
            Integration Guide
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-accent-200 sm:text-5xl">
            Bot Integration Guide
          </h1>
          <p className="mt-4 text-xl leading-[1.5] text-slate-200">
            ATF sits between your bot&apos;s transaction intent and on-chain
            execution. Every trade passes through policy validation and produces
            a verifiable receipt - no custody changes, no extra dependencies.
          </p>
        </div>
      </Section>

      {/* ── Architecture Diagram ── */}
      <Section divider className="fade-in-up fade-delay-1">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight text-accent-300">
            Where ATF Fits
          </h2>
          <p className="mt-4 text-lg text-slate-300">
            A typical bot execution pipeline with ATF inserted as the
            enforcement layer:
          </p>

          <Card className="mt-6">
            <pre className="overflow-x-auto text-sm leading-relaxed text-slate-200 sm:text-base">
{`Trading Bot
   ↓
Build transaction intent
   ↓
┌─────────────────────────┐
│  ATF protect endpoint   │  ← policy enforcement
│  POST /v1/bot/protect   │
└─────────────────────────┘
   ↓
Policy validation
   ↓  (approved / rejected)
Bot signs transaction
   ↓
On-chain execution
   ↓
Execution receipt
   ↓
Verification`}
            </pre>
          </Card>

          <p className="mt-4 text-base text-slate-400">
            ATF never holds keys. It validates the intent, returns an approval
            or rejection, and the bot retains full signing authority.
          </p>
        </div>
      </Section>

      {/* ── MCP Integration Path ── */}
      <Section divider className="fade-in-up fade-delay-2">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight text-accent-300">
            Hosted MCP Integration
          </h2>
          <p className="mt-4 text-lg text-slate-300">
            Agent runtimes that support the Model Context Protocol can integrate
            via the hosted MCP endpoint. ATF provides five MCP tools covering
            the full advisory-to-enforcement loop:
          </p>

          <Card className="mt-6">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <code className="shrink-0 rounded bg-neutral-800 px-2 py-0.5 text-sm text-primary-200">probe_transaction</code>
                <p className="text-sm text-slate-300">Lightweight policy pre-check (advisory)</p>
              </div>
              <div className="flex items-start gap-3">
                <code className="shrink-0 rounded bg-neutral-800 px-2 py-0.5 text-sm text-primary-200">simulate_transaction</code>
                <p className="text-sm text-slate-300">Full simulation against active policies (advisory)</p>
              </div>
              <div className="flex items-start gap-3">
                <code className="shrink-0 rounded bg-neutral-800 px-2 py-0.5 text-sm text-emerald-200">protect_transaction</code>
                <p className="text-sm text-slate-300">Binding enforcement decision (authoritative)</p>
              </div>
              <div className="flex items-start gap-3">
                <code className="shrink-0 rounded bg-neutral-800 px-2 py-0.5 text-sm text-primary-200">verify_receipt</code>
                <p className="text-sm text-slate-300">Verify receipt hash integrity</p>
              </div>
              <div className="flex items-start gap-3">
                <code className="shrink-0 rounded bg-neutral-800 px-2 py-0.5 text-sm text-primary-200">explain_decision</code>
                <p className="text-sm text-slate-300">Human-readable explanation with reason codes (advisory)</p>
              </div>
            </div>
          </Card>

          <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/[0.04] p-4">
            <p className="text-sm font-semibold text-amber-300">
              MCP does not sign or submit transactions.
            </p>
            <p className="mt-1 text-sm text-slate-400">
              The hosted MCP endpoint covers discovery through verification.
              Signing and chain submission remain on your side. Entitlement is
              tier-based and tenant-backed.
            </p>
          </div>
        </div>
      </Section>

      {/* ── Example Pseudocode ── */}
      <Section divider className="fade-in-up fade-delay-2">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight text-accent-300">
            Example: Protect a Trade
          </h2>
          <p className="mt-4 text-lg text-slate-300">
            Submit a transaction intent to ATF before signing. The response
            includes an approval status and a receipt hash.
          </p>

          <Card className="mt-6">
            <pre className="overflow-x-auto text-sm leading-relaxed text-slate-200 sm:text-base">
{`// 1. Build transaction intent
const intent = {
  action: "swap",
  inputMint:  "So11111111111111111111111111111111111111112",
  outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  amount: 1_000_000,
  slippage: 50, // bps
};

// 2. Submit to ATF protect endpoint
const res = await fetch(
  "https://api.trucore.xyz/v1/bot/protect",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ intent }),
  }
);

const { approved, receiptHash, reason } = await res.json();

// 3. Proceed only if approved
if (!approved) {
  console.error("ATF rejected:", reason);
  process.exit(1);
}

// 4. Sign and send the transaction
const sig = await signAndSend(intent);

// 5. Verify execution receipt
await verify(sig, receiptHash);`}
            </pre>
          </Card>
        </div>
      </Section>

      {/* ── Key Points ── */}
      <Section divider className="fade-in-up fade-delay-3">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight text-accent-300">
            Key Points
          </h2>
          <ul className="mt-4 space-y-3 text-base text-slate-200">
            <li className="flex items-start gap-3">
              <span className="mt-0.5 text-primary-200">&#x2713;</span>
              Non-custodial - your bot keeps its keys
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 text-primary-200">&#x2713;</span>
              Single HTTP call adds policy enforcement
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 text-primary-200">&#x2713;</span>
              Works with any language or framework that can make HTTP requests
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 text-primary-200">&#x2713;</span>
              Deterministic receipt per trade for audit and compliance
            </li>
          </ul>
        </div>
      </Section>

      {/* ── Quickstart callout ── */}
      <Section divider className="fade-in-up">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-lg border border-primary-300/20 bg-primary-500/[0.06] p-5">
            <p className="text-lg text-slate-200">
              Want to test before integrating?{" "}
              <Link
                href="/quickstart"
                className="font-semibold text-primary-200 underline decoration-primary-300/30 underline-offset-2 transition-colors hover:text-primary-100 hover:decoration-primary-200/50"
              >
                Quickstart
              </Link>{" "}
              - copy-paste a protected transaction in under 60 seconds.
            </p>
          </div>
        </div>
      </Section>

      {/* ── References ── */}
      <Section divider className="fade-in-up fade-delay-4">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight text-accent-300">
            Next Steps
          </h2>
          <ul className="mt-4 space-y-2 text-lg text-slate-200">
            <li>
              <Link
                href="/docs/first-protected-trade"
                className="font-semibold text-primary-200 transition-colors hover:text-primary-100"
              >
                First Protected Trade →
              </Link>
            </li>
            <li>
              <Link
                href="/examples/protected-swap"
                className="font-semibold text-primary-200 transition-colors hover:text-primary-100"
              >
                Protected Swap Example →
              </Link>
            </li>
            <li>
              <Link
                href="/builders"
                className="font-semibold text-primary-200 transition-colors hover:text-primary-100"
              >
                Builders Portal →
              </Link>
            </li>
          </ul>
        </div>
      </Section>
    </Container>
  );
}
