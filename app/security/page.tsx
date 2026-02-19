import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Security & Responsible Disclosure",
  description:
    "TruCore security policy, responsible disclosure guidelines, and contact information for reporting vulnerabilities.",
};

export default function SecurityPage() {
  return (
    <Container>
      <Section className="fade-in-up">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight text-[#ffe0b2] sm:text-5xl">
            Security &amp; Responsible Disclosure
          </h1>
          <p className="mt-4 text-2xl leading-[1.5] text-slate-200">
            TruCore builds security-first infrastructure for autonomous finance.
            We take the security of our systems and the safety of our users
            seriously. If you believe you have found a vulnerability, we
            encourage you to report it responsibly.
          </p>
        </div>
      </Section>

      <Section className="border-t border-white/10 fade-in-up fade-delay-1">
        <div className="mx-auto max-w-3xl space-y-8">
          {/* Responsible Disclosure */}
          <Card>
            <h2 className="text-3xl font-bold text-[#f0a050]">
              Responsible Disclosure
            </h2>
            <p className="mt-3 text-xl leading-[1.6] text-slate-200">
              If you discover a security issue, please email us at{" "}
              <a
                href="mailto:security@trucore.xyz"
                className="font-semibold text-primary-300 underline underline-offset-2 transition-colors hover:text-primary-200"
              >
                security@trucore.xyz
              </a>
              . When reporting, please include:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-xl text-slate-300">
              <li>A description of the vulnerability and its potential impact.</li>
              <li>
                Steps to reproduce the issue (proof-of-concept code or
                screenshots if applicable).
              </li>
              <li>
                The affected component, URL, or endpoint (if known).
              </li>
              <li>Your contact information for follow-up.</li>
            </ul>
          </Card>

          {/* Safe Harbor */}
          <Card>
            <h2 className="text-3xl font-bold text-[#f0a050]">Safe Harbor</h2>
            <p className="mt-3 text-xl leading-[1.6] text-slate-200">
              We consider good-faith security research to be authorized and will
              not pursue legal action against researchers who:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-xl text-slate-300">
              <li>
                Act in good faith to avoid privacy violations, data destruction,
                and disruption to our services.
              </li>
              <li>
                Report vulnerabilities directly to us and allow reasonable time
                to address them before any public disclosure.
              </li>
              <li>
                Do not exploit the vulnerability beyond what is necessary to
                demonstrate the issue.
              </li>
              <li>Do not engage in extortion or demand payment.</li>
              <li>
                Do not use social engineering, phishing, or physical attacks
                against TruCore personnel or infrastructure.
              </li>
            </ul>
          </Card>

          {/* Out of Scope */}
          <Card>
            <h2 className="text-3xl font-bold text-[#f0a050]">Out of Scope</h2>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-xl text-slate-300">
              <li>Denial-of-service (DoS / DDoS) attacks.</li>
              <li>Spam, social engineering, or phishing.</li>
              <li>Physical security attacks.</li>
              <li>
                Issues in third-party services or dependencies not under
                TruCore&apos;s direct control.
              </li>
              <li>Attacks requiring physical access to a user&apos;s device.</li>
            </ul>
          </Card>

          {/* Response Targets */}
          <Card>
            <h2 className="text-3xl font-bold text-[#f0a050]">
              Response Expectations
            </h2>
            <p className="mt-3 text-xl leading-[1.6] text-slate-200">
              We aim to acknowledge receipt of vulnerability reports within a
              reasonable timeframe and will work to validate and address
              confirmed issues promptly. These are best-effort targets and not
              guaranteed SLAs.
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-xl text-slate-300">
              <li>Acknowledgement: within 3 business days (best effort).</li>
              <li>Initial assessment: within 10 business days (best effort).</li>
              <li>
                Remediation timeline: varies by severity; we will keep you
                informed.
              </li>
            </ul>
          </Card>

          {/* PGP Key */}
          <Card className="border-primary-300/25 bg-primary-500/10">
            <h2 className="text-3xl font-bold text-[#f0a050]">PGP Key</h2>
            <p className="mt-3 text-xl leading-[1.6] text-slate-200">
              PGP key coming soon. In the meantime, please use{" "}
              <a
                href="mailto:security@trucore.xyz"
                className="font-semibold text-primary-300 underline underline-offset-2 transition-colors hover:text-primary-200"
              >
                security@trucore.xyz
              </a>{" "}
              for all security communications.
            </p>
          </Card>

          {/* Contact */}
          <div className="rounded-xl border border-white/10 bg-neutral-900/50 p-6 text-center">
            <p className="text-xl text-slate-300">
              Security inquiries:{" "}
              <a
                href="mailto:security@trucore.xyz"
                className="font-semibold text-primary-300 underline underline-offset-2 transition-colors hover:text-primary-200"
              >
                security@trucore.xyz
              </a>
            </p>
            <p className="mt-2 text-xl text-slate-300">
              General inquiries:{" "}
              <a
                href="mailto:info@trucore.xyz"
                className="font-semibold text-primary-300 underline underline-offset-2 transition-colors hover:text-primary-200"
              >
                info@trucore.xyz
              </a>
            </p>
          </div>
        </div>
      </Section>
    </Container>
  );
}
