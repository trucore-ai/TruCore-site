import { Card } from "@/components/ui/card";
import { Section } from "@/components/ui/section";

const whyNowCards = [
  {
    title: "Agents are executing",
    description:
      "Agent-driven finance has moved from experiments to production workflows. Capital is now being deployed by autonomous systems in live environments.",
  },
  {
    title: "MEV is adversarial by default",
    description:
      "Execution happens in an adversarial arena where value extraction is automated. Any unbounded behavior is quickly priced and exploited.",
  },
  {
    title: "Trust doesn’t scale, enforcement does",
    description:
      "Human trust checks cannot keep pace with machine-speed decisions. Deterministic enforcement is how systems stay reliable as volume rises.",
  },
];

export function WhyNowSection() {
  return (
    <Section className="border-t border-white/10 fade-in-up">
      <div className="mb-8 max-w-3xl">
        <h2 className="text-4xl font-bold tracking-tight text-[#f0a050]">Why Now</h2>
        <p className="mt-4 text-2xl leading-[1.4] text-slate-200">
          Autonomous finance is entering a phase where execution is real, adversaries are active,
          and risk surfaces compound quickly. The window to add hard enforcement is now.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {whyNowCards.map((card) => (
          <Card key={card.title}>
            <h3 className="text-xl font-bold text-[#e8944a]">{card.title}</h3>
            <p className="mt-2 text-lg leading-[1.5] text-slate-200">{card.description}</p>
          </Card>
        ))}
      </div>
    </Section>
  );
}
