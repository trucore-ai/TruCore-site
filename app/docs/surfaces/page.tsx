import type { Metadata } from "next";
import Link from "next/link";
import { HeadingAnchor } from "@/components/heading-anchor";
import { CopyBlock } from "@/components/copy-block";

export const metadata: Metadata = {
  title: "Integration Surfaces - API, CLI, Plugin & MCP",
  description:
    "How to integrate with ATF: REST API, CLI tool, OpenClaw plugin, and hosted MCP endpoint. Current capabilities, maturity, and tool inventory.",
};

const API_EXAMPLE = `curl -sS https://api.trucore.xyz/v1/bot/protect \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: atf_live_YOUR_KEY" \\
  -d '{
    "chain_id": "solana",
    "intent_type": "swap",
    "intent": {
      "type": "swap",
      "in_mint": "So11111111111111111111111111111111111111112",
      "out_mint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      "amount_in": 1000000,
      "slippage_bps": 50,
      "agent_id": "my-bot-v1"
    }
  }'`;

const CLI_EXAMPLE = `# Install globally
npm install -g @trucore/atf

# Run a protected trade (demo mode)
atf trade

# Protect a specific intent
cat intent.json | atf bot protect --stdin

# Verify a receipt
atf verify <receipt-id>

# Environment health check
atf doctor`;

type SurfaceEntry = {
  name: string;
  status: "available" | "coming-soon" | "request-access";
  description: string;
};

const apiEndpoints: SurfaceEntry[] = [
  { name: "POST /v1/bot/protect", status: "available", description: "Evaluate intent against policies, return allow/deny with receipt" },
  { name: "POST /v1/intents/approve", status: "available", description: "Submit swap, lending, or withdrawal intent for approval" },
  { name: "POST /v1/executions/finalize", status: "available", description: "Finalize an approved execution and issue a full receipt" },
  { name: "POST /v1/receipts/verify", status: "available", description: "Verify receipt hash integrity" },
  { name: "POST /v1/permits/verify", status: "available", description: "Verify permit signature and expiration" },
  { name: "GET /v1/whoami", status: "available", description: "Resolved identity and tenant metadata" },
  { name: "GET /plans", status: "available", description: "Public plan tiers and limits" },
  { name: "GET /features/catalog", status: "available", description: "Public-safe feature catalog" },
  { name: "GET /onboarding/sample-intent", status: "available", description: "Pre-built sample swap intent for testing" },
  { name: "POST /onboarding/protect-dry-run", status: "available", description: "Policy evaluation without on-chain execution" },
  { name: "POST /onboarding/execute-sample", status: "available", description: "Execute sample trade (mock or real)" },
];

const cliCommands: SurfaceEntry[] = [
  { name: "atf trade", status: "available", description: "Run a protected trade (demo or real)" },
  { name: "atf setup", status: "available", description: "Configure wallet and RPC for real trades" },
  { name: "atf doctor", status: "available", description: "Environment health check - RPC, wallet, config" },
  { name: "atf verify", status: "available", description: "Verify receipt hash locally" },
  { name: "atf simulate", status: "available", description: "Simulate a transaction without sending" },
  { name: "atf bot protect", status: "available", description: "Protect intent from stdin (pipeline-friendly)" },
  { name: "atf receipts list", status: "available", description: "List receipts for current profile" },
  { name: "atf profile", status: "available", description: "Manage named profiles for different environments" },
  { name: "atf rpc ping", status: "available", description: "Test RPC endpoint latency" },
  { name: "atf burner", status: "available", description: "Switch active profile to devnet for testing" },
  { name: "atf whoami", status: "available", description: "Show current identity and profile" },
];

