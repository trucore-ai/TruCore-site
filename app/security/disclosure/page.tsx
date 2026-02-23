import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Card } from "@/components/ui/card";

const lastUpdated = process.env.NEXT_PUBLIC_BUILD_DATE ?? "unknown";

export const metadata: Metadata = {
  title: "Responsible Disclosure",
  description:
    "How to report security vulnerabilities to TruCore, disclosure windows, scope, and response timeline.",
};

export default function SecurityDisclosurePage() {
  return (
    <Container>
      <Section className="fade-in-up">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight text-[#ffe0b2] sm:text-5xl">
            Responsible Disclosure
          </h1>
          <p className="mt-4 text-2xl leading-[1.5] text-slate-200">
            If you discover a security issue, email us at{" "}
            <a
              href="mailto:security@trucore.xyz"
              className="font-semibold text-primary-300 underline underline-offset-2 transition-colors hover:text-primary-200"
            >
              security@trucore.xyz
            </a>
            .
          </p>
          <p className="mt-4 text-sm font-medium text-slate-400">
            Last updated: {lastUpdated}
          </p>
        </div>
      </Section>

      <Section className="border-t border-white/10 fade-in-up fade-delay-1">
        <div className="mx-auto max-w-3xl space-y-6">
          <Card>
            <h2 className="text-3xl font-bold text-[#f0a050]">Policy</h2>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-xl text-slate-300">
              <li>90-day coordinated disclosure window.</li>
              <li>48-hour initial acknowledgement target.</li>
              <li>Good-faith researchers are welcome.</li>
            </ul>
          </Card>

          <Card>
            <h2 className="text-3xl font-bold text-[#f0a050]">In Scope</h2>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-xl text-slate-300">
              <li>TruCore web application routes.</li>
              <li>Public and authenticated API endpoints.</li>
            </ul>
          </Card>

          <Card>
            <h2 className="text-3xl font-bold text-[#f0a050]">Out of Scope Examples</h2>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-xl text-slate-300">
              <li>Denial-of-service and traffic flooding.</li>
              <li>Social engineering, phishing, or physical attacks.</li>
              <li>
                Issues in third-party infrastructure outside direct TruCore
                control.
              </li>
            </ul>
          </Card>

          <div className="glass-panel rounded-xl p-6 text-center">
            <p className="text-lg text-slate-200">
              Read the broader posture on{" "}
              <Link
                href="/security/overview"
                className="font-semibold text-primary-300 underline underline-offset-2 transition-colors hover:text-primary-200"
              >
                Security Overview
              </Link>
              .
            </p>
          </div>
        </div>
      </Section>
    </Container>
  );
}