import type { Metadata } from "next";
import Link from "next/link";
import { HeadingAnchor } from "@/components/heading-anchor";
import { AtfCopyCommand } from "@/components/atf-copy-command";
import { getAtfCliVersion } from "@/lib/version";

export const metadata: Metadata = {
  title: "ATF CLI Guide: Swap Permit Parameters",
  description:
    "Full reference for swap permit parameters, safe defaults, override precedence, and the ATF enforcement model.",
};

const cliVersion = getAtfCliVersion();

export default function SwapPermitsGuidePage() {
  return (
    <article className="space-y-10">
      <header className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
          CLI &rsaquo; Guides &rsaquo; Swap Permits
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-accent-200 sm:text-5xl">
          Swap Permit Parameters
        </h1>
        <p className="max-w-3xl text-lg leading-relaxed text-slate-300">
          A complete reference for the parameters that define a swap permit. Understand what each field does,
          which are required, and how override precedence works.
        </p>
      </header>

      {/* ── Parameter Glossary ── */}
      <section className="space-y-4">
        <HeadingAnchor id="parameter-glossary">Parameter Glossary</HeadingAnchor>
        <p className="text-sm text-slate-300">
          These are the commonly used parameters when constructing a swap permit.
          All parameter names match the CLI flag and policy JSON schema.
        </p>
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-neutral-950/50">
                <th className="px-4 py-2.5 font-semibold text-slate-200">Parameter</th>
                <th className="px-4 py-2.5 font-semibold text-slate-200">Type</th>
                <th className="px-4 py-2.5 font-semibold text-slate-200">Usage</th>
                <th className="px-4 py-2.5 font-semibold text-slate-200">Description</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              <tr className="border-b border-white/5">
                <td className="px-4 py-2.5 font-mono text-primary-200">inputMint</td>
                <td className="px-4 py-2.5">string</td>
                <td className="px-4 py-2.5">Required</td>
                <td className="px-4 py-2.5">Mint address of the token being sold (input side of the swap).</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="px-4 py-2.5 font-mono text-primary-200">outputMint</td>
                <td className="px-4 py-2.5">string</td>
                <td className="px-4 py-2.5">Required</td>
                <td className="px-4 py-2.5">Mint address of the token being purchased (output side of the swap).</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="px-4 py-2.5 font-mono text-primary-200">amount</td>
                <td className="px-4 py-2.5">number</td>
                <td className="px-4 py-2.5">Required</td>
                <td className="px-4 py-2.5">The amount of input tokens to swap, in the smallest unit (lamports or token decimals).</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="px-4 py-2.5 font-mono text-primary-200">maxAmountIn</td>
                <td className="px-4 py-2.5">number</td>
                <td className="px-4 py-2.5">Commonly used</td>
                <td className="px-4 py-2.5">Upper bound on the input amount. Enforced by the policy engine as a hard ceiling.</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="px-4 py-2.5 font-mono text-primary-200">minAmountOut</td>
                <td className="px-4 py-2.5">number</td>
                <td className="px-4 py-2.5">Commonly used</td>
                <td className="px-4 py-2.5">Minimum acceptable output. The swap is blocked if the expected output falls below this value.</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="px-4 py-2.5 font-mono text-primary-200">slippageBps</td>
                <td className="px-4 py-2.5">number</td>
                <td className="px-4 py-2.5">Commonly used</td>
                <td className="px-4 py-2.5">Maximum slippage tolerance in basis points (1 bps = 0.01%). The policy engine blocks swaps exceeding this bound.</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="px-4 py-2.5 font-mono text-primary-200">allowedPrograms</td>
                <td className="px-4 py-2.5">string[]</td>
                <td className="px-4 py-2.5">Commonly used</td>
                <td className="px-4 py-2.5">Allowlist of on-chain program IDs the swap may interact with (e.g. Jupiter aggregator).</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="px-4 py-2.5 font-mono text-primary-200">ttlSeconds</td>
                <td className="px-4 py-2.5">number</td>
                <td className="px-4 py-2.5">Commonly used</td>
                <td className="px-4 py-2.5">Time-to-live for the permit in seconds. After expiry the permit is no longer valid.</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="px-4 py-2.5 font-mono text-primary-200">nonce</td>
                <td className="px-4 py-2.5">string</td>
                <td className="px-4 py-2.5">Commonly used</td>
                <td className="px-4 py-2.5">Unique value for replay protection. Prevents the same permit from being evaluated twice.</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="px-4 py-2.5 font-mono text-primary-200">profile</td>
                <td className="px-4 py-2.5">string</td>
                <td className="px-4 py-2.5">Commonly used</td>
                <td className="px-4 py-2.5">Named profile to use for this command. Determines wallet, RPC, and network context.</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-mono text-primary-200">network</td>
                <td className="px-4 py-2.5">string</td>
                <td className="px-4 py-2.5">Commonly used</td>
                <td className="px-4 py-2.5">Target network: <code className="font-mono text-slate-200">devnet</code> or <code className="font-mono text-slate-200">mainnet-beta</code>.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Safe Defaults ── */}
      <section className="space-y-4">
        <HeadingAnchor id="safe-defaults">Safe Defaults Guidance</HeadingAnchor>
        <p className="text-sm text-slate-300">
          If you are unsure what values to use, these are reasonable starting points for devnet testing:
        </p>
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-neutral-950/50">
                <th className="px-4 py-2.5 font-semibold text-slate-200">Parameter</th>
                <th className="px-4 py-2.5 font-semibold text-slate-200">Suggested default</th>
                <th className="px-4 py-2.5 font-semibold text-slate-200">Notes</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              <tr className="border-b border-white/5">
                <td className="px-4 py-2.5 font-mono text-primary-200">slippageBps</td>
                <td className="px-4 py-2.5">50</td>
                <td className="px-4 py-2.5">0.5% slippage. Conservative for most pairs.</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="px-4 py-2.5 font-mono text-primary-200">ttlSeconds</td>
                <td className="px-4 py-2.5">120</td>
                <td className="px-4 py-2.5">2 minutes. Enough time to verify and send.</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="px-4 py-2.5 font-mono text-primary-200">network</td>
                <td className="px-4 py-2.5">devnet</td>
                <td className="px-4 py-2.5">Always start on devnet. Switch to mainnet-beta only when ready.</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-mono text-primary-200">amount</td>
                <td className="px-4 py-2.5">1000000</td>
                <td className="px-4 py-2.5">1 token (assuming 6 decimals). Small enough to be safe for testing.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm text-slate-400">
          Production deployments should set tighter slippage and shorter TTL values based on your
          specific use case and risk tolerance.
        </p>
      </section>

      {/* ── Override Precedence ── */}
      <section className="space-y-4">
        <HeadingAnchor id="override-precedence">Override Precedence</HeadingAnchor>
        <p className="text-sm text-slate-300">
          When the same parameter is specified in multiple places, ATF resolves it
          from highest to lowest priority:
        </p>
        <ol className="list-decimal space-y-2 pl-6 text-sm text-slate-300">
          <li>
            <strong className="text-slate-100">CLI flags</strong> override everything.
            If you pass <code className="font-mono text-slate-200">--slippage-bps 25</code> on the command line,
            that value is used regardless of policy or preset.
          </li>
          <li>
            <strong className="text-slate-100">Policy JSON</strong> values override presets and profile config.
            Use a policy file for repeatable, version-controlled parameter sets.
          </li>
          <li>
            <strong className="text-slate-100">Preset</strong> defaults apply when no flag or policy specifies
            the parameter. Presets like <code className="font-mono text-slate-200">swap_small</code> bundle
            sensible values for common scenarios.
          </li>
          <li>
            <strong className="text-slate-100">Profile config</strong> provides the baseline.
            Network, RPC endpoint, and wallet come from the active profile unless overridden.
          </li>
        </ol>
        <AtfCopyCommand
          label="Example: flag overrides preset slippage"
          command={`npx @trucore/atf@${cliVersion} simulate --preset swap_small --slippage-bps 25 --verify`}
        />
        <p className="text-sm text-slate-400">
          In this example, the preset provides all parameters except slippage. The explicit
          flag sets slippage to 25 bps instead of the preset default.
        </p>
      </section>

      {/* ── Redaction & No Secrets ── */}
      <section className="space-y-4">
        <HeadingAnchor id="redaction">Redaction and No-Secrets Behavior</HeadingAnchor>
        <div className="max-w-3xl space-y-3 text-slate-300">
          <p>
            The ATF CLI never sends private keys, seed phrases, or API secrets to the ATF API.
            Wallet signing happens locally. RPC keys are used only for direct RPC calls and are
            never included in permit payloads or receipts.
          </p>
          <p>
            CLI output redacts sensitive values by default. Wallet addresses are shown in
            abbreviated form (e.g. <code className="font-mono text-slate-200">5UBb...xYz3</code>)
            and API keys are never echoed back.
          </p>
          <p>
            Receipts are fully self-contained and contain no secrets. You can safely store, share,
            and audit receipts without exposing any private material.
          </p>
        </div>
      </section>

      <nav className="pt-4 text-sm text-slate-400">
        <Link href="/docs/cli/guides" className="font-semibold text-primary-100 transition-colors hover:text-primary-200">
          &larr; Back to Guides
        </Link>
      </nav>
    </article>
  );
}
