/**
 * Structured metadata for agent retrieval and programmatic discovery.
 *
 * This is the single source of truth for the /api/docs/sitemap endpoint.
 * It enriches docs-nav.ts with machine-readable fields that LLMs,
 * crawlers, and retrieval systems can consume.
 *
 * Keep entries in sync with docs-nav.ts sections. When a new page is
 * added to docs-nav.ts, add a corresponding entry here.
 */

/* ── Schema types ── */

export type DocLayer = "public" | "authenticated";

export type DocAudience = "human" | "agent" | "both";

export type DocStatus =
  | "canonical"
  | "guide"
  | "reference"
  | "tutorial"
  | "spec";

export type ProductArea =
  | "receipts"
  | "verification"
  | "keys"
  | "readiness"
  | "webhooks"
  | "rate_limits"
  | "reconcile"
  | "troubleshooting"
  | "production_bot"
  | "support"
  | "architecture"
  | "mcp"
  | "policy"
  | "permits"
  | "onboarding"
  | "discovery"
  | "glossary"
  | "cli"
  | "dex"
  | "perps";

export interface DocMetadataEntry {
  /** URL path (must match docs-nav.ts href). */
  href: string;
  /** Page title. */
  title: string;
  /** One-sentence machine-readable summary. */
  summary: string;
  /** Public or authenticated layer. */
  layer: DocLayer;
  /** Primary audience. */
  audience: DocAudience;
  /** Document type. */
  status: DocStatus;
  /** Product area tags. */
  product_area: ProductArea[];
  /** Whether the page requires customer authentication. */
  auth_required: boolean;
  /** Link to normative spec (atf-spec repo) if applicable. */
  spec_ref?: string;
  /** Related page paths within the site. */
  related?: string[];
}

/* ── Registry ── */

