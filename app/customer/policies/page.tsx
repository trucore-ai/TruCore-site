"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  isLoggedIn,
  fetchPolicy,
  updatePolicyOverrides,
  fetchReceiptSummary,
  fetchMarketConditions,
  type EffectivePolicyResponse,
  type ReceiptSummary,
  type MarketConditions,
} from "@/lib/customer-auth";
import { PremiumSlider } from "@/components/premium-slider";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatLimit(v: number): string {
  if (v < 0) return "Unlimited";
  return v.toLocaleString();
}

function tierLabel(code: string): string {
  const labels: Record<string, string> = {
    free: "Free",
    pro: "Pro",
    advanced: "Advanced",
    enterprise: "Enterprise",
  };
  return labels[code] ?? code;
}

// Editable override fields exposed for policy customization.
const EDITABLE_FIELDS = [
  {
    key: "max_slippage_bps",
    label: "Max Slippage (bps)",
    type: "number" as const,
    min: 1,
    max: 1000,
    placeholder: "e.g. 100",
    hint: "Maximum allowed slippage in basis points. Lower values provide tighter price protection.",
    group: "safety",
    guidance: "Most users set 50–200 bps. Above 500 is rarely needed.",
  },
  {
    key: "max_notional_usd",
    label: "Max Transaction Value (USD)",
    type: "number" as const,
    min: 1,
    max: 10_000_000,
    placeholder: "e.g. 25000",
    hint: "Upper bound on transaction value in USD. Transactions above this limit are blocked.",
    group: "limits",
    guidance: "Most users stay under $100K.",
  },
  {
    key: "max_value_sol",
    label: "Max Value (SOL)",
    type: "number" as const,
    min: 1,
    max: 100_000,
    placeholder: "e.g. 500",
    hint: "Upper bound on transaction value in SOL. Works alongside the USD limit.",
    group: "limits",
    guidance: "100–1,000 SOL covers most use cases.",
  },
  {
    key: "require_simulation_success",
    label: "Require Simulation Success",
    type: "boolean" as const,
    hint: "When enabled, transactions must pass simulation before execution. Strongly recommended.",
    group: "safety",
    guidance: "Most users keep this on.",
  },
  {
    key: "allowed_programs",
    label: "Allowed Programs",
    type: "list" as const,
    maxItems: 50,
    itemMaxLen: 64,
    placeholder: "Program ID",
    hint: "Only these program IDs will be permitted. Leave empty to allow all from your plan.",
    group: "programs",
    guidance: "Restrict to known programs for maximum safety.",
  },
  {
    key: "denied_programs",
    label: "Denied Programs",
    type: "list" as const,
    maxItems: 50,
    itemMaxLen: 64,
    placeholder: "Program ID",
    hint: "Transactions involving these program IDs will be blocked.",
    group: "programs",
    guidance: "Block known dangerous or unwanted programs.",
  },
] as const;

type EditableKey = (typeof EDITABLE_FIELDS)[number]["key"];

// ---------------------------------------------------------------------------
// Token policy model
// ---------------------------------------------------------------------------

type TokenPolicyMode = "unrestricted" | "allowlist" | "denylist";

interface TokenPolicyState {
  mode: TokenPolicyMode;
  allowed_mints: string[];
  denied_mints: string[];
}

const DEFAULT_TOKEN_POLICY: TokenPolicyState = {
  mode: "unrestricted",
  allowed_mints: [],
  denied_mints: [],
};

const TOKEN_MODES: {
  id: TokenPolicyMode;
  label: string;
  tagline: string;
  detail: string;
  emptyNote: string;
  strictness: string;
  strictnessColor: string;
}[] = [
  {
    id: "unrestricted",
    label: "Open",
    tagline: "Any token allowed",
    detail: "All tokens are permitted. No restrictions on which mints can appear in transactions.",
    emptyNote: "No token lists needed — all mints are allowed.",
    strictness: "Permissive",
    strictnessColor: "text-orange-400",
  },
  {
    id: "denylist",
    label: "Block Selected",
    tagline: "Block specific tokens",
    detail: "All tokens are allowed except those on your deny list. Add tokens you want to block.",
    emptyNote: "No tokens blocked yet — effectively the same as Open mode. Add mints below to start blocking.",
    strictness: "Moderate",
    strictnessColor: "text-amber-300",
  },
  {
    id: "allowlist",
    label: "Allow Selected Only",
    tagline: "Only approved tokens",
    detail: "Only tokens on your allow list are permitted. Everything else is blocked.",
    emptyNote: "No tokens allowed yet — all transactions will be blocked. Add at least one mint to proceed.",
    strictness: "Restrictive",
    strictnessColor: "text-emerald-400",
  },
];

