export type DocsNavItem = {
  title: string;
  href: string;
  description: string;
};

export type DocsNavSection = {
  title: string;
  items: DocsNavItem[];
  /** When true, the section should only be shown to authenticated customers. */
  authenticated?: boolean;
};

export const DOCS_VERSION = "v0.1";
export const LAST_UPDATED = "2026-03-05";

export const sections: DocsNavSection[] = [
  {
    title: "Getting Started",
    items: [
      {
        title: "Overview",
        href: "/docs",
        description: "Start here for structure, core concepts, and next steps.",
      },
      {
        title: "Getting Started",
        href: "/docs/getting-started",
        description:
          "Create an account, verify email, get an API key, and run your first protected trade.",
      },
      {
        title: "Integration Surfaces",
        href: "/docs/surfaces",
        description:
          "API, CLI, and OpenClaw plugin: capabilities, maturity, and when to use each surface.",
      },
      {
        title: "MCP Integration",
        href: "/docs/mcp",
        description:
          "Model Context Protocol: how agents call TruCore policy enforcement and receipt verification as standard MCP tools.",
      },
      {
        title: "Plans & Feature Tiers",
        href: "/docs/plans",
        description:
          "Free, Pro, and Enterprise: rate limits, feature availability, and feature gating.",
      },
      {
        title: "Receipts & Trust",
        href: "/docs/receipts-and-trust",
        description:
          "What receipts prove, how verification works, mock vs real execution, and why receipts matter.",
      },
      {
        title: "Auth & API Keys",
        href: "/docs/auth",
        description:
          "Signup, login, email verification, API key creation/rotation/revocation, and account recovery.",
      },
      {
        title: "Upgrade & Access",
        href: "/docs/upgrade",
        description:
          "Request Pro or Enterprise, track request status, and understand feature gating.",
      },
      {
        title: "When to Use ATF",
        href: "/docs/when-to-use-atf",
        description:
          "Mock vs real execution, when Free is enough, when Pro helps, and which bots benefit first.",
      },
      {
        title: "Hello-World Bot",
        href: "/docs/hello-world-bot",
        description:
          "Minimal Python bot, unprotected then ATF-protected. See exactly what changes when you add a policy gate.",
      },
    ],
  },
  {
    title: "Documentation",
    items: [
      {
        title: "First Protected Trade",
        href: "/docs/first-protected-trade",
        description:
          "Golden path: protect a swap intent, receive a receipt, and verify it. HTTP, Python, TypeScript, CLI, and OpenClaw paths.",
      },
      {
        title: "ATF CLI",
        href: "/docs/cli",
        description:
          "Comprehensive CLI reference: profiles, transactions, policy validation, bot protection, receipts, perps enforcement, agent discovery, and more.",
      },
      {
        title: "ATF Command Reference",
        href: "/docs/cli/commands",
        description:
          "Install the CLI, learn the golden-path commands (trade, setup, doctor, verify), and find advanced command groups.",
      },
      {
        title: "ATF API",
        href: "/docs/api",
        description:
          "Public endpoints for deterministic simulation and receipt generation.",
      },
      {
        title: "Quickstart",
        href: "/docs/quickstart",
        description:
          "Go from policy definition to validated execution in four practical steps.",
      },
      {
        title: "5-Minute Quickstart",
        href: "/docs/5-minute-quickstart",
        description:
          "Copy and run a simulator request, then inspect deterministic policy output.",
      },
      {
        title: "ATF Architecture",
        href: "/docs/atf-architecture",
        description:
          "Review threat model assumptions, permit schema, deterministic checks, and receipt hashing.",
      },
      {
        title: "Integration Pattern",
        href: "/docs/integration-pattern",
        description:
          "See how AI agents call ATF before execution and consume deterministic decisions with receipt hashes.",
      },
      {
        title: "Latency-Positive ATF",
        href: "/docs/latency-positive-atf",
        description:
          "How ATF evolves into a latency-positive execution layer - making protected bots faster, not slower.",
      },
      {
        title: "Perps Enforcement",
        href: "/docs/perps",
        description:
          "Feature-gated perps enforcement for Hyperliquid, Drift v2, and Mango v4. OFF by default, fail-closed.",
      },
      {
        title: "DEX Guardrails",
        href: "/docs/dex-guardrails",
        description:
          "Slippage caps, DEX allowlists, mint allow/deny lists, unverified route deny, and deterministic receipts.",
      },
      {
        title: "Policy Model",
        href: "/docs/policy-model",
        description:
          "Understand allowlists, limits, slippage bounds, cooldowns, and fail-closed checks.",
      },
      {
        title: "Permit Schema v1",
        href: "/docs/permit-schema-v1",
        description:
          "Use a versioned, deterministic permit contract with copyable demo fields for integration.",
      },
      {
        title: "Receipt Specification v1",
        href: "/docs/receipt-specification-v1",
        description:
          "Reference the formal RFC-style receipt contract, deterministic hash rules, and version compatibility policy.",
      },
      {
        title: "Verification",
        href: "/docs/verify",
        description:
          "Understand what content_hash means, what --verify guarantees, and how to use receipt verification in production.",
      },
      {
        title: "Anchoring & Execution Roadmap",
        href: "/docs/anchoring-roadmap",
        description:
          "Review live, preview, and planned phases for receipt verification and anchoring evolution.",
      },
      {
        title: "Permits",
        href: "/docs/permits",
        description:
          "Learn permit fields, domain separation, TTL, nonce usage, and replay protection.",
      },
      {
        title: "Changelog",
        href: "/docs/changelog",
        description:
          "Versioned release notes for the ATF CLI and public API.",
      },
      {
        title: "OpenClaw Plugin",
        href: "/docs/openclaw-plugin",
        description:
          "Install @trucore/trucore-atf, review thirteen tools, safety defaults, and configuration options.",
      },
      {
        title: "Agent Discovery",
        href: "/docs/agent-discovery",
        description:
          "Machine-readable ATF manifest, OpenClaw plugin, recipes_v2 self-install, and receipts-backed savings reporting for autonomous agents.",
      },
    ],
  },
  {
    title: "CLI Deep Dives",
    items: [
      {
        title: "Doctor",
        href: "/docs/cli/doctor",
        description: "Environment health checks, RPC reachability, and wallet detection.",
      },
      {
        title: "Profiles & Config",
        href: "/docs/cli/profiles",
        description: "Named profiles, secrets separation, and configuration management.",
      },
      {
        title: "RPC & Network",
        href: "/docs/cli/rpc",
        description: "Helius-first RPC setup, latency testing, and network selection.",
      },
      {
        title: "Devnet Burner",
        href: "/docs/cli/burner",
        description: "Throwaway devnet wallets for fast, safe testing.",
      },
      {
        title: "Transactions",
        href: "/docs/cli/transactions",
        description: "Simulate, sign, send, and check transaction status.",
      },
      {
        title: "Receipts & Verification",
        href: "/docs/cli/receipts",
        description: "Deterministic receipt verification and local hash recomputation.",
      },
      {
        title: "Shell Completion",
        href: "/docs/cli/completion",
        description: "Tab-completion scripts for bash, zsh, and fish.",
      },
      {
        title: "Whoami & Ls",
        href: "/docs/cli/whoami-ls",
        description: "Identity inspection and profile listing.",
      },
    ],
  },
  {
    title: "CLI Guides",
    items: [
      {
        title: "Guides Overview",
        href: "/docs/cli/guides",
        description:
          "Step-by-step walkthroughs for common ATF CLI workflows.",
      },
      {
        title: "Swap Permit Parameters",
        href: "/docs/cli/guides/swap-permits",
        description:
          "Parameter glossary, safe defaults, and override precedence for swap permits.",
      },
      {
        title: "Simulate, Verify, Execute",
        href: "/docs/cli/guides/simulate-verify-execute",
        description:
          "The canonical ATF workflow from simulation through verification to execution.",
      },
      {
        title: "Helius RPC Setup",
        href: "/docs/cli/guides/helius-setup",
        description:
          "Configure profiles, set a Helius endpoint, and confirm connectivity.",
      },
      {
        title: "Devnet Burner Quickstart",
        href: "/docs/cli/guides/devnet-burner",
        description:
          "Disposable devnet wallets for fast, safe testing.",
      },
      {
        title: "Production Bot Basics",
        href: "/docs/cli/guides/production-bot-basics",
        description:
          "Profile separation, receipts retention, and operational hygiene.",
      },
    ],
  },
  {
    title: "Customer Guides",
    authenticated: true,
    items: [
      {
        title: "Customer Guides Overview",
        href: "/docs/guide",
        description:
          "Operational guidance for teams running TruCore ATF in production. Start here.",
      },
      {
        title: "API Key Lifecycle",
        href: "/docs/guide/key-lifecycle",
        description:
          "Create, rotate, revoke, and scope API keys with environment setup and key hygiene.",
      },
      {
        title: "Rate Limits & Recovery",
        href: "/docs/guide/rate-limits",
        description:
          "Read rate-limit headers, implement backoff, and recover gracefully.",
      },
      {
        title: "Webhook Setup & Debugging",
        href: "/docs/guide/webhooks",
        description:
          "Configure endpoints, verify delivery signatures, and troubleshoot failures.",
      },
      {
        title: "Readiness & Health Checks",
        href: "/docs/guide/readiness",
        description:
          "Interpret CLI doctor output, verify RPC connectivity, and confirm integration readiness.",
      },
      {
        title: "Receipt Operations",
        href: "/docs/guide/receipts-ops",
        description:
          "Browse, verify, and export your receipts with content_hash verification.",
      },
    ],
  },
];