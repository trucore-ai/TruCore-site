import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { DesignPartnerApplyForm } from "@/components/design-partner-apply-form";

export const metadata: Metadata = {
  title: "Apply as Design Partner",
  description:
    "Apply to join the ATF Design Partner program. Work directly with TruCore on policy-bound execution, early API access, and dedicated integration support for your autonomous trading system on Solana.",
};

const whoThisIsFor = [
  "Teams deploying autonomous trading or yield strategies on Solana.",
  "Projects integrating Jupiter, Solend, or similar DeFi protocols with AI agents.",
  "Builders who need deterministic policy checks and verifiable receipts before going to production.",
];

const whatYouGet = [
  "Early API access and hands-on integration support from TruCore engineers.",
  "Direct input into ATF features, policy templates, and roadmap priorities.",
  "Co-marketing opportunities and a case study spotlight at launch.",
];

const whatHappensNext = [
  "We review your application within one business day.",
  "You receive a confirmation email with next steps and program details.",
  "We schedule a 15-minute fit check to learn about your setup and answer questions.",
];

export default function ApplyPage() {
  return (
    <Container>
      {/* ── Hero ── */}
      <Section className="fade-in-up">
        <div className="max-w-3xl">
          <Badge className="mb-4">Design Partner Program</Badge>
          <h1 className="text-4xl font-bold tracking-tight text-[#ffe0b2] sm:text-6xl">
            Apply to be an ATF Design Partner
          </h1>
          <p className="mt-5 text-2xl leading-[1.4] text-slate-200 sm:text-3xl">
            We are looking for teams deploying autonomous strategies on Solana.
            If you are building with AI agents and need trust infrastructure,
            this program is built for you.
          </p>
        </div>
      </Section>

      {/* ── Info Sections ── */}
      <Section className="border-t border-white/10 fade-in-up fade-delay-1">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Who this is for */}
          <Card className="border-primary-300/25 bg-primary-500/10">
            <h2 className="text-2xl font-bold text-[#e8944a]">Who this is for</h2>
            <ul className="mt-4 space-y-3">
              {whoThisIsFor.map((item) => (
                <li key={item} className="flex items-start gap-3 text-lg text-slate-200">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent-400" />
                  {item}
                </li>
              ))}
            </ul>
          </Card>

          {/* What you get */}
          <Card className="border-primary-300/25 bg-primary-500/10">
            <h2 className="text-2xl font-bold text-[#e8944a]">What you get</h2>
            <ul className="mt-4 space-y-3">
              {whatYouGet.map((item) => (
                <li key={item} className="flex items-start gap-3 text-lg text-slate-200">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary-400" />
                  {item}
                </li>
              ))}
            </ul>
          </Card>

          {/* What happens next */}
          <Card className="border-primary-300/25 bg-primary-500/10">
            <h2 className="text-2xl font-bold text-[#e8944a]">What happens next</h2>
            <ol className="mt-4 space-y-3">
              {whatHappensNext.map((item, i) => (
                <li key={item} className="flex items-start gap-3 text-lg text-slate-200">
                  <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-primary-300/40 text-xs font-bold text-primary-100">
                    {i + 1}
                  </span>
                  {item}
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </Section>

      {/* ── Apply Form ── */}
      <Section className="border-t border-white/10 fade-in-up fade-delay-2">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight text-[#f0a050]">
            Your application
          </h2>
          <p className="mt-3 text-lg text-slate-300">
            All fields marked with <span className="text-red-400">*</span> are
            required. We will never share your information with third parties.
          </p>
          <div className="mt-8">
            <DesignPartnerApplyForm />
          </div>
        </div>
      </Section>
    </Container>
  );
}
