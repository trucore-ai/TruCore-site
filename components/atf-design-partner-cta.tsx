"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Section } from "@/components/ui/section";
import { trackEvent } from "@/lib/analytics";

type AtfDesignPartnerCtaProps = {
  location?: string;
};

export function AtfDesignPartnerCta({ location = "atf_page" }: AtfDesignPartnerCtaProps) {
  const handleApplyClick = () => {
    trackEvent("design_partner_apply_click", { location });
    trackEvent("pilot_cta_click", { location });
  };

  return (
    <Section className="border-t border-white/10 fade-in-up">
      <Card className="bg-accent-500/10 border-accent-500/30 p-8 sm:p-10">
        <h2 className="text-4xl font-bold text-accent-300">
          Seeking Design Partners
        </h2>
        <p className="mt-4 max-w-2xl text-2xl leading-[1.4] text-slate-100">
          We are working with a limited number of early teams building
          AI-driven trading systems on Solana.
        </p>
        <div className="mt-6 max-w-2xl">
          <p className="text-lg font-semibold text-slate-100">Pilot includes:</p>
          <ul className="mt-3 space-y-2 text-lg text-slate-200">
            <li>• Dedicated partner API key tier</li>
            <li>• Integration guidance</li>
            <li>• Policy design review</li>
            <li>• Success metric alignment</li>
          </ul>
        </div>
        <div className="mt-6">
          <Link
            href="/atf/apply"
            className="inline-flex items-center justify-center rounded-xl px-7 py-4 text-xl font-semibold transition-colors bg-accent-500 text-neutral-950 hover:bg-accent-400"
            onClick={handleApplyClick}
          >
            Apply as Design Partner
          </Link>
        </div>
      </Card>
    </Section>
  );
}
