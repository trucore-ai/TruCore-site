import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { TrackedLink } from "@/components/tracked-link";

export const metadata: Metadata = {
  title: "The Case for Agent Transaction Firewalls",
  description:
    "A technical manifesto for Agent Transaction Firewalls as the enforcement standard for autonomous capital systems.",
  alternates: {
    canonical: "https://trucore.xyz/manifesto",
  },
};

const principles = [
  {
    title: "Autonomous Capital Is Inevitable",
    points: [
      "AI agents are moving from research workflows into production capital flows.",
      "As autonomy increases, enforcement cannot depend on manual human review.",
    ],
  },
  {
    title: "Traditional Controls Are Insufficient",
    points: [
      "API gateways route requests and authenticate identity, they do not enforce economic invariants.",
      "Monitoring improves visibility, but visibility after execution is not prevention.",
    ],
  },
  {
    title: "Deterministic Enforcement Is the Standard",
    points: [
      "Explicit permits define what an agent is allowed to do before execution.",
      "Deterministic policy evaluation applies consistent constraints at machine speed.",
      "Cryptographic receipts make every decision path inspectable and verifiable.",
    ],
  },
  {
    title: "ATF as Infrastructure",
    points: [
      "ATF functions as a pre-execution enforcement layer between agent intent and market execution.",
      "The model remains non-custodial, policy controls constrain behavior without holding user funds.",
      "Policy-first design makes controls explicit, testable, and operationally auditable.",
    ],
  },
  {
    title: "Long-Term Direction",
    points: [
      "Vault guardrails that enforce capital boundaries at account and strategy levels.",
      "Policy attestation that proves enforcement configuration at decision time.",
      "Router constraints that bind execution paths to approved venues and parameters.",
    ],
  },
];

export default function ManifestoPage() {
  return (
    <Container>
      <Section>
        <div className="mx-auto max-w-4xl">
          <h1 className="text-4xl font-bold tracking-tight text-[#ffe0b2] sm:text-6xl">
            The Case for Agent Transaction Firewalls
          </h1>
          <p className="mt-5 text-xl leading-[1.5] text-slate-200 sm:text-2xl">
            Autonomous finance requires controls that execute as reliably as code.
            Agent Transaction Firewalls define the enforcement boundary for that
            future, explicit policy, deterministic evaluation, and verifiable
            receipts.
          </p>
        </div>
      </Section>

      {principles.map((section) => (
        <Section key={section.title} className="border-t border-white/10">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-3xl font-bold tracking-tight text-[#f0a050] sm:text-4xl">
              {section.title}
            </h2>
            <ul className="mt-5 space-y-3 text-lg leading-[1.5] text-slate-200 sm:text-xl">
              {section.points.map((point) => (
                <li key={point} className="flex gap-3">
                  <span className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-primary-200" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </Section>
      ))}

      <Section className="border-t border-white/10">
        <div className="mx-auto max-w-4xl rounded-xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="text-2xl font-bold tracking-tight text-[#f0a050] sm:text-3xl">
            Continue Reading
          </h2>
          <div className="mt-4 flex flex-wrap gap-4 text-lg font-semibold">
            <TrackedLink
              href="/agent-transaction-firewall"
              eventName="manifesto_link_click"
              eventProps={{ target: "agent_transaction_firewall" }}
              className="text-primary-200 transition-colors hover:text-primary-100"
            >
              Agent Transaction Firewall
            </TrackedLink>
            <TrackedLink
              href="/docs/atf-architecture"
              eventName="manifesto_link_click"
              eventProps={{ target: "atf_architecture" }}
              className="text-primary-200 transition-colors hover:text-primary-100"
            >
              ATF Architecture Docs
            </TrackedLink>
            <TrackedLink
              href="/process"
              eventName="manifesto_link_click"
              eventProps={{ target: "process" }}
              className="text-primary-200 transition-colors hover:text-primary-100"
            >
              How ATF is built
            </TrackedLink>
          </div>
        </div>
      </Section>
    </Container>
  );
}
