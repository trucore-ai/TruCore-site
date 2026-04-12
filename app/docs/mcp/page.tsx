import type { Metadata } from "next";
import Link from "next/link";
import { HeadingAnchor } from "@/components/heading-anchor";

export const metadata: Metadata = {
  title: "MCP Integration: Model Context Protocol | TruCore",
  description:
    "How TruCore uses the Model Context Protocol (MCP) to expose policy enforcement, transaction protection, and receipt verification as standard agent tools.",
  keywords: [
    "MCP",
    "Model Context Protocol",
    "agent tools",
    "AI agent integration",
    "policy enforcement",
    "transaction protection",
    "receipts",
    "operator control",
    "TruCore ATF",
  ],
  openGraph: {
    title: "MCP Integration: Model Context Protocol | TruCore",
    description:
      "TruCore exposes policy enforcement and receipt verification as MCP tools. Agents call protected transaction operations through a standard protocol instead of bespoke glue.",
    url: "https://trucore.xyz/docs/mcp",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "MCP Integration: Model Context Protocol | TruCore",
    description:
      "Policy enforcement, operator control, and verifiable receipts exposed as MCP tools for AI agent runtimes.",
    images: ["/opengraph-image"],
  },
  alternates: {
    canonical: "https://trucore.xyz/docs/mcp",
  },
};

const mcpTools = [
  {
    name: "probe_transaction",
    type: "Advisory",
    description:
      "Lightweight policy pre-check on a candidate intent. Returns a quick pass/fail signal without full simulation.",
  },
  {
    name: "simulate_transaction",
    type: "Advisory",
    description:
      "Full simulation against active policies and current conditions. Returns detailed evaluation results.",
  },
  {
    name: "protect_transaction",
    type: "Authoritative",
    description:
      "Binding policy enforcement decision. Returns an approved permit with receipt or a denial. This is the enforcement gate.",
  },
  {
    name: "verify_receipt",
    type: "Verification",
    description:
      "Deterministic hash verification on an execution receipt. Confirms the receipt has not been tampered with.",
  },
  {
    name: "explain_decision",
    type: "Advisory",
    description:
      "Human-readable explanation of a prior decision with reason codes. Useful for observability and debugging.",
  },
];

