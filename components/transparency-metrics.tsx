import { Card } from "@/components/ui/card";
import { Section } from "@/components/ui/section";

const metrics = [
  {
    label: "Security headers enforced",
    value: "Yes",
    description: "Strict CSP, HSTS, X-Frame-Options, and more on every response.",
  },
  {
    label: "CSP violations logged",
    value: "Active",
    description: "Content Security Policy violations are reported and stored.",
  },
  {
    label: "Admin audit logging",
    value: "Enabled",
    description: "Every admin action is recorded with timestamp and actor.",
  },
  {
    label: "Health endpoint monitored",
    value: "/api/health",
    description: "Automated uptime checks run against a dedicated health route.",
  },
  {
    label: "Design partner applications",
    value: "Open",
    description: "Accepting applications from teams building on Solana.",
  },
];

export function TransparencyMetrics() {
  return (
    <Section className="border-t border-white/10 fade-in-up">
      <div className="mb-8 max-w-2xl">
        <h2 className="text-4xl font-bold tracking-tight text-[#f0a050]">
          Transparency Metrics
        </h2>
        <p className="mt-4 text-2xl leading-[1.4] text-slate-200">
          Visibility into operational safeguards that are active on this site
          today. No vanity numbers, just verifiable controls.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((m) => (
          <Card key={m.label} className="border-primary-300/25 bg-primary-500/10">
            <p className="text-sm font-bold uppercase tracking-wider text-primary-300">
              {m.label}
            </p>
            <p className="mt-2 text-2xl font-bold text-[#e8944a]">{m.value}</p>
            <p className="mt-1 text-base leading-[1.5] text-slate-300">
              {m.description}
            </p>
          </Card>
        ))}
      </div>
    </Section>
  );
}
