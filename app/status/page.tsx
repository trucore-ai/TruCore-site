import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Card } from "@/components/ui/card";
import { StatusLiveChecks } from "@/components/status-live-checks";
import { getReleaseMetadata } from "@/lib/version";

export const metadata: Metadata = {
  title: "System Status",
  description:
    "Current operational status of TruCore systems, monitoring details, and incident reporting information.",
};

export default function StatusPage() {
  const release = getReleaseMetadata();

  return (
    <Container>
      <Section className="fade-in-up">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight text-accent-200 sm:text-4xl lg:text-5xl">
            System Status
          </h1>
          <p className="mt-4 text-2xl leading-[1.5] text-slate-200">
            Current operational status of TruCore services.
          </p>
        </div>
      </Section>

      <Section divider className="fade-in-up fade-delay-1">
        <div className="mx-auto max-w-3xl space-y-8">
          <StatusLiveChecks />

          {/* Monitoring */}
          <Card>
            <h2 className="text-3xl font-bold text-accent-300">Monitoring</h2>
            <p className="mt-3 text-xl leading-[1.6] text-slate-200">
              We monitor{" "}
              <code className="rounded bg-neutral-800 px-1.5 py-0.5 text-base text-primary-200">
                /api/health
              </code>{" "}
              and key workflows continuously. External uptime checks run against
              the health endpoint to verify system availability.
            </p>
            <p className="mt-3 text-sm text-slate-400">
              These checks run in your browser, no personal data is sent.
            </p>
          </Card>

          {/* Incident Reporting */}
          <Card>
            <h2 className="text-3xl font-bold text-accent-300">
              Incident Reporting
            </h2>
            <p className="mt-3 text-xl leading-[1.6] text-slate-200">
              If you believe there is an outage or service disruption, please
              email{" "}
              <a
                href="mailto:info@trucore.xyz"
                className="font-semibold text-primary-300 underline underline-offset-2 transition-colors hover:text-primary-200"
              >
                info@trucore.xyz
              </a>{" "}
              and we will investigate promptly.
            </p>
          </Card>

          {/* Security Incidents */}
          <Card className="border-primary-300/25 bg-primary-500/10">
            <h2 className="text-3xl font-bold text-accent-300">
              Security Incidents
            </h2>
            <p className="mt-3 text-xl leading-[1.6] text-slate-200">
              For security-related issues, please email{" "}
              <a
                href="mailto:security@trucore.xyz"
                className="font-semibold text-primary-300 underline underline-offset-2 transition-colors hover:text-primary-200"
              >
                security@trucore.xyz
              </a>
              . See our{" "}
              <a
                href="/security"
                className="font-semibold text-primary-300 underline underline-offset-2 transition-colors hover:text-primary-200"
              >
                Security &amp; Responsible Disclosure
              </a>{" "}
              page for full reporting guidelines.
            </p>
          </Card>

          {/* Release Metadata */}
          <div className="glass-panel rounded-xl p-6 text-center break-words">
            <p className="text-sm text-slate-400">Release metadata</p>
            <p className="mt-2 text-sm text-slate-300">
              Commit:{" "}
              <code className="rounded bg-neutral-800 px-1.5 py-0.5 text-xs text-slate-300 break-all">
                {release.siteCommit ?? "unavailable"}
              </code>
            </p>
            <p className="mt-2 text-sm text-slate-300">
              Environment:{" "}
              <code className="rounded bg-neutral-800 px-1.5 py-0.5 text-xs text-slate-300">
                {release.environment}
              </code>
            </p>
            <p className="mt-2 text-sm text-slate-300">
              CLI pinned:{" "}
              <code className="rounded bg-neutral-800 px-1.5 py-0.5 text-xs text-slate-300">
                {release.cliPinnedVersion}
              </code>
            </p>
            <p className="mt-3 text-xs text-slate-500">
              Git tags are not injected by Vercel. Map this commit SHA to a
              release tag in GitHub.
            </p>
          </div>
        </div>
      </Section>
    </Container>
  );
}
