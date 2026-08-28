import type { Metadata } from "next";
import Link from "next/link";
import { HeadingAnchor } from "@/components/heading-anchor";
import { TrackedLink } from "@/components/tracked-link";

export const metadata: Metadata = {
  title: "x402Fuel Docs — HTTP 402 Wallets for AI Agents | TruCore",
  description:
    "Complete documentation for x402Fuel: non-custodial wallet daemon that gives AI agents USDC on Base with HTTP 402 payment settlement. Install, create wallets, configure budgets, integrate.",
  keywords: [
    "x402Fuel",
    "HTTP 402",
    "AI agent wallet",
    "USDC payments",
    "non-custodial wallet",
    "agent payments",
    "Base USDC",
    "EIP-3009",
    "agent economy",
  ],
  openGraph: {
    title: "x402Fuel Docs — HTTP 402 Wallets for AI Agents | TruCore",
    description:
      "One binary, no dependencies. Give your AI agent a USDC wallet that speaks HTTP 402.",
    url: "https://trucore.xyz/docs/x402fuel",
  },
  alternates: { canonical: "https://trucore.xyz/docs/x402fuel" },
};

export default function X402FuelDocs() {
  return (
    <>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary-200">
          TruCore Product Docs
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-white sm:text-5xl">
          x402Fuel
        </h1>
        <p className="mt-3 text-xl leading-relaxed text-slate-300">
          Non-custodial HTTP 402 wallet daemon for AI agents. Give your agent a
          USDC wallet on Base with one command. Keys never leave your machine.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <TrackedLink
            href="https://x402fuel.trucore.xyz"
            eventName="x402fuel_docs_try"
            eventProps={{ location: "docs_x402fuel_header" }}
            className="inline-flex items-center gap-2 rounded-xl bg-accent-500 px-5 py-2.5 text-sm font-semibold text-neutral-950 transition-colors hover:bg-accent-400"
          >
            Live Demo →
          </TrackedLink>
          <TrackedLink
            href="https://github.com/trucore-ai/x402fuel"
            eventName="x402fuel_docs_github"
            eventProps={{ location: "docs_x402fuel_header" }}
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-neutral-900/60 px-5 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:border-white/[0.12]"
          >
            GitHub
          </TrackedLink>
        </div>
      </div>

      <HeadingAnchor id="what-is-x402fuel">
        What is x402Fuel?
      </HeadingAnchor>
      <p>
        x402Fuel is a single Go binary that runs on your machine next to your AI
        agent. It acts as a local wallet daemon and HTTP 402 payment proxy.
      </p>
      <p>
        When your agent hits an API that returns{" "}
        <code>402 Payment Required</code>, x402Fuel intercepts the response,
        checks your budget policy, signs a USDC payment on Base with EIP-3009
        authorization, and retries the request with the payment attached. The
        agent gets the resource — no human intervention, no credit card, no
        prepaid API key.
      </p>
      <p>
        <strong>Non-custodial by construction.</strong> Your agent holds its own
        keys — encrypted at rest on your machine. x402Fuel never sees your
        funds. Settlement flows directly from your agent's wallet to the
        merchant on-chain.
      </p>

      <HeadingAnchor id="architecture">
        Architecture
      </HeadingAnchor>
      <p>Six components in one binary:</p>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="pb-2 pr-4 font-semibold text-slate-300">Component</th>
              <th className="pb-2 pr-4 font-semibold text-slate-300">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            <tr>
              <td className="py-2 pr-4 font-mono text-xs text-primary-200">Key Store</td>
              <td className="py-2 text-slate-400">Generates and stores encrypted secp256k1 keys locally. Never transmits key material.</td>
            </tr>
            <tr>
              <td className="py-2 pr-4 font-mono text-xs text-primary-200">Proxy Interceptor</td>
              <td className="py-2 text-slate-400">Sits between your agent and the internet. Catches 402 responses, parses payment requirements.</td>
            </tr>
            <tr>
              <td className="py-2 pr-4 font-mono text-xs text-primary-200">Policy Engine</td>
              <td className="py-2 text-slate-400">Enforces per-txn max, daily cap, per-service allowlist, and global kill switch. Blocks BEFORE signing.</td>
            </tr>
            <tr>
              <td className="py-2 pr-4 font-mono text-xs text-primary-200">Chain Client</td>
              <td className="py-2 text-slate-400">Reads USDC balance, signs EIP-3009 authorization, submits to Base via public RPC.</td>
            </tr>
            <tr>
              <td className="py-2 pr-4 font-mono text-xs text-primary-200">HTMX Dashboard</td>
              <td className="py-2 text-slate-400">Local web UI at <code>localhost:8420</code> — balances, transaction history, budget utilization.</td>
            </tr>
            <tr>
              <td className="py-2 pr-4 font-mono text-xs text-primary-200">Event Logger</td>
              <td className="py-2 text-slate-400">Structured JSONL log of every 402 encounter and payment attempt. Opt-in aggregate telemetry.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <HeadingAnchor id="quickstart">
        Quickstart
      </HeadingAnchor>
      <p>Install, create a wallet, start the daemon:</p>
      <pre className="my-4 overflow-x-auto rounded-xl border border-white/[0.06] bg-neutral-950 p-4 text-sm">
        <code className="text-green-400">
          {`$ go install github.com/trucore-ai/x402fuel@latest
$ x402fuel create --name my-agent
  Created wallet 0x... on Base. Keys stored at ~/.x402fuel/keys/

$ x402fuel serve
  Proxy listening on :8420
  Dashboard at http://localhost:8420`}
        </code>
      </pre>
      <p>
        Point your agent's HTTP proxy at <code>localhost:8420</code>. When the
        agent hits a 402 paywall, x402Fuel handles the rest.
      </p>

      <HeadingAnchor id="cli-reference">
        CLI Reference
      </HeadingAnchor>

      <h3 id="cli-create" className="mt-6 text-lg font-semibold text-slate-200">
        <code>x402fuel create</code>
      </h3>
      <p>Creates a new Base USDC wallet. Keys encrypted at rest.</p>
      <pre className="my-4 overflow-x-auto rounded-xl border border-white/[0.06] bg-neutral-950 p-4 text-sm">
        <code className="text-slate-300">
          {`x402fuel create [flags]

Flags:
  --name string       Wallet name (required)
  --output string     Output format: text (default), json
  --config string     Config file path (default: ~/.x402fuel/config.yaml)`}
        </code>
      </pre>

      <h3 id="cli-serve" className="mt-6 text-lg font-semibold text-slate-200">
        <code>x402fuel serve</code>
      </h3>
      <p>Starts the daemon — proxy + REST API + dashboard.</p>
      <pre className="my-4 overflow-x-auto rounded-xl border border-white/[0.06] bg-neutral-950 p-4 text-sm">
        <code className="text-slate-300">
          {`x402fuel serve [flags]

Flags:
  --port int          Proxy + dashboard port (default: 8420)
  --rpc-url string    Base RPC endpoint (default: public Base RPC)
  --config string     Config file path`}
        </code>
      </pre>

      <h3 id="cli-pause" className="mt-6 text-lg font-semibold text-slate-200">
        <code>x402fuel pause</code>
      </h3>
      <p>Global kill switch. Blocks all new payments within 1 second. In-flight payments still settle.</p>
      <pre className="my-4 overflow-x-auto rounded-xl border border-white/[0.06] bg-neutral-950 p-4 text-sm">
        <code className="text-slate-300">
          {`x402fuel pause
  Payments paused. All future 402 requests will be blocked.

x402fuel pause --resume
  Payments resumed.`}
        </code>
      </pre>

      <h3 id="cli-status" className="mt-6 text-lg font-semibold text-slate-200">
        <code>x402fuel status</code>
      </h3>
      <p>Shows wallet balances, budget utilization, pause state, and recent activity.</p>
      <pre className="my-4 overflow-x-auto rounded-xl border border-white/[0.06] bg-neutral-950 p-4 text-sm">
        <code className="text-slate-300">
          {`x402fuel status [flags]

Flags:
  --output string     Output format: text (default), json
  --json              Short for --output json`}
        </code>
      </pre>

      <HeadingAnchor id="budget-policy">
        Budget Policy
      </HeadingAnchor>
      <p>
        Configured via <code>~/.x402fuel/config.yaml</code>. Policy is enforced
        locally — no cloud dependency.
      </p>
      <pre className="my-4 overflow-x-auto rounded-xl border border-white/[0.06] bg-neutral-950 p-4 text-sm">
        <code className="text-yellow-300">
          {`wallet:
  address: "0x..."

policy:
  max_per_txn_usdc: 5.00        # Block any single payment over $5
  daily_cap_usdc: 50.00          # Block when daily total exceeds $50
  allowed_hosts:                 # Only pay these services
    - "api.openai.com"
    - "data-provider.example.com"
  kill_switch: false             # true = block all payments

logging:
  event_log: ~/.x402fuel/events.jsonl
  telemetry: false               # Opt-in aggregate counts only`}
        </code>
      </pre>

      <HeadingAnchor id="how-payment-works">
        How Payment Works (E2E)
      </HeadingAnchor>
      <ol className="my-4 space-y-3">
        <li>
          <strong className="text-slate-200">Agent requests a resource.</strong>{" "}
          <span className="text-slate-400">
            Your agent sends an HTTP request through the x402Fuel proxy.
          </span>
        </li>
        <li>
          <strong className="text-slate-200">Server returns 402.</strong>{" "}
          <span className="text-slate-400">
            The API responds with <code>402 Payment Required</code> plus an{" "}
            <code>X-PAYMENT-REQUIREMENTS</code> header describing cost, asset, and network.
          </span>
        </li>
        <li>
          <strong className="text-slate-200">x402Fuel checks policy.</strong>{" "}
          <span className="text-slate-400">
            Is the host allowed? Is the amount under max-per-txn? Is the daily cap not exceeded?
            If any check fails → payment blocked BEFORE signing, agent receives original 402
            with a machine-readable block reason.
          </span>
        </li>
        <li>
          <strong className="text-slate-200">Signs EIP-3009 authorization.</strong>{" "}
          <span className="text-slate-400">
            Uses the locally stored key to sign a gasless USDC transfer authorization.
            No ETH needed for gas — EIP-3009 permits are submitted by the payee.
          </span>
        </li>
        <li>
          <strong className="text-slate-200">Retries with payment.</strong>{" "}
          <span className="text-slate-400">
            Repeats the original request with the signed authorization in the{" "}
            <code>X-PAYMENT</code> header.
          </span>
        </li>
        <li>
          <strong className="text-slate-200">Server delivers resource.</strong>{" "}
          <span className="text-slate-400">
            API verifies the payment, delivers the resource, and submits the
            authorization on-chain. USDC transfers from your agent's wallet to
            the merchant.
          </span>
        </li>
      </ol>

      <HeadingAnchor id="security-model">
        Security Model
      </HeadingAnchor>
      <div className="my-4 grid gap-3 sm:grid-cols-2">
        {[
          { title: "Keys never leave your machine", desc: "Private keys are generated and stored encrypted locally. x402Fuel has no server-side component that could access them." },
          { title: "Budget is enforced BEFORE signing", desc: "Policy checks happen in the proxy interceptor before the key store is ever touched. A blocked payment never produces a signature." },
          { title: "No custody = no money-transmitter risk", desc: "Like MetaMask, x402Fuel is wallet software. It never holds, controls, or intermediates funds. You hold the keys." },
          { title: "Kill switch in 1 second", desc: "`x402fuel pause` blocks all new payments immediately. Designed for emergency shutdown when an agent goes rogue." },
          { title: "Zero key material in logs", desc: "Enforced by automated test — grep for hex private keys in log output returns zero matches. Not a convention, a test." },
          { title: "Event log is local-first", desc: "Every 402 encounter and payment attempt is logged to your local JSONL file. Telemetry is opt-in and publishes counts only — no URLs, no addresses." },
        ].map((item) => (
          <div key={item.title} className="rounded-xl border border-white/[0.06] bg-neutral-900/60 p-4">
            <p className="font-semibold text-slate-200">{item.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-400">{item.desc}</p>
          </div>
        ))}
      </div>

      <HeadingAnchor id="event-log">
        Event Log
      </HeadingAnchor>
      <p>
        Every 402 encounter and payment attempt is recorded as structured JSONL:
      </p>
      <pre className="my-4 overflow-x-auto rounded-xl border border-white/[0.06] bg-neutral-950 p-4 text-sm">
        <code className="text-slate-300">
          {`{"ts":"2026-08-23T02:00:00Z","host":"api.example.com","amount":"1.50",
 "asset":"USDC","network":"evm:8453","decision":"approved","outcome":"settled",
 "tx_hash":"0xabc...","latency_ms":183}
{"ts":"2026-08-23T02:01:00Z","host":"unknown-service.io","amount":"10.00",
 "asset":"USDC","network":"evm:8453","decision":"blocked",
 "reason":"host_not_allowed","latency_ms":4}`}
        </code>
      </pre>

      <HeadingAnchor id="faq">
        FAQ
      </HeadingAnchor>

      <h3 className="mt-6 text-lg font-semibold text-slate-200">Do I need ETH for gas?</h3>
      <p>
        No. x402Fuel uses EIP-3009 (gasless transfer with authorization). The
        merchant submits the signed authorization and pays gas. Your agent
        wallet only needs USDC.
      </p>

      <h3 className="mt-6 text-lg font-semibold text-slate-200">What if the agent goes rogue?</h3>
      <p>
        The daily cap and max-per-txn limit constrain damage. <code>x402fuel pause</code>{" "}
        stops all new payments immediately. Review the event log to see what happened.
      </p>

      <h3 className="mt-6 text-lg font-semibold text-slate-200">Can I use chains other than Base?</h3>
      <p>
        Base is the only supported chain at MVP. Multi-chain (Solana, EVM L2s)
        is on the roadmap — the architecture supports it, the proxy iterates
        over <code>accepts[]</code> entries in payment requirements.
      </p>

      <h3 className="mt-6 text-lg font-semibold text-slate-200">Does x402Fuel charge transaction fees?</h3>
      <p>
        No. x402Fuel is MIT-licensed and self-hosted. It's your binary on your
        machine. A managed cloud control plane with multi-wallet dashboards and
        org budgets is planned (Q4 2026), but the core wallet daemon is free
        forever.
      </p>

      <HeadingAnchor id="integrations">
        Integrations & Next Steps
      </HeadingAnchor>
      <div className="my-4 grid gap-3 sm:grid-cols-2">
        {[
          {
            title: "MeshDNS",
            desc: "Discover x402-paywalled APIs by capability. Register your MCP servers and let agents find services they can pay for.",
            href: "https://provengraph.trucore.xyz",
          },
          {
            title: "ATF (Agent Transaction Firewall)",
            desc: "Policy-enforced guardrails for on-chain transactions on Solana. Pair with x402Fuel for full agent payment safety.",
            href: "/docs",
          },
          {
            title: "GitHub Repo",
            desc: "Source code, issue tracker, and discussion board. MIT-licensed. Contributions welcome.",
            href: "https://github.com/trucore-ai/x402fuel",
          },
          {
            title: "Live Demo",
            desc: "See the HTMX dashboard live. Balances, transaction history, budget controls — all running on Render.",
            href: "https://x402fuel.trucore.xyz",
          },
        ].map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="group rounded-xl border border-white/[0.06] bg-neutral-900/60 p-4 transition-colors hover:border-primary-300/20 hover:bg-neutral-900/80"
          >
            <p className="font-semibold text-slate-200 group-hover:text-primary-200">
              {item.title} →
            </p>
            <p className="mt-1 text-sm leading-relaxed text-slate-400">
              {item.desc}
            </p>
          </Link>
        ))}
      </div>
    </>
  );
}