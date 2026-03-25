import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { TryAtfFlow } from "@/components/try-atf-flow";

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
        </div>
      </Section>

      <Section divider className="pt-0 fade-in-up fade-delay-1">
        <TryAtfFlow />
      </Section>
    </Container>
  );
}
