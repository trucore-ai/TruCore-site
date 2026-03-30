import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { TryAtfFlow } from "@/components/try-atf-flow";
import { ApiKeySection } from "@/components/api-key-section";
import { TrackedLink } from "@/components/tracked-link";

export const metadata: Metadata = {
  title: "Try ATF",
  description:
    "Try the Agent Transaction Firewall instantly - no signup required. See policy enforcement and receipts in action.",
};

export default function TryPage() {
  return (
    <Container>
      <Section className="fade-in-up">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary-200">
            Public Sandbox
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-accent-200 sm:text-6xl">
            Protect a sample trade
          </h1>
          <p className="mt-4 text-xl leading-[1.5] text-slate-200">
            Load a sample Solana trade, run it through ATF, and inspect the
            policy decision and receipt.
          </p>
          <p className="mt-3 text-sm text-slate-400">
            Public sandbox - no real transactions, no fees. Rate limited per IP.
          </p>
          <p className="mt-2 text-sm text-slate-300">
            No setup required for demo. No risk to try.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <TrackedLink
              href="#first-trade-flow"
              eventName="try_start_first_trade_click"
              eventProps={{ location: "try_header" }}
              className="inline-flex items-center justify-center rounded-xl bg-accent-500 px-6 py-3 text-base font-semibold text-neutral-950 transition-colors hover:bg-accent-400"
            >
              Start Your First Protected Trade
            </TrackedLink>
            <TrackedLink
              href="/verify-demo"
              eventName="try_verify_demo_click"
              eventProps={{ location: "try_header" }}
              className="inline-flex items-center justify-center rounded-xl border border-primary-300/30 px-6 py-3 text-base font-semibold text-primary-200 transition-colors hover:bg-primary-500/10"
            >
              Verify Demo First
            </TrackedLink>
          </div>
          <div className="mt-5 max-w-2xl rounded-lg border border-primary-300/20 bg-primary-500/[0.06] p-4">
            <p className="text-sm font-semibold text-primary-100">What happens next:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
              <li>You submit a transaction</li>
              <li>ATF evaluates policy</li>
              <li>You receive a decision and receipt</li>
            </ul>
            <p className="mt-3 text-sm text-slate-300">
              You stay in control. You can start in safe mode with no real execution.
            </p>
          </div>
        </div>
      </Section>

      <Section divider className="pt-0 fade-in-up fade-delay-1">
        <div className="mx-auto max-w-3xl rounded-xl border border-white/[0.08] bg-neutral-900/40 p-6">
          <h2 className="text-2xl font-bold tracking-tight text-accent-300">
            Make Your First Protected Trade
          </h2>
          <p className="mt-3 text-base text-slate-200">
            You can test ATF safely before using real funds.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-slate-300">
            <li><span className="font-semibold text-primary-100">Step 1:</span> Run a sample transaction using demo or dry-run.</li>
            <li><span className="font-semibold text-primary-100">Step 2:</span> Review the decision and receipt to understand policy and output.</li>
            <li><span className="font-semibold text-primary-100">Step 3:</span> Run your own protected trade with real or controlled input.</li>
          </ul>
        </div>
      </Section>

      <Section id="first-trade-flow" divider className="pt-0 fade-in-up fade-delay-1">
        <TryAtfFlow />
      </Section>

      <Section divider className="fade-in-up fade-delay-2">
        <ApiKeySection />
      </Section>
    </Container>
  );
}