const WELL_KNOWN_MINTS: { symbol: string; name: string; address: string }[] = [
  { symbol: "SOL", name: "Solana", address: "So11111111111111111111111111111111111111112" },
  { symbol: "USDC", name: "USD Coin", address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" },
  { symbol: "USDT", name: "Tether USD", address: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB" },
  { symbol: "BONK", name: "Bonk", address: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263" },
  { symbol: "JUP", name: "Jupiter", address: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN" },
  { symbol: "RAY", name: "Raydium", address: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R" },
  { symbol: "PYTH", name: "Pyth Network", address: "HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3" },
  { symbol: "ORCA", name: "Orca", address: "orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE" },
  { symbol: "mSOL", name: "Marinade SOL", address: "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So" },
  { symbol: "JitoSOL", name: "Jito SOL", address: "J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn" },
];

/** Resolve a mint identifier: look up known symbols, otherwise return as-is. */
function resolveMintDisplay(mint: string): { symbol: string; isKnown: boolean } {
  const upper = mint.toUpperCase();
  const known = WELL_KNOWN_MINTS.find(
    (m) => m.symbol.toUpperCase() === upper || m.address === mint,
  );
  if (known) return { symbol: known.symbol, isKnown: true };
  // Truncate long addresses for display
  if (mint.length > 16) return { symbol: `${mint.slice(0, 6)}…${mint.slice(-4)}`, isKnown: false };
  return { symbol: mint, isKnown: false };
}

const NUMERIC_FORMAT: Record<string, (v: number) => string> = {
  max_slippage_bps: (v) => `${v.toLocaleString()} bps`,
  max_notional_usd: (v) => `$${v.toLocaleString()}`,
  max_value_sol: (v) => `${v.toLocaleString()} SOL`,
};

// ---------------------------------------------------------------------------
// Presets — frontend-only guided defaults
// ---------------------------------------------------------------------------

interface Preset {
  id: string;
  label: string;
  tagline: string;
  values: Record<string, string>;
}

const PRESETS: Preset[] = [
  {
    id: "conservative",
    label: "Conservative",
    tagline: "Tight limits, maximum safety",
    values: {
      max_slippage_bps: "50",
      max_notional_usd: "5000",
      max_value_sol: "100",
      require_simulation_success: "true",
    },
  },
  {
    id: "balanced",
    label: "Balanced",
    tagline: "Standard protection for active usage",
    values: {
      max_slippage_bps: "150",
      max_notional_usd: "50000",
      max_value_sol: "1000",
      require_simulation_success: "true",
    },
  },
  {
    id: "aggressive",
    label: "Aggressive",
    tagline: "Maximum flexibility, fewer guardrails",
    values: {
      max_slippage_bps: "500",
      max_notional_usd: "500000",
      max_value_sol: "10000",
      require_simulation_success: "false",
    },
  },
];

function detectPreset(
  formValues: Record<string, string>,
  listValues: Record<string, string[]>,
): string {
  for (const preset of PRESETS) {
    const numericMatch = Object.entries(preset.values).every(
      ([k, v]) => formValues[k] === v,
    );
    const listsEmpty =
      (listValues.allowed_programs ?? []).length === 0 &&
      (listValues.denied_programs ?? []).length === 0;
    if (numericMatch && listsEmpty) return preset.id;
  }
  return "custom";
}

// ---------------------------------------------------------------------------
// Field groups
// ---------------------------------------------------------------------------

const FIELD_GROUPS = [
  {
    id: "limits",
    title: "Transaction Limits",
    description: "Maximum value allowed per transaction",
  },
  {
    id: "safety",
    title: "Execution Safety",
    description: "Slippage tolerance and simulation requirements",
  },
  {
    id: "tokens",
    title: "Token Access Policy",
    description: "Control which tokens your agent can trade",
  },
  {
    id: "programs",
    title: "Program Controls",
    description: "Restrict which on-chain programs can be invoked",
  },
];

// ---------------------------------------------------------------------------
// Live risk profile
// ---------------------------------------------------------------------------

interface RiskProfile {
  overall: string;
  overallColor: string;
  transactionFreedom: string;
  transactionColor: string;
  executionSafety: string;
  safetyColor: string;
  programAccess: string;
  programColor: string;
  simulationRequired: string;
  simulationColor: string;
  tokenAccess: string;
  tokenColor: string;
}

function computeRiskProfile(
  formValues: Record<string, string>,
  listValues: Record<string, string[]>,
  tokenPolicy?: TokenPolicyState,
): RiskProfile {
  const slippage = Number(formValues.max_slippage_bps) || 0;
  const notional = Number(formValues.max_notional_usd) || 0;
  const sol = Number(formValues.max_value_sol) || 0;
  const simVal = formValues.require_simulation_success ?? "";
  const simRequired = simVal !== "false";

  let txScore = 0;
  let txCount = 0;
  if (notional > 0) {
    txCount++;
    if (notional <= 10_000) txScore += 1;
    else if (notional <= 100_000) txScore += 2;
    else txScore += 3;
  }
  if (sol > 0) {
    txCount++;
    if (sol <= 200) txScore += 1;
    else if (sol <= 2_000) txScore += 2;
    else txScore += 3;
  }
  const txAvg = txCount > 0 ? txScore / txCount : 0;

  let transactionFreedom = "Plan default";
  let transactionColor = "text-slate-400";
  if (txCount > 0) {
    if (txAvg <= 1.5) {
      transactionFreedom = "Conservative";
      transactionColor = "text-emerald-400";
    } else if (txAvg <= 2.5) {
      transactionFreedom = "Moderate";
      transactionColor = "text-amber-300";
    } else {
      transactionFreedom = "High";
      transactionColor = "text-orange-400";
    }
  }

  let safetyScore = 0;
  if (slippage > 0) {
    if (slippage <= 100) safetyScore = 1;
    else if (slippage <= 300) safetyScore = 2;
    else safetyScore = 3;
  }
  if (simVal !== "" && !simRequired) safetyScore += 1;

  let executionSafety = "Plan default";
  let safetyColor = "text-slate-400";
  if (slippage > 0 || simVal !== "") {
    if (safetyScore <= 1) {
      executionSafety = "High";
      safetyColor = "text-emerald-400";
    } else if (safetyScore <= 2) {
      executionSafety = "Medium";
      safetyColor = "text-amber-300";
    } else {
      executionSafety = "Low";
      safetyColor = "text-orange-400";
    }
  }

  const allowed = (listValues.allowed_programs ?? []).length;
  const denied = (listValues.denied_programs ?? []).length;
  let programAccess = "Open";
  let programColor = "text-slate-400";
  if (allowed > 0) {
    programAccess = "Allowlist only";
    programColor = "text-emerald-400";
  } else if (denied > 0) {
    programAccess = "Denylist active";
    programColor = "text-amber-300";
  }

  let simulationRequired = "Plan default";
  let simulationColor = "text-slate-400";
  if (simVal === "true") {
    simulationRequired = "Required";
    simulationColor = "text-emerald-400";
  } else if (simVal === "false") {
    simulationRequired = "Not required";
    simulationColor = "text-orange-400";
  }

  const hasValues = slippage > 0 || txCount > 0 || simVal !== "";
  let overall = "Plan default";
  let overallColor = "text-slate-400";
  if (hasValues) {
    const totalAvg = txCount > 0 ? (txAvg + safetyScore) / 2 : safetyScore;
    if (totalAvg <= 1.5) {
      overall = "Conservative";
      overallColor = "text-emerald-400";
    } else if (totalAvg <= 2.5) {
      overall = "Balanced";
      overallColor = "text-amber-300";
    } else {
      overall = "Aggressive";
      overallColor = "text-orange-400";
    }
  }

  // Token access dimension
  let tokenAccess = "Plan default";
  let tokenColor = "text-slate-400";
  if (tokenPolicy) {
    if (tokenPolicy.mode === "allowlist") {
      tokenAccess = tokenPolicy.allowed_mints.length > 0 ? "Allowlist only" : "Deny all (empty)";
      tokenColor = "text-emerald-400";
    } else if (tokenPolicy.mode === "denylist") {
      tokenAccess = tokenPolicy.denied_mints.length > 0 ? "Blocklist active" : "Open (empty blocklist)";
      tokenColor = tokenPolicy.denied_mints.length > 0 ? "text-amber-300" : "text-slate-400";
    } else {
      tokenAccess = "Open";
      tokenColor = "text-orange-400";
    }
  }

  return {
    overall,
    overallColor,
    transactionFreedom,
    transactionColor,
    executionSafety,
    safetyColor,
    programAccess,
    programColor,
    simulationRequired,
    simulationColor,
    tokenAccess,
    tokenColor,
  };
}

// ---------------------------------------------------------------------------
// Range guidance
// ---------------------------------------------------------------------------

function rangeGuidance(
  key: string,
  value: string,
): { label: string; color: string } | null {
  const num = Number(value);
  if (!value || isNaN(num)) return null;
  if (key === "max_slippage_bps") {
    if (num <= 75) return { label: "Conservative", color: "text-emerald-400" };
    if (num <= 200) return { label: "Balanced", color: "text-amber-300" };
    if (num <= 500) return { label: "Permissive", color: "text-orange-400" };
    return { label: "Aggressive", color: "text-orange-400" };
  }
  if (key === "max_notional_usd") {
    if (num <= 10_000) return { label: "Conservative", color: "text-emerald-400" };
    if (num <= 100_000) return { label: "Balanced", color: "text-amber-300" };
    if (num <= 1_000_000) return { label: "Elevated", color: "text-orange-400" };
    return { label: "Maximum", color: "text-orange-400" };
  }
  if (key === "max_value_sol") {
    if (num <= 100) return { label: "Conservative", color: "text-emerald-400" };
    if (num <= 1_000) return { label: "Balanced", color: "text-amber-300" };
    if (num <= 10_000) return { label: "Elevated", color: "text-orange-400" };
    return { label: "Maximum", color: "text-orange-400" };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Plain-English policy rule generation
// ---------------------------------------------------------------------------

interface PolicyRule {
  text: string;
  source: "default" | "override";
  category: "limits" | "safety" | "tokens" | "programs";
}

function generatePolicyRules(
  effective: Record<string, unknown>,
  overrides: Record<string, unknown>,
): PolicyRule[] {
  const rules: PolicyRule[] = [];
  const isOverride = (key: string) =>
    Object.prototype.hasOwnProperty.call(overrides, key);

  // Transaction limits
  const maxUsd = effective.max_notional_usd;
  if (typeof maxUsd === "number" && maxUsd > 0) {
    rules.push({
      text: `Transactions above $${maxUsd.toLocaleString()} USD will be denied.`,
      source: isOverride("max_notional_usd") ? "override" : "default",
      category: "limits",
    });
  }

  const maxSol = effective.max_value_sol;
  if (typeof maxSol === "number" && maxSol > 0) {
    rules.push({
      text: `Transactions above ${maxSol.toLocaleString()} SOL will be denied.`,
      source: isOverride("max_value_sol") ? "override" : "default",
      category: "limits",
    });
  }

  // Slippage
  const slippage = effective.max_slippage_bps;
  if (typeof slippage === "number") {
    const pct = slippage / 100;
    const pctStr = pct % 1 === 0 ? pct.toFixed(0) : pct.toFixed(2);
    rules.push({
      text: `Slippage is capped at ${slippage} bps (${pctStr}%).`,
      source: isOverride("max_slippage_bps") ? "override" : "default",
      category: "safety",
    });
  }

  // Simulation
  const simRequired = effective.require_simulation_success;
  if (simRequired === true) {
    rules.push({
      text: "Simulation must succeed before execution.",
      source: isOverride("require_simulation_success") ? "override" : "default",
      category: "safety",
    });
  } else if (simRequired === false) {
    rules.push({
      text: "Transactions may execute without successful simulation.",
      source: isOverride("require_simulation_success") ? "override" : "default",
      category: "safety",
    });
  }

  // Token policy
  const tp = effective.token_policy;
  if (tp && typeof tp === "object" && !Array.isArray(tp)) {
    const tpObj = tp as Record<string, unknown>;
    const mode = String(tpObj.mode ?? "unrestricted");
    const allowed = Array.isArray(tpObj.allowed_mints) ? tpObj.allowed_mints.length : 0;
    const denied = Array.isArray(tpObj.denied_mints) ? tpObj.denied_mints.length : 0;
    if (mode === "allowlist") {
      rules.push({
        text: allowed > 0
          ? `Only ${allowed} approved token${allowed !== 1 ? "s are" : " is"} permitted.`
          : "Token allowlist is active but empty — all tokens are currently blocked.",
        source: isOverride("token_policy") ? "override" : "default",
        category: "tokens",
      });
    } else if (mode === "denylist") {
      rules.push({
        text: denied > 0
          ? `${denied} token${denied !== 1 ? "s are" : " is"} blocked. All others are permitted.`
          : "Token blocklist is active but empty — no tokens are blocked.",
        source: isOverride("token_policy") ? "override" : "default",
        category: "tokens",
      });
    } else {
      rules.push({
        text: "Token access is unrestricted.",
        source: isOverride("token_policy") ? "override" : "default",
        category: "tokens",
      });
    }
  }

  // Program controls
  const allowedProgs = effective.allowed_programs;
  const deniedProgs = effective.denied_programs;
  if (Array.isArray(allowedProgs) && allowedProgs.length > 0) {
    rules.push({
      text: `Only ${allowedProgs.length} approved program${allowedProgs.length !== 1 ? "s may" : " may"} be invoked.`,
      source: isOverride("allowed_programs") ? "override" : "default",
      category: "programs",
    });
  }
  if (Array.isArray(deniedProgs) && deniedProgs.length > 0) {
    rules.push({
      text: `${deniedProgs.length} program${deniedProgs.length !== 1 ? "s are" : " is"} blocked from execution.`,
      source: isOverride("denied_programs") ? "override" : "default",
      category: "programs",
    });
  }
  if (
    (!Array.isArray(allowedProgs) || allowedProgs.length === 0) &&
    (!Array.isArray(deniedProgs) || deniedProgs.length === 0)
  ) {
    rules.push({
      text: "All on-chain programs are permitted.",
      source: "default",
      category: "programs",
    });
  }

  return rules;
}

// ---------------------------------------------------------------------------
// What-this-means outcomes
// ---------------------------------------------------------------------------

function generateOutcomes(
  effective: Record<string, unknown>,
): string[] {
  const outcomes: string[] = [];
  const maxUsd = effective.max_notional_usd;
  const maxSol = effective.max_value_sol;
  if ((typeof maxUsd === "number" && maxUsd > 0) || (typeof maxSol === "number" && maxSol > 0)) {
    outcomes.push("Large trades outside your limits will be blocked.");
  }
  if (effective.require_simulation_success === true) {
    outcomes.push("If simulation fails, execution will not proceed.");
  }
  const tp = effective.token_policy;
  if (tp && typeof tp === "object" && !Array.isArray(tp)) {
    const mode = String((tp as Record<string, unknown>).mode ?? "unrestricted");
    if (mode === "unrestricted") {
      outcomes.push("When token policy is unrestricted, token access is governed by other active rules.");
    } else if (mode === "allowlist") {
      outcomes.push("Allowlist mode means only listed tokens are permitted.");
    } else if (mode === "denylist") {
      outcomes.push("Blocklist mode means listed tokens are blocked; everything else is allowed.");
    }
  }
  return outcomes;
}

// ---------------------------------------------------------------------------
// Policy simulation scenarios — frontend-derived from effective policy
// ---------------------------------------------------------------------------

interface SimulationScenario {
  title: string;
  description: string;
  outcome: "Allowed" | "Denied";
  reason: string;
  category: "limits" | "safety" | "tokens" | "programs";
}

function generateSimulationScenarios(
  effective: Record<string, unknown>,
): SimulationScenario[] {
  const scenarios: SimulationScenario[] = [];

  // --- Transaction limit scenarios ---
  const maxUsd = effective.max_notional_usd;
  if (typeof maxUsd === "number" && maxUsd > 0) {
    const overAmount = Math.round(maxUsd * 1.2).toLocaleString();
    const underAmount = Math.round(maxUsd * 0.5).toLocaleString();
    scenarios.push({
      title: "Large USD transaction",
      description: `Swap worth $${overAmount} USD`,
      outcome: "Denied",
      reason: `Exceeds your $${maxUsd.toLocaleString()} USD transaction limit.`,
      category: "limits",
    });
    scenarios.push({
      title: "Normal USD transaction",
      description: `Swap worth $${underAmount} USD`,
      outcome: "Allowed",
      reason: `Within your $${maxUsd.toLocaleString()} USD transaction limit.`,
      category: "limits",
    });
  }

  const maxSol = effective.max_value_sol;
  if (typeof maxSol === "number" && maxSol > 0) {
    const overSol = Math.round(maxSol * 1.5).toLocaleString();
    scenarios.push({
      title: "Oversized SOL transaction",
      description: `Transfer of ${overSol} SOL`,
      outcome: "Denied",
      reason: `Exceeds your ${maxSol.toLocaleString()} SOL value limit.`,
      category: "limits",
    });
  }

  // --- Slippage scenario ---
  const slippage = effective.max_slippage_bps;
  if (typeof slippage === "number") {
    const exceedBps = slippage + 50;
    scenarios.push({
      title: "High-slippage swap",
      description: `Swap with ${exceedBps} bps slippage`,
      outcome: "Denied",
      reason: `Slippage exceeds your ${slippage} bps cap.`,
      category: "safety",
    });
  }

  // --- Simulation requirement scenario ---
  if (effective.require_simulation_success === true) {
    scenarios.push({
      title: "Failed simulation",
      description: "Transaction where simulation returns an error",
      outcome: "Denied",
      reason: "Your policy requires simulation to succeed before execution.",
      category: "safety",
    });
  }

  // --- Token policy scenarios ---
  const tp = effective.token_policy;
  if (tp && typeof tp === "object" && !Array.isArray(tp)) {
    const tpObj = tp as Record<string, unknown>;
    const mode = String(tpObj.mode ?? "unrestricted");
    const allowed = Array.isArray(tpObj.allowed_mints) ? tpObj.allowed_mints : [];
    const denied = Array.isArray(tpObj.denied_mints) ? tpObj.denied_mints : [];

    if (mode === "allowlist" && allowed.length > 0) {
      const firstMint = resolveMintDisplay(String(allowed[0]));
      scenarios.push({
        title: "Approved token swap",
        description: `Swap involving ${firstMint.symbol}`,
        outcome: "Allowed",
        reason: `${firstMint.symbol} is on your approved token list.`,
        category: "tokens",
      });
      scenarios.push({
        title: "Unlisted token swap",
        description: "Swap involving an unlisted token",
        outcome: "Denied",
        reason: "Only tokens on your allowlist are permitted.",
        category: "tokens",
      });
    } else if (mode === "denylist" && denied.length > 0) {
      const firstDenied = resolveMintDisplay(String(denied[0]));
      scenarios.push({
        title: "Blocked token swap",
        description: `Swap involving ${firstDenied.symbol}`,
        outcome: "Denied",
        reason: `${firstDenied.symbol} is on your blocked token list.`,
        category: "tokens",
      });
    }
  }

  // --- Program control scenarios ---
  const allowedProgs = effective.allowed_programs;
  const deniedProgs = effective.denied_programs;
  if (Array.isArray(deniedProgs) && deniedProgs.length > 0) {
    scenarios.push({
      title: "Blocked program call",
      description: "Transaction invoking a denied program",
      outcome: "Denied",
      reason: "The program is on your block list.",
      category: "programs",
    });
  }
  if (Array.isArray(allowedProgs) && allowedProgs.length > 0) {
    scenarios.push({
      title: "Unapproved program call",
      description: "Transaction invoking a program not on your allowlist",
      outcome: "Denied",
      reason: "Only approved programs may be invoked.",
      category: "programs",
    });
  }

  return scenarios;
}

// ---------------------------------------------------------------------------
// Human-readable labels for effective policy display
// ---------------------------------------------------------------------------

const EFFECTIVE_LABELS: Record<string, string> = {
  tx_limit_per_month: "Monthly transaction limit",
  max_notional_usd: "Max transaction value (USD)",
  max_value_sol: "Max transaction value (SOL)",
  max_slippage_bps: "Max slippage",
  require_simulation_success: "Simulation required",
  allowed_programs: "Allowed programs",
  denied_programs: "Denied programs",
  blocked_programs: "Blocked programs",
  allowed_mints: "Allowed token mints",
  denied_mints: "Denied token mints",
  custom_token_allowlist_enabled: "Custom token allowlist",
  token_policy: "Token access policy",
};

// ---------------------------------------------------------------------------
// Policy recommendations — deterministic, frontend-derived + customer history
// ---------------------------------------------------------------------------

type RecommendationPriority = "high" | "medium" | "low";

/**
 * Recommendation source taxonomy.
 *
 * Active sources (used today):
 *   - "Default guidance"   — generic best-practice recommendations
 *   - "Policy analysis"    — derived from the customer's current policy values
 *   - "Customer history"   — derived from the customer's own receipt history
 *   - "Market analysis"    — real-time execution environment health signals
 *
 * Future sources (defined in the type for forward-compatibility, not shown in
 * the UI until actually wired):
 *   - "Policy Intelligence" — PIL-backed backend signals
 *   - "Cohort benchmark"    — anonymized cross-cohort comparisons
 *   - "External context"    — third-party data feeds
 */
type RecommendationSource =
  | "Default guidance"
  | "Policy analysis"
  | "Customer history"
  | "Policy Intelligence"
  | "Market analysis"
  | "Cohort benchmark"
  | "External context";

interface PolicyRecommendation {
  id: string;
  title: string;
  explanation: string;
  why: string;
  priority: RecommendationPriority;
  source: RecommendationSource;
  /** Editable field key to highlight when user clicks "View setting" */
  fieldKey?: string;
  /** Optional evidence text (for future richer intelligence sources) */
  evidence?: string;
  /** Optional confidence score 0–1 (for future PIL/ML sources) */
  confidence?: number;
}

function generatePolicyRecommendations(
  effective: Record<string, unknown>,
  overrides: Record<string, unknown>,
  overridesEnabled: boolean,
): PolicyRecommendation[] {
  const recommendations: PolicyRecommendation[] = [];

  // 1. Simulation not required
  if (effective.require_simulation_success === false) {
    recommendations.push({
      id: "enable-simulation",
      title: "Enable simulation requirement",
      explanation:
        "Your policy allows transactions to execute without passing simulation first.",
      why: "Simulation catches errors, reverts, and unexpected losses before real funds are at risk. Most users keep this on.",
      priority: "high",
      source: "Default guidance",
      fieldKey: "require_simulation_success",
    });
  }

  // 2. Very permissive slippage
  const slippage = effective.max_slippage_bps;
  if (typeof slippage === "number" && slippage > 300) {
    recommendations.push({
      id: "tighten-slippage",
      title: "Tighten slippage tolerance",
      explanation: `Your slippage cap is set to ${slippage} bps (${(slippage / 100).toFixed(slippage % 100 === 0 ? 0 : 2)}%). This is higher than most users configure.`,
      why: "High slippage tolerance increases the risk of unfavorable execution prices. Most users stay under 200 bps.",
      priority: "medium",
      source: "Default guidance",
      fieldKey: "max_slippage_bps",
    });
  }

  // 3. Very high transaction limits
  const maxUsd = effective.max_notional_usd;
  if (typeof maxUsd === "number" && maxUsd > 200_000) {
    recommendations.push({
      id: "review-usd-limit",
      title: "Review USD transaction limit",
      explanation: `Your per-transaction limit is $${maxUsd.toLocaleString()} USD, which is well above the typical range.`,
      why: "Extremely high limits increase exposure if an agent misbehaves. Consider whether your use case requires this level of access.",
      priority: "low",
      source: "Policy analysis",
      fieldKey: "max_notional_usd",
    });
  }
  const maxSol = effective.max_value_sol;
  if (typeof maxSol === "number" && maxSol > 5_000) {
    recommendations.push({
      id: "review-sol-limit",
      title: "Review SOL transaction limit",
      explanation: `Your per-transaction SOL limit is ${maxSol.toLocaleString()} SOL, which is above the typical range.`,
      why: "High SOL limits increase exposure per transaction. Most users stay under 1,000 SOL.",
      priority: "low",
      source: "Policy analysis",
      fieldKey: "max_value_sol",
    });
  }

  // 4. Token access unrestricted
  const tp = effective.token_policy;
  if (tp && typeof tp === "object" && !Array.isArray(tp)) {
    const tpObj = tp as Record<string, unknown>;
    const mode = String(tpObj.mode ?? "unrestricted");
    const allowed = Array.isArray(tpObj.allowed_mints) ? tpObj.allowed_mints : [];
    const denied = Array.isArray(tpObj.denied_mints) ? tpObj.denied_mints : [];

    if (mode === "unrestricted") {
      recommendations.push({
        id: "restrict-tokens",
        title: "Restrict token access",
        explanation:
          "Your token policy is set to unrestricted — any token mint is permitted in transactions.",
        why: "Restricting token access to known, vetted mints reduces the risk of interacting with malicious or worthless tokens.",
        priority: "medium",
        source: "Default guidance",
        fieldKey: "token_policy",
      });
    } else if (mode === "allowlist" && allowed.length === 0) {
      recommendations.push({
        id: "fix-empty-allowlist",
        title: "Add tokens to your allowlist",
        explanation:
          "Token access is set to allowlist mode, but the list is empty. This means all token transactions will be blocked.",
        why: "An empty allowlist prevents all token activity. Add at least the tokens your agent needs to operate.",
        priority: "high",
        source: "Policy analysis",
        fieldKey: "token_policy",
      });
    } else if (mode === "denylist" && denied.length === 0) {
      recommendations.push({
        id: "populate-denylist",
        title: "Add tokens to your denylist",
        explanation:
          "Token access is set to denylist mode, but no tokens are blocked. This is effectively the same as unrestricted.",
        why: "If you chose denylist mode, consider adding known risky or unwanted tokens to make the restriction meaningful.",
        priority: "low",
        source: "Policy analysis",
        fieldKey: "token_policy",
      });
    }
  }

  // 5. No program restrictions
  const allowedProgs = effective.allowed_programs;
  const deniedProgs = effective.denied_programs;
  const hasAllowedProgs = Array.isArray(allowedProgs) && allowedProgs.length > 0;
  const hasDeniedProgs = Array.isArray(deniedProgs) && deniedProgs.length > 0;
  if (!hasAllowedProgs && !hasDeniedProgs) {
    recommendations.push({
      id: "add-program-restrictions",
      title: "Add program restrictions",
      explanation:
        "No program allowlist or denylist is configured. All on-chain programs are permitted.",
      why: "Restricting programs to known, trusted addresses prevents your agent from invoking unexpected contracts.",
      priority: "low",
      source: "Default guidance",
      fieldKey: "allowed_programs",
    });
  }

  // 6. Overrides enabled but no customization
  if (overridesEnabled && Object.keys(overrides).length === 0) {
    recommendations.push({
      id: "customize-policy",
      title: "Customize your policy",
      explanation:
        "Your plan supports policy customization, but no overrides are set. You are running on plan defaults.",
      why: "Tailoring your policy to your specific use case provides better protection than generic plan defaults.",
      priority: "low",
      source: "Default guidance",
    });
  }

  // Sort by priority: high → medium → low
  const order: Record<RecommendationPriority, number> = { high: 0, medium: 1, low: 2 };
  recommendations.sort((a, b) => order[a.priority] - order[b.priority]);

  return recommendations;
}

// ---------------------------------------------------------------------------
// Customer-history-aware recommendations
// ---------------------------------------------------------------------------

/**
 * Generate recommendations informed by the customer's own receipt history.
 *
 * All recommendations are grounded in actual customer data from the
 * ReceiptSummary.  Each is labeled with source "Customer history" and
 * includes a brief evidence string derived from the summary.
 *
 * Returns an empty array when the summary has no receipts or when no
 * history-based recommendations apply — degrades gracefully.
 */
function generateHistoryRecommendations(
  summary: ReceiptSummary,
  effective: Record<string, unknown>,
): PolicyRecommendation[] {
  const recs: PolicyRecommendation[] = [];

  // Need at least a handful of receipts to make meaningful recommendations
  if (summary.total_receipts < 3) return recs;

  // 1. Policy limits much higher than actual usage
  const policyMaxUsd = effective.max_notional_usd;
  if (
    summary.avg_notional_usd !== null &&
    typeof policyMaxUsd === "number" &&
    policyMaxUsd > 0 &&
    summary.avg_notional_usd > 0 &&
    policyMaxUsd > summary.avg_notional_usd * 5
  ) {
    const avgStr = `$${Math.round(summary.avg_notional_usd).toLocaleString()}`;
    const maxStr = summary.max_notional_usd !== null
      ? `$${Math.round(summary.max_notional_usd).toLocaleString()}`
      : avgStr;
    recs.push({
      id: "history-limit-headroom",
      title: "Your USD limit has significant headroom",
      explanation:
        `Your recent transactions average ${avgStr} USD with a peak of ${maxStr}, ` +
        `but your policy allows up to $${policyMaxUsd.toLocaleString()}.`,
      why:
        "Tightening your limit closer to your actual usage reduces exposure if your agent is compromised.",
      priority: "low",
      source: "Customer history",
      fieldKey: "max_notional_usd",
      evidence: `Based on ${summary.total_receipts} receipts over the last ${summary.period_days} days.`,
    });
  }

  // 2. Slippage cap wider than recent trades need
  const policySlippage = effective.max_slippage_bps;
  if (
    summary.avg_slippage_bps !== null &&
    typeof policySlippage === "number" &&
    policySlippage > 0 &&
    summary.avg_slippage_bps > 0 &&
    policySlippage > summary.avg_slippage_bps * 3
  ) {
    const avgBps = Math.round(summary.avg_slippage_bps);
    recs.push({
      id: "history-slippage-headroom",
      title: "Your slippage cap is wider than recent usage",
      explanation:
        `Your recent trades averaged ${avgBps} bps slippage, but your policy allows up to ${policySlippage} bps.`,
      why:
        "A tighter slippage cap reduces the risk of unfavorable execution prices without impacting your typical trades.",
      priority: "low",
      source: "Customer history",
      fieldKey: "max_slippage_bps",
      evidence: `Based on ${summary.total_receipts} receipts over the last ${summary.period_days} days.`,
    });
  }

  // 3. Simulation failures suggest requiring simulation
  if (
    summary.simulation_failures > 0 &&
    summary.simulation_total > 0 &&
    effective.require_simulation_success !== true
  ) {
    const failPct = Math.round((summary.simulation_failures / summary.simulation_total) * 100);
    recs.push({
      id: "history-simulation-failures",
      title: "Recent simulation failures detected",
      explanation:
        `${summary.simulation_failures} of your last ${summary.simulation_total} ` +
        `executions failed (${failPct}%). Requiring simulation success would catch these before execution.`,
      why:
        "Simulation pre-checks prevent failed transactions from consuming gas and causing unexpected losses.",
      priority: "medium",
      source: "Customer history",
      fieldKey: "require_simulation_success",
      evidence: `${summary.simulation_failures} failures in the last ${summary.period_days} days.`,
    });
  }

  // 4. Narrow token usage suggests allowlist mode
  const tp = effective.token_policy;
  const isUnrestricted =
    !tp ||
    (typeof tp === "object" &&
      !Array.isArray(tp) &&
      String((tp as Record<string, unknown>).mode ?? "unrestricted") === "unrestricted");

  if (
    isUnrestricted &&
    summary.recent_tokens.length > 0 &&
    summary.recent_tokens.length <= 5
  ) {
    const tokenList = summary.recent_tokens.join(", ");
    recs.push({
      id: "history-narrow-tokens",
      title: "You use a small set of tokens",
      explanation:
        `Your recent activity involves only ${summary.recent_tokens.length} token${summary.recent_tokens.length !== 1 ? "s" : ""}: ${tokenList}. ` +
        "Switching to allowlist mode would restrict access to just these tokens.",
      why:
        "Restricting to known tokens prevents your agent from interacting with unfamiliar or malicious mints.",
      priority: "low",
      source: "Customer history",
      fieldKey: "token_policy",
      evidence: `Based on ${summary.total_receipts} receipts over the last ${summary.period_days} days.`,
    });
  }

  // 5. Narrow program usage suggests adding restrictions
  const allowedProgs = effective.allowed_programs;
  const deniedProgs = effective.denied_programs;
  const hasProgRestrictions =
    (Array.isArray(allowedProgs) && allowedProgs.length > 0) ||
    (Array.isArray(deniedProgs) && deniedProgs.length > 0);

  if (
    !hasProgRestrictions &&
    summary.recent_programs.length > 0 &&
    summary.recent_programs.length <= 5
  ) {
    recs.push({
      id: "history-narrow-programs",
      title: "You use a small set of programs",
      explanation:
        `Your recent activity involves only ${summary.recent_programs.length} on-chain program${summary.recent_programs.length !== 1 ? "s" : ""}. ` +
        "Adding a program allowlist would prevent your agent from calling unexpected contracts.",
      why:
        "Restricting to known programs is a strong security measure when your usage is predictable.",
      priority: "low",
      source: "Customer history",
      fieldKey: "allowed_programs",
      evidence: `Based on ${summary.total_receipts} receipts over the last ${summary.period_days} days.`,
    });
  }

  // 6. Recent denials — review policy
  const denyCount = summary.decisions["deny"] ?? 0;
  const allowCount = summary.decisions["allow"] ?? 0;
  if (denyCount > 0 && allowCount > 0) {
    const denyPct = Math.round((denyCount / summary.total_receipts) * 100);
    const reasonHint =
      summary.denial_reasons.length > 0
        ? ` Common reasons: ${summary.denial_reasons.slice(0, 3).join(", ")}.`
        : "";
    recs.push({
      id: "history-recent-denials",
      title: "Some recent transactions were denied",
      explanation:
        `${denyCount} of ${summary.total_receipts} recent transactions (${denyPct}%) were denied by your policy.${reasonHint}`,
      why:
        "If denials are expected, your policy is working correctly. If not, review your limits to ensure they match your intended usage.",
      priority: denyPct > 20 ? "medium" : "low",
      source: "Customer history",
      evidence: `${denyCount} denial${denyCount !== 1 ? "s" : ""} in the last ${summary.period_days} days.`,
    });
  }

  return recs;
}

// ---------------------------------------------------------------------------
// Market-aware recommendations
// ---------------------------------------------------------------------------

/**
 * Generate recommendations informed by real-time execution environment
 * conditions from the RPC/market monitoring layer.
 *
 * All recommendations are grounded in actual infrastructure telemetry
 * (RPC health, throttle rates).  Each is labeled with source
 * "Market analysis" and includes the environment summary as evidence.
 *
 * Returns an empty array when conditions are stable or when no market
 * data is available — degrades gracefully.
 */
function generateMarketRecommendations(
  market: MarketConditions,
  effective: Record<string, unknown>,
): PolicyRecommendation[] {
  const recs: PolicyRecommendation[] = [];

  // Only generate recommendations when there is a real signal
  if (market.environment === "stable") return recs;

  const isDegraded = market.environment === "degraded";
  const isStressed = market.environment === "stressed";

  // 1. Recommend enabling simulation when execution environment is degraded/stressed
  if (
    (isDegraded || isStressed) &&
    effective.require_simulation_success !== true
  ) {
    recs.push({
      id: "market-enable-simulation",
      title: "Enable simulation — execution conditions are elevated",
      explanation:
        `Current execution environment is ${market.environment}. ` +
        "Enabling simulation requirement helps catch failed transactions before they consume gas.",
      why:
        "When RPC infrastructure is stressed, transactions are more likely to revert. " +
        "Simulation pre-checks prevent wasted gas and unexpected losses.",
      priority: isStressed ? "high" : "medium",
      source: "Market analysis",
      fieldKey: "require_simulation_success",
      evidence: market.summary,
    });
  }

  // 2. Recommend tightening slippage when stressed
  const policySlippage = effective.max_slippage_bps;
  if (
    isStressed &&
    typeof policySlippage === "number" &&
    policySlippage > 100
  ) {
    recs.push({
      id: "market-tighten-slippage",
      title: "Consider tightening slippage — market conditions are stressed",
      explanation:
        `Your slippage cap is ${policySlippage} bps. During stressed execution conditions, ` +
        "wider slippage tolerances increase the risk of unfavorable fills.",
      why:
        "Tighter slippage limits provide a safety net when execution quality is reduced.",
      priority: "medium",
      source: "Market analysis",
      fieldKey: "max_slippage_bps",
      evidence: market.summary,
    });
  }

  // 3. Recommend caution on transaction limits when stressed
  const policyMaxUsd = effective.max_notional_usd;
  if (
    isStressed &&
    typeof policyMaxUsd === "number" &&
    policyMaxUsd > 50_000
  ) {
    recs.push({
      id: "market-review-limits",
      title: "Review transaction limits — elevated execution risk",
      explanation:
        `Your USD limit is $${policyMaxUsd.toLocaleString()}. During stressed conditions, ` +
        "large transactions carry higher execution risk.",
      why:
        "Temporarily lowering limits reduces exposure while infrastructure conditions are elevated.",
      priority: "low",
      source: "Market analysis",
      fieldKey: "max_notional_usd",
      evidence: market.summary,
    });
  }

  // 4. Warn about specific method throttling affecting transaction submission
  if (
    market.throttled_methods.length > 0 &&
    market.throttled_methods.some((m) =>
      m.toLowerCase().includes("sendtransaction") || m.toLowerCase().includes("send_transaction"),
    ) &&
    effective.require_simulation_success !== true
  ) {
    recs.push({
      id: "market-tx-submission-throttled",
      title: "Transaction submission is being throttled",
      explanation:
        "The transaction submission method is currently experiencing throttling. " +
        "Requiring simulation success ensures only viable transactions are submitted.",
      why:
        "When submission is throttled, each attempt is more costly. " +
        "Simulation filters out transactions likely to fail.",
      priority: "high",
      source: "Market analysis",
      fieldKey: "require_simulation_success",
      evidence: market.summary,
    });
  }

  return recs;
}

const PRIORITY_STYLES: Record<RecommendationPriority, { badge: string; border: string }> = {
  high: {
    badge: "bg-red-500/15 text-red-300 border border-red-500/20",
    border: "border-red-500/20",
  },
  medium: {
    badge: "bg-amber-500/15 text-amber-300 border border-amber-500/20",
    border: "border-amber-500/20",
  },
  low: {
    badge: "bg-white/5 text-slate-400 border border-white/10",
    border: "border-white/10",
  },
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CustomerPoliciesPage() {
  const router = useRouter();
  const [policy, setPolicy] = useState<EffectivePolicyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [historySummary, setHistorySummary] = useState<ReceiptSummary | null>(null);
  const [marketConditions, setMarketConditions] = useState<MarketConditions | null>(null);

  // Edit state
  const listInputRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const [editing, setEditing] = useState(false);
  const [highlightFieldKey, setHighlightFieldKey] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [listValues, setListValues] = useState<Record<string, string[]>>({});
  const [tokenPolicy, setTokenPolicy] = useState<TokenPolicyState>({ ...DEFAULT_TOKEN_POLICY });
  const [tokenMintInput, setTokenMintInput] = useState("");
  const [editSnapshot, setEditSnapshot] = useState<{
    values: Record<string, string>;
    lists: Record<string, string[]>;
    tokenPolicy: TokenPolicyState;
  } | null>(null);

  const loadPolicy = useCallback(async () => {
    try {
      const p = await fetchPolicy();
      setPolicy(p);
      setError("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load policy data. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch receipt summary for history-aware recommendations (non-blocking).
  const loadHistorySummary = useCallback(async () => {
    try {
      const summary = await fetchReceiptSummary(30);
      setHistorySummary(summary);
    } catch {
      // History summary is optional — degrade gracefully.
      setHistorySummary(null);
    }
  }, []);

  // Fetch market conditions for market-aware recommendations (non-blocking).
  const loadMarketConditions = useCallback(async () => {
    try {
      const conditions = await fetchMarketConditions();
      setMarketConditions(conditions);
    } catch {
      // Market conditions are optional — degrade gracefully.
      setMarketConditions(null);
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
      return;
    }
    loadPolicy();
    loadHistorySummary();
    loadMarketConditions();
  }, [router, loadPolicy, loadHistorySummary, loadMarketConditions]);

  // Initialize form values from current overrides when entering edit mode.
  // Scroll to and briefly highlight the target field after edit form mounts.
  useEffect(() => {
    if (!editing || !highlightFieldKey) return;
    const timer = setTimeout(() => {
      const el = document.querySelector(`[data-field-key="${highlightFieldKey}"]`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("ring-2", "ring-amber-400/60", "rounded-xl");
        const fade = setTimeout(() => {
          el.classList.remove("ring-2", "ring-amber-400/60", "rounded-xl");
          setHighlightFieldKey(null);
        }, 1500);
        return () => clearTimeout(fade);
      }
      setHighlightFieldKey(null);
    }, 150);
    return () => clearTimeout(timer);
  }, [editing, highlightFieldKey]);

  function enterEditMode(fieldKey?: string) {
    const values: Record<string, string> = {};
    const lists: Record<string, string[]> = {};
    const overrides = policy?.overrides ?? {};
    for (const field of EDITABLE_FIELDS) {
      const current = overrides[field.key];
      if (field.type === "list") {
        lists[field.key] = Array.isArray(current) ? [...(current as string[])] : [];
      } else if (current !== undefined && current !== null) {
        values[field.key] = String(current);
      } else {
        values[field.key] = "";
      }
    }
    // Initialize token policy from overrides
    const tp = overrides.token_policy;
    const initTokenPolicy: TokenPolicyState = tp && typeof tp === "object" && !Array.isArray(tp)
      ? {
          mode: (tp as Record<string, unknown>).mode as TokenPolicyMode ?? "unrestricted",
          allowed_mints: Array.isArray((tp as Record<string, unknown>).allowed_mints)
            ? [...((tp as Record<string, unknown>).allowed_mints as string[])]
            : [],
          denied_mints: Array.isArray((tp as Record<string, unknown>).denied_mints)
            ? [...((tp as Record<string, unknown>).denied_mints as string[])]
            : [],
        }
      : { ...DEFAULT_TOKEN_POLICY };

    setFormValues(values);
    setListValues(lists);
    setTokenPolicy(initTokenPolicy);
    setTokenMintInput("");
    setEditSnapshot({
      values: { ...values },
      lists: Object.fromEntries(
        Object.entries(lists).map(([k, v]) => [k, [...v]]),
      ),
      tokenPolicy: {
        mode: initTokenPolicy.mode,
        allowed_mints: [...initTokenPolicy.allowed_mints],
        denied_mints: [...initTokenPolicy.denied_mints],
      },
    });
    setSaveError("");
    setSaveSuccess(false);
    setHighlightFieldKey(fieldKey ?? null);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setEditSnapshot(null);
    setSaveError("");
    setSaveSuccess(false);
    setListValues({});
    setTokenPolicy({ ...DEFAULT_TOKEN_POLICY });
    setTokenMintInput("");
  }

  function applyPreset(preset: Preset) {
    setFormValues((prev) => ({ ...prev, ...preset.values }));
    setListValues({ allowed_programs: [], denied_programs: [] });
  }

  function updateField(key: string, value: string) {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  }

  // Token policy helpers
  function setTokenPolicyMode(mode: TokenPolicyMode) {
    setTokenPolicy((prev) => ({
      mode,
      allowed_mints: mode === "allowlist" ? prev.allowed_mints : [],
      denied_mints: mode === "denylist" ? prev.denied_mints : [],
    }));
  }

  function addTokenMint(mint: string) {
    const trimmed = mint.trim();
    if (!trimmed) return;
    setTokenPolicy((prev) => {
      const listKey = prev.mode === "allowlist" ? "allowed_mints" : "denied_mints";
      const current = prev[listKey];
      if (current.includes(trimmed)) return prev;
      if (current.length >= 50) return prev;
      return { ...prev, [listKey]: [...current, trimmed] };
    });
    setTokenMintInput("");
  }

  function removeTokenMint(index: number) {
    setTokenPolicy((prev) => {
      const listKey = prev.mode === "allowlist" ? "allowed_mints" : "denied_mints";
      const updated = [...prev[listKey]];
      updated.splice(index, 1);
      return { ...prev, [listKey]: updated };
    });
  }

  function addListItem(key: string, value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    setListValues((prev) => {
      const current = prev[key] ?? [];
      if (current.includes(trimmed)) return prev;
      return { ...prev, [key]: [...current, trimmed] };
    });
  }

  function removeListItem(key: string, index: number) {
    setListValues((prev) => {
      const current = [...(prev[key] ?? [])];
      current.splice(index, 1);
      return { ...prev, [key]: current };
    });
  }

  async function handleSave() {
    // Build new overrides: start with current non-editable overrides,
    // then merge editable field values.
    const currentOverrides = { ...(policy?.overrides ?? {}) };
    const editableKeys = new Set<string>([
      ...EDITABLE_FIELDS.map((f) => f.key),
      "token_policy",
    ]);

    // Preserve overrides the UI does not expose.
    const newOverrides: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(currentOverrides)) {
      if (!editableKeys.has(k)) {
        newOverrides[k] = v;
      }
    }

    // Apply editable field values.
    for (const field of EDITABLE_FIELDS) {
      if (field.type === "list") {
        const items = listValues[field.key] ?? [];
        if (items.length === 0) continue; // omit if empty = revert to plan default
        // Client-side validation for list fields
        if (items.length > field.maxItems) {
          setSaveError(`${field.label} must have at most ${field.maxItems} entries.`);
          return;
        }
        for (const item of items) {
          if (item.length === 0 || item.length > field.itemMaxLen) {
            setSaveError(`${field.label} entries must be 1–${field.itemMaxLen} characters.`);
            return;
          }
        }
        newOverrides[field.key] = items;
        continue;
      }

      const raw = formValues[field.key]?.trim() ?? "";
      if (raw === "") continue; // omit = revert to plan default

      if (field.type === "boolean") {
        newOverrides[field.key] = raw === "true";
      } else if (field.type === "number") {
        const num = Number(raw);
        if (isNaN(num) || num < field.min || num > field.max) {
          setSaveError(
            `${field.label} must be a number between ${field.min.toLocaleString()} and ${field.max.toLocaleString()}.`,
          );
          return;
        }
        newOverrides[field.key] = num;
      }
    }

    // Apply token policy (only if not unrestricted-with-empty-lists = plan default)
    const isTokenPolicyDefault =
      tokenPolicy.mode === "unrestricted" &&
      tokenPolicy.allowed_mints.length === 0 &&
      tokenPolicy.denied_mints.length === 0;
    if (!isTokenPolicyDefault) {
      newOverrides.token_policy = {
        mode: tokenPolicy.mode,
        allowed_mints: tokenPolicy.mode === "allowlist" ? tokenPolicy.allowed_mints : [],
        denied_mints: tokenPolicy.mode === "denylist" ? tokenPolicy.denied_mints : [],
      };
    }

    setSaving(true);
    setSaveError("");
    setSaveSuccess(false);

    try {
      await updatePolicyOverrides(newOverrides);
      // Refresh policy to show updated effective values.
      await loadPolicy();
      setEditing(false);
      setSaveSuccess(true);
    } catch (err) {
      setSaveError(
        err instanceof Error
          ? err.message
          : "Could not save overrides. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  // -----------------------------------------------------------------------
  // Loading
  // -----------------------------------------------------------------------

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 px-4 py-20">
        <div className="mx-auto max-w-2xl animate-pulse space-y-4">
          <div className="h-5 w-40 rounded bg-white/10" />
          <div className="h-4 w-64 rounded bg-white/5" />
          <div className="h-48 rounded-xl bg-white/5" />
        </div>
      </main>
    );
  }

  // -----------------------------------------------------------------------
  // Error
  // -----------------------------------------------------------------------

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 px-4 py-20">
        <div className="mx-auto max-w-2xl space-y-6">
          <Link
            href="/customer/dashboard"
            className="text-xs text-primary-400 hover:text-primary-300 transition"
          >
            &larr; Back to dashboard
          </Link>
          <section className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 space-y-3">
            <h1 className="text-sm font-medium text-red-300">
              Policy data unavailable
            </h1>
            <p className="text-xs text-red-200">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/10"
            >
              Retry
            </button>
          </section>
        </div>
      </main>
    );
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  const planCode = policy?.plan_code ?? "free";
  const txLimit = policy?.plan_limits?.tx_limit_per_month ?? 0;
  const overridesEnabled = policy?.plan_limits?.policy_overrides_enabled ?? false;
  const overrides = policy?.overrides ?? {};
  const effective = policy?.effective ?? {};
  const hasOverrides = Object.keys(overrides).length > 0;

  // Partition effective keys into categories for display
  const limitKeys = ["tx_limit_per_month", "max_notional_usd", "max_value_sol"];
  const tokenKeys = ["token_policy", "allowed_mints", "denied_mints", "custom_token_allowlist_enabled"];
  const protectionKeys = ["max_slippage_bps", "require_simulation_success"];
  const programKeys = ["allowed_programs", "denied_programs", "blocked_programs"];

  // Live risk profile & preset detection
  const riskProfile = computeRiskProfile(formValues, listValues, tokenPolicy);
  const activePreset = detectPreset(formValues, listValues);

  // Detect unsaved changes
  const tokenPolicyChanged =
    editing &&
    editSnapshot !== null &&
    (tokenPolicy.mode !== editSnapshot.tokenPolicy.mode ||
      tokenPolicy.allowed_mints.length !== editSnapshot.tokenPolicy.allowed_mints.length ||
      tokenPolicy.denied_mints.length !== editSnapshot.tokenPolicy.denied_mints.length ||
      tokenPolicy.allowed_mints.some((m, i) => m !== editSnapshot.tokenPolicy.allowed_mints[i]) ||
      tokenPolicy.denied_mints.some((m, i) => m !== editSnapshot.tokenPolicy.denied_mints[i]));

  const hasChanges =
    editing &&
    editSnapshot !== null &&
    (Object.keys(formValues).some(
      (k) => formValues[k] !== (editSnapshot.values[k] ?? ""),
    ) ||
      Object.keys(listValues).some((k) => {
        const curr = listValues[k] ?? [];
        const init = editSnapshot.lists[k] ?? [];
        return (
          curr.length !== init.length || curr.some((v, i) => v !== init[i])
        );
      }) ||
      tokenPolicyChanged);

  function renderValue(key: string, val: unknown): string {
    if (val === null || val === undefined) return "—";
    if (key === "token_policy" && typeof val === "object" && val !== null && !Array.isArray(val)) {
      const tp = val as Record<string, unknown>;
      const mode = String(tp.mode ?? "unrestricted");
      const allowed = Array.isArray(tp.allowed_mints) ? tp.allowed_mints.length : 0;
      const denied = Array.isArray(tp.denied_mints) ? tp.denied_mints.length : 0;
      if (mode === "allowlist") return `Allowlist (${allowed} mint${allowed !== 1 ? "s" : ""})`;
      if (mode === "denylist") return `Blocklist (${denied} mint${denied !== 1 ? "s" : ""})`;
      return "Open (unrestricted)";
    }
    if (typeof val === "boolean") return val ? "Yes" : "No";
    if (typeof val === "number") {
      if (val < 0) return "Unlimited";
      if (key.endsWith("_bps")) return `${val} bps`;
      if (key.endsWith("_usd"))
        return `$${val.toLocaleString()}`;
      return val.toLocaleString();
    }
    if (Array.isArray(val))
      return val.length === 0 ? "None" : `${val.length} item${val.length !== 1 ? "s" : ""}`;
    return String(val);
  }

  function renderEffectiveSection(
    title: string,
    keys: string[],
    values: Record<string, unknown>,
    policyOverrides?: Record<string, unknown>,
  ) {
    const entries = keys
      .filter((k) => values[k] !== undefined)
      .map((k) => ({ key: k, value: values[k] }));
    if (entries.length === 0) return null;
    return (
      <div className="space-y-2">
        <h3 className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
          {title}
        </h3>
        <div className="divide-y divide-white/5">
          {entries.map(({ key, value }) => {
            const isOverride = policyOverrides
              ? Object.prototype.hasOwnProperty.call(policyOverrides, key)
              : false;
            return (
              <div key={key} className="flex items-center justify-between py-2.5">
                <span className="text-xs text-slate-400 flex items-center gap-2">
                  {EFFECTIVE_LABELS[key] ?? key}
                  {policyOverrides && (
                    <span
                      className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-medium leading-none ${
                        isOverride
                          ? "bg-amber-500/15 text-amber-300 border border-amber-500/20"
                          : "bg-white/5 text-slate-500 border border-white/5"
                      }`}
                      data-testid={`source-badge-${key}`}
                    >
                      {isOverride ? "Override" : "Default"}
                    </span>
                  )}
                </span>
                <span className="text-xs text-slate-200 font-medium">
                  {renderValue(key, value)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 px-4 py-20">
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <Link
            href="/customer/dashboard"
            className="text-xs text-primary-400 hover:text-primary-300 transition"
          >
            &larr; Back to dashboard
          </Link>
          <h1 className="text-lg font-semibold text-slate-100">
            Policy &amp; Protections
          </h1>
          <p className="text-xs text-slate-500">
            {editing ? (
              "Configure your transaction policy. Choose a preset or customize individual controls."
            ) : (
              <>
                Your effective transaction policy is derived from your{" "}
                <span className="font-medium text-slate-300">
                  {tierLabel(planCode)}
                </span>{" "}
                plan defaults{hasOverrides ? " with custom overrides applied" : ""}.
                {!overridesEnabled && " All values shown are read-only."}
              </>
            )}
          </p>
        </div>

        {/* Plan tier */}
        <section className="rounded-xl border border-primary-400/20 bg-primary-500/5 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center rounded-full border border-primary-400/40 bg-primary-500/10 px-3 py-1 text-xs font-semibold capitalize text-primary-300">
                {tierLabel(planCode)}
              </span>
              <span className="text-xs text-slate-400">
                {formatLimit(txLimit)} transactions / month
              </span>
            </div>
            <p className="text-[10px] text-slate-500">
              Policy overrides:{" "}
              {overridesEnabled ? (
                <span className="text-emerald-400">Enabled</span>
              ) : (
                <span className="text-slate-400">
                  Not available on this plan
                </span>
              )}
            </p>
          </div>
        </section>

        {/* Save success banner */}
        {saveSuccess && !editing && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 flex items-center gap-3">
            <span className="text-emerald-400 text-sm">&#10003;</span>
            <p className="text-xs text-emerald-300">
              Policy overrides saved successfully.
            </p>
          </div>
        )}

        {/* Live risk profile (editing mode) */}
        {editing && (
          <section className="rounded-xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-slate-300">
                Policy Profile
              </h2>
              <span className={`text-xs font-semibold ${riskProfile.overallColor}`}>
                {riskProfile.overall}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <div className="space-y-1">
                <p className="text-[10px] text-slate-500">Transaction Freedom</p>
                <p className={`text-xs font-medium ${riskProfile.transactionColor}`}>
                  {riskProfile.transactionFreedom}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-slate-500">Execution Safety</p>
                <p className={`text-xs font-medium ${riskProfile.safetyColor}`}>
                  {riskProfile.executionSafety}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-slate-500">Simulation</p>
                <p className={`text-xs font-medium ${riskProfile.simulationColor}`}>
                  {riskProfile.simulationRequired}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-slate-500">Token Access</p>
                <p className={`text-xs font-medium ${riskProfile.tokenColor}`}>
                  {riskProfile.tokenAccess}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-slate-500">Program Access</p>
                <p className={`text-xs font-medium ${riskProfile.programColor}`}>
                  {riskProfile.programAccess}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Preset chips (editing mode) */}
        {editing && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] text-slate-500 mr-1">Quick start:</span>
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset)}
                disabled={saving}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
                  activePreset === preset.id
                    ? "border border-amber-400/50 bg-amber-500/15 text-amber-200 shadow-sm shadow-amber-500/10"
                    : "border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200"
                }`}
                title={preset.tagline}
              >
                {preset.label}
              </button>
            ))}
            {activePreset === "custom" && (
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-xs font-medium text-slate-500">
                Custom
              </span>
            )}
          </div>
        )}

        {/* Effective policy (view mode) */}
        {!editing && (
          <>
            {/* Policy at a Glance — plain-English summary */}
            <section
              className="rounded-xl border border-primary-400/20 bg-primary-500/5 p-6 space-y-4"
              data-testid="policy-preview"
            >
              <h2 className="text-sm font-medium text-slate-200">
                Policy at a Glance
              </h2>
              <p className="text-[10px] text-slate-500">
                A plain-English summary of your current effective policy.
              </p>
              <ul className="space-y-2" data-testid="policy-rules">
                {generatePolicyRules(effective, overrides).map((rule, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="mt-0.5 shrink-0 text-[10px] leading-none text-slate-600">
                      &#9679;
                    </span>
                    <span className="text-xs text-slate-300 leading-relaxed">
                      {rule.text}
                    </span>
                    <span
                      className={`ml-auto shrink-0 inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-medium leading-none ${
                        rule.source === "override"
                          ? "bg-amber-500/15 text-amber-300 border border-amber-500/20"
                          : "bg-white/5 text-slate-500 border border-white/5"
                      }`}
                    >
                      {rule.source === "override" ? "Override" : "Default"}
                    </span>
                  </li>
                ))}
              </ul>

              {/* What this means */}
              {(() => {
                const outcomes = generateOutcomes(effective);
                if (outcomes.length === 0) return null;
                return (
                  <div
                    className="rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3 space-y-1.5"
                    data-testid="policy-outcomes"
                  >
                    <p className="text-[10px] font-medium text-slate-400">
                      What this means
                    </p>
                    {outcomes.map((o, i) => (
                      <p key={i} className="text-[10px] text-slate-500 leading-relaxed">
                        {o}
                      </p>
                    ))}
                  </div>
                );
              })()}
            </section>

            {/* Policy Simulation — example outcomes */}
            {(() => {
              const scenarios = generateSimulationScenarios(effective);
              if (scenarios.length === 0) return null;
              return (
                <section
                  className="rounded-xl border border-white/10 bg-white/[0.02] p-6 space-y-4"
                  data-testid="policy-simulation"
                >
                  <div>
                    <h2 className="text-sm font-medium text-slate-200">
                      How Your Policy Behaves
                    </h2>
                    <p className="mt-1 text-[10px] text-slate-500">
                      Example scenarios showing how your current effective policy would respond.
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2" data-testid="simulation-scenarios">
                    {scenarios.map((scenario, idx) => (
                      <div
                        key={idx}
                        className={`rounded-lg border p-4 space-y-2 ${
                          scenario.outcome === "Allowed"
                            ? "border-emerald-500/20 bg-emerald-500/5"
                            : "border-red-500/20 bg-red-500/5"
                        }`}
                        data-testid={`scenario-card-${idx}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-200">
                            {scenario.title}
                          </span>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold leading-none ${
                              scenario.outcome === "Allowed"
                                ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20"
                                : "bg-red-500/15 text-red-300 border border-red-500/20"
                            }`}
                            data-testid="scenario-outcome"
                          >
                            {scenario.outcome}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400">
                          {scenario.description}
                        </p>
                        <p className="text-[10px] text-slate-500 leading-relaxed">
                          {scenario.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                  <p className="text-[9px] text-slate-600 text-center">
                    These examples reflect your current effective policy. They are not live transactions.
                  </p>
                </section>
              );
            })()}

            {/* Policy Recommendations */}
            {(() => {
              const deterministicRecs = generatePolicyRecommendations(effective, overrides, overridesEnabled);
              const historyRecs = historySummary
                ? generateHistoryRecommendations(historySummary, effective)
                : [];
              const marketRecs = marketConditions
                ? generateMarketRecommendations(marketConditions, effective)
                : [];
              // Merge, deduplicate by id, sort by priority
              const seenIds = new Set<string>();
              const allRecs: PolicyRecommendation[] = [];
              for (const rec of [...deterministicRecs, ...historyRecs, ...marketRecs]) {
                if (!seenIds.has(rec.id)) {
                  seenIds.add(rec.id);
                  allRecs.push(rec);
                }
              }
              const order: Record<RecommendationPriority, number> = { high: 0, medium: 1, low: 2 };
              allRecs.sort((a, b) => order[a.priority] - order[b.priority]);

              if (allRecs.length === 0) return null;

              const hasHistoryRecs = historyRecs.length > 0;
              const hasMarketRecs = marketRecs.length > 0;
              return (
                <section
                  className="rounded-xl border border-primary-400/20 bg-primary-500/5 p-6 space-y-4"
                  data-testid="policy-recommendations"
                >
                  <div>
                    <h2 className="text-sm font-medium text-slate-200">
                      Policy Recommendations
                    </h2>
                    <p className="mt-1 text-[10px] text-slate-500">
                      Suggestions to strengthen your policy based on your current configuration
                      {hasHistoryRecs ? " and your recent transaction history" : ""}
                      {hasMarketRecs ? " and current execution conditions" : ""}.
                    </p>
                  </div>
                  <div className="space-y-3" data-testid="recommendation-cards">
                    {allRecs.map((rec) => {
                      const styles = PRIORITY_STYLES[rec.priority];
                      return (
                        <div
                          key={rec.id}
                          className={`rounded-lg border ${styles.border} bg-white/[0.02] p-4 space-y-2`}
                          data-testid={`recommendation-${rec.id}`}
                        >
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="text-xs font-semibold text-slate-200">
                              {rec.title}
                            </span>
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold leading-none ${styles.badge}`}
                                data-testid="recommendation-priority"
                              >
                                {rec.priority === "high" ? "High priority" : rec.priority === "medium" ? "Medium" : "Suggestion"}
                              </span>
                              <span
                                className="inline-flex items-center rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] font-medium leading-none text-slate-500"
                                data-testid="recommendation-source"
                              >
                                {rec.source}
                              </span>
                            </div>
                          </div>
                          <p className="text-[10px] text-slate-400 leading-relaxed">
                            {rec.explanation}
                          </p>
                          <p className="text-[10px] text-slate-500 leading-relaxed">
                            <span className="font-medium text-slate-400">Why it matters:</span>{" "}
                            {rec.why}
                          </p>
                          {rec.evidence && (
                            <p className="text-[9px] text-slate-600 leading-relaxed italic">
                              {rec.evidence}
                            </p>
                          )}
                          {overridesEnabled && rec.fieldKey && (
                            <button
                              type="button"
                              onClick={() => enterEditMode(rec.fieldKey)}
                              className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-medium text-slate-400 transition hover:bg-white/10 hover:text-slate-200"
                              data-testid={`recommendation-action-${rec.id}`}
                            >
                              View setting &rarr;
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[9px] text-slate-600 text-center">
                    These recommendations are advisory. They are derived from your current policy configuration{hasHistoryRecs ? ", your own recent transaction history" : ""}{hasMarketRecs ? ", and current execution infrastructure conditions" : hasHistoryRecs ? "" : ""}{!hasHistoryRecs && !hasMarketRecs ? ". They do not use live market data or cross-customer analysis" : ""}.
                  </p>
                </section>
              );
            })()}

            {/* Detailed effective policy grid */}
            <section className="rounded-xl border border-white/10 bg-white/[0.02] p-6 space-y-5">
              <h2 className="text-sm font-medium text-slate-300">
                Effective Policy
              </h2>
              <p className="text-[10px] text-slate-500">
                These are the merged values that the firewall enforces on every
                transaction. Plan defaults are combined with any custom overrides.
              </p>
              {renderEffectiveSection("Transaction Limits", limitKeys, effective, overrides)}
              {renderEffectiveSection("Execution Safety", protectionKeys, effective, overrides)}
              {renderEffectiveSection("Token Controls", tokenKeys, effective, overrides)}
              {renderEffectiveSection("Program Controls", programKeys, effective, overrides)}

              {/* Catch-all for any extra effective keys */}
              {(() => {
                const known = new Set([...limitKeys, ...tokenKeys, ...protectionKeys, ...programKeys]);
                const extra = Object.keys(effective).filter((k) => !known.has(k));
                return extra.length > 0
                  ? renderEffectiveSection("Other", extra, effective, overrides)
                  : null;
              })()}
            </section>
          </>
        )}

        {/* Overrides — editable or read-only */}
        {overridesEnabled ? (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-medium text-slate-200">
                  {editing ? "Configure Overrides" : "Custom Overrides"}
                </h2>
                <p className="mt-1 text-[10px] text-slate-500">
                  {editing
                    ? "Clear a field to revert to plan default. Changes are not saved until you confirm."
                    : hasOverrides
                      ? "These values override your plan defaults."
                      : "No custom overrides set."}
                </p>
              </div>
              {!editing && (
                <button
                  onClick={() => enterEditMode()}
                  className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-medium text-amber-200 transition hover:bg-amber-500/20"
                >
                  Edit Overrides
                </button>
              )}
            </div>

            {editing ? (
              <>
                {/* Grouped field sections */}
                {FIELD_GROUPS.map((group) => {
                  // Special rendering for the token policy section
                  if (group.id === "tokens") {
                    const activeMode = TOKEN_MODES.find((m) => m.id === tokenPolicy.mode)!;
                    const activeMintList =
                      tokenPolicy.mode === "allowlist"
                        ? tokenPolicy.allowed_mints
                        : tokenPolicy.mode === "denylist"
                          ? tokenPolicy.denied_mints
                          : [];
                    const showMintEditor = tokenPolicy.mode !== "unrestricted";
                    const mintListLabel =
                      tokenPolicy.mode === "allowlist" ? "Allowed Mints" : "Blocked Mints";

                    return (
                      <div
                        key={group.id}
                        className="rounded-xl border border-white/10 bg-white/[0.02] p-5 space-y-4 transition-shadow duration-300"
                        data-field-key="token_policy"
                      >
                        <div>
                          <h3 className="text-xs font-semibold text-slate-200">
                            {group.title}
                          </h3>
                          <p className="mt-0.5 text-[10px] text-slate-500">
                            {group.description}
                          </p>
                        </div>

                        {/* Mode selector */}
                        <div className="space-y-3">
                          <p className="text-[10px] text-slate-500">
                            Choose how token access is controlled:
                          </p>
                          <div className="grid gap-2 sm:grid-cols-3">
                            {TOKEN_MODES.map((mode) => (
                              <button
                                key={mode.id}
                                type="button"
                                onClick={() => setTokenPolicyMode(mode.id)}
                                disabled={saving}
                                className={`rounded-lg border p-3 text-left transition disabled:opacity-50 ${
                                  tokenPolicy.mode === mode.id
                                    ? "border-amber-400/50 bg-amber-500/10 shadow-sm shadow-amber-500/10"
                                    : "border-white/10 bg-white/[0.02] hover:bg-white/5"
                                }`}
                                data-testid={`token-mode-${mode.id}`}
                              >
                                <div className="flex items-center justify-between">
                                  <span
                                    className={`text-xs font-semibold ${
                                      tokenPolicy.mode === mode.id
                                        ? "text-amber-200"
                                        : "text-slate-300"
                                    }`}
                                  >
                                    {mode.label}
                                  </span>
                                  <span className={`text-[10px] font-medium ${mode.strictnessColor}`}>
                                    {mode.strictness}
                                  </span>
                                </div>
                                <p className="mt-1 text-[10px] text-slate-500 leading-relaxed">
                                  {mode.tagline}
                                </p>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Mode explanation */}
                        <div className="rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3">
                          <p className="text-[10px] text-slate-400 leading-relaxed">
                            {activeMode.detail}
                          </p>
                        </div>

                        {/* Mint list editor */}
                        {showMintEditor && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-medium text-slate-300">
                                {mintListLabel}
                              </label>
                              <span className="text-[10px] text-slate-500">
                                {activeMintList.length} / 50
                              </span>
                            </div>

                            {/* Existing mints as chips */}
                            <div className="flex flex-wrap gap-2">
                              {activeMintList.length === 0 && (
                                <p className="text-[10px] text-slate-500 italic">
                                  {activeMode.emptyNote}
                                </p>
                              )}
                              {activeMintList.map((mint, idx) => {
                                const display = resolveMintDisplay(mint);
                                return (
                                  <span
                                    key={idx}
                                    className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-mono ${
                                      display.isKnown
                                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                                        : "border-amber-500/20 bg-amber-500/10 text-amber-200"
                                    }`}
                                    title={mint}
                                  >
                                    {display.symbol}
                                    <button
                                      type="button"
                                      onClick={() => removeTokenMint(idx)}
                                      disabled={saving}
                                      className="ml-1 text-current opacity-60 hover:opacity-100 hover:text-red-400 disabled:opacity-30"
                                      aria-label={`Remove ${display.symbol}`}
                                    >
                                      &times;
                                    </button>
                                  </span>
                                );
                              })}
                            </div>

                            {/* Quick-add well-known tokens */}
                            <div className="space-y-1.5">
                              <p className="text-[10px] text-slate-500">
                                Quick add popular tokens:
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {WELL_KNOWN_MINTS.filter(
                                  (m) => !activeMintList.includes(m.symbol) && !activeMintList.includes(m.address),
                                ).map((m) => (
                                  <button
                                    key={m.symbol}
                                    type="button"
                                    onClick={() => addTokenMint(m.symbol)}
                                    disabled={saving || activeMintList.length >= 50}
                                    className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] text-slate-400 transition hover:bg-white/10 hover:text-slate-200 disabled:opacity-30"
                                    title={`${m.name} (${m.address})`}
                                  >
                                    + {m.symbol}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Custom mint input */}
                            <div className="flex gap-2">
                              <input
                                id="token-mint-input"
                                type="text"
                                placeholder="Token symbol or mint address"
                                value={tokenMintInput}
                                onChange={(e) => setTokenMintInput(e.target.value)}
                                disabled={saving}
                                className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 font-mono outline-none transition focus:border-amber-500/40 disabled:opacity-50"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    addTokenMint(tokenMintInput);
                                  }
                                }}
                              />
                              <button
                                type="button"
                                disabled={saving || !tokenMintInput.trim()}
                                onClick={() => addTokenMint(tokenMintInput)}
                                className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-200 transition hover:bg-amber-500/20 disabled:opacity-50"
                                data-testid="token-mint-add-btn"
                              >
                                Add
                              </button>
                            </div>

                            <p className="text-[10px] text-slate-500">
                              Enter well-known symbols (SOL, USDC) or full mint addresses.
                              The backend resolves symbols to on-chain addresses.
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  }

                  const groupFields = EDITABLE_FIELDS.filter(
                    (f) => f.group === group.id,
                  );
                  if (groupFields.length === 0) return null;
                  const groupFieldKeys = groupFields.map((f) => f.key);
                  return (
                    <div
                      key={group.id}
                      className="rounded-xl border border-white/10 bg-white/[0.02] p-5 space-y-4 transition-shadow duration-300"
                      {...(groupFieldKeys.length === 1 ? { "data-field-key": groupFieldKeys[0] } : {})}
                    >
                      <div>
                        <h3 className="text-xs font-semibold text-slate-200">
                          {group.title}
                        </h3>
                        <p className="mt-0.5 text-[10px] text-slate-500">
                          {group.description}
                        </p>
                      </div>
                      <div className="space-y-5">
                        {groupFields.map((field) => {
                          const guide =
                            field.type === "number"
                              ? rangeGuidance(field.key, formValues[field.key] ?? "")
                              : null;
                          const isDefault =
                            field.type === "list"
                              ? (listValues[field.key] ?? []).length === 0
                              : (formValues[field.key] ?? "") === "";
                          return (
                            <div key={field.key} className="space-y-1.5" data-field-key={field.key}>
                              <div className="flex items-center justify-between">
                                <label
                                  htmlFor={`override-${field.key}`}
                                  className="block text-xs font-medium text-slate-300"
                                >
                                  {field.label}
                                </label>
                                <div className="flex items-center gap-2">
                                  {guide && (
                                    <span
                                      className={`text-[10px] font-medium ${guide.color}`}
                                    >
                                      {guide.label}
                                    </span>
                                  )}
                                  {isDefault && (
                                    <span className="text-[10px] text-slate-600">
                                      Plan default
                                    </span>
                                  )}
                                </div>
                              </div>
                              {field.type === "boolean" ? (
                                <select
                                  id={`override-${field.key}`}
                                  value={formValues[field.key] ?? ""}
                                  onChange={(e) =>
                                    updateField(field.key, e.target.value)
                                  }
                                  disabled={saving}
                                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 outline-none transition focus:border-amber-500/40 disabled:opacity-50"
                                >
                                  <option value="">Plan default</option>
                                  <option value="true">Yes</option>
                                  <option value="false">No</option>
                                </select>
                              ) : field.type === "list" ? (
                                <div className="space-y-2">
                                  <div className="flex flex-wrap gap-2">
                                    {(listValues[field.key] ?? []).length ===
                                      0 && (
                                      <span className="text-[10px] text-slate-500 italic">
                                        No entries — add program IDs below.
                                      </span>
                                    )}
                                    {(listValues[field.key] ?? []).map(
                                      (item, idx) => (
                                        <span
                                          key={idx}
                                          className="inline-flex items-center gap-1 rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-xs text-amber-200 font-mono"
                                        >
                                          {item}
                                          <button
                                            type="button"
                                            onClick={() =>
                                              removeListItem(field.key, idx)
                                            }
                                            disabled={saving}
                                            className="ml-1 text-amber-400 hover:text-red-400 disabled:opacity-50"
                                            aria-label={`Remove ${item}`}
                                          >
                                            &times;
                                          </button>
                                        </span>
                                      ),
                                    )}
                                  </div>
                                  <div className="flex gap-2">
                                    <input
                                      id={`override-${field.key}`}
                                      ref={(el) => {
                                        if (el)
                                          listInputRefs.current.set(
                                            field.key,
                                            el,
                                          );
                                        else
                                          listInputRefs.current.delete(
                                            field.key,
                                          );
                                      }}
                                      type="text"
                                      placeholder={field.placeholder}
                                      disabled={saving}
                                      className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 font-mono outline-none transition focus:border-amber-500/40 disabled:opacity-50"
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          e.preventDefault();
                                          addListItem(
                                            field.key,
                                            (e.target as HTMLInputElement)
                                              .value,
                                          );
                                          (
                                            e.target as HTMLInputElement
                                          ).value = "";
                                        }
                                      }}
                                    />
                                    <button
                                      type="button"
                                      disabled={saving}
                                      onClick={() => {
                                        const input =
                                          listInputRefs.current.get(field.key);
                                        if (input) {
                                          addListItem(field.key, input.value);
                                          input.value = "";
                                        }
                                      }}
                                      className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-200 transition hover:bg-amber-500/20 disabled:opacity-50"
                                    >
                                      Add
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <PremiumSlider
                                  id={`override-${field.key}`}
                                  min={"min" in field ? field.min : 0}
                                  max={"max" in field ? field.max : 100}
                                  placeholder={
                                    "placeholder" in field
                                      ? field.placeholder
                                      : undefined
                                  }
                                  value={formValues[field.key] ?? ""}
                                  onChange={(v) =>
                                    updateField(field.key, v)
                                  }
                                  disabled={saving}
                                  formatDisplay={NUMERIC_FORMAT[field.key]}
                                />
                              )}
                              <div className="flex items-center justify-between">
                                <p className="text-[10px] text-slate-500">
                                  {field.hint}
                                </p>
                                {"guidance" in field && field.guidance && (
                                  <p className="text-[10px] text-slate-600 shrink-0 ml-4">
                                    {field.guidance}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Save error */}
                {saveError && (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
                    <p className="text-xs text-red-300">{saveError}</p>
                  </div>
                )}

                {/* Sticky save bar */}
                <div className="sticky bottom-4 z-10 rounded-xl border border-white/10 bg-neutral-900/95 backdrop-blur px-5 py-3 flex items-center justify-between shadow-lg shadow-black/30">
                  <div className="flex items-center gap-2">
                    {hasChanges && (
                      <span className="inline-block h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                    )}
                    <span className="text-[10px] text-slate-500">
                      {hasChanges ? "Unsaved changes" : "No changes"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={cancelEdit}
                      disabled={saving}
                      className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/10 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="rounded-lg bg-amber-600 px-5 py-2 text-xs font-semibold text-white transition hover:bg-amber-500 disabled:opacity-50"
                    >
                      {saving ? "Saving…" : "Save Overrides"}
                    </button>
                  </div>
                </div>
              </>
            ) : hasOverrides ? (
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
                <div className="divide-y divide-white/5">
                  {Object.entries(overrides).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between py-2.5"
                    >
                      <span className="text-xs text-amber-200/80">
                        {EFFECTIVE_LABELS[key] ?? key}
                      </span>
                      <span className="text-xs text-amber-200 font-medium">
                        {renderValue(key, value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                No custom overrides set. Click Edit Overrides to customize your
                policy.
              </p>
            )}
          </section>
        ) : (
          /* Read-only overrides for non-entitled plans */
          hasOverrides && (
            <section className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-6 space-y-3">
              <h2 className="text-sm font-medium text-amber-300">
                Custom Overrides
              </h2>
              <p className="text-[10px] text-slate-500">
                These values override your plan defaults. Contact your account
                owner to modify.
              </p>
              <div className="divide-y divide-white/5">
                {Object.entries(overrides).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between py-2">
                    <span className="text-xs text-amber-200/80 font-mono">
                      {key}
                    </span>
                    <span className="text-xs text-amber-200 font-medium">
                      {renderValue(key, value)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )
        )}

        {/* Info footer */}
        {!overridesEnabled && (
          <p className="text-[10px] text-slate-500 text-center">
            Policy customization is available on Pro plans and above.{" "}
            <Link
              href="/customer/dashboard"
              className="text-primary-400 hover:text-primary-300 transition"
            >
              Manage your plan &rarr;
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}
