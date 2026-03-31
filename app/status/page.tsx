import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Card } from "@/components/ui/card";
import { StatusLiveChecks } from "@/components/status-live-checks";
import { OpsRouteFailuresLoader } from "@/components/ops-route-failures-loader";
import { OpsFirstTradeCheckLoader } from "@/components/ops-first-trade-check-loader";
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
          <h1 className="text-4xl font-bold tracking-tight text-accent-200 sm:text-5xl">
            Live System Status
          </h1>
          <p className="mt-4 text-2xl leading-[1.5] text-slate-200">
            Real-time health of TruCore API and enforcement services.
          </p>
          <p className="mt-3 text-base text-slate-400">All checks reflect actual system state right now.</p>
        </div>
      </Section>

      <Section divider className="fade-in-up fade-delay-1">
        <div className="mx-auto max-w-3xl space-y-8">
          <StatusLiveChecks />

          <OpsRouteFailuresLoader />

          <OpsFirstTradeCheckLoader />

          {/* Monitoring */}
          <Card>
            <h2 className="text-3xl font-bold text-accent-300">Monitoring</h2>
            <p className="mt-3 text-xl leading-[1.6] text-slate-200">
              Continuous health checks monitor the 
              <code className="rounded bg-neutral-800 px-1.5 py-0.5 text-base text-primary-200">
                /api/health
              </code>{" "}
              endpoint and core enforcement workflows. These checks run live.
            </p>
            <p className="mt-3 text-sm text-slate-400">
              Privacy-respecting: no personal data is collected. Status reflects real-time system state.
            </p>
          </Card>

          {/* Incident Reporting */}
          <Card>
            <h2 className="text-3xl font-bold text-accent-300">
              Report an Issue
            </h2>
            <p className="mt-3 text-xl leading-[1.6] text-slate-200">
              Suspect a service disruption? Email 
              <a
                href="mailto:info@trucore.xyz"
                className="font-semibold text-primary-300 underline underline-offset-2 transition-colors hover:text-primary-200"
              >
                {" "}info@trucore.xyz
              </a>{" "}
              with details. We investigate immediately.
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
          <div className="glass-panel rounded-xl p-6 text-center">
            <p className="text-sm text-slate-400">Release metadata</p>
            <p className="mt-2 text-sm text-slate-300">
              Commit:{" "}
              <code className="rounded bg-neutral-800 px-1.5 py-0.5 text-xs text-slate-300">
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
