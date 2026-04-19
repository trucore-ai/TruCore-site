import type { Metadata } from "next";
import { HeadingAnchor } from "@/components/heading-anchor";

export const metadata: Metadata = {
  title: "Auto-Dynamic PIL | TruCore ATF",
  description:
    "How Auto-Dynamic Policy Intelligence Layer (PIL) works: bounded adaptive tuning, safety rails, durable policy vs adaptive overlay, and practical usage guidance.",
  keywords: [
    "Auto-Dynamic PIL",
    "adaptive policy",
    "policy intelligence",
    "PIL",
    "ATF",
    "TruCore ATF",
    "slippage adaptive",
    "bounded policy",
  ],
  openGraph: {
    title: "Auto-Dynamic PIL | TruCore ATF",
    description:
      "Bounded adaptive policy tuning for the next transaction. Learn how it works, what it can change, and what it cannot touch.",
    url: "https://trucore.xyz/docs/policies/auto-dynamic-pil",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Auto-Dynamic PIL | TruCore ATF",
    description:
      "Bounded adaptive policy tuning for the next transaction. Safety rails, durable vs adaptive, usage guidance.",
    images: ["/opengraph-image"],
  },
  alternates: { canonical: "https://trucore.xyz/docs/policies/auto-dynamic-pil" },
};

