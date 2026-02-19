import { Section } from "@/components/ui/section";

const phases = [
  {
    phase: "Phase 1",
    title: "V1 Guardrails (Solana core)",
    description:
      "Policy engine, permit gateway, execution validator, and receipt ledger for Solana with Jupiter and Solend integrations.",
  },
  {
    phase: "Phase 2",
    title: "On-chain attestation registry",
    description:
      "Publish policy evaluations and execution receipts to an on-chain registry for transparent, verifiable audit.",
  },
  {
    phase: "Phase 3",
    title: "Vault and invariant enforcement program",
    description:
      "On-chain program enforcing portfolio-level hard invariants with vault-scoped custody and automatic halt logic.",
  },
  {
    phase: "Phase 4",
    title: "Multi-chain expansion",
    description:
      "Extend ATF enforcement to additional chains and protocol integrations beyond Solana.",
  },
];

export function AtfRoadmap() {
  return (
    <Section className="border-t border-white/10 fade-in-up">
      <div className="mb-8 max-w-2xl">
        <h2 className="text-4xl font-bold tracking-tight text-[#f0a050]">
          Roadmap
        </h2>
        <p className="mt-4 text-2xl leading-[1.4] text-slate-200">
          A phased approach. Each stage builds on proven enforcement before
          expanding scope.
        </p>
      </div>

      <div className="relative max-w-2xl pl-8">
        {/* Vertical line */}
        <div className="absolute left-3 top-0 h-full w-px bg-primary-400/30" />

        <ol className="space-y-8">
          {phases.map((p, i) => (
            <li key={p.phase} className="relative">
              {/* Dot */}
              <div className="absolute -left-5 top-1 flex h-4 w-4 items-center justify-center">
                <span
                  className={`block h-3 w-3 rounded-full ${
                    i === 0
                      ? "bg-accent-400 ring-2 ring-accent-400/40"
                      : "bg-primary-400/60"
                  }`}
                />
              </div>
              <p className="text-sm font-bold uppercase tracking-wider text-primary-300">
                {p.phase}
              </p>
              <h3 className="mt-1 text-xl font-bold text-[#e8944a]">{p.title}</h3>
              <p className="mt-1 text-lg leading-[1.5] text-slate-200">{p.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}
