import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Card } from "@/components/ui/card";
import { TrackedLink } from "@/components/tracked-link";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with the TruCore team. General inquiries, security reports, and social channels.",
};

export default function ContactPage() {
  return (
    <Container>
      <Section className="fade-in-up">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight text-[#ffe0b2] sm:text-5xl">
            Contact
          </h1>
          <p className="mt-4 text-2xl leading-[1.5] text-slate-200">
            We are happy to hear from you. Choose the right channel for your
            inquiry and we will get back to you as soon as we can.
          </p>
        </div>
      </Section>

      <Section className="border-t border-white/10 fade-in-up fade-delay-1">
        <div className="mx-auto max-w-3xl space-y-8">
          {/* General */}
          <Card>
            <h2 className="text-3xl font-bold text-[#f0a050]">
              General Inquiries
            </h2>
            <p className="mt-3 text-xl leading-[1.6] text-slate-200">
              For questions about TruCore, partnership opportunities, waitlist
              requests, or anything else, email us at{" "}
              <a
                href="mailto:info@trucore.xyz"
                className="font-semibold text-primary-300 underline underline-offset-2 transition-colors hover:text-primary-200"
              >
                info@trucore.xyz
              </a>
              .
            </p>
          </Card>

          {/* Security */}
          <Card className="border-primary-300/25 bg-primary-500/10">
            <h2 className="text-3xl font-bold text-[#f0a050]">
              Security &amp; Vulnerability Reports
            </h2>
            <p className="mt-3 text-xl leading-[1.6] text-slate-200">
              If you have discovered a security vulnerability, please report it
              responsibly to{" "}
              <a
                href="mailto:security@trucore.xyz"
                className="font-semibold text-primary-300 underline underline-offset-2 transition-colors hover:text-primary-200"
              >
                security@trucore.xyz
              </a>
              . For full reporting guidelines and our safe harbor policy, see
              the{" "}
              <Link
                href="/security"
                className="font-semibold text-primary-300 underline underline-offset-2 transition-colors hover:text-primary-200"
              >
                Security &amp; Responsible Disclosure
              </Link>{" "}
              page.
            </p>
          </Card>

          {/* Social */}
          <Card>
            <h2 className="text-3xl font-bold text-[#f0a050]">
              Social Channels
            </h2>
            <div className="mt-4 flex flex-wrap gap-4">
              <TrackedLink
                href="https://x.com/TruCore_AI"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-neutral-900/40 px-5 py-3 text-xl font-medium text-slate-200 transition-colors hover:bg-neutral-800/60 hover:text-primary-200"
                eventName="outbound_click"
                eventProps={{ target: "x", location: "contact" }}
              >
                X (Twitter)
              </TrackedLink>
              <TrackedLink
                href="https://github.com/TruCore-AI"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-neutral-900/40 px-5 py-3 text-xl font-medium text-slate-200 transition-colors hover:bg-neutral-800/60 hover:text-primary-200"
                eventName="outbound_click"
                eventProps={{ target: "github", location: "contact" }}
              >
                GitHub
              </TrackedLink>
            </div>
          </Card>

          <div className="rounded-xl border border-white/10 bg-neutral-900/50 p-6 text-center">
            <p className="text-sm text-slate-400">
              We typically respond within 2 business days. For urgent security
              issues, use the security email for the fastest response.
            </p>
          </div>
        </div>
      </Section>
    </Container>
  );
}
