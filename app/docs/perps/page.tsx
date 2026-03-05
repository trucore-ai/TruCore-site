import type { Metadata } from "next";
import Link from "next/link";
import { HeadingAnchor } from "@/components/heading-anchor";
import { getAtfCliTag } from "@/lib/version";

export const metadata: Metadata = {
  title: "Perps Enforcement",
  description:
    "ATF perps enforcement for Hyperliquid, Drift v2, and Mango v4. Feature-gated, fail-closed, deterministic receipts.",
};

export default function DocsPerpsPage() {
  const cliTag = getAtfCliTag();

  return (
    <article className="space-y-8">
      <header className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Enforcement</p>
        <h1 className="text-4xl font-bold tracking-tight text-[#ffe0b2] sm:text-5xl">
          Perps Enforcement
        </h1>
        <p className="max-w-3xl text-lg leading-relaxed text-slate-300">
          ATF enforces deterministic constraints on perpetual futures operations across multiple
          venues. Each adapter is feature-gated, OFF by default, and fail-closed on unknown
          operations.
        </p>
      </header>

      {/* ── What it enforces ── */}
      <section className="space-y-4">
        <HeadingAnchor id="what-it-enforces">What it enforces</HeadingAnchor>
        <p className="text-slate-300">
          Every perps operation is checked against the active policy before execution. The following
          constraints are evaluated deterministically:
        </p>
        <ul className="space-y-3 text-slate-300">
          <li>
            <span className="font-semibold text-slate-100">Venue allowlist</span> &mdash; only
            explicitly enabled venues can process perps operations. All others are denied.
          </li>
          <li>
            <span className="font-semibold text-slate-100">Market allowlist</span> &mdash; restrict
            which perpetual markets an agent can interact with (e.g. SOL-PERP, BTC-PERP).
          </li>
          <li>
            <span className="font-semibold text-slate-100">Leverage caps</span> &mdash; maximum
            leverage per market. Operations exceeding the cap are rejected.
          </li>
          <li>
            <span className="font-semibold text-slate-100">Notional limits</span> &mdash; cap the
            total notional value per order to prevent outsized exposure.
          </li>
          <li>
            <span className="font-semibold text-slate-100">Operation allowlist</span> &mdash; only
            known operation types (open, close, modify) are permitted. Unknown types are denied
            immediately.
          </li>
        </ul>
      </section>

      {/* ── Feature gating ── */}
      <section className="space-y-4">
        <HeadingAnchor id="feature-gating">Feature gating</HeadingAnchor>
        <p className="text-slate-300">
          All perps adapters are <strong className="text-slate-100">OFF by default</strong>. You
          must explicitly enable each venue with an environment flag. If the flag is not set, every
          operation targeting that venue is denied. This is intentional: fail-closed means no
          surprises.
        </p>
        <div className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4">
          <pre className="text-sm text-slate-200 leading-relaxed">{`# Enable venue adapters individually
ATF_ENABLE_HYPERLIQUID_POLICY=1
ATF_ENABLE_DRIFT_POLICY=1
ATF_ENABLE_MANGO_POLICY=1`}</pre>
        </div>
        <p className="text-sm text-slate-400">
          When a flag is unset or set to <code className="text-slate-300">0</code>, the adapter is
          fully disabled. The ATF runtime will not evaluate any perps policy for that venue.
        </p>
      </section>

      {/* ── Supported venues ── */}
      <section className="space-y-4">
        <HeadingAnchor id="supported-venues">Supported venues</HeadingAnchor>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-slate-300">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                <th className="py-2 pr-4">Venue</th>
                <th className="py-2 pr-4">Chain</th>
                <th className="py-2 pr-4">Type</th>
                <th className="py-2 pr-4">Env flag</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <tr>
                <td className="py-2 pr-4 font-semibold text-slate-100">Hyperliquid</td>
                <td className="py-2 pr-4">L1 (own chain)</td>
                <td className="py-2 pr-4">Perps</td>
                <td className="py-2 pr-4">
                  <code className="text-xs text-amber-300">ATF_ENABLE_HYPERLIQUID_POLICY</code>
                </td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-semibold text-slate-100">Drift v2</td>
                <td className="py-2 pr-4">Solana</td>
                <td className="py-2 pr-4">Perps</td>
                <td className="py-2 pr-4">
                  <code className="text-xs text-amber-300">ATF_ENABLE_DRIFT_POLICY</code>
                </td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-semibold text-slate-100">Mango v4</td>
                <td className="py-2 pr-4">Solana</td>
                <td className="py-2 pr-4">Perps</td>
                <td className="py-2 pr-4">
                  <code className="text-xs text-amber-300">ATF_ENABLE_MANGO_POLICY</code>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Fail-closed behavior ── */}
      <section className="space-y-4">
        <HeadingAnchor id="fail-closed">Fail-closed behavior</HeadingAnchor>
        <p className="text-slate-300">
          If any of the following conditions are true, the operation is <strong className="text-slate-100">denied</strong>:
        </p>
        <ul className="ml-5 list-disc space-y-2 text-slate-300">
          <li>The venue adapter is not enabled (env flag unset or set to 0).</li>
          <li>The market is not on the allowed markets list.</li>
          <li>Requested leverage exceeds the configured cap.</li>
          <li>Notional value exceeds the configured limit.</li>
          <li>The operation type is unknown or not in the operation allowlist.</li>
          <li>Any required field is missing or malformed.</li>
        </ul>
        <p className="text-sm text-slate-400">
          The default outcome is always deny. ATF does not fall back to a permissive mode.
        </p>
      </section>

      {/* ── CLI quickstart ── */}
      <section className="space-y-4">
        <HeadingAnchor id="cli-quickstart">CLI quickstart</HeadingAnchor>
        <p className="text-slate-300">
          The ATF CLI includes perps-specific commands. Install the CLI pinned to the current release:
        </p>
        <div className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4">
          <pre className="text-sm text-slate-200 leading-relaxed">{`npx @trucore/atf@${cliTag} perps fixtures`}</pre>
        </div>
        <p className="mt-2 text-slate-300">
          Generate fixture data for a supported venue, then run protect and explain:
        </p>
        <div className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4">
          <pre className="text-sm text-slate-200 leading-relaxed">{`# Load fixtures for Drift v2
npx @trucore/atf@${cliTag} perps fixtures --venue drift

# Protect: evaluate a perps operation against policy
echo '<ExecutionRequest JSON>' | npx @trucore/atf@${cliTag} perps protect --stdin

# Explain: get a human-readable breakdown of the decision
echo '<ExecutionRequest JSON>' | npx @trucore/atf@${cliTag} perps explain --stdin`}</pre>
        </div>
        <p className="text-sm text-slate-400">
          Each command produces a deterministic receipt. Use <code className="text-slate-300">--verify</code> to
          confirm the receipt hash matches the expected output.
        </p>
      </section>

      {/* ── Example policy ── */}
      <section className="space-y-4">
        <HeadingAnchor id="example-policy">Example policy (YAML)</HeadingAnchor>
        <div className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4">
          <pre className="text-sm text-slate-200 leading-relaxed">{`perps:
  enabled: true
  venues:
    - drift_v2
    - mango_v4
    - hyperliquid
  markets:
    - SOL-PERP
    - BTC-PERP
    - ETH-PERP
  perps_leverage_max: 5
  perps_notional_max_usd: 50000
  allowed_operations:
    - open
    - close
    - modify`}</pre>
        </div>
      </section>

      {/* ── Next steps ── */}
      <section className="space-y-4">
        <HeadingAnchor id="next-steps">Next steps</HeadingAnchor>
        <ul className="space-y-2 text-slate-300">
          <li>
            <Link href="/docs/policy-model" className="font-semibold text-primary-100 transition-colors hover:text-primary-200">
              Policy Model
            </Link>{" "}
            &mdash; full reference for all policy primitives.
          </li>
          <li>
            <Link href="/docs/dex-guardrails" className="font-semibold text-primary-100 transition-colors hover:text-primary-200">
              DEX Guardrails
            </Link>{" "}
            &mdash; slippage caps, allowlists, and mint controls for spot DEX operations.
          </li>
          <li>
            <Link href="/docs/cli" className="font-semibold text-primary-100 transition-colors hover:text-primary-200">
              ATF CLI
            </Link>{" "}
            &mdash; complete command reference.
          </li>
          <li>
            <Link href="/docs/live-demo" className="font-semibold text-primary-100 transition-colors hover:text-primary-200">
              Live Demo
            </Link>{" "}
            &mdash; try a perps simulation in the browser.
          </li>
        </ul>
      </section>
    </article>
  );
}
