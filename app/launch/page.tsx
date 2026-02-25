import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { PublicMetricsStrip } from "@/components/public-metrics-strip";
import { TrackedLink } from "@/components/tracked-link";
import { SingleCommandQuickstart } from "@/components/single-command-quickstart";

export const metadata: Metadata = {
  title: "Launch",
  description:
    "Infrastructure for Autonomous Finance. TruCore is launching Agent Transaction Firewall (ATF) with deterministic enforcement and tamper-evident receipts.",
  openGraph: {
    title: "Infrastructure for Autonomous Finance",
    description:
      "Launching with Agent Transaction Firewall (ATF), enforceable guardrails for agent transactions.",
    images: [
      {
        url: "/launch/opengraph-image",
        width: 1200,
        height: 630,
        alt: "TruCore Launch social preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Infrastructure for Autonomous Finance",
    description:
      "Launching with Agent Transaction Firewall (ATF), enforceable guardrails for agent transactions.",
    images: ["/launch/opengraph-image"],
  },
};

export default function LaunchPage() {
  return (
    <Container>
      <Section className="fade-in-up">
        <div className="mx-auto max-w-3xl">
          <Badge className="mb-4">Launch</Badge>
          <h1 className="text-4xl font-bold tracking-tight text-[#ffe0b2] sm:text-6xl">
            Infrastructure for Autonomous Finance
          </h1>
          <p className="mt-5 text-2xl leading-[1.4] text-slate-200 sm:text-3xl">
            Launching with Agent Transaction Firewall (ATF), enforceable guardrails for agent
            transactions.
          </p>

          <ul className="mt-6 space-y-2 text-lg text-slate-300 sm:text-xl">
            <li className="flex items-start gap-3">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary-400" />
              Deterministic policy enforcement
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary-400" />
              Permit-based authorization (bounded, replay-safe)
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary-400" />
              Tamper-evident receipts
            </li>
          </ul>

          <div className="mt-8 flex flex-wrap gap-4">
            <TrackedLink
              href="/atf/apply"
              eventName="launch_apply_click"
              eventProps={{ location: "launch_hero" }}
              className="inline-flex items-center justify-center rounded-xl bg-accent-500 px-7 py-4 text-xl font-semibold text-neutral-950 transition-colors hover:bg-accent-400"
            >
              Apply as Design Partner
            </TrackedLink>
            <TrackedLink
              href="/atf/primer"
              eventName="launch_primer_click"
              eventProps={{ location: "launch_hero" }}
              className="inline-flex items-center justify-center rounded-xl border border-primary-300/40 bg-primary-500/15 px-7 py-4 text-xl font-semibold text-primary-100 transition-colors hover:bg-primary-500/25"
            >
              Read the Primer
            </TrackedLink>
            <TrackedLink
              href="/atf/whitepaper"
              eventName="launch_whitepaper_click"
              eventProps={{ location: "launch_hero" }}
              className="inline-flex items-center justify-center rounded-xl border border-primary-300/40 bg-primary-500/15 px-7 py-4 text-xl font-semibold text-primary-100 transition-colors hover:bg-primary-500/25"
            >
              Whitepaper Preview
            </TrackedLink>
          </div>

          <div className="mt-6">
            <SingleCommandQuickstart location="launch" compact />
          </div>
          <p className="mt-4 text-sm text-slate-300">
            v1 launch mode uses a pinned CLI tag for reproducibility. Simulator behavior is deterministic, and
            signature availability depends on environment configuration.
          </p>
        </div>
      </Section>

      <PublicMetricsStrip />

      <Section className="border-t border-white/10 fade-in-up fade-delay-1">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 rounded-xl border border-white/10 bg-neutral-900/40 p-6">
          <p className="text-lg font-medium text-slate-200">Building an agent? Start with the docs.</p>
          <TrackedLink
            href="/docs"
            eventName="launch_docs_click"
            eventProps={{ location: "launch_footer", target: "docs" }}
            className="text-lg font-semibold text-primary-200 transition-colors hover:text-primary-100"
          >
            Go to Docs &rarr;
          </TrackedLink>
        </div>
      </Section>
    </Container>
  );
}
