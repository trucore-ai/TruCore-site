/* ────────────────────────────────────────────────────────────────
 *  PortalCreateKeyGuide - API-key-aware activation prompt
 *
 *  Shown when the portal detects the logged-in partner has no API
 *  keys yet (hasApiKey = false). Explains that API keys are
 *  provisioned by the TruCore team and surfaces actionable contact
 *  links alongside quickstart / builder docs.
 *
 *  Placement: above PortalActivationGuide, visible only when the
 *  partner has zero keys.
 *
 *  Server component - no client JS required.
 * ──────────────────────────────────────────────────────────── */

import Link from "next/link";

const DISCORD_INVITE =
  process.env.NEXT_PUBLIC_DISCORD_INVITE_URL || "https://discord.gg/hZWTn6Vr";

export function PortalCreateKeyGuide() {
  return (
    <section className="space-y-4 rounded-xl border border-amber-500/30 bg-amber-500/[0.06] p-5">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-amber-300">
          You need an API key to get started
        </h2>
        <p className="text-sm text-slate-300">
          API keys are provisioned by the TruCore team. Reach out and
          we&apos;ll issue one for your account — usually within minutes
          during business hours.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <a
          href={DISCORD_INVITE}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-amber-400/40 bg-amber-500/20 px-4 py-2 text-sm font-semibold text-amber-200 transition-colors hover:bg-amber-500/30"
        >
          <span aria-hidden="true">💬</span>
          Request a key on Discord
        </a>
        <a
          href="mailto:support@trucore.xyz?subject=API%20key%20request"
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10"
        >
          <span aria-hidden="true">✉</span>
          Email support
        </a>
      </div>

      <p className="text-xs text-slate-500">
        Once your key is issued it will appear in the{" "}
        <a href="#api-keys" className="text-slate-400 underline underline-offset-2 hover:text-slate-300">
          API Keys
        </a>{" "}
        table below. While you wait, explore the guides:
      </p>

      <div className="flex flex-wrap gap-4 text-sm">
        <Link
          href="/docs/quickstart"
          className="font-medium text-slate-400 underline decoration-slate-500/30 underline-offset-2 transition-colors hover:text-slate-300 hover:decoration-slate-400/50"
        >
          Quickstart guide
        </Link>
        <Link
          href="/builders"
          className="font-medium text-slate-400 underline decoration-slate-500/30 underline-offset-2 transition-colors hover:text-slate-300 hover:decoration-slate-400/50"
        >
          Builder docs
        </Link>
      </div>
    </section>
  );
}