const pluginTools: SurfaceEntry[] = [
  { name: "atf_health", status: "available", description: "Check ATF service health" },
  { name: "atf_discover", status: "available", description: "Discover ATF capabilities and manifest" },
  { name: "atf_protect_intent", status: "available", description: "Submit intent for policy evaluation" },
  { name: "atf_verify_receipt", status: "available", description: "Verify receipt integrity" },
  { name: "atf_report_savings", status: "available", description: "Generate receipts-backed savings report" },
  { name: "atf_bot_preflight", status: "available", description: "Run bot preflight checks" },
  { name: "atf_integration_doctor", status: "available", description: "Diagnose integration issues" },
  { name: "atf_tx_explain", status: "available", description: "Explain a transaction or intent" },
  { name: "atf_adoption_advisor", status: "available", description: "Adoption guidance and recommendations" },
  { name: "atf_billing_status", status: "coming-soon", description: "Check billing and usage status" },
  { name: "atf_billing_upgrade", status: "coming-soon", description: "Trigger plan upgrade flow" },
];

const mcpTools: SurfaceEntry[] = [
  { name: "probe_transaction", status: "available", description: "Lightweight policy pre-check on a candidate intent (advisory)" },
  { name: "simulate_transaction", status: "available", description: "Full simulation against active policies and conditions (advisory)" },
  { name: "protect_transaction", status: "available", description: "Binding policy enforcement decision - approve or deny (authoritative)" },
  { name: "verify_receipt", status: "available", description: "Verify execution receipt hash integrity" },
  { name: "explain_decision", status: "available", description: "Human-readable explanation of a decision with reason codes (advisory)" },
];

