import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "TruCore privacy policy: how we handle data and respect your privacy.",
};

export default function PrivacyPage() {
  return (
    <Container>
      <Section className="fade-in-up">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight text-[#ffe0b2] sm:text-5xl">
            Privacy Policy
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
              What We Collect
            </h2>
            <p className="mt-3 text-xl leading-[1.6] text-slate-200">
              We collect minimal information needed to operate this site. If you
              join our waitlist, we store the email address you provide. We do
              not sell or share your data with third parties.
            </p>
          </Card>

          <Card>
            <h2 className="text-3xl font-bold text-[#f0a050]">Analytics</h2>
            <p className="mt-3 text-xl leading-[1.6] text-slate-200">
              We use Vercel Web Analytics, a privacy-first, cookie-free
              analytics service, to measure page views and understand how
              visitors interact with the site. We also track a small number of
              custom events (e.g.&nbsp;waitlist sign-ups, button clicks) to
              improve the product experience.
            </p>
            <p className="mt-3 text-xl leading-[1.6] text-slate-200">
              These analytics <strong className="text-white">never</strong>{" "}
              collect personally identifiable information. No emails, IP
              addresses, or browser fingerprints are stored in analytics events.
              We do not sell or share analytics data with any third party.
            </p>
          </Card>

          <Card>
            <h2 className="text-3xl font-bold text-[#f0a050]">
              Waitlist Submissions
            </h2>
            <p className="mt-3 text-xl leading-[1.6] text-slate-200">
              If you join our waitlist, we store the email address you provide
              along with an optional role and use-case description. We also
              store a one-way hash of your IP address for abuse prevention;
              the raw IP is never retained. This data is used solely for
              early-access communication and is never sold or shared.
            </p>
            <p className="mt-3 text-xl leading-[1.6] text-slate-200">
              If you apply as a design partner, we additionally collect your
              project or company name, integration interests (e.g. Jupiter,
              Solend), expected transaction volume range, and current build
              stage. These fields help us prioritize outreach and are stored
              alongside your waitlist record under the same policies described
              above.
            </p>
            <p className="mt-3 text-xl leading-[1.6] text-slate-200">
              To request deletion of your waitlist data, email{" "}
              <a
                href="mailto:info@trucore.xyz"
                className="font-semibold text-primary-300 underline underline-offset-2 transition-colors hover:text-primary-200"
              >
                info@trucore.xyz
              </a>
              .
            </p>
          </Card>

          <Card>
            <h2 className="text-3xl font-bold text-[#f0a050]">
              Data Deletion
            </h2>
            <p className="mt-3 text-xl leading-[1.6] text-slate-200">
              If you would like your data removed, contact us at{" "}
              <a
                href="mailto:info@trucore.xyz"
                className="font-semibold text-primary-300 underline underline-offset-2 transition-colors hover:text-primary-200"
              >
                info@trucore.xyz
              </a>{" "}
              and we will process your request promptly.
            </p>
          </Card>

          <div className="rounded-xl border border-white/10 bg-neutral-900/50 p-6 text-center">
            <p className="text-sm text-slate-400">
              This is not legal advice. This policy is provided for
              informational purposes and may be updated at any time.
            </p>
          </div>
        </div>
      </Section>
    </Container>
  );
}
