import type { Metadata } from "next";
import Link from "next/link";
import { HeadingAnchor } from "@/components/heading-anchor";
import { AtfCopyCommand } from "@/components/atf-copy-command";
import { WindowsCliNote } from "@/components/windows-cli-note";
import { getAtfCliTag, getAtfCliVersion } from "@/lib/version";

export const metadata: Metadata = {
  title: "DEX Guardrails",
  description:
    "ATF DEX guardrails: slippage caps, DEX allowlists, mint allow/deny lists, unverified route deny, and deterministic receipts.",
};

export default function DocsDexGuardrailsPage() {
  const cliTag = getAtfCliTag();
  const cliVersion = getAtfCliVersion();

  return (
    <article className="space-y-8">
      <header className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Enforcement</p>
        <h1 className="text-4xl font-bold tracking-tight text-accent-200 sm:text-5xl">
          DEX Guardrails
        </h1>
        <p className="max-w-3xl text-lg leading-relaxed text-slate-300">
          Deterministic enforcement for every DEX swap. Slippage caps, protocol allowlists,
          unverified route deny, and mint controls. Every decision produces a verifiable receipt.
        </p>
      </header>

      {/* ── Slippage caps ── */}
      <section className="space-y-4">
        <HeadingAnchor id="slippage-caps">Slippage caps</HeadingAnchor>
        <p className="text-slate-300">
          Every swap request includes a <code className="text-slate-100">max_slippage_bps</code>{" "}
          value. ATF checks this against the policy-configured ceiling before the operation reaches
          the DEX. If the requested slippage exceeds the cap, the operation is denied.
        </p>
        <div className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4">
          <pre className="text-sm text-slate-200 leading-relaxed">{`swap:
  max_slippage_bps: 100   # 1% max slippage
  min_out_check: true     # enforce minimum output amount`}</pre>
        </div>
        <p className="text-sm text-slate-400">
          Slippage is checked pre-flight. If the swap would exceed the configured bound at
          settlement, the transaction is not submitted.
        </p>
      </section>

      {/* ── DEX allowlists ── */}
      <section className="space-y-4">
        <HeadingAnchor id="dex-allowlists">DEX allowlists</HeadingAnchor>
        <p className="text-slate-300">
          Only explicitly approved DEX venues can process swap operations. Any route that touches
          an unapproved program is denied.
        </p>
        <div className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4">
          <pre className="text-sm text-slate-200 leading-relaxed">{`swap:
  dex_allowlist:
    - jupiter
    - orca
    - raydium
  deny_unlisted_dex: true`}</pre>
        </div>
        <p className="text-slate-300">
          <strong className="text-slate-100">Jupiter, Orca, and Raydium</strong> are the supported DEX paths in
          ATF v1. Additional venues will be added as adapters are validated and audited.
        </p>
      </section>

      {/* ── Unverified route deny ── */}
      <section className="space-y-4">
        <HeadingAnchor id="unverified-route-deny">Unverified route deny</HeadingAnchor>
        <p className="text-slate-300">
          When <code className="text-slate-100">deny_unverified_routes</code> is enabled, ATF
          rejects any swap route that includes an intermediate hop through an unverified or unknown
          program. This prevents routing through potentially compromised or malicious contracts.
        </p>
        <div className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4">
          <pre className="text-sm text-slate-200 leading-relaxed">{`swap:
  deny_unverified_routes: true`}</pre>
        </div>
      </section>

      {/* ── Mint allow/deny lists ── */}
      <section className="space-y-4">
        <HeadingAnchor id="mint-lists">Mint allow/deny lists</HeadingAnchor>
        <p className="text-slate-300">
          Control which token mints an agent can interact with. You can run in allowlist mode
          (only listed mints are accepted) or denylist mode (listed mints are blocked).
        </p>
        <div className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4">
          <pre className="text-sm text-slate-200 leading-relaxed">{`swap:
  mint_allowlist:
    - So11111111111111111111111111111111111111112  # SOL
    - EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v # USDC
  mint_denylist:
    - <known_scam_mint_address>`}</pre>
        </div>
        <p className="text-sm text-slate-400">
          If both lists are configured, the allowlist takes precedence. A mint must appear on the
          allowlist and not appear on the denylist.
        </p>
      </section>

      {/* ── Deterministic receipts ── */}
      <section className="space-y-4">
        <HeadingAnchor id="deterministic-receipts">Deterministic receipts</HeadingAnchor>
        <p className="text-slate-300">
          Every DEX guardrail evaluation produces a cryptographic receipt. The receipt includes the
          policy version, the decision (allow/deny), the reason code, and a content hash that can
          be independently recomputed.
        </p>
        <ul className="ml-5 list-disc space-y-2 text-slate-300">
          <li>Receipt is generated for <strong className="text-slate-100">every</strong> evaluation, not just denials.</li>
          <li>Content hash is deterministic: same input always produces the same hash.</li>
          <li>Receipts are tamper-evident and auditable post-trade.</li>
        </ul>
      </section>

      {/* ── CLI quickstart ── */}
      <section className="space-y-4">
        <HeadingAnchor id="cli-quickstart">CLI quickstart</HeadingAnchor>
        <div className="rounded-xl border border-primary-300/20 bg-primary-500/5 p-5 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-200">Install the CLI</p>
          <AtfCopyCommand command={`npm install -g @trucore/atf@${cliVersion}`} testId="dex-install-global" />
          <p className="text-sm text-slate-400">Or run without installing (macOS/Linux only): <code className="font-mono text-slate-300">npx @trucore/atf@{cliVersion} &lt;command&gt;</code></p>
          <WindowsCliNote />
        </div>
        <p className="text-slate-300">
          Run a swap simulation through the ATF CLI:
        </p>
        <div className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4">
          <pre className="text-sm text-slate-200 leading-relaxed">{`# Simulate a swap with slippage check
npx @trucore/atf@${cliTag} simulate --preset swap_small --verify

# Simulate with custom JSON
npx @trucore/atf@${cliTag} simulate --json '{
  "action": "swap",
  "token_in": "SOL",
  "token_out": "USDC",
  "amount": 10,
  "max_slippage_bps": 100,
  "ttl_seconds": 60
}'`}</pre>
        </div>
        <p className="text-sm text-slate-400">
          Use <code className="text-slate-300">--verify</code> to confirm the receipt hash matches
          the expected output.
        </p>
      </section>

      {/* ── Example policy ── */}
      <section className="space-y-4">
        <HeadingAnchor id="example-policy">Example policy (YAML)</HeadingAnchor>
        <div className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4">
          <pre className="text-sm text-slate-200 leading-relaxed">{`swap:
  enabled: true
  dex_allowlist:
    - jupiter
    - orca
    - raydium
  deny_unlisted_dex: true
  deny_unverified_routes: true
  max_slippage_bps: 100
  min_out_check: true
  mint_allowlist:
    - So11111111111111111111111111111111111111112
    - EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
  mint_denylist: []`}</pre>
        </div>
      </section>

      {/* ── Next steps ── */}
      <section className="space-y-4">
        <HeadingAnchor id="next-steps">Next steps</HeadingAnchor>
        <ul className="space-y-2 text-slate-300">
          <li>
            <Link href="/docs/perps" className="font-semibold text-primary-100 transition-colors hover:text-primary-200">
              Perps Enforcement
            </Link>{" "}
            &mdash; leverage caps, venue gates, and operation allowlists for perpetual futures.
          </li>
          <li>
            <Link href="/docs/policy-model" className="font-semibold text-primary-100 transition-colors hover:text-primary-200">
              Policy Model
            </Link>{" "}
            &mdash; full reference for all policy primitives.
          </li>
          <li>
            <Link href="/docs/cli" className="font-semibold text-primary-100 transition-colors hover:text-primary-200">
              ATF CLI
            </Link>{" "}
            &mdash; complete command reference.
          </li>
          <li>
            <Link href="/receipts" className="font-semibold text-primary-100 transition-colors hover:text-primary-200">
              Receipts Explorer
            </Link>{" "}
            &mdash; view example receipts and verify content hashes.
          </li>
        </ul>
      </section>
    </article>
  );
}