export default function DocsAutoDynamicPilPage() {
  return (
    <article className="space-y-8">
      <header className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
          Policy Intelligence
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-accent-200 sm:text-5xl">
          Auto-Dynamic PIL
        </h1>
        <p className="max-w-3xl text-lg leading-relaxed text-slate-300">
          Premium adaptive policy assistance. Auto-Dynamic PIL can tune a bounded set of
          execution parameters for the next transaction in the same market — deterministically,
          transparently, and without touching your durable policy defaults.
        </p>
      </header>

      {/* ── What it is ── */}
      <section className="space-y-4">
        <HeadingAnchor id="what-it-is">What Auto-Dynamic PIL is</HeadingAnchor>
        <p className="text-slate-300">
          Auto-Dynamic PIL (Policy Intelligence Layer) is an opt-in premium feature that analyzes
          same-market signals and produces a bounded, next-transaction policy overlay. The
          adjustment is:
        </p>
        <ul className="space-y-2 text-slate-300 list-disc pl-5">
          <li>
            <span className="font-semibold text-slate-100">Same-market scoped</span> — signals and
            adjustments are specific to the market pair in the pending transaction.
          </li>
          <li>
            <span className="font-semibold text-slate-100">Next-transaction only</span> — the
            overlay expires after one use. It is not persisted.
          </li>
          <li>
            <span className="font-semibold text-slate-100">Bounded and deterministic</span> — every
            adjustment is capped by hard policy limits. The system does not guess freely.
          </li>
          <li>
            <span className="font-semibold text-slate-100">Explainable</span> — each adjustment
            produces receipt evidence so you can inspect what was applied and why.
          </li>
        </ul>
      </section>

      {/* ── The three modes ── */}
      <section className="space-y-4">
        <HeadingAnchor id="modes">The three modes</HeadingAnchor>
        <p className="text-slate-300">
          Auto-Dynamic PIL has three operating modes selectable from the{" "}
          <span className="font-semibold text-slate-100">Policy Controls</span> screen:
        </p>
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full text-sm text-left text-slate-300">
            <thead>
              <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3 pr-6">Mode</th>
                <th className="px-4 py-3">Behavior</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <tr>
                <td className="px-4 py-3 font-semibold text-slate-200 whitespace-nowrap">Off</td>
                <td className="px-4 py-3 text-slate-400">
                  PIL is fully disabled. No adaptive changes are computed or applied. Your durable
                  policy defaults govern every transaction without modification.
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-slate-200 whitespace-nowrap">Recommend</td>
                <td className="px-4 py-3 text-slate-400">
                  PIL computes bounded recommendations and surfaces them in the Policy Controls UI.
                  Nothing is applied automatically — you review and accept or dismiss each
                  suggestion.
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-slate-200 whitespace-nowrap">
                  Auto (bounded)
                </td>
                <td className="px-4 py-3 text-slate-400">
                  PIL computes and automatically applies the bounded next-transaction overlay
                  without requiring manual approval. The overlay is still constrained by hard caps
                  and expires after the next transaction in that market.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ── What it can change ── */}
      <section className="space-y-4">
        <HeadingAnchor id="eligible-fields">What it can change (v1)</HeadingAnchor>
        <p className="text-slate-300">
          In v1, Auto-Dynamic PIL can adjust one field:
        </p>
        <ul className="space-y-2 text-slate-300 list-disc pl-5">
          <li>
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[13px] text-slate-200">
              max_slippage_bps
            </code>{" "}
            — the maximum tolerated slippage for a DEX swap, in basis points. PIL may propose a
            tighter or wider bound based on same-market volatility signals.
          </li>
        </ul>
        <p className="text-sm text-slate-400">
          The set of eligible fields expands over time as confidence and verifiability increase.
          Additional fields will be documented here as they become available.
        </p>
      </section>

      {/* ── What it does NOT do ── */}
      <section className="space-y-4">
        <HeadingAnchor id="what-it-does-not-do">What it does not do</HeadingAnchor>
        <p className="text-slate-300">
          Auto-Dynamic PIL has hard boundaries. It does not:
        </p>
        <ul className="space-y-2 text-slate-300 list-disc pl-5">
          <li>
            <span className="font-semibold text-slate-100">Rewrite trust boundaries</span> — it
            cannot expand your DEX allowlist, modify your allowed protocols, or change spend limits
            beyond the pre-configured range.
          </li>
          <li>
            <span className="font-semibold text-slate-100">Mutate allow or deny lists</span> — token
            and program allow/deny lists are durable policy. PIL does not touch them.
          </li>
          <li>
            <span className="font-semibold text-slate-100">Override your explicit overrides</span>{" "}
            — if you have manually set a value in Policy Controls, PIL will not silently supersede
            it beyond bounded deltas.
          </li>
          <li>
            <span className="font-semibold text-slate-100">Persist changes</span> — no adaptive
            adjustment is written into your durable policy. Every overlay is ephemeral.
          </li>
        </ul>
      </section>

      {/* ── Durable policy vs adaptive overlay ── */}
      <section className="space-y-4">
        <HeadingAnchor id="durable-vs-adaptive">
          Durable policy vs adaptive overlay
        </HeadingAnchor>
        <p className="text-slate-300">
          Understanding this distinction is key to using Auto-Dynamic PIL safely.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Durable Policy
            </p>
            <p className="text-sm text-slate-300">
              Your standing defaults and overrides. Configured in Policy Controls.
              These are the permanent rules that govern every transaction unless an
              adaptive overlay is active.
            </p>
            <ul className="text-sm text-slate-400 list-disc pl-4 space-y-1">
              <li>Survives across all transactions</li>
              <li>Explicit operator and user intent</li>
              <li>What you set is what enforces</li>
            </ul>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Adaptive Overlay
            </p>
            <p className="text-sm text-slate-300">
              A bounded, next-transaction adjustment computed by PIL. Not written to durable
              policy. Expires after one use in the same market.
            </p>
            <ul className="text-sm text-slate-400 list-disc pl-4 space-y-1">
              <li>Single-use, then discarded</li>
              <li>Bounded by hard caps</li>
              <li>Produces a receipt event for auditability</li>
            </ul>
          </div>
        </div>
        <p className="text-sm text-slate-400">
          A <span className="text-slate-300 font-medium">pending overlay</span> is an adaptive
          adjustment that has been computed and queued but not yet consumed. You can see pending
          overlays in the Policy Controls adaptive status grid. Once the next qualifying
          transaction executes, the overlay is applied and then discarded.
        </p>
      </section>

      {/* ── Safety rails ── */}
      <section className="space-y-4">
        <HeadingAnchor id="safety-rails">Safety rails</HeadingAnchor>
        <p className="text-slate-300">
          Every Auto-Dynamic PIL adjustment operates within multiple layers of safety constraints:
        </p>
        <ul className="space-y-3 text-slate-300">
          <li>
            <span className="font-semibold text-slate-100">Bounded delta size</span> — each
            eligible field has a maximum allowed change magnitude. PIL cannot push a value beyond
            that delta, regardless of market signals.
          </li>
          <li>
            <span className="font-semibold text-slate-100">Hard caps</span> — absolute policy
            ceilings enforced by ATF. An adaptive overlay can never result in a value that exceeds
            the configured hard cap for that field.
          </li>
          <li>
            <span className="font-semibold text-slate-100">Same-market scope</span> — signals are
            scoped to the specific market pair. An adjustment for SOL/USDC does not influence
            ETH/USDC behavior.
          </li>
          <li>
            <span className="font-semibold text-slate-100">
              Next-transaction TTL (time-to-live)
            </span>{" "}
            — overlays expire after one transaction. They are not cumulative and do not carry
            forward.
          </li>
          <li>
            <span className="font-semibold text-slate-100">Explainability and receipts</span> —
            every applied overlay generates a receipt event. You can inspect the pre-overlay value,
            the applied adjustment, and the reason at any time.
          </li>
        </ul>
      </section>

      {/* ── Practical usage guidance ── */}
      <section className="space-y-4">
        <HeadingAnchor id="how-to-use-it">How to use it safely</HeadingAnchor>

        <div className="space-y-3">
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
            <p className="text-sm font-semibold text-slate-200">When to leave it Off</p>
            <p className="mt-1 text-sm text-slate-400">
              If you have strict compliance requirements, prefer full operator control, or are
              running in a context where every policy change needs human sign-off, leave PIL off.
              Your durable policy governs entirely.
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
            <p className="text-sm font-semibold text-slate-200">When Recommend mode is best</p>
            <p className="mt-1 text-sm text-slate-400">
              Use Recommend when you want the benefit of market-signal intelligence but want to
              review every suggestion before it applies. Good for learning the system or for
              contexts where you are actively monitoring trade outcomes.
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
            <p className="text-sm font-semibold text-slate-200">
              When Auto (bounded) makes sense
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Use Auto (bounded) when you trust the bounded behavior, want frictionless
              next-transaction adaptation, and are comfortable with the hard caps in place. Suitable
              for automated agent workflows where real-time human review is not practical. Review
              your receipt events periodically to verify behavior.
            </p>
          </div>
        </div>
      </section>

      {/* ── How to verify what happened ── */}
      <section className="space-y-4">
        <HeadingAnchor id="verifying">How to verify what happened</HeadingAnchor>
        <p className="text-slate-300">
          Adaptive events are surfaced in two places:
        </p>
        <ul className="space-y-2 text-slate-300 list-disc pl-5">
          <li>
            <span className="font-semibold text-slate-100">Policy Controls status grid</span> —
            shows the latest adaptive event via the customer policy payload&apos;s
            {" "}
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[13px] text-slate-300">
              adaptive_pil.latest_event
            </code>
            {" "}
            field.
          </li>
          <li>
            <span className="font-semibold text-slate-100">Receipt evidence</span> — each applied
            overlay appends adaptive PIL details to the transaction receipt.
          </li>
        </ul>
        <p className="text-sm text-slate-400">
          If an adjustment was applied and you want to understand why, locate the corresponding
          receipt and inspect the nested{" "}
          <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[13px] text-slate-300">
            adaptive_pil
          </code>{" "}
          object. It contains an{" "}
          <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[13px] text-slate-300">
            applied_event
          </code>{" "}
          record when an overlay is consumed, a{" "}
          <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[13px] text-slate-300">
            recommendation_event
          </code>{" "}
          record when a bounded recommendation is produced, and an{" "}
          <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[13px] text-slate-300">
            overlay_used
          </code>{" "}
          boolean indicating whether a pending overlay was actually applied on that transaction.
        </p>
      </section>

      {/* ── Availability ── */}
      <section className="space-y-4">
        <HeadingAnchor id="availability">Availability</HeadingAnchor>
        <p className="text-slate-300">
          Auto-Dynamic PIL is available on Pro and Enterprise plans. Free-tier accounts can view
          the adaptive section and access this documentation, but the mode selectors will remain
          locked until upgrading.
        </p>
      </section>
    </article>
  );
}
