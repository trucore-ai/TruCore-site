import { Section } from "@/components/ui/section";

const readinessCards = [
  {
    title: "Deterministic Policy Enforcement",
    accent: "border-t-primary-400",
    items: [
      "Policy rules evaluated before execution",
      "Fail-closed architecture",
    ],
  },
  {
    title: "Permit-Based Authorization",
    accent: "border-t-primary-400",
    items: [
      "Explicit scopes",
      "TTL + nonce enforcement",
    ],
  },
  {
    title: "Execution Validation",
    accent: "border-t-accent-500",
    items: [
      "Slippage bounds",
      "Protocol allowlists",
      "Invariant checks",
    ],
  },
  {
    title: "Audit & Receipts",
    accent: "border-t-accent-500",
    items: [
      "Tamper-evident logs",
      "Admin audit trail",
      "CSP monitoring",
    ],
  },
];

export function AtfReadiness() {
  return (
    <Section className="border-t border-white/10 fade-in-up">
      <div className="mb-8 max-w-2xl">
        <h2 className="text-4xl font-bold tracking-tight text-[#f0a050]">
          Production Readiness
        </h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {readinessCards.map((card) => (
          <article
            key={card.title}
            className={`rounded-xl border border-white/15 border-t-2 ${card.accent} bg-neutral-950/65 p-6 backdrop-blur-lg`}
          >
            <h3 className="text-lg font-bold text-[#e8944a]">
              {card.title}
            </h3>
            <ul className="mt-3 space-y-2">
              {card.items.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-sm leading-relaxed text-slate-300"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-400" />
                  {item}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </Section>
  );
}
