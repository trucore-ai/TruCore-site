import { Card } from "@/components/ui/card";
import { Section } from "@/components/ui/section";

const personas = [
  {
    title: "Autonomous Trading Agents",
    bullets: [
      "Enforce slippage, spend caps, and protocol allowlists before every transaction.",
      "Operate continuously without human approval loops while staying within hard boundaries.",
      "Generate tamper-evident receipts for every policy evaluation and execution outcome.",
    ],
  },
  {
    title: "Quant Funds Running Agent Infrastructure",
    bullets: [
      "Layer deterministic risk controls over any agent framework or model pipeline.",
      "Define portfolio-level invariants that no single agent can override.",
      "Maintain auditable, verifiable execution records across all agent activity.",
    ],
  },
  {
    title: "Protocol Teams Embedding Guardrails",
    bullets: [
      "Gate agent access to your protocol with scoped, time-bound permits.",
      "Protect your liquidity pools from unbounded or malicious agent behavior.",
      "Ship a trust layer without building custom enforcement from scratch.",
    ],
  },
];

export function AtfDesignedFor() {
  return (
    <Section className="border-t border-white/10 fade-in-up">
      <div className="mb-8 max-w-2xl">
        <h2 className="text-4xl font-bold tracking-tight text-[#f0a050]">
          Designed For
        </h2>
        <p className="mt-4 text-2xl leading-[1.4] text-slate-200">
          ATF is built for teams that need provable, deterministic controls
          around autonomous on-chain execution.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {personas.map((p) => (
          <Card key={p.title} className="border-primary-300/25 bg-primary-500/10">
            <h3 className="text-xl font-bold text-[#e8944a]">{p.title}</h3>
            <ul className="mt-3 space-y-2">
              {p.bullets.map((b) => (
                <li key={b} className="flex items-start gap-2 text-lg leading-[1.5] text-slate-200">
                  <span className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-primary-400" />
                  {b}
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </Section>
  );
}
