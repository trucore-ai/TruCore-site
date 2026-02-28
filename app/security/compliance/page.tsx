import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Card } from "@/components/ui/card";
import { RiskBoundaryBlock } from "@/components/risk-boundary-block";

const lastUpdated = process.env.NEXT_PUBLIC_BUILD_DATE ?? "unknown";

export const metadata: Metadata = {
  title: "Compliance & Security Alignment",
  description:
    "TruCore compliance alignment posture for enterprise procurement, including framework alignment concepts, data handling model, and audit evidence approach.",
};

export default function SecurityCompliancePage() {
  return (
    <Container>
      <Section className="fade-in-up">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight text-[#ffe0b2] sm:text-5xl">
            Compliance &amp; Security Alignment
          </h1>
          <p className="mt-4 text-2xl leading-[1.5] text-slate-200">
            This page describes TruCore alignment posture for enterprise security
            reviews and procurement workflows.
          </p>
          <p className="mt-4 text-sm font-medium text-slate-400">
            Last updated: {lastUpdated}
          </p>
        </div>
      </Section>

      <Section className="border-t border-white/10 fade-in-up fade-delay-1">
        <div className="mx-auto max-w-3xl space-y-6">
          <Card>
            <h2 className="text-3xl font-bold text-[#f0a050]">
              Alignment with Common Frameworks
            </h2>
            <p className="mt-4 text-xl leading-[1.5] text-slate-200">
              ATF is designed in alignment with common security control
              objectives. TruCore does not currently claim certification under
              these frameworks.
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-xl text-slate-300">
              <li>
                SOC 2 principle alignment concepts for Security, Availability,
                and Confidentiality.
              </li>
              <li>ISO 27001 control alignment concepts.</li>
              <li>NIST risk management alignment concepts.</li>
            </ul>
          </Card>

          <Card>
            <h2 className="text-3xl font-bold text-[#f0a050]">Data Handling Model</h2>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-xl text-slate-300">
              <li>No custody of customer funds.</li>
              <li>No financial account storage.</li>
              <li>No PII required for simulation.</li>
              <li>Aggregated metrics only for public reporting.</li>
            </ul>
          </Card>

          <RiskBoundaryBlock />

          <Card>
            <h2 className="text-3xl font-bold text-[#f0a050]">Audit &amp; Evidence</h2>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-xl text-slate-300">
              <li>Deterministic receipts for policy decisions and outcomes.</li>
              <li>Versioned releases with public release notes.</li>
              <li>Public changelog for traceable product changes.</li>
              <li>Signature verification path for ATF whitepaper artifacts.</li>
            </ul>
          </Card>

          <Card>
            <h2 className="text-3xl font-bold text-[#f0a050]">Procurement Readiness</h2>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-xl text-slate-300">
              <li>
                Security contact:{" "}
                <a
                  href="mailto:security@trucore.xyz"
                  className="font-semibold text-primary-300 underline underline-offset-2 transition-colors hover:text-primary-200"
                >
                  security@trucore.xyz
                </a>
              </li>
              <li>
                Responsible disclosure policy:{" "}
                <Link
                  href="/security/disclosure"
                  className="font-semibold text-primary-300 underline underline-offset-2 transition-colors hover:text-primary-200"
                >
                  /security/disclosure
                </Link>
              </li>
              <li>
                Status page:{" "}
                <Link
                  href="/status"
                  className="font-semibold text-primary-300 underline underline-offset-2 transition-colors hover:text-primary-200"
                >
                  /status
                </Link>
              </li>
            </ul>
          </Card>

          <div className="glass-panel rounded-xl p-6 text-lg text-slate-200">
            <p>
              Additional references: {" "}
              <Link
                href="/security/overview"
                className="font-semibold text-primary-300 underline underline-offset-2 transition-colors hover:text-primary-200"
              >
                /security/overview
              </Link>
              {" "}•{" "}
              <Link
                href="/process"
                className="font-semibold text-primary-300 underline underline-offset-2 transition-colors hover:text-primary-200"
              >
                /process
              </Link>
              {" "}•{" "}
              <Link
                href="/changelog"
                className="font-semibold text-primary-300 underline underline-offset-2 transition-colors hover:text-primary-200"
              >
                /changelog
              </Link>
            </p>
          </div>
        </div>
      </Section>
    </Container>
  );
}