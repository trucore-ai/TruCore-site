import type { Metadata } from "next";
import Link from "next/link";
import { HeadingAnchor } from "@/components/heading-anchor";
import { AtfCopyCommand } from "@/components/atf-copy-command";
import { getAtfCliVersion } from "@/lib/version";

export const metadata: Metadata = {
  title: "ATF CLI: RPC & Network",
  description:
    "Configure RPC endpoints, set up Helius, test latency with rpc ping, and select networks in the ATF CLI.",
};

const cliVersion = getAtfCliVersion();

export default function RpcPage() {
  return (
    <article className="space-y-10">
      <header className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
          CLI &rsaquo; RPC &amp; Network
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-[#ffe0b2] sm:text-5xl">
          RPC &amp; Network
        </h1>
        <p className="max-w-3xl text-lg leading-relaxed text-slate-300">
          ATF CLI is Helius-first by default. Configure your RPC endpoint, test connectivity,
          and switch between mainnet and devnet.
        </p>
      </header>

      <section className="space-y-4">
        <HeadingAnchor id="helius-setup">Helius RPC Setup</HeadingAnchor>
        <p className="text-sm text-slate-300">
          Helius provides reliable Solana RPC access. Sign up at{" "}
          <a href="https://helius.dev" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary-100 transition-colors hover:text-primary-200">
            helius.dev
          </a>{" "}
          for an API key, then configure the CLI:
        </p>
        <AtfCopyCommand
          label="Set Helius endpoint"
          command={`npx @trucore/atf@${cliVersion} rpc set --provider helius --api-key YOUR_KEY`}
        />
        <AtfCopyCommand
          label="Set Helius for devnet"
          command={`npx @trucore/atf@${cliVersion} rpc set --provider helius --api-key YOUR_KEY --network devnet`}
        />
      </section>

      <section className="space-y-4">
        <HeadingAnchor id="custom-endpoint">Custom RPC Endpoint</HeadingAnchor>
        <p className="text-sm text-slate-300">
          If you use a different RPC provider, set the URL directly:
        </p>
        <AtfCopyCommand
          label="Set custom URL"
          command={`npx @trucore/atf@${cliVersion} rpc set --url https://your-rpc-endpoint.example.com`}
        />
      </section>

      <section className="space-y-4">
        <HeadingAnchor id="rpc-ping">RPC Ping</HeadingAnchor>
        <p className="text-sm text-slate-300">
          Quick latency check to confirm your endpoint is reachable and responsive.
          This is one of the easiest dev tools to run.
        </p>
        <AtfCopyCommand
          label="Ping endpoint"
          command={`npx @trucore/atf@${cliVersion} rpc ping`}
        />
        <pre className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4 text-sm text-slate-200">
{`Pinging https://rpc.helius.xyz ...
Response: 200 OK (38ms)
Network: devnet
Block height: 284,291,044`}
        </pre>
      </section>

      <section className="space-y-4">
        <HeadingAnchor id="network-selection">Network Selection</HeadingAnchor>
        <p className="text-sm text-slate-300">
          Switch between mainnet and devnet using config:
        </p>
        <AtfCopyCommand
          label="Switch to devnet"
          command={`npx @trucore/atf@${cliVersion} config set network devnet`}
        />
        <AtfCopyCommand
          label="Switch to mainnet"
          command={`npx @trucore/atf@${cliVersion} config set network mainnet`}
        />
        <p className="text-sm text-slate-400">
          For quick devnet testing without changing your config, use the{" "}
          <Link href="/docs/cli/burner" className="font-semibold text-primary-100 transition-colors hover:text-primary-200">
            burner command
          </Link>{" "}
          which automatically targets devnet.
        </p>
      </section>

      <section className="space-y-4">
        <HeadingAnchor id="flags">Flags</HeadingAnchor>
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-neutral-950/50">
                <th className="px-4 py-2.5 font-semibold text-slate-200">Flag</th>
                <th className="px-4 py-2.5 font-semibold text-slate-200">Description</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              <tr className="border-b border-white/5">
                <td className="px-4 py-2.5 font-mono text-primary-200">--provider &lt;name&gt;</td>
                <td className="px-4 py-2.5">RPC provider name (e.g., helius).</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="px-4 py-2.5 font-mono text-primary-200">--api-key &lt;key&gt;</td>
                <td className="px-4 py-2.5">API key for the provider.</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="px-4 py-2.5 font-mono text-primary-200">--url &lt;endpoint&gt;</td>
                <td className="px-4 py-2.5">Direct RPC endpoint URL.</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-mono text-primary-200">--network &lt;net&gt;</td>
                <td className="px-4 py-2.5">Target network: mainnet or devnet.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <nav className="pt-4 text-sm text-slate-400">
        <Link href="/docs/cli" className="font-semibold text-primary-100 transition-colors hover:text-primary-200">
          &larr; Back to CLI Documentation
        </Link>
      </nav>
    </article>
  );
}
