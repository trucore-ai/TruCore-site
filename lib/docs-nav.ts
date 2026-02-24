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
        title: "Policy Model",
        href: "/docs/policy-model",
        description:
          "Understand allowlists, limits, slippage bounds, cooldowns, and fail-closed checks.",
      },
      {
        title: "Permits",
        href: "/docs/permits",
        description:
          "Learn permit fields, domain separation, TTL, nonce usage, and replay protection.",
      },
    ],
  },
];