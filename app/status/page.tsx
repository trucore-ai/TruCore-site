import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "System Status",
  description:
    "Current operational status of TruCore systems, monitoring details, and incident reporting information.",
};

const systems = [
  { name: "Website", status: "Operational" },
  { name: "Waitlist API", status: "Operational" },
  { name: "Admin Tools", status: "Operational" },
];

export default function StatusPage() {
  const commitSha = process.env.VERCEL_GIT_COMMIT_SHA ?? null;

  return (
    <Container>
      <Section className="fade-in-up">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight text-[#ffe0b2] sm:text-5xl">
            System Status
          </h1>
          <p className="mt-4 text-2xl leading-[1.5] text-slate-200">
            Current operational status of TruCore services.
          </p>
        </div>
      </Section>

      <Section className="border-t border-white/10 fade-in-up fade-delay-1">
        <div className="mx-auto max-w-3xl space-y-8">
          {/* Current Status */}
          <Card>
            <h2 className="text-3xl font-bold text-[#f0a050]">
              Current Status
            </h2>
            <div className="mt-4 space-y-3">
              {systems.map((sys) => (
                <div
                  key={sys.name}
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-neutral-900/40 px-5 py-3"
                >
                  <span className="text-xl text-slate-200">{sys.name}</span>
                  <Badge className="bg-emerald-600/20 text-emerald-300 border-emerald-500/30">
                    {sys.status}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* Monitoring */}
          <Card>
            <h2 className="text-3xl font-bold text-[#f0a050]">Monitoring</h2>
            <p className="mt-3 text-xl leading-[1.6] text-slate-200">
              We monitor{" "}
              <code className="rounded bg-neutral-800 px-1.5 py-0.5 text-base text-primary-200">
                /api/health
              </code>{" "}
              and key workflows continuously. External uptime checks run against
              the health endpoint to verify system availability.
            </p>
          </Card>

          {/* Incident Reporting */}
          <Card>
            <h2 className="text-3xl font-bold text-[#f0a050]">
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
            <h2 className="text-3xl font-bold text-[#f0a050]">
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

          {/* Last Deploy */}
          {commitSha && (
            <div className="rounded-xl border border-white/10 bg-neutral-900/50 p-6 text-center">
              <p className="text-sm text-slate-400">
                Last deploy:{" "}
                <code className="rounded bg-neutral-800 px-1.5 py-0.5 text-xs text-slate-300">
                  {commitSha.slice(0, 7)}
                </code>
              </p>
            </div>
          )}
        </div>
      </Section>
    </Container>
  );
}
