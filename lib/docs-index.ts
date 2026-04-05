export type DocsIndexEntry = {
  href: string;
  title: string;
  contentSnippets: string[];
  tags: string[];
};

export const docsIndex: DocsIndexEntry[] = [
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
];