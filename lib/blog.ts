export type BlogPost = {
  slug: string;
  title: string;
  date: string;
  description: string;
  tags: string[];
  body: Array<{
    heading?: string;
    paragraphs: string[];
    code?: {
      language: string;
      content: string;
    };
  }>;
};

export const posts: BlogPost[] = [
  {
    slug: "why-agent-autonomy-fails-without-permits",
    title: "Why agent autonomy fails without permits",
    date: "2026-02-20",
    description:
      "Autonomous execution needs explicit delegation boundaries. Permits turn intent into constrained authority.",
    tags: ["permits", "authorization", "agent-security"],
    body: [
      {
        heading: "Autonomy needs explicit scope",
        paragraphs: [
          "Agent autonomy breaks when execution rights are implicit. If an agent can call every protocol and move every asset, a single bad decision can become a full account compromise.",
          "Permits solve this by expressing exactly what is allowed, for how long, and under what conditions. They convert natural language intent into deterministic machine constraints.",
        ],
      },
      {
        heading: "What a useful permit must include",
        paragraphs: [
          "A practical permit should define principal, action, resource, and constraint set. Constraints should include value limits, protocol allowlists, and expiry.",
          "Without these fields, incident response depends on emergency revocation and luck. With them, the blast radius is bounded before execution starts.",
        ],
        code: {
          language: "json",
          content:
            '{\n  "principal": "agent:rebalance-bot",\n  "actions": ["swap"],\n  "protocols": ["jupiter"],\n  "max_notional_usd": 25000,\n  "expires_at": "2026-02-20T18:00:00Z"\n}',
        },
      },
      {
        heading: "Permits are the control plane",
        paragraphs: [
          "Monitoring and audits are valuable, but they are post-event tools. Permits are pre-event controls that make unsafe execution unrepresentable.",
          "For autonomous finance, permits are not optional compliance features. They are the minimum structure that makes autonomy survivable.",
        ],
      },
    ],
  },
  {
    slug: "hard-invariants-the-minimum-viable-firewall",
    title: "Hard invariants: the minimum viable firewall",
    date: "2026-02-19",
    description:
      "A firewall for agents starts with a tiny set of non-negotiable invariants that fail closed under stress.",
    tags: ["invariants", "firewall", "risk-controls"],
    body: [
      {
        heading: "Start with failure modes, not features",
        paragraphs: [
          "Most agent incidents are not novel exploits. They are ordinary mistakes amplified by speed, automation, and unlimited permissions.",
          "The minimum viable firewall should reject unsafe states by default, then allow explicit exceptions through policy.",
        ],
      },
      {
        heading: "Three hard invariants",
        paragraphs: [
          "Invariant one: no transaction executes without policy evaluation. Invariant two: no transfer leaves approved protocol boundaries. Invariant three: no settlement proceeds without a signed receipt chain.",
          "If any invariant cannot be proven at runtime, execution halts. This is where fail-closed design becomes operational instead of aspirational.",
        ],
        code: {
          language: "ts",
          content:
            "const decision = evaluatePolicy(tx);\nif (!decision.allow) throw new Error(\"deny: policy\");\nif (!isAllowedProtocol(tx.programId)) throw new Error(\"deny: protocol\");\nif (!canIssueReceipt(tx)) throw new Error(\"deny: receipt\");",
        },
      },
      {
        heading: "Keep the invariant set small",
        paragraphs: [
          "Teams often overfit policy too early. A compact invariant core is easier to test, easier to audit, and harder to bypass accidentally.",
          "Expand policy logic only after the base invariants are observable, measurable, and stable in production.",
        ],
      },
    ],
  },
  {
    slug: "v1-scope-solana-jupiter-solend-and-why",
    title: "V1 scope: Solana + Jupiter + Solend and why",
    date: "2026-02-18",
    description:
      "Constrained surface area is a security strategy. V1 focuses on one chain and two core protocol rails.",
    tags: ["v1", "solana", "jupiter", "solend"],
    body: [
      {
        heading: "Why this scope is deliberate",
        paragraphs: [
          "V1 should maximize learning per integration while minimizing unknown interactions. Solana provides low-latency execution and mature tooling for deterministic checks.",
          "Jupiter and Solend cover core workflows for routing and lending without expanding into broad, unbounded protocol exposure.",
        ],
      },
      {
        heading: "Security upside of narrower integrations",
        paragraphs: [
          "A tighter integration set enables stronger simulation coverage, clearer allowlists, and faster incident triage. Every additional protocol adds policy complexity and threat surface.",
          "Scope discipline is not a growth constraint. It is how you ship a system that users can trust before scaling outward.",
        ],
        code: {
          language: "yaml",
          content:
            "v1_scope:\n  chain: solana\n  protocols:\n    - jupiter\n    - solend\n  controls:\n    - slippage_limits\n    - protocol_allowlists\n    - permit_expiry\n    - receipt_signing",
        },
      },
      {
        heading: "What changes after V1",
        paragraphs: [
          "After invariants and receipts are stable, the roadmap can add integrations in controlled phases. Each new rail should pass the same policy and observability bar.",
          "This sequence keeps security architecture ahead of distribution instead of trailing behind it.",
        ],
      },
    ],
  },
];

export function getPost(slug: string) {
  return posts.find((post) => post.slug === slug);
}

export function getAllPosts() {
  return posts;
}
