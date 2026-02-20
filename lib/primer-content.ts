/**
 * Structured content for the ATF Primer.
 * Shared between the web page (/atf/primer) and the PDF route (/atf/primer/pdf).
 */

export type PrimerSection = {
  id: string;
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
};

export const primerMeta = {
  title: "ATF Primer",
  subtitle: "Infrastructure for Autonomous Finance",
  callout:
    "This primer is intentionally narrow. TruCore is an umbrella for more products.",
  footerLine: "trucore.xyz \u2022 info@trucore.xyz",
};

export const primerSections: PrimerSection[] = [
  {
    id: "problem",
    heading: "The Problem",
    paragraphs: [
      "Autonomous AI agents are executing financial transactions at machine speed with zero human oversight. Current infrastructure assumes a human approves every material decision, an assumption that collapses when agents operate independently.",
      "Without an external enforcement boundary, agents can exceed spend limits, interact with unapproved protocols, and leave no auditable trail. The result is uncontrolled capital exposure and no accountability.",
      "AI models hallucinate, drift, and behave unpredictably under novel conditions. On-chain environments compound the risk: MEV bots, sandwich attacks, and front-runners actively exploit unprotected transactions. Capital preservation requires hard constraints that cannot be softened at runtime.",
    ],
  },
  {
    id: "model",
    heading: "The Model",
    paragraphs: [
      "ATF enforces a four-stage deterministic pipeline on every agent transaction:",
    ],
    bullets: [
      "Policy: declarative rules evaluated against the agent's intent before any execution begins.",
      "Permit: a scoped, time-bound authorization token granting minimal execution rights. Permits expire automatically and cannot be escalated.",
      "Validate: pre-flight simulation and constraint verification ensure the transaction conforms to policy before touching the chain. Fail-closed by default.",
      "Receipt: a cryptographic receipt captures every evaluation, approval, rejection, and settlement event for tamper-evident post-trade audit.",
    ],
  },
  {
    id: "v1-scope",
    heading: "V1 Scope",
    paragraphs: [
      "V1 targets Solana with two protocol integrations:",
    ],
    bullets: [
      "Jupiter: swap enforcement with slippage bounds and minimum-out checks.",
      "Solend: lending enforcement with collateral ratio and liquidation safeguards.",
    ],
  },
  {
    id: "hard-invariants",
    heading: "Hard Invariants",
    paragraphs: [
      "Non-negotiable constraints enforced on every transaction. These cannot be bypassed, overridden, or weakened at runtime.",
    ],
    bullets: [
      "Spend cap: max value per transaction and per rolling time window.",
      "Protocol allowlist: only pre-approved programs may be invoked.",
      "Slippage max: price deviation hard-capped with enforced minimum output.",
      "Cooldown period: minimum interval between high-risk actions.",
      "Permit TTL + nonce: permits expire fast and carry single-use nonces.",
      "Domain separation: each permit is scoped to a specific environment. Cross-domain reuse is invalid.",
    ],
  },
  {
    id: "threat-model",
    heading: "Threat Model",
    paragraphs: [
      "ATF is designed to mitigate the following categories of risk:",
    ],
    bullets: [
      "Unbounded execution: agent submits transactions outside approved parameters, draining capital.",
      "Protocol drift: agent interacts with unapproved or compromised contracts.",
      "Slippage exploitation: adverse fills and MEV extraction erode portfolio value.",
      "Authorization creep: over-permissioned agents accumulate access beyond original scope.",
      "Audit opacity: no verifiable trail of what was checked, approved, or rejected.",
      "Adversary and MEV exploitation: sandwich attacks and front-runners extract value from unprotected transactions.",
    ],
  },
  {
    id: "design-partners",
    heading: "What Design Partners Get",
    paragraphs: [
      "TruCore is onboarding a small cohort of design partners for V1.",
    ],
    bullets: [
      "Early API access with direct engineering support for integration.",
      "Influence on policy primitives, SDK design, and protocol coverage.",
      "Priority onboarding when ATF moves to general availability.",
    ],
  },
  {
    id: "engage",
    heading: "How to Engage",
    paragraphs: [
      "If you are building autonomous agents that execute financial transactions on Solana, apply as a design partner. We are looking for teams with live agents, real transaction volume, and a concrete need for execution guardrails.",
    ],
  },
];