function StatusBadge({ status }: { status: SurfaceEntry["status"] }) {
  const styles = {
    available: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    "coming-soon": "bg-amber-500/15 text-amber-300 border-amber-500/30",
    "request-access": "bg-purple-500/15 text-purple-300 border-purple-500/30",
  };
  const labels = {
    available: "Available",
    "coming-soon": "Coming Soon",
    "request-access": "Request Access",
  };
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

export default function SurfacesPage() {
  return (
    <article className="space-y-10">
      <header className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
          Integration Guide
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-accent-200 sm:text-5xl">
          Integration Surfaces
        </h1>
        <p className="max-w-3xl text-lg leading-relaxed text-slate-300">
          ATF provides four integration surfaces: a hosted MCP endpoint for agent
          runtimes, a REST API for direct integration, a CLI for local development
          and CI pipelines, and an OpenClaw plugin for autonomous agent frameworks.
        </p>
      </header>

      {/* ── Surface Overview ── */}
      <section className="space-y-4">
        <HeadingAnchor id="overview">Surface Overview</HeadingAnchor>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-5 space-y-2">
            <h3 className="text-lg font-bold text-emerald-300">Hosted MCP</h3>
            <StatusBadge status="available" />
            <p className="text-sm text-slate-300">
              Model Context Protocol endpoint for agent runtimes. Five tools covering
              advisory probing, simulation, protect enforcement, verification, and
              explanation.
            </p>
          </div>
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-5 space-y-2">
            <h3 className="text-lg font-bold text-emerald-300">REST API</h3>
            <StatusBadge status="available" />
            <p className="text-sm text-slate-300">
              The primary integration path. Send intents, receive decisions, verify receipts.
              Works with any language or framework.
            </p>
          </div>
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-5 space-y-2">
            <h3 className="text-lg font-bold text-emerald-300">CLI</h3>
            <StatusBadge status="available" />
            <p className="text-sm text-slate-300">
              Local development, scripting, and CI/CD pipelines. Profile-based config,
              pipeline-friendly I/O.
            </p>
          </div>
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-5 space-y-2">
            <h3 className="text-lg font-bold text-emerald-300">OpenClaw Plugin</h3>
            <StatusBadge status="available" />
            <p className="text-sm text-slate-300">
              Autonomous agent integration. 13 tools for protect, verify, report, and discover.
              Runs inside the OpenClaw agent framework.
            </p>
          </div>
        </div>
      </section>

      {/* ── MCP ── */}
      <section className="space-y-4">
        <HeadingAnchor id="mcp">Hosted MCP Endpoint</HeadingAnchor>
        <p className="text-slate-300">
          ATF exposes a hosted Model Context Protocol (MCP) endpoint for agent runtimes.
          Five tools cover the full advisory-to-enforcement loop. Advisory tools
          (<code className="font-mono text-slate-200">probe_transaction</code>,{" "}
          <code className="font-mono text-slate-200">simulate_transaction</code>,{" "}
          <code className="font-mono text-slate-200">explain_decision</code>) are
          policy-aware but not authoritative.{" "}
          <code className="font-mono text-slate-200">protect_transaction</code> is the
          binding enforcement gate. MCP does not sign or submit transactions.
        </p>
        <p className="text-slate-300">
          Entitlement is tier-based and tenant-backed. Each tenant&apos;s MCP access
          is scoped to their entitlement tier.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left">
                <th className="pb-2 pr-4 font-semibold text-slate-300">Tool</th>
                <th className="pb-2 pr-4 font-semibold text-slate-300">Status</th>
                <th className="pb-2 font-semibold text-slate-300">Description</th>
              </tr>
            </thead>
            <tbody className="text-slate-400">
              {mcpTools.map((tool) => (
                <tr key={tool.name} className="border-b border-white/5">
                  <td className="py-2 pr-4 font-mono text-xs text-slate-200">{tool.name}</td>
                  <td className="py-2 pr-4"><StatusBadge status={tool.status} /></td>
                  <td className="py-2">{tool.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-lg border border-amber-400/20 bg-amber-900/10 p-4 space-y-2">
          <p className="text-sm font-semibold text-amber-300">MCP Boundaries</p>
          <ul className="ml-4 list-disc space-y-1 text-sm text-slate-300">
            <li>MCP does not sign transactions</li>
            <li>MCP does not submit transactions to the chain</li>
            <li>Advisory tools inform; protect enforces</li>
            <li>Entitlement is tier-based and tenant-backed</li>
          </ul>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
            Canonical MCP flow
          </p>
          <ol className="ml-5 list-decimal space-y-1 text-sm text-slate-300">
            <li>Discover tools via MCP endpoint</li>
            <li>Probe a candidate intent</li>
            <li>Simulate the candidate</li>
            <li>Request protection (binding enforcement)</li>
            <li>Verify the execution receipt</li>
            <li>Explain the result if needed</li>
            <li>Stop before signing/submission</li>
          </ol>
        </div>
      </section>

      {/* ── API ── */}
      <section className="space-y-4">
        <HeadingAnchor id="api">REST API</HeadingAnchor>
        <p className="text-slate-300">
          Base URL: <code className="font-mono text-slate-200">https://api.trucore.xyz</code>.
          All endpoints accept JSON. Authentication is via <code className="font-mono text-slate-200">X-API-Key</code> header
          for protect/execute operations.
        </p>
        <CopyBlock label="bash" value={API_EXAMPLE} />

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left">
                <th className="pb-2 pr-4 font-semibold text-slate-300">Endpoint</th>
                <th className="pb-2 pr-4 font-semibold text-slate-300">Status</th>
                <th className="pb-2 font-semibold text-slate-300">Description</th>
              </tr>
            </thead>
            <tbody className="text-slate-400">
              {apiEndpoints.map((ep) => (
                <tr key={ep.name} className="border-b border-white/5">
                  <td className="py-2 pr-4 font-mono text-xs text-slate-200">{ep.name}</td>
                  <td className="py-2 pr-4"><StatusBadge status={ep.status} /></td>
                  <td className="py-2">{ep.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-slate-400">
          See the full{" "}
          <Link href="/docs/api" className="font-semibold text-primary-200 hover:text-primary-100">
            API Reference
          </Link>{" "}
          for request/response schemas and error codes.
        </p>
      </section>

      {/* ── CLI ── */}
      <section className="space-y-4">
        <HeadingAnchor id="cli">ATF CLI</HeadingAnchor>
        <p className="text-slate-300">
          Install via npm and run immediately. The CLI wraps the API with profile management,
          local receipt verification, and pipeline-friendly exit codes.
        </p>
        <CopyBlock label="bash" value={CLI_EXAMPLE} />

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left">
                <th className="pb-2 pr-4 font-semibold text-slate-300">Command</th>
                <th className="pb-2 pr-4 font-semibold text-slate-300">Status</th>
                <th className="pb-2 font-semibold text-slate-300">Description</th>
              </tr>
            </thead>
            <tbody className="text-slate-400">
              {cliCommands.map((cmd) => (
                <tr key={cmd.name} className="border-b border-white/5">
                  <td className="py-2 pr-4 font-mono text-xs text-slate-200">{cmd.name}</td>
                  <td className="py-2 pr-4"><StatusBadge status={cmd.status} /></td>
                  <td className="py-2">{cmd.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-slate-400">
          See the full{" "}
          <Link href="/docs/cli" className="font-semibold text-primary-200 hover:text-primary-100">
            CLI Reference
          </Link>{" "}
          and{" "}
          <Link href="/docs/cli/commands" className="font-semibold text-primary-200 hover:text-primary-100">
            Command Reference
          </Link>{" "}
          for details.
        </p>
      </section>

      {/* ── Plugin ── */}
      <section className="space-y-4">
        <HeadingAnchor id="plugin">OpenClaw Plugin</HeadingAnchor>
        <p className="text-slate-300">
          The <code className="font-mono text-slate-200">@trucore/trucore-atf</code> plugin integrates ATF
          into the OpenClaw autonomous agent framework. Agents can protect intents, verify receipts,
          and generate savings reports without custom HTTP code.
        </p>
        <CopyBlock label="bash" value="openclaw plugins install @trucore/trucore-atf@0.2.11" />

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left">
                <th className="pb-2 pr-4 font-semibold text-slate-300">Tool</th>
                <th className="pb-2 pr-4 font-semibold text-slate-300">Status</th>
                <th className="pb-2 font-semibold text-slate-300">Description</th>
              </tr>
            </thead>
            <tbody className="text-slate-400">
              {pluginTools.map((tool) => (
                <tr key={tool.name} className="border-b border-white/5">
                  <td className="py-2 pr-4 font-mono text-xs text-slate-200">{tool.name}</td>
                  <td className="py-2 pr-4"><StatusBadge status={tool.status} /></td>
                  <td className="py-2">{tool.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-slate-400">
          See the full{" "}
          <Link href="/docs/openclaw-plugin" className="font-semibold text-primary-200 hover:text-primary-100">
            OpenClaw Plugin Reference
          </Link>{" "}
          for configuration, safety defaults, and workflow examples.
        </p>
      </section>

      {/* ── Choosing a Surface ── */}
      <section className="space-y-4">
        <HeadingAnchor id="choosing">When to Use Which Surface</HeadingAnchor>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-white/10 p-5 space-y-2">
            <h3 className="font-bold text-accent-300">Use MCP when…</h3>
            <ul className="space-y-1 text-sm text-slate-400">
              <li>Your agent runtime supports MCP natively</li>
              <li>You want the advisory-to-enforcement loop in one surface</li>
              <li>Building with hosted agent frameworks</li>
            </ul>
          </div>
          <div className="rounded-lg border border-white/10 p-5 space-y-2">
            <h3 className="font-bold text-accent-300">Use the API when…</h3>
            <ul className="space-y-1 text-sm text-slate-400">
              <li>Building a custom trading bot in any language</li>
              <li>Integrating ATF into an existing backend</li>
              <li>You need full control over request/response handling</li>
            </ul>
          </div>
          <div className="rounded-lg border border-white/10 p-5 space-y-2">
            <h3 className="font-bold text-accent-300">Use the CLI when…</h3>
            <ul className="space-y-1 text-sm text-slate-400">
              <li>Developing and testing locally</li>
              <li>Running in CI/CD pipelines</li>
              <li>Scripting protect/verify workflows</li>
            </ul>
          </div>
          <div className="rounded-lg border border-white/10 p-5 space-y-2">
            <h3 className="font-bold text-accent-300">Use the Plugin when…</h3>
            <ul className="space-y-1 text-sm text-slate-400">
              <li>Building on the OpenClaw agent framework</li>
              <li>Want zero-code ATF integration for agents</li>
              <li>Need autonomous protect &rarr; verify workflows</li>
            </ul>
          </div>
        </div>
      </section>
    </article>
  );
}
