/* ────────────────────────────────────────────────────────────────
 *  PortalCreateKeyGuide — API-key-aware activation prompt
 *
 *  Shown when the portal detects the logged-in partner has no API
 *  keys yet (hasApiKey = false). Directs the user to the API Keys
 *  section on the portal page and surfaces quickstart / builder
 *  docs as secondary links.
 *
 *  Placement: above PortalActivationGuide, visible only when the
 *  partner has zero keys.
 *
 *  Server component — no client JS required.
 * ──────────────────────────────────────────────────────────── */

import Link from "next/link";

export function PortalCreateKeyGuide() {
  return (
    <section className="space-y-4 rounded-xl border border-amber-500/30 bg-amber-500/[0.06] p-5">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-amber-300">
          Create your API key
        </h2>
        <p className="text-sm text-slate-300">
          You don&apos;t have an API key yet. Create one to start sending
          protected trades through the firewall.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <a
          href="#api-keys"
          className="inline-flex items-center rounded-lg border border-amber-400/40 bg-amber-500/20 px-4 py-2 text-sm font-semibold text-amber-200 transition-colors hover:bg-amber-500/30"
        >
          Create API key
        </a>
      </div>

      <div className="flex flex-wrap gap-4 pt-1 text-sm">
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
