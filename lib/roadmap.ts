export type RoadmapStatus = "completed" | "in_progress" | "planned";
export type RoadmapScope = "core" | "security" | "ecosystem";

export type RoadmapItem = {
  id: string;
  title: string;
  description: string;
  status: RoadmapStatus;
  scope: RoadmapScope;
};

export const SCOPE_LABELS: Record<RoadmapScope, string> = {
  core: "Core Infrastructure",
  security: "Security and Audit",
  ecosystem: "Ecosystem and Expansion",
};

export const roadmapItems: RoadmapItem[] = [
  {
    id: "policy-engine",
    title: "Policy Engine Core",
    description:
      "Declarative rule definitions evaluated against every transaction before submission. Supports allowlists, rate limits, slippage bounds, and multi-sig requirements.",
    status: "completed",
    scope: "core",
  },
  {
    id: "permit-model",
    title: "Permit Model",
    description:
      "Scoped, time-bound authorization tokens grant agents minimal execution rights. Permits expire automatically and cannot be escalated.",
    status: "completed",
    scope: "core",
  },
  {
    id: "execution-validator",
    title: "Execution Validator",
    description:
      "Pre-flight simulation and constraint verification ensure transactions conform to policy before touching the chain. Fail-closed by default.",
    status: "in_progress",
    scope: "core",
  },
  {
    id: "receipt-ledger",
    title: "Receipt Ledger",
    description:
      "Cryptographic receipts capture every policy evaluation, approval, rejection, and settlement event for tamper-evident post-trade audit.",
    status: "in_progress",
    scope: "security",
  },
  {
    id: "policy-attestation-registry",
    title: "Policy Attestation Registry",
    description:
      "On-chain registry publishing policy evaluations and execution receipts for transparent, verifiable audit by any third party.",
    status: "planned",
    scope: "security",
  },
  {
    id: "on-chain-vault-program",
    title: "On-chain Vault Program",
    description:
      "On-chain program enforcing portfolio-level hard invariants with vault-scoped custody and automatic halt logic.",
    status: "planned",
    scope: "ecosystem",
  },
  {
    id: "router-program",
    title: "Router Program",
    description:
      "Smart routing layer for multi-protocol execution, coordinating transactions across Jupiter, Solend, and future integrations under unified policy control.",
    status: "planned",
    scope: "ecosystem",
  },
];

/** Group roadmap items by scope, preserving scope order. */
export function groupByScope(items: RoadmapItem[]): { scope: RoadmapScope; label: string; items: RoadmapItem[] }[] {
  const order: RoadmapScope[] = ["core", "security", "ecosystem"];
  return order
    .map((scope) => ({
      scope,
      label: SCOPE_LABELS[scope],
      items: items.filter((i) => i.scope === scope),
    }))
    .filter((g) => g.items.length > 0);
}
