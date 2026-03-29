<<<<<<< Updated upstream
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
    <Section divider className="fade-in-up">
      <Card className="bg-accent-500/10 border-accent-500/30 p-8 sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-400">
          For teams already building
        </p>
        <h2 className="mt-2 text-3xl font-bold text-accent-300">
          Design Partner Program
        </h2>
        <p className="mt-3 max-w-2xl text-lg leading-[1.4] text-slate-200">
          Working with a limited cohort of early teams integrating ATF into
          production trading bots on Solana. This is not a waitlist - it is
          hands-on integration support.
        </p>
        <div className="mt-4 max-w-2xl">
          <p className="text-sm font-semibold text-slate-300">Includes:</p>
          <ul className="mt-2 space-y-1 text-sm text-slate-300">
            <li>• Dedicated partner API key tier</li>
            <li>• Integration guidance and policy design review</li>
            <li>• Direct access to engineering</li>
          </ul>
        </div>
        <div className="mt-5">
          <Link
            href="/atf/apply"
            className="inline-flex items-center justify-center rounded-xl border border-accent-400/40 bg-accent-500/15 px-6 py-3 text-base font-semibold text-accent-200 transition-colors hover:bg-accent-500/25"
            onClick={handleApplyClick}
          >
            Apply as Design Partner
          </Link>
        </div>
      </Card>
    </Section>
  );
}
=======
"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Section } from "@/components/ui/section";
import { trackEvent } from "@/lib/analytics";

type AtfDesignPartnerCtaProps = {
  location?: string;
};

export function AtfDesignPartnerCta({ location = "atf_page" }: AtfDesignPartnerCtaProps) {
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
        <div className="mt-6">
          <Link
            href="/atf/apply"
            className="inline-flex items-center justify-center rounded-xl px-7 py-4 text-xl font-semibold transition-colors bg-accent-500 text-neutral-950 hover:bg-accent-400"
            onClick={() =>
              trackEvent("design_partner_apply_click", { location })
            }
          >
            Apply as Design Partner
          </Link>
        </div>
      </Card>
    </Section>
  );
}
>>>>>>> Stashed changes
