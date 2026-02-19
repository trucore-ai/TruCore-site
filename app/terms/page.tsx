import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Terms of Use",
  description:
    "TruCore terms of use: conditions for using the TruCore website.",
};

export default function TermsPage() {
  return (
    <Container>
      <Section className="fade-in-up">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight text-[#ffe0b2] sm:text-5xl">
            Terms of Use
          </h1>
          <p className="mt-2 text-lg text-slate-400">
            Last updated: February 2026
          </p>
        </div>
      </Section>

      <Section className="border-t border-white/10 fade-in-up fade-delay-1">
        <div className="mx-auto max-w-3xl space-y-8">
          <Card>
            <h2 className="text-3xl font-bold text-[#f0a050]">
              Informational Site
            </h2>
            <p className="mt-3 text-xl leading-[1.6] text-slate-200">
              This website is provided for informational purposes only. The
              content on this site does not constitute financial, investment,
              legal, or tax advice.
            </p>
          </Card>

          <Card>
            <h2 className="text-3xl font-bold text-[#f0a050]">No Warranties</h2>
            <p className="mt-3 text-xl leading-[1.6] text-slate-200">
              This site and its content are provided &quot;as is&quot; without
              warranty of any kind, express or implied. TruCore makes no
              representations or warranties regarding the accuracy,
              completeness, or reliability of any information presented.
            </p>
          </Card>

          <Card>
            <h2 className="text-3xl font-bold text-[#f0a050]">
              Financial Decisions
            </h2>
            <p className="mt-3 text-xl leading-[1.6] text-slate-200">
              Do not rely on information presented on this site for financial
              decisions. Always conduct your own research and consult qualified
              professionals before making investment or financial decisions.
            </p>
          </Card>

          <Card>
            <h2 className="text-3xl font-bold text-[#f0a050]">Changes</h2>
            <p className="mt-3 text-xl leading-[1.6] text-slate-200">
              These terms are subject to change at any time without notice. Your
              continued use of the site constitutes acceptance of any
              modifications.
            </p>
          </Card>

          <div className="rounded-xl border border-white/10 bg-neutral-900/50 p-6 text-center">
            <p className="text-sm text-slate-400">
              This is not legal advice. These terms are provided for
              informational purposes and may be updated at any time.
            </p>
          </div>
        </div>
      </Section>
    </Container>
  );
}
