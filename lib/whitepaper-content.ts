export type WhitepaperSection = {
  id: string;
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
};

export const whitepaperMeta = {
  title: "ATF Security Whitepaper (Preview)",
  subtitle: "A policy + permit enforcement layer for autonomous finance",
  footerLine: "trucore.xyz • info@trucore.xyz",
};

export const whitepaperSections: WhitepaperSection[] = [
  {
    id: "abstract",
    heading: "Abstract",
    paragraphs: [
      "This preview describes the security model behind TruCore Agent Transaction Firewall (ATF). ATF is an external enforcement boundary for autonomous finance systems that execute on Solana.",
      "The design centers on deterministic controls: policy evaluation, scoped permits, pre-flight validation, and tamper-evident receipts. The goal is constrained execution with clear accountability.",
    ],
  },
  {
    id: "threat-model",
    heading: "Threat Model",
    bullets: [
      "Unbounded execution: an agent proposes transactions outside approved risk limits.",
      "Protocol drift: execution moves to unapproved or unsafe on-chain programs.",
      "Slippage exploitation: adverse pricing and MEV extraction degrade outcomes.",
      "Authorization creep: agent capabilities expand beyond intended scope.",
      "Replay and timing abuse: stale or duplicated intents are replayed.",
      "Audit opacity: no reliable record of checks, approvals, and outcomes.",
    ],
  },
  {
    id: "trust-model",
    heading: "Trust Model",
    bullets: [
      "ATF assumes model output is not inherently trustworthy and must be constrained before execution.",
      "ATF assumes Solana is adversarial and treats mempool and routing environments as hostile.",
      "ATF assumes enforcement must fail closed when checks are ambiguous or unavailable.",
      "ATF does not rely on agent-side self-approval for critical permissions.",
    ],
  },
  {
    id: "enforcement-model",
    heading: "Enforcement Model",
    paragraphs: [
      "ATF enforces a deterministic pipeline:",
    ],
    bullets: [
      "Policy: evaluate declared intent against hard rules.",
      "Permit: issue a scoped, time-bound authorization token.",
      "Validate: perform pre-flight constraint checks before submission.",
    ],
  },
  {
    id: "receipt-model",
    heading: "Receipt Model",
    paragraphs: [
      "Each decision point emits structured evidence: policy version, permit scope, validation result, and settlement status. Receipts are designed for tamper-evident audit and post-incident review.",
    ],
  },
  {
    id: "v1-scope",
    heading: "V1 Scope",
    bullets: [
      "Chain: Solana",
      "Protocol coverage: Jupiter (swaps), Solend (lending)",
      "Controls: allowlists, spend caps, slippage constraints, TTL and nonce requirements",
    ],
  },
  {
    id: "design-partner",
    heading: "Design Partner Program",
    paragraphs: [
      "Teams running autonomous financial agents can apply for early integration and direct feedback loops. The program is focused on practical deployment constraints and measurable risk controls.",
    ],
  },
];