export const docsMetadata: DocMetadataEntry[] = [
  /* ─── Getting Started (public) ─── */
  {
    href: "/docs",
    title: "Documentation Overview",
    summary:
      "Entry point for ATF documentation. Structure, core concepts, and navigation to all doc surfaces.",
    layer: "public",
    audience: "both",
    status: "reference",
    product_area: ["onboarding"],
    auth_required: false,
  },
  {
    href: "/docs/getting-started",
    title: "Getting Started",
    summary:
      "Create an account, verify email, obtain an API key, and run your first protected trade.",
    layer: "public",
    audience: "both",
    status: "tutorial",
    product_area: ["onboarding", "keys"],
    auth_required: false,
    related: ["/docs/first-protected-trade", "/docs/hello-world-bot"],
  },
  {
    href: "/docs/surfaces",
    title: "Integration Surfaces",
    summary:
      "API, CLI, and OpenClaw plugin: capabilities, maturity levels, and when to use each surface.",
    layer: "public",
    audience: "both",
    status: "reference",
    product_area: ["architecture", "mcp", "cli"],
    auth_required: false,
  },
  {
    href: "/docs/mcp",
    title: "MCP Integration",
    summary:
      "Model Context Protocol: how agents call TruCore policy enforcement and receipt verification as standard MCP tools.",
    layer: "public",
    audience: "agent",
    status: "canonical",
    product_area: ["mcp", "discovery"],
    auth_required: false,
    spec_ref:
      "https://github.com/trucore-ai/atf-spec/blob/main/docs/mcp-integration.md",
    related: ["/docs/agent-discovery", "/docs/openclaw-plugin"],
  },
  {
    href: "/docs/plans",
    title: "Plans & Feature Tiers",
    summary:
      "Free, Pro, and Enterprise: rate limits, feature availability, and feature gating.",
    layer: "public",
    audience: "human",
    status: "reference",
    product_area: ["rate_limits"],
    auth_required: false,
  },
  {
    href: "/docs/receipts-and-trust",
    title: "Receipts & Trust",
    summary:
      "What receipts prove, how verification works, mock vs real execution, and why receipts matter for agent transactions.",
    layer: "public",
    audience: "both",
    status: "canonical",
    product_area: ["receipts", "verification"],
    auth_required: false,
    spec_ref:
      "https://github.com/trucore-ai/atf-spec/blob/main/spec/receipt.md",
    related: ["/docs/verify", "/docs/receipt-specification-v1"],
  },
  {
    href: "/docs/hello-world-bot",
    title: "Hello-World Bot",
    summary:
      "Minimal Python bot, unprotected then ATF-protected. See exactly what changes when you add a policy gate.",
    layer: "public",
    audience: "both",
    status: "tutorial",
    product_area: ["onboarding", "policy"],
    auth_required: false,
    spec_ref:
      "https://github.com/trucore-ai/atf-spec/blob/main/docs/hello-world-bot.md",
    related: ["/docs/first-protected-trade", "/docs/getting-started"],
  },

  /* ─── Documentation (public) ─── */
  {
    href: "/docs/first-protected-trade",
    title: "First Protected Trade",
    summary:
      "Golden path: protect a swap intent, receive a receipt, verify the hash. HTTP, Python, TypeScript, CLI, and OpenClaw paths.",
    layer: "public",
    audience: "both",
    status: "tutorial",
    product_area: ["receipts", "verification", "onboarding"],
    auth_required: false,
    related: ["/docs/quickstart", "/docs/hello-world-bot"],
  },
  {
    href: "/docs/quickstart",
    title: "Quickstart",
    summary:
      "Go from policy definition to validated execution in four practical steps.",
    layer: "public",
    audience: "both",
    status: "tutorial",
    product_area: ["onboarding", "policy"],
    auth_required: false,
    related: ["/docs/first-protected-trade", "/docs/5-minute-quickstart"],
  },
  {
    href: "/docs/receipt-specification-v1",
    title: "Receipt Specification v1",
    summary:
      "Formal RFC-style receipt contract, deterministic hash rules, and version compatibility policy.",
    layer: "public",
    audience: "both",
    status: "spec",
    product_area: ["receipts", "verification"],
    auth_required: false,
    spec_ref:
      "https://github.com/trucore-ai/atf-spec/blob/main/spec/receipt.md",
    related: ["/docs/verify", "/docs/receipts-and-trust"],
  },
  {
    href: "/docs/verify",
    title: "Verification",
    summary:
      "What content_hash means, what --verify guarantees, and how to use receipt verification in production.",
    layer: "public",
    audience: "both",
    status: "canonical",
    product_area: ["verification", "receipts"],
    auth_required: false,
    spec_ref:
      "https://github.com/trucore-ai/atf-spec/blob/main/spec/verification.md",
    related: ["/docs/receipts-and-trust", "/docs/receipt-specification-v1"],
  },
  {
    href: "/docs/terminology-and-endpoints",
    title: "Terminology & Endpoint Glossary",
    summary:
      "Reference mapping of ATF terms across spec, API, CLI, and UI surfaces. Endpoint comparison for protect vs simulate flows.",
    layer: "public",
    audience: "both",
    status: "canonical",
    product_area: ["glossary"],
    auth_required: false,
  },
  {
    href: "/docs/policy-model",
    title: "Policy Model",
    summary:
      "Allowlists, limits, slippage bounds, cooldowns, and fail-closed checks.",
    layer: "public",
    audience: "both",
    status: "canonical",
    product_area: ["policy"],
    auth_required: false,
    related: ["/docs/permits", "/docs/permit-schema-v1"],
  },
  {
    href: "/docs/permits",
    title: "Permits",
    summary:
      "Permit fields, domain separation, TTL, nonce usage, and replay protection.",
    layer: "public",
    audience: "both",
    status: "canonical",
    product_area: ["permits"],
    auth_required: false,
    related: ["/docs/permit-schema-v1", "/docs/policy-model"],
  },
  {
    href: "/docs/permit-schema-v1",
    title: "Permit Schema v1",
    summary:
      "Versioned, deterministic permit contract with copyable demo fields for integration.",
    layer: "public",
    audience: "both",
    status: "spec",
    product_area: ["permits"],
    auth_required: false,
    related: ["/docs/permits", "/docs/policy-model"],
  },
  {
    href: "/docs/openclaw-plugin",
    title: "OpenClaw Plugin",
    summary:
      "Install @trucore/trucore-atf, review thirteen tools, safety defaults, and configuration options.",
    layer: "public",
    audience: "agent",
    status: "canonical",
    product_area: ["discovery", "mcp"],
    auth_required: false,
    related: ["/docs/agent-discovery", "/docs/mcp"],
  },
  {
    href: "/docs/agent-discovery",
    title: "Agent Discovery",
    summary:
      "Machine-readable ATF manifest, OpenClaw plugin, recipes_v2, and receipts-backed savings reporting for autonomous agents.",
    layer: "public",
    audience: "agent",
    status: "canonical",
    product_area: ["discovery"],
    auth_required: false,
    related: ["/docs/openclaw-plugin", "/docs/mcp"],
  },
  {
    href: "/docs/dex-guardrails",
    title: "DEX Guardrails",
    summary:
      "Slippage caps, DEX allowlists, mint allow/deny lists, unverified route deny, and deterministic receipts.",
    layer: "public",
    audience: "both",
    status: "canonical",
    product_area: ["dex", "policy"],
    auth_required: false,
  },
  {
    href: "/docs/perps",
    title: "Perps Enforcement",
    summary:
      "Feature-gated perps enforcement for Hyperliquid, Drift v2, and Mango v4. OFF by default, fail-closed.",
    layer: "public",
    audience: "both",
    status: "canonical",
    product_area: ["perps", "policy"],
    auth_required: false,
  },
  {
    href: "/docs/atf-architecture",
    title: "ATF Architecture",
    summary:
      "Threat model assumptions, permit schema, deterministic checks, and receipt hashing.",
    layer: "public",
    audience: "both",
    status: "reference",
    product_area: ["architecture"],
    auth_required: false,
    spec_ref:
      "https://github.com/trucore-ai/atf-spec/blob/main/spec/architecture.md",
  },

  /* ─── Customer Guides (authenticated) ─── */
  {
    href: "/docs/guide",
    title: "Customer Guides Overview",
    summary:
      "Operational guidance for teams running TruCore ATF in production.",
    layer: "authenticated",
    audience: "human",
    status: "guide",
    product_area: ["onboarding"],
    auth_required: true,
  },
  {
    href: "/docs/guide/key-lifecycle",
    title: "API Key Lifecycle",
    summary:
      "Create, store, scope, rotate, and revoke ATF API keys with environment setup and key hygiene.",
    layer: "authenticated",
    audience: "both",
    status: "guide",
    product_area: ["keys"],
    auth_required: true,
    related: ["/docs/guide/readiness", "/docs/guide/production-bot"],
  },
  {
    href: "/docs/guide/rate-limits",
    title: "Rate Limits & Recovery",
    summary:
      "Read rate-limit headers, implement exponential backoff, and recover gracefully when ATF limits are hit.",
    layer: "authenticated",
    audience: "both",
    status: "guide",
    product_area: ["rate_limits"],
    auth_required: true,
    related: ["/docs/guide/troubleshooting", "/docs/guide/production-bot"],
  },
  {
    href: "/docs/guide/webhooks",
    title: "Webhook Setup & Debugging",
    summary:
      "Configure webhook endpoints, verify HMAC signatures, understand delivery semantics, and troubleshoot failures.",
    layer: "authenticated",
    audience: "both",
    status: "guide",
    product_area: ["webhooks"],
    auth_required: true,
    related: ["/docs/guide/reconcile", "/docs/guide/readiness"],
  },
  {
    href: "/docs/guide/readiness",
    title: "Readiness & Health Checks",
    summary:
      "Interpret CLI doctor output, verify API health, and confirm integration readiness.",
    layer: "authenticated",
    audience: "both",
    status: "guide",
    product_area: ["readiness"],
    auth_required: true,
    related: ["/docs/guide/reconcile", "/docs/guide/troubleshooting"],
  },
  {
    href: "/docs/guide/receipts-ops",
    title: "Receipt Operations",
    summary:
      "Browse, verify, and export ATF receipts with content_hash verification.",
    layer: "authenticated",
    audience: "both",
    status: "guide",
    product_area: ["receipts", "verification"],
    auth_required: true,
    spec_ref:
      "https://github.com/trucore-ai/atf-spec/blob/main/spec/receipt.md",
    related: ["/docs/verify", "/docs/receipts-and-trust"],
  },
  {
    href: "/docs/guide/troubleshooting",
    title: "Troubleshooting",
    summary:
      "Diagnose and resolve common ATF integration issues with symptom-driven recovery steps.",
    layer: "authenticated",
    audience: "human",
    status: "guide",
    product_area: ["troubleshooting"],
    auth_required: true,
    related: ["/docs/guide/readiness", "/docs/guide/reconcile"],
  },
  {
    href: "/docs/guide/production-bot",
    title: "Production Bot Configuration",
    summary:
      "Environment setup, key strategy, readiness checks, rate-limit-aware polling, webhook handling, receipt verification, and safe rollout patterns.",
    layer: "authenticated",
    audience: "both",
    status: "guide",
    product_area: ["production_bot"],
    auth_required: true,
    related: [
      "/docs/guide/key-lifecycle",
      "/docs/guide/rate-limits",
      "/docs/guide/webhooks",
    ],
  },
  {
    href: "/docs/guide/support-deflection",
    title: "Support Deflection",
    summary:
      "Decide when to self-serve, what to try first, and when to contact support.",
    layer: "authenticated",
    audience: "human",
    status: "guide",
    product_area: ["support"],
    auth_required: true,
    related: ["/docs/guide/troubleshooting"],
  },
  {
    href: "/docs/guide/reconcile",
    title: "Reconcile & State Recovery",
    summary:
      "Assess agent health, detect drift, plan repairs with dry-run, trigger token rotation, and respond to reconcile webhook events.",
    layer: "authenticated",
    audience: "both",
    status: "guide",
    product_area: ["reconcile", "readiness"],
    auth_required: true,
    related: ["/docs/guide/readiness", "/docs/guide/webhooks"],
  },
];
