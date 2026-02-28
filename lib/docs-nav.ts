export type DocsNavItem = {
  title: string;
  href: string;
  description: string;
};

export type DocsNavSection = {
  title: string;
  items: DocsNavItem[];
};

export const DOCS_VERSION = "v0.1";
export const LAST_UPDATED = "2026-02-20";

export const sections: DocsNavSection[] = [
  {
    title: "Documentation",
    items: [
      {
        title: "Overview",
        href: "/docs",
        description: "Start here for structure, core concepts, and next steps.",
      },
      {
        title: "ATF CLI",
        href: "/docs/cli",
        description:
          "Complete CLI reference: doctor, burner, transactions, receipts, and more.",
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
];