export default function McpDocsPage() {
  return (
    <article className="space-y-10">
      <header className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
          Integration Guide
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-accent-200 sm:text-5xl">
          MCP Integration
        </h1>
        <p className="max-w-3xl text-lg leading-relaxed text-slate-300">
          The Model Context Protocol (MCP) gives AI agents a standard way to discover and call
          external tools. TruCore uses MCP to expose policy enforcement, operator control, and
          verifiable receipts as tools that any MCP-compatible agent runtime can call directly.
        </p>
      </header>

      {/* ── Specification reference ── */}
      <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
        <p className="text-sm text-slate-300">
          <strong className="text-slate-100">See the specification:</strong>{" "}
          The normative MCP tool definitions and hosted integration model are in{" "}
          <a
            href="https://github.com/trucore-ai/atf-spec/blob/main/docs/mcp-integration.md"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-primary-200 transition-colors hover:text-primary-100"
          >
            atf-spec &rarr; docs/mcp-integration.md
          </a>
          . This page covers integration guidance and usage patterns.
        </p>
      </div>

      {/* ── What is MCP ── */}
      <section className="space-y-4">
        <HeadingAnchor id="what-is-mcp">What is MCP?</HeadingAnchor>
        <p className="text-slate-300">
          MCP is an open protocol for connecting large language model applications to external
          data sources and tools. It defines a standard lifecycle for tool discovery, invocation,
          and response handling so agent runtimes do not need custom integrations for every
          service they use.
        </p>
        <p className="text-slate-300">
          MCP includes concepts such as tools (callable operations), resources (readable data),
          lifecycle management, and optional authorization for HTTP transports. The current
          protocol version is 2025-11-25. Multiple agent runtimes and platforms now support
          MCP as a standard integration surface, including OpenAI&apos;s Apps SDK which uses an
          MCP server model to define app capabilities.
        </p>
      </section>

      {/* ── Why MCP matters ── */}
      <section className="space-y-4">
        <HeadingAnchor id="why-mcp-matters">Why MCP Matters for Agent Systems</HeadingAnchor>
        <p className="text-slate-300">
          Autonomous agents that execute high-value operations (trading, transfers, contract
          calls) need guardrails that are not hard-coded into every agent. MCP provides a
          standard way for agents to call enforcement tools before execution, receive
          structured decisions, and verify results afterward. This means:
        </p>
        <ul className="ml-5 list-disc space-y-2 text-sm text-slate-300">
          <li>
            <strong className="text-slate-100">No bespoke glue.</strong>{" "}
            Agents call TruCore through MCP tool invocations instead of custom API wrappers.
          </li>
          <li>
            <strong className="text-slate-100">Runtime-agnostic.</strong>{" "}
            Any agent framework that speaks MCP can use TruCore without framework-specific plugins.
          </li>
          <li>
            <strong className="text-slate-100">Composable enforcement.</strong>{" "}
            Policy checks, simulation, and receipt verification are separate tools that agents
            can call in the order their workflow requires.
          </li>
        </ul>
      </section>

      {/* ── How TruCore fits ── */}
      <section className="space-y-4">
        <HeadingAnchor id="how-trucore-fits">How TruCore Fits</HeadingAnchor>
        <p className="text-slate-300">
          TruCore&apos;s hosted MCP endpoint exposes five tools that cover the full
          advisory-to-enforcement loop for agent transactions:
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left">
                <th className="pb-2 pr-4 font-semibold text-slate-300">Tool</th>
                <th className="pb-2 pr-4 font-semibold text-slate-300">Type</th>
                <th className="pb-2 font-semibold text-slate-300">Description</th>
              </tr>
            </thead>
            <tbody className="text-slate-400">
              {mcpTools.map((tool) => (
                <tr key={tool.name} className="border-b border-white/5">
                  <td className="py-2 pr-4 font-mono text-xs text-slate-200">{tool.name}</td>
                  <td className="py-2 pr-4">
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                        tool.type === "Authoritative"
                          ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
                          : tool.type === "Verification"
                            ? "border-blue-500/30 bg-blue-500/15 text-blue-300"
                            : "border-slate-500/30 bg-slate-500/15 text-slate-300"
                      }`}
                    >
                      {tool.type}
                    </span>
                  </td>
                  <td className="py-2">{tool.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-slate-300">
          The integration model is straightforward: an MCP server exposes protected transaction
          tools. Agents call TruCore through MCP instead of building bespoke integration code.
          TruCore remains the policy and receipt layer while the agent runtime handles tool
          orchestration, signing, and submission.
        </p>
      </section>

      {/* ── Canonical flow ── */}
      <section className="space-y-4">
        <HeadingAnchor id="canonical-flow">Canonical MCP Flow</HeadingAnchor>
        <ol className="ml-5 list-decimal space-y-2 text-sm text-slate-300">
          <li>Agent runtime discovers TruCore tools via the MCP endpoint.</li>
          <li>
            Agent calls{" "}
            <code className="font-mono text-slate-200">probe_transaction</code> for a
            lightweight pre-check on a candidate intent.
          </li>
          <li>
            Agent calls{" "}
            <code className="font-mono text-slate-200">simulate_transaction</code> for full
            policy simulation.
          </li>
          <li>
            Agent calls{" "}
            <code className="font-mono text-slate-200">protect_transaction</code> to get a
            binding enforcement decision (approved permit or denial).
          </li>
          <li>If approved, the agent signs and submits the transaction independently.</li>
          <li>
            Agent calls{" "}
            <code className="font-mono text-slate-200">verify_receipt</code> to confirm
            receipt integrity.
          </li>
          <li>
            Optionally, agent calls{" "}
            <code className="font-mono text-slate-200">explain_decision</code> for
            human-readable audit output.
          </li>
        </ol>
        <div className="rounded-lg border border-amber-400/20 bg-amber-900/10 p-4 space-y-2">
          <p className="text-sm font-semibold text-amber-300">Important</p>
          <p className="text-sm text-slate-300">
            MCP does not sign or submit transactions. The agent remains responsible for key
            management and chain submission. TruCore evaluates, enforces, and produces receipts.
          </p>
        </div>
      </section>

      {/* ── Security and trust ── */}
      <section className="space-y-4">
        <HeadingAnchor id="security-and-trust">Security and Trust</HeadingAnchor>
        <ul className="ml-5 list-disc space-y-2 text-sm text-slate-300">
          <li>
            <strong className="text-slate-100">Policy gate before execution.</strong>{" "}
            Every intent passes through policy evaluation before the agent can proceed.
            Denied intents never reach signing or submission.
          </li>
          <li>
            <strong className="text-slate-100">Deterministic outputs.</strong>{" "}
            The same input produces the same decision. Receipt hashes are reproducible from
            canonicalized decision data.
          </li>
          <li>
            <strong className="text-slate-100">Verifiable receipts.</strong>{" "}
            Every enforcement decision produces a tamper-evident receipt that can be
            independently verified without contacting TruCore.
          </li>
          <li>
            <strong className="text-slate-100">Operator control.</strong>{" "}
            Operators define spend caps, slippage bounds, protocol allowlists, and cooldown
            windows. Agents cannot override these policies.
          </li>
          <li>
            <strong className="text-slate-100">Tier-scoped entitlement.</strong>{" "}
            MCP access is scoped to each tenant&apos;s entitlement tier. Tooling availability
            follows the same plan-based gating as the REST API.
          </li>
        </ul>
      </section>

      {/* ── Current status ── */}
      <section className="space-y-4">
        <HeadingAnchor id="current-status">Current Status</HeadingAnchor>
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
              Available
            </span>
            <span className="text-sm font-semibold text-slate-200">Hosted MCP Endpoint</span>
          </div>
          <p className="text-sm text-slate-300">
            TruCore&apos;s hosted MCP endpoint is available today with five tools covering the
            full advisory-to-enforcement loop. Agents can discover tools, probe and simulate
            intents, request binding enforcement decisions, verify receipts, and explain
            decisions through the MCP protocol surface.
          </p>
          <p className="text-sm text-slate-300">
            For full tool inventory, endpoint details, and tier-based access, see{" "}
            <Link
              href="/docs/surfaces#mcp"
              className="font-semibold text-primary-200 transition-colors hover:text-primary-100"
            >
              Integration Surfaces: Hosted MCP
            </Link>
            .
          </p>
        </div>
      </section>

      {/* ── Next steps ── */}
      <section className="space-y-4">
        <HeadingAnchor id="next-steps">Next Steps</HeadingAnchor>
        <ul className="ml-5 list-disc space-y-2 text-sm text-slate-300">
          <li>
            <Link
              href="/docs/surfaces#mcp"
              className="font-semibold text-primary-200 transition-colors hover:text-primary-100"
            >
              Integration Surfaces
            </Link>
            {" "}for the full MCP tool inventory, REST API endpoints, CLI commands, and
            OpenClaw plugin reference.
          </li>
          <li>
            <Link
              href="/docs/first-protected-trade"
              className="font-semibold text-primary-200 transition-colors hover:text-primary-100"
            >
              First Protected Trade
            </Link>
            {" "}to run the golden-path workflow using the HTTP API or CLI.
          </li>
          <li>
            <Link
              href="/docs/integration-pattern"
              className="font-semibold text-primary-200 transition-colors hover:text-primary-100"
            >
              Integration Pattern
            </Link>
            {" "}for the Agent to ATF to Execution flow diagram and code examples.
          </li>
          <li>
            <Link
              href="/docs/agent-discovery"
              className="font-semibold text-primary-200 transition-colors hover:text-primary-100"
            >
              Agent Discovery
            </Link>
            {" "}for machine-readable manifests and OpenClaw plugin details.
          </li>
          <li>
            <Link
              href="/docs/receipts-and-trust"
              className="font-semibold text-primary-200 transition-colors hover:text-primary-100"
            >
              Receipts and Trust
            </Link>
            {" "}for receipt verification semantics and verification guarantees.
          </li>
        </ul>
      </section>
    </article>
  );
}
