export type DocsIndexEntry = {
  href: string;
  title: string;
  contentSnippets: string[];
  tags: string[];
};

export const docsIndex: DocsIndexEntry[] = [
  /* ─── Getting Started ─── */
  {
    href: "/docs",
    title: "Documentation",
    contentSnippets: [
      "Technical hub for evaluating ATF integration fit quickly.",
      "Start with quickstart, then dive into policy model and permit semantics.",
      "Concise docs for engineering, security, and compliance review.",
    ],
    tags: ["docs", "hub", "overview", "atf"],
  },
  {
    href: "/docs/getting-started",
    title: "Getting Started",
    contentSnippets: [
      "Create an account, verify email, and obtain an API key.",
      "Run your first protected trade in minutes.",
      "Step-by-step onboarding from zero to first receipt.",
    ],
    tags: ["getting started", "onboarding", "signup", "api key", "first trade"],
  },
  {
    href: "/docs/surfaces",
    title: "Integration Surfaces",
    contentSnippets: [
      "API, CLI, and OpenClaw plugin: capabilities and maturity levels.",
      "Choose the right surface for your integration pattern.",
    ],
    tags: ["surfaces", "api", "cli", "openclaw", "integration", "maturity"],
  },
  {
    href: "/docs/mcp",
    title: "MCP Integration",
    contentSnippets: [
      "Model Context Protocol gives AI agents a standard way to call tools.",
      "TruCore exposes policy enforcement and receipt verification as MCP tools.",
      "Hosted MCP endpoint with five tools: probe, simulate, protect, verify, explain.",
      "Agents call TruCore through MCP instead of bespoke integration code.",
    ],
    tags: ["mcp", "model context protocol", "agent tools", "policy enforcement", "receipts", "verification", "operator control"],
  },
  {
    href: "/docs/plans",
    title: "Plans & Feature Tiers",
    contentSnippets: [
      "Free, Pro, and Enterprise tiers with different rate limits.",
      "Feature gating controls what each tier can access.",
    ],
    tags: ["plans", "pricing", "free", "pro", "enterprise", "rate limits", "tiers"],
  },
  {
    href: "/docs/receipts-and-trust",
    title: "Receipts & Trust",
    contentSnippets: [
      "Receipts prove what happened: deterministic, tamper-evident records.",
      "Mock vs real execution and why receipts matter for agent transactions.",
      "Content hash verification ensures receipt integrity.",
    ],
    tags: ["receipts", "trust", "verification", "content hash", "tamper-evident", "mock"],
  },
  {
    href: "/docs/auth",
    title: "Auth & API Keys",
    contentSnippets: [
      "Signup, login, and email verification flow.",
      "Create, rotate, and revoke API keys.",
      "Account recovery and key hygiene best practices.",
    ],
    tags: ["auth", "authentication", "api key", "signup", "login", "rotate", "revoke"],
  },
  {
    href: "/docs/upgrade",
    title: "Upgrade & Access",
    contentSnippets: [
      "Request Pro or Enterprise access and track request status.",
      "Understand feature gating between tiers.",
    ],
    tags: ["upgrade", "pro", "enterprise", "access", "feature gating"],
  },
  {
    href: "/docs/when-to-use-atf",
    title: "When to Use ATF",
    contentSnippets: [
      "Mock vs real execution: when Free is enough and when Pro helps.",
      "Which bots benefit from ATF protection first.",
    ],
    tags: ["when to use", "mock", "real execution", "use cases", "bot protection"],
  },
  {
    href: "/docs/hello-world-bot",
    title: "Hello-World Bot",
    contentSnippets: [
      "Minimal Python bot, first unprotected then ATF-protected.",
      "See exactly what changes when you add a policy gate.",
      "Copy-paste tutorial for your first protected agent.",
    ],
    tags: ["hello world", "bot", "tutorial", "python", "policy gate", "beginner"],
  },

  /* ─── Documentation ─── */
  {
    href: "/docs/first-protected-trade",
    title: "First Protected Trade",
    contentSnippets: [
      "Golden path: protect a swap intent, receive a receipt, verify the hash.",
      "HTTP, Python, TypeScript, CLI, and OpenClaw integration paths.",
    ],
    tags: ["first trade", "golden path", "swap", "receipt", "verify", "protect"],
  },
  {
    href: "/docs/cli",
    title: "ATF CLI",
    contentSnippets: [
      "Comprehensive CLI reference for profiles, transactions, and receipts.",
      "Policy validation, bot protection, perps enforcement, and agent discovery.",
    ],
    tags: ["cli", "command line", "terminal", "atf cli", "reference"],
  },
  {
    href: "/docs/cli/commands",
    title: "ATF Command Reference",
    contentSnippets: [
      "Install the CLI and learn golden-path commands: trade, setup, doctor, verify.",
      "Advanced command groups for profiles, transactions, and receipts.",
    ],
    tags: ["cli commands", "trade", "setup", "doctor", "verify", "install"],
  },
  {
    href: "/docs/api",
    title: "ATF API",
    contentSnippets: [
      "Public endpoints for deterministic simulation and receipt generation.",
      "REST API reference for protect, simulate, and verify operations.",
    ],
    tags: ["api", "rest", "endpoints", "simulate", "protect", "http"],
  },
  {
    href: "/docs/quickstart",
    title: "Quickstart",
    contentSnippets: [
      "Define policy guardrails before agent execution.",
      "Issue a scoped permit with short TTL.",
      "Validate transactions and record tamper-evident receipts.",
    ],
    tags: ["quickstart", "integration", "policy", "permit", "receipt"],
  },
  {
    href: "/docs/5-minute-quickstart",
    title: "5-Minute Quickstart",
    contentSnippets: [
      "Copy and run a simulator request immediately.",
      "Inspect deterministic policy output in under five minutes.",
    ],
    tags: ["quickstart", "5 minute", "simulator", "fast start", "copy paste"],
  },
  {
    href: "/docs/atf-architecture",
    title: "ATF Architecture",
    contentSnippets: [
      "Threat model assumptions and trust boundaries.",
      "Permit schema, deterministic checks, and receipt hashing internals.",
    ],
    tags: ["architecture", "threat model", "trust boundary", "design", "internals"],
  },
  {
    href: "/docs/integration-pattern",
    title: "Integration Pattern",
    contentSnippets: [
      "How AI agents call ATF before execution.",
      "Consume deterministic decisions with receipt hashes.",
    ],
    tags: ["integration", "pattern", "agent", "preflight", "decision", "receipt hash"],
  },
  {
    href: "/docs/latency-positive-atf",
    title: "Latency-Positive ATF",
    contentSnippets: [
      "ATF evolves into a latency-positive execution layer.",
      "Protected bots become faster, not slower, with policy enforcement.",
    ],
    tags: ["latency", "performance", "speed", "execution layer", "optimization"],
  },
  {
    href: "/docs/perps",
    title: "Perps Enforcement",
    contentSnippets: [
      "Feature-gated perpetuals enforcement for Hyperliquid, Drift v2, and Mango v4.",
      "OFF by default, fail-closed when enabled.",
    ],
    tags: ["perps", "perpetuals", "hyperliquid", "drift", "mango", "leverage"],
  },
  {
    href: "/docs/dex-guardrails",
    title: "DEX Guardrails",
    contentSnippets: [
      "Slippage caps and DEX allowlists protect against bad routes.",
      "Mint allow/deny lists and unverified route denial.",
    ],
    tags: ["dex", "guardrails", "slippage", "allowlist", "mint", "route"],
  },
  {
    href: "/docs/policy-model",
    title: "Policy Model",
    contentSnippets: [
      "Use allowlists to constrain protocols and methods.",
      "Enforce spend limits, slippage bounds, and cooldown windows.",
      "Fail-closed behavior denies execution when checks are missing or invalid.",
    ],
    tags: ["policy", "allowlist", "limits", "slippage", "cooldown", "fail-closed"],
  },
  {
    href: "/docs/permit-schema-v1",
    title: "Permit Schema v1",
    contentSnippets: [
      "Versioned, deterministic permit contract.",
      "Copyable demo fields for integration testing.",
    ],
    tags: ["permit schema", "v1", "contract", "deterministic", "versioned"],
  },
  {
    href: "/docs/receipt-specification-v1",
    title: "Receipt Specification v1",
    contentSnippets: [
      "Formal RFC-style receipt contract with deterministic hash rules.",
      "Version compatibility policy for receipt consumers.",
    ],
    tags: ["receipt spec", "rfc", "hash", "specification", "v1", "compatibility"],
  },
  {
    href: "/docs/verify",
    title: "Verification",
    contentSnippets: [
      "What content_hash means and what --verify guarantees.",
      "Use receipt verification in production for trust anchoring.",
    ],
    tags: ["verify", "verification", "content hash", "trust", "production"],
  },
  {
    href: "/docs/anchoring-roadmap",
    title: "Anchoring & Execution Roadmap",
    contentSnippets: [
      "Live, preview, and planned phases for receipt verification.",
      "Anchoring evolution from in-memory to on-chain.",
    ],
    tags: ["anchoring", "roadmap", "on-chain", "phases", "evolution"],
  },
  {
    href: "/docs/permits",
    title: "Permits",
    contentSnippets: [
      "Permit fields include scope, TTL, nonce, and domain separation.",
      "Short-lived authorization reduces replay risk.",
      "Validation denies expired, reused, or out-of-domain permits.",
    ],
    tags: ["permit", "ttl", "nonce", "replay", "authorization", "scope"],
  },
  {
    href: "/docs/changelog",
    title: "Changelog",
    contentSnippets: [
      "Versioned release notes for the ATF CLI and public API.",
      "Track breaking changes, new features, and deprecations.",
    ],
    tags: ["changelog", "release notes", "versions", "updates", "breaking changes"],
  },
  {
    href: "/docs/openclaw-plugin",
    title: "OpenClaw Plugin",
    contentSnippets: [
      "Install @trucore/trucore-atf with thirteen typed tools.",
      "Safety defaults and configuration options for agent plugins.",
    ],
    tags: ["openclaw", "plugin", "trucore-atf", "tools", "install", "agent"],
  },
  {
    href: "/docs/agent-discovery",
    title: "Agent Discovery",
    contentSnippets: [
      "Machine-readable ATF manifest and recipes_v2 self-install.",
      "Receipts-backed savings reporting for autonomous agents.",
    ],
    tags: ["agent discovery", "manifest", "atf.json", "recipes", "savings"],
  },

  /* ─── CLI Deep Dives ─── */
  {
    href: "/docs/cli/doctor",
    title: "Doctor",
    contentSnippets: [
      "Run environment health checks and verify RPC reachability.",
      "Detect wallet configuration issues before trading.",
    ],
    tags: ["doctor", "health check", "rpc", "wallet", "diagnostics", "cli"],
  },
  {
    href: "/docs/cli/profiles",
    title: "Profiles & Config",
    contentSnippets: [
      "Named profiles separate secrets from configuration.",
      "Switch between devnet and mainnet profiles easily.",
    ],
    tags: ["profiles", "config", "secrets", "devnet", "mainnet", "cli"],
  },
  {
    href: "/docs/cli/rpc",
    title: "RPC & Network",
    contentSnippets: [
      "Helius-first RPC setup with latency testing.",
      "Network selection and endpoint configuration.",
    ],
    tags: ["rpc", "network", "helius", "latency", "endpoint", "cli"],
  },
  {
    href: "/docs/cli/burner",
    title: "Devnet Burner",
    contentSnippets: [
      "Create throwaway devnet wallets for fast, safe testing.",
      "No risk of mainnet fund loss during development.",
    ],
    tags: ["burner", "devnet", "wallet", "testing", "throwaway", "cli"],
  },
  {
    href: "/docs/cli/transactions",
    title: "Transactions",
    contentSnippets: [
      "Simulate, sign, send, and check transaction status.",
      "End-to-end transaction lifecycle from intent to confirmation.",
    ],
    tags: ["transactions", "simulate", "sign", "send", "status", "cli"],
  },
  {
    href: "/docs/cli/receipts",
    title: "Receipts & Verification",
    contentSnippets: [
      "Deterministic receipt verification via the CLI.",
      "Local hash recomputation for offline trust validation.",
    ],
    tags: ["receipts", "verification", "hash", "cli", "offline", "recompute"],
  },
  {
    href: "/docs/cli/completion",
    title: "Shell Completion",
    contentSnippets: [
      "Tab-completion scripts for bash, zsh, and fish shells.",
    ],
    tags: ["completion", "bash", "zsh", "fish", "tab complete", "shell", "cli"],
  },
  {
    href: "/docs/cli/whoami-ls",
    title: "Whoami & Ls",
    contentSnippets: [
      "Inspect current identity and list active profiles.",
    ],
    tags: ["whoami", "ls", "identity", "profile list", "cli"],
  },

  /* ─── CLI Guides ─── */
  {
    href: "/docs/cli/guides",
    title: "CLI Guides Overview",
    contentSnippets: [
      "Step-by-step walkthroughs for common ATF CLI workflows.",
    ],
    tags: ["guides", "cli", "walkthroughs", "workflows"],
  },
  {
    href: "/docs/cli/guides/swap-permits",
    title: "Swap Permit Parameters",
    contentSnippets: [
      "Parameter glossary with safe defaults for swap permits.",
      "Override precedence rules for permit fields.",
    ],
    tags: ["swap", "permit", "parameters", "defaults", "override", "cli guide"],
  },
  {
    href: "/docs/cli/guides/simulate-verify-execute",
    title: "Simulate, Verify, Execute",
    contentSnippets: [
      "The canonical ATF workflow: simulate, then verify, then execute.",
      "Step-by-step from policy check to confirmed transaction.",
    ],
    tags: ["simulate", "verify", "execute", "workflow", "canonical", "cli guide"],
  },
  {
    href: "/docs/cli/guides/helius-setup",
    title: "Helius RPC Setup",
    contentSnippets: [
      "Configure a Helius RPC endpoint and confirm connectivity.",
      "Profile-based endpoint management for different environments.",
    ],
    tags: ["helius", "rpc", "setup", "endpoint", "connectivity", "cli guide"],
  },
  {
    href: "/docs/cli/guides/devnet-burner",
    title: "Devnet Burner Quickstart",
    contentSnippets: [
      "Spin up disposable devnet wallets for safe, fast testing.",
    ],
    tags: ["devnet", "burner", "quickstart", "wallet", "testing", "cli guide"],
  },
  {
    href: "/docs/cli/guides/production-bot-basics",
    title: "Production Bot Basics",
    contentSnippets: [
      "Profile separation, receipts retention, and operational hygiene.",
      "Best practices for running ATF-protected bots in production.",
    ],
    tags: ["production", "bot", "operational", "hygiene", "receipts retention", "cli guide"],
  },

  /* ─── Standalone public pages (not in docs-nav but in sitemap/metadata) ─── */
  {
    href: "/docs/terminology-and-endpoints",
    title: "Terminology & Endpoint Glossary",
    contentSnippets: [
      "Reference mapping of ATF terms across spec, API, CLI, and UI.",
      "Endpoint comparison for protect vs simulate flows.",
    ],
    tags: ["terminology", "glossary", "endpoints", "reference", "mapping"],
  },
  {
    href: "/docs/live-demo",
    title: "Live Demo",
    contentSnippets: [
      "Interactive demonstration of ATF policy enforcement.",
    ],
    tags: ["demo", "live demo", "interactive", "try it"],
  },
  {
    href: "/docs/policy-examples",
    title: "Policy Examples",
    contentSnippets: [
      "Concrete policy configurations for common use cases.",
      "Copy-paste examples for allowlists, limits, and guardrails.",
    ],
    tags: ["policy examples", "examples", "allowlist", "configuration", "copy paste"],
  },
];