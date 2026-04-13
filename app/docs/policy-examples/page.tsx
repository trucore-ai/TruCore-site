import type { Metadata } from "next";
import { HeadingAnchor } from "@/components/heading-anchor";

export const metadata: Metadata = {
  title: "ATF Policy Examples | TruCore",
  description:
    "Structured, reusable ATF policy examples for swap guardrails, lending exposure caps, and time-bound execution.",
  keywords: [
    "ATF policy examples",
    "swap guardrails",
    "lending exposure caps",
    "time-bound execution",
    "policy configuration",
    "TruCore ATF",
  ],
  openGraph: {
    title: "ATF Policy Examples | TruCore",
    description:
      "Reusable ATF policy examples: swap guardrails, lending caps, and time-bound execution.",
    url: "https://trucore.xyz/docs/policy-examples",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "ATF Policy Examples | TruCore",
    description:
      "Reusable ATF policy examples: swap guardrails, lending caps, and time-bound execution.",
    images: ["/opengraph-image"],
  },
  alternates: { canonical: "https://trucore.xyz/docs/policy-examples" },
};

const swapGuardrailPolicy = `{
  "policy_id": "swap_guardrail_v1",
  "action": "swap",
  "constraints": {
    "max_notional_usd": 50000,
    "max_slippage_bps": 75,
    "protocol_allowlist": ["jupiter", "orca", "raydium"]
  }
}`;

const lendingExposureCapPolicy = `{
  "policy_id": "lending_exposure_cap_v1",
  "action": "lend",
  "constraints": {
    "max_position_usd": 250000,
    "max_protocol_exposure_pct": 35,
    "protocol_allowlist": ["solend", "marginfi", "kamino"]
  }
}`;

const timeBoundExecutionPolicy = `{
  "policy_id": "time_bound_execution_v1",
  "constraints": {
    "ttl_seconds": 60,
    "nonce_required": true,
    "deny_if_expired": true
  }
}`;

const ecommerceDiscountGuardrailPolicy = `{
  "max_discount_percent": 25,
  "max_refund_amount": 200,
  "promotion_ttl_seconds": 86400
}`;

export default function DocsPolicyExamplesPage() {
  return (
    <article className="space-y-10">
      <header className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">ATF Policy Examples</p>
        <h1 className="text-4xl font-bold tracking-tight text-accent-200 sm:text-5xl">Policy Examples</h1>
        <p className="max-w-3xl text-lg leading-relaxed text-slate-300">
          Reusable example structures for ATF policy authoring and integration planning.
        </p>
        <p className="text-sm font-medium text-slate-400">
          Examples are illustrative and not production recommendations.
        </p>
      </header>

      <section className="space-y-4">
        <HeadingAnchor id="swap-guardrail-policy">Example 1: Swap Guardrail Policy</HeadingAnchor>
        <p className="text-slate-300">
          Description: Constrains swap activity to a bounded notional size and slippage threshold on
          an approved router.
        </p>
        <p className="text-slate-300">
          Invariant enforced: Swap execution remains within explicit size and slippage risk limits.
        </p>
        <pre className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4 text-sm text-slate-200">
{swapGuardrailPolicy}
        </pre>
      </section>

      <section className="space-y-4">
        <HeadingAnchor id="lending-exposure-cap-policy">Example 2: Lending Exposure Cap Policy</HeadingAnchor>
        <p className="text-slate-300">
          Description: Caps capital concentration and protocol allocation for lending intents.
        </p>
        <p className="text-slate-300">
          Invariant enforced: Total lending exposure cannot exceed approved protocol and position
          thresholds.
        </p>
        <pre className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4 text-sm text-slate-200">
{lendingExposureCapPolicy}
        </pre>
      </section>

      <section className="space-y-4">
        <HeadingAnchor id="time-bound-execution-policy">Example 3: Time-Bound Execution Policy</HeadingAnchor>
        <p className="text-slate-300">
          Description: Forces short-lived execution authority with nonce-based replay resistance.
        </p>
        <p className="text-slate-300">
          Invariant enforced: Requests are denied once stale or replayed outside the validity
          window.
        </p>
        <pre className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4 text-sm text-slate-200">
{timeBoundExecutionPolicy}
        </pre>
      </section>

      <section className="space-y-4">
        <HeadingAnchor id="ecommerce-discount-guardrail">Example 4: E-Commerce Discount Guardrail</HeadingAnchor>
        <p className="text-slate-300">
          Description: Sets strict discount and refund boundaries for AI-driven checkout operations.
        </p>
        <p className="text-slate-300">
          Clarification: Illustrative template.
        </p>
        <pre className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4 text-sm text-slate-200">
{ecommerceDiscountGuardrailPolicy}
        </pre>
      </section>
    </article>
  );
}