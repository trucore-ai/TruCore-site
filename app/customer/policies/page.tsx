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
  fetchPilRecommendations,
  fetchCohortBenchmarks,
  fetchExternalContext,
  type EffectivePolicyResponse,
  type ReceiptSummary,
  type MarketConditions,
  type PilRecommendationsResponse,
  type CohortBenchmarkResponse,
  type ExternalContextResponse,
  type SignalFreshness,
} from "@/lib/customer-auth";
import { PremiumSlider } from "@/components/premium-slider";
import {
  trackRecommendationImpression,
  trackRecommendationExpand,
  trackRecommendationCollapse,
  trackRecommendationViewSetting,
  trackSignalRefreshClick,
  trackSignalRefreshComplete,
  trackUpgradeTeaserView,
  trackUpgradeTeaserClick,
  resetImpressionTracking,
  trackRecommendationApplyClick,
  trackRecommendationApplySuccess,
  trackRecommendationApplyError,
  trackRecommendationUndoClick,
  trackRecommendationUndoSuccess,
  trackRecommendationUndoError,
} from "@/lib/client/policy-recommendation-analytics";
import {
  deriveReceiptTrendSignals,
  getMarketConditionCue,
  loadRecSnapshot,
  saveRecSnapshot,
  loadRecHistoryEntry,
  saveRecHistoryEntry,
  classifyRecChanges,
  TREND_STATUS_DOT,
  TREND_STATUS_TEXT,
  type RecHistoryEntry,
} from "@/lib/customer-policy-trend";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatLimit(v: number): string {
  if (v < 0) return "Unlimited";
  return v.toLocaleString();
}

/** Returns a user-facing tooltip for the Undo button describing what will be restored. */
function undoTitle(mutationKey: string): string {
  const titles: Record<string, string> = {
    require_simulation_success: "Undo will restore your previous simulation requirement setting.",
    max_slippage_bps: "Undo will restore your previous slippage cap.",
    max_notional_usd: "Undo will restore your previous USD transaction limit.",
  };
  return titles[mutationKey] ?? "Undo will restore the previous setting.";
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
  /**
   * When true, this recommendation supports a direct one-click apply flow.
   * Only set for recommendations that map to a single, safe, reversible
   * policy mutation.  All others remain manual-only via "View setting".
   */
  applyable?: boolean;
  /**
   * Human-readable plain-English description of exactly what will change
   * when the user confirms the apply.  Shown inline before confirmation.
   * Required when applyable is true.
   */
  applyConfirmText?: string;
  /**
   * The single override mutation performed by the apply flow.
   * key: the policy override field name (e.g. "require_simulation_success")
   * value: the exact value to write (e.g. true)
   * Required when applyable is true.
   */
  applyMutation?: { key: string; value: unknown };
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
      applyable: true,
      applyConfirmText:
        "This will turn on simulation requirement. Transactions must pass simulation before executing.",
      applyMutation: { key: "require_simulation_success", value: true },
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
    // Applyable only when we have peak data AND policy is strictly more than 2× the peak.
    // Target = 2× highest historical transaction, floored at $1,000.
    // The 2× condition guarantees target < policyMaxUsd (always tighter than current).
    const limitApplyable =
      summary.max_notional_usd !== null && policyMaxUsd > summary.max_notional_usd * 2;
    const targetUsd = limitApplyable
      ? Math.max(1000, Math.round(summary.max_notional_usd! * 2))
      : null;
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
      ...(limitApplyable && targetUsd !== null
        ? {
            applyable: true,
            applyConfirmText:
              `This will lower your USD transaction limit from $${policyMaxUsd.toLocaleString()} to $${targetUsd.toLocaleString()} ` +
              `(2\u00d7 your highest recent transaction of ${maxStr}).`,
            applyMutation: { key: "max_notional_usd", value: targetUsd },
          }
        : {}),
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
    // Conservative deterministic target: 2× actual average, floored at 50 bps.
    // Always tighter than current cap because the trigger requires cap > avg * 3.
    const targetBps = Math.max(50, Math.round(summary.avg_slippage_bps * 2));
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
      applyable: true,
      applyConfirmText:
        `This will lower your slippage cap from ${policySlippage} bps to ${targetBps} bps ` +
        `(2× your recent average of ${avgBps} bps).`,
      applyMutation: { key: "max_slippage_bps", value: targetBps },
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
      applyable: true,
      applyConfirmText:
        "This will turn on simulation requirement, blocking transactions that fail pre-execution checks.",
      applyMutation: { key: "require_simulation_success", value: true },
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
// Signal freshness badge
// ---------------------------------------------------------------------------

const FRESHNESS_STYLES: Record<string, { text: string; dot: string; label: string }> = {
  fresh: { text: "text-emerald-400", dot: "bg-emerald-400", label: "Live" },
  stale: { text: "text-amber-400", dot: "bg-amber-400", label: "Data may be outdated" },
  unavailable: { text: "text-slate-500", dot: "bg-slate-500", label: "Signal unavailable" },
};

function SignalFreshnessBadge({ freshness, source }: { freshness: SignalFreshness | undefined; source: string }) {
  if (!freshness) return null;
  const style = FRESHNESS_STYLES[freshness.status] ?? FRESHNESS_STYLES.unavailable;
  return (
    <span
      className={`inline-flex items-center gap-1 text-[9px] ${style.text}`}
      data-testid={`freshness-badge-${source.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
}

/** Render a human-friendly relative timestamp from a unix-epoch seconds value. */
function formatLastUpdated(epochSeconds: number | null | undefined): string | null {
  if (epochSeconds == null) return null;
  const diffSec = Math.floor(Date.now() / 1000) - epochSeconds;
  if (diffSec < 60) return "just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
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
      applyable: true,
      applyConfirmText:
        "This will turn on simulation requirement. Transactions that fail simulation will be blocked before executing.",
      applyMutation: { key: "require_simulation_success", value: true },
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
      applyable: true,
      applyConfirmText:
        "This will turn on simulation requirement. Only transactions that pass simulation will be submitted.",
      applyMutation: { key: "require_simulation_success", value: true },
    });
  }

  return recs;
}

// ---------------------------------------------------------------------------
// Policy Intelligence–backed recommendations
// ---------------------------------------------------------------------------

const PIL_CONFIDENCE_MAP: Record<string, number> = {
  low: 0.3,
  medium: 0.6,
  high: 0.9,
};

const PIL_PRIORITY_MAP: Record<string, RecommendationPriority> = {
  high: "high",
  medium: "medium",
  low: "low",
};

const PIL_WHY: Record<string, string> = {
  REDUCE_SLIPPAGE:
    "Consistently high slippage wastes value on every trade. Tightening the tolerance protects execution quality.",
  SLIPPAGE_HEADROOM:
    "Your slippage tolerance is much higher than what your transactions actually need. Tightening it reduces worst-case exposure.",
  RELAX_LIMIT:
    "Repeated near-boundary denials suggest your limits are slightly too tight for your actual usage pattern.",
  HIGH_FRICTION:
    "A high denial rate means your policy may be blocking legitimate transactions. Review which rules are triggering.",
  TIGHTEN_RISK:
    "Elevated blocked risk events suggest your policy could benefit from tighter value or token restrictions.",
  REVIEW_LATENCY:
    "Unstable execution latency can indicate infrastructure issues or overly aggressive timeout settings.",
  CONFIRMATION_BOTTLENECK:
    "Slow confirmations may indicate network congestion. This is informational — not a policy change.",
  HEALTHY_CONFIRMATION:
    "Confirmation latency is within normal bounds. No action needed.",
  IMPROVE_EXECUTION:
    "A gap between approved and executed transactions suggests post-approval failures worth investigating.",
  SPARSE_DATA:
    "With limited transaction history, recommendations have lower confidence. Continue transacting to improve signal quality.",
  COLLECT_MORE_DATA:
    "More transaction data will improve the accuracy of future intelligence-backed recommendations.",
  GENERAL_HEALTH:
    "Overall system health is acceptable. Continue monitoring for changes.",
  MAINTAIN_PARAMETERS:
    "Your current configuration is performing well. No changes recommended at this time.",
};

function generatePilRecommendations(
  pil: PilRecommendationsResponse,
): PolicyRecommendation[] {
  if (!pil.recommendations || pil.recommendations.length === 0) return [];

  return pil.recommendations.map((rec) => {
    const editableKeys = new Set([
      "max_slippage_bps",
      "max_notional_usd",
      "max_value_sol",
      "require_simulation_success",
      "allowed_programs",
      "denied_programs",
    ]);
    const fieldKey = editableKeys.has(rec.parameter) ? rec.parameter : undefined;

    return {
      id: `pil-${rec.id.toLowerCase().replace(/_/g, "-")}`,
      title: rec.title,
      explanation: rec.explanation,
      why: PIL_WHY[rec.id] ?? "",
      priority: PIL_PRIORITY_MAP[rec.confidence] ?? "low",
      source: "Policy Intelligence" as RecommendationSource,
      fieldKey,
      evidence: rec.evidence || undefined,
      confidence: PIL_CONFIDENCE_MAP[rec.confidence] ?? 0.3,
    };
  });
}

// ---------------------------------------------------------------------------
// Cohort benchmark → PolicyRecommendation mapping
// ---------------------------------------------------------------------------

const BENCHMARK_PRIORITY_MAP: Record<string, RecommendationPriority> = {
  high: "high",
  medium: "medium",
  low: "low",
};

const BENCHMARK_CONFIDENCE_MAP: Record<string, number> = {
  high: 0.8,
  medium: 0.5,
  low: 0.3,
};

function generateCohortBenchmarkRecommendations(
  benchmarks: CohortBenchmarkResponse,
): PolicyRecommendation[] {
  if (!benchmarks.benchmarks || benchmarks.benchmarks.length === 0) return [];

  const editableKeys = new Set([
    "max_slippage_bps",
    "max_notional_usd",
    "require_simulation_success",
  ]);

  return benchmarks.benchmarks.map((b) => ({
    id: `bench-${b.id.toLowerCase().replace(/_/g, "-")}`,
    title: b.title,
    explanation: b.explanation,
    why: "This observation is derived from anonymized, aggregated data across similar configurations — no individual tenant data is used.",
    priority: BENCHMARK_PRIORITY_MAP[b.confidence] ?? "low",
    source: "Cohort benchmark" as RecommendationSource,
    fieldKey: editableKeys.has(b.parameter) ? b.parameter : undefined,
    evidence: b.evidence || undefined,
    confidence: BENCHMARK_CONFIDENCE_MAP[b.confidence] ?? 0.3,
  }));
}

// ---------------------------------------------------------------------------
// External context recommendation generation
// ---------------------------------------------------------------------------

const EXTERNAL_CONFIDENCE_MAP: Record<string, number> = {
  high: 0.85,
  medium: 0.55,
  low: 0.3,
};

const EXTERNAL_PRIORITY_MAP: Record<string, RecommendationPriority> = {
  high: "high",
  medium: "medium",
  low: "low",
};

function generateExternalContextRecommendations(
  ctx: ExternalContextResponse,
): PolicyRecommendation[] {
  if (!ctx.recommendations || ctx.recommendations.length === 0) return [];

  const editableKeys = new Set([
    "max_slippage_bps",
    "max_notional_usd",
    "max_value_sol",
    "require_simulation_success",
  ]);

  return ctx.recommendations.map((r) => ({
    id: `ext-${r.id.toLowerCase().replace(/_/g, "-")}`,
    title: r.title,
    explanation: r.explanation,
    why: "This recommendation is based on real-time external infrastructure conditions — not your individual transactions or policy configuration.",
    priority: EXTERNAL_PRIORITY_MAP[r.confidence] ?? "medium",
    source: "External context" as RecommendationSource,
    fieldKey: editableKeys.has(r.parameter) ? r.parameter : undefined,
    evidence: r.evidence || undefined,
    confidence: EXTERNAL_CONFIDENCE_MAP[r.confidence] ?? 0.3,
  }));
}

// ---------------------------------------------------------------------------
// Recommendation tier configuration
// ---------------------------------------------------------------------------

/**
 * Tier rank — higher value = more recommendation access.
 * Unknown tiers default to 0 (Free).
 */
const TIER_RANKS: Record<string, number> = {
  free: 0,
  pro: 1,
  advanced: 2,
  enterprise: 3,
};

/**
 * Minimum tier rank required for each recommendation source.
 * Deterministic sources (Default guidance / Policy analysis) are available to all.
 * Richer intelligence sources require Pro or above.
 */
const SOURCE_MIN_TIER: Record<RecommendationSource, number> = {
  "Default guidance": TIER_RANKS.free,
  "Policy analysis": TIER_RANKS.free,
  "Customer history": TIER_RANKS.pro,
  "Market analysis": TIER_RANKS.pro,
  "Policy Intelligence": TIER_RANKS.pro,
  "Cohort benchmark": TIER_RANKS.advanced,
  "External context": TIER_RANKS.enterprise,
};

function planRank(plan: string): number {
  return TIER_RANKS[plan] ?? 0;
}

function isSourceAvailable(source: RecommendationSource, plan: string): boolean {
  return planRank(plan) >= (SOURCE_MIN_TIER[source] ?? 0);
}

/** User-facing label describing what a gated source provides. */
const SOURCE_DESCRIPTIONS: Partial<Record<RecommendationSource, string>> = {
  "Customer history": "recommendations based on your transaction patterns",
  "Market analysis": "recommendations informed by recent execution conditions",
  "Policy Intelligence": "higher-confidence intelligence-backed suggestions",
  "Cohort benchmark": "comparison to similar aggregated policy patterns",
  "External context": "broader context signals for enterprise-grade policy decisions",
};

/** Short, value-focused headline for a single dominant gated source. */
const SOURCE_TEASER_HEADLINES: Partial<Record<RecommendationSource, string>> = {
  "Customer history": "Unlock recommendations tailored to your history",
  "Market analysis": "Unlock market-aware policy recommendations",
  "Policy Intelligence": "Unlock intelligence-backed policy suggestions",
  "Cohort benchmark": "Unlock peer-comparison benchmarks",
  "External context": "Unlock enterprise-grade external signals",
};

/**
 * Rank gated sources by conversion-weighted value so the most compelling
 * and accessible missing signal dominates the teaser headline and CTA.
 * Higher number = appears first as dominant source.
 *
 * Analytics-informed ordering (teaser-performance panel insight):
 *   Policy Intelligence ranks highest — it is based on the user's own
 *   transaction patterns, is the most universally compelling signal, and
 *   requires only a Pro upgrade (lowest barrier to conversion).
 *   Customer history ranks 3 — personalised signals consistently outperform
 *   generic market-condition signals for conversion: a "your history shows X"
 *   teaser is more compelling than an abstract "market conditions suggest Y"
 *   teaser, and Customer history is also Pro-accessible.
 *   Cohort benchmark and External context share rank 4 — both are high-value
 *   but gated at Advanced/Enterprise tier (higher friction); they don't
 *   overtake Policy Intelligence or Customer history.
 *   Market analysis stays at 2 — useful but abstract and impersonal.
 */
const SOURCE_VALUE_RANK: Partial<Record<RecommendationSource, number>> = {
  "Market analysis": 2,
  "Customer history": 3,
  "Cohort benchmark": 4,
  "External context": 4,
  "Policy Intelligence": 5,
};

/** Return gated sources sorted by descending monetisation value. */
function sortGatedByValue(sources: RecommendationSource[]): RecommendationSource[] {
  return [...sources].sort(
    (a, b) => (SOURCE_VALUE_RANK[b] ?? 0) - (SOURCE_VALUE_RANK[a] ?? 0),
  );
}

/** Tier-specific CTA label — more specific than generic "View plans". */
function teaserCtaLabel(tierLabel: string, dominantSource: RecommendationSource | null): string {
  if (dominantSource === "Policy Intelligence") return `Explore ${tierLabel} for deeper intelligence`;
  if (dominantSource === "External context") return `Explore ${tierLabel} for enterprise signals`;
  if (dominantSource === "Cohort benchmark") return `Explore ${tierLabel} for peer benchmarks`;
  if (dominantSource === "Customer history") return `Explore ${tierLabel} for personalised insights`;
  if (dominantSource === "Market analysis") return `Explore ${tierLabel} for market signals`;
  return `Explore ${tierLabel} plans`;
}

/**
 * Mix-aware body lead text for the upgrade teaser.
 * Returns a short, readable phrase that describes what the user gains.
 *
 *  single  (1 source): specific source description
 *  few    (2–3 sources): lead with the dominant source description
 *  many   (4+ sources): emphasise breadth
 */
function teaserLeadText(
  gatedSources: RecommendationSource[],
  dominantSource: RecommendationSource | null,
): string {
  const n = gatedSources.length;
  if (n <= 0) return "additional intelligence";
  if (n === 1) {
    return (dominantSource && SOURCE_DESCRIPTIONS[dominantSource]) ?? (dominantSource ?? "additional intelligence");
  }
  if (n <= 3) {
    const desc = dominantSource && SOURCE_DESCRIPTIONS[dominantSource];
    return desc
      ? `${n} intelligence sources — led by ${desc}`
      : `${n} intelligence sources`;
  }
  return `the full intelligence suite (${n} sources)`;
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
// Source-specific detail framing for expandable recommendation details
// ---------------------------------------------------------------------------

function getSourceDetailFraming(rec: PolicyRecommendation): string | null {
  switch (rec.source) {
    case "Customer history":
      return "This recommendation is based on patterns observed in your recent transaction history.";
    case "Market analysis":
      return "This recommendation reflects current execution-environment conditions.";
    case "Policy Intelligence":
      return rec.confidence != null && rec.confidence >= 0.7
        ? "High-confidence intelligence signal based on analysis of your transaction patterns."
        : rec.confidence != null && rec.confidence >= 0.4
          ? "Moderate-confidence signal from policy intelligence analysis."
          : "Low-confidence signal — consider as directional guidance.";
    case "Cohort benchmark":
      return "Derived from anonymized, aggregated data across similar configurations.";
    case "External context":
      return "Informed by real-time external network and infrastructure signals.";
    default:
      return null;
  }
}

/** Whether a recommendation has enough extra detail to warrant a drill-down toggle. */
function hasExpandableDetail(rec: PolicyRecommendation): boolean {
  if (rec.why) return true;
  if (rec.evidence) return true;
  if (rec.confidence != null) return true;
  if (getSourceDetailFraming(rec)) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Recommendation display prioritization
// ---------------------------------------------------------------------------

/**
 * Source engagement tiers — informed by internal analytics patterns.
 *
 * Analytics insight: signal-backed sources (Policy Intelligence, Market
 * analysis, External context, Cohort benchmark) consistently drive higher
 * expand rates and "View setting" click rates than static sources (Default
 * guidance, Policy analysis).  Customer history sits in between — it is
 * personalised and drives moderate engagement.
 *
 * Tier 0 = highest observed engagement, Tier 2 = lowest.
 * These tiers are used as a stable sort tiebreaker, NOT as an opaque score.
 * Update the tiers when the analytics summary reveals meaningful shifts.
 */
const SOURCE_ENGAGEMENT_TIER: Record<RecommendationSource, number> = {
  "Policy Intelligence": 0,
  "External context":    0,
  "Market analysis":     0,
  "Cohort benchmark":    1,
  "Customer history":    1,
  "Policy analysis":     2,
  "Default guidance":    2,
};

/** Whether a source belongs to the signal-backed (high-engagement) tier. */
function isSignalBackedSource(source: RecommendationSource): boolean {
  return SOURCE_ENGAGEMENT_TIER[source] <= 1;
}

/**
 * Display section classification — determines which visual group a
 * recommendation appears in.
 *
 * "top"   → shown prominently at the top of the list (always visible)
 * "more"  → shown in a collapsed "More suggestions" section
 *
 * Classification rules (explainable, analytics-informed):
 *   1. High priority → always "top"
 *   2. Medium priority + actionable (has fieldKey) → "top"
 *   3. Medium priority + high-confidence (≥ 0.7) signal-backed source → "top"
 *      (analytics show these drive meaningful action despite lacking a
 *       direct fieldKey link)
 *   4. Everything else → "more"
 */
type DisplaySection = "top" | "more";

function classifyDisplaySection(rec: PolicyRecommendation): DisplaySection {
  if (rec.priority === "high") return "top";
  if (rec.priority === "medium" && rec.fieldKey) return "top";
  // Promote high-confidence signal-backed medium-priority recs
  if (
    rec.priority === "medium" &&
    rec.confidence != null &&
    rec.confidence >= 0.7 &&
    isSignalBackedSource(rec.source)
  ) {
    return "top";
  }
  return "more";
}

/**
 * Recommendation sort comparator — multi-dimensional, explainable ordering.
 *
 * Sort dimensions (in order of precedence):
 *   1. Priority:           high (0) → medium (1) → low (2)
 *   2. Actionability:      has fieldKey (0) → no fieldKey (1)
 *   3. Source engagement:  tier 0 (highest engagement) → tier 2 (lowest)
 *      (informed by internal analytics — see SOURCE_ENGAGEMENT_TIER)
 *   4. Source trust:       signal-backed with confidence (0) → other (1)
 *   5. Confidence:         higher first (descending), null last
 *
 * This comparator is shared by both the "top" and "more" sections.
 */
const PRIORITY_RANK: Record<RecommendationPriority, number> = { high: 0, medium: 1, low: 2 };

function compareRecommendations(a: PolicyRecommendation, b: PolicyRecommendation): number {
  // 1. Priority
  const pa = PRIORITY_RANK[a.priority];
  const pb = PRIORITY_RANK[b.priority];
  if (pa !== pb) return pa - pb;

  // 2. Actionability — actionable (has fieldKey) sorts first
  const aa = a.fieldKey ? 0 : 1;
  const ab = b.fieldKey ? 0 : 1;
  if (aa !== ab) return aa - ab;

  // 3. Source engagement tier (analytics-informed)
  const ea = SOURCE_ENGAGEMENT_TIER[a.source] ?? 2;
  const eb = SOURCE_ENGAGEMENT_TIER[b.source] ?? 2;
  if (ea !== eb) return ea - eb;

  // 4. Source trust — signal-backed with confidence sorts first
  const sa = a.confidence != null ? 0 : 1;
  const sb = b.confidence != null ? 0 : 1;
  if (sa !== sb) return sa - sb;

  // 5. Confidence descending (null treated as -1)
  const ca = a.confidence ?? -1;
  const cb = b.confidence ?? -1;
  if (ca !== cb) return cb - ca;

  return 0;
}

// ---------------------------------------------------------------------------
// Card emphasis model
// ---------------------------------------------------------------------------

/**
 * Card emphasis level — determines visual weight for a recommendation card.
 *
 * "featured"   → strongest treatment: first high-priority card that is
 *                actionable OR high-confidence signal-backed.
 *                Shows inline reason snippet, prominent CTA, "Recommended action" tag.
 * "emphasized" → standard top-section treatment with inline reason snippet
 *                for high-priority or high-confidence actionable cards.
 * "standard"   → compact treatment for lower-priority / More suggestions cards.
 *                Analytics-informed: high-confidence signal-backed cards in the
 *                "more" section now show inline reason to improve engagement
 *                with buried-but-valuable intelligence.
 */
type CardEmphasis = "featured" | "emphasized" | "standard";

interface CardDisplayMeta {
  emphasis: CardEmphasis;
  showInlineReason: boolean;
  showInlineConfidence: boolean;
}

function computeCardEmphasis(
  rec: PolicyRecommendation,
  section: DisplaySection,
  indexInSection: number,
): CardDisplayMeta {
  // More-suggestions section → standard, but show inline reason for
  // high-confidence signal-backed cards (analytics: these are valuable
  // but under-engaged when stripped down)
  if (section === "more") {
    const highConfSignal =
      rec.confidence != null &&
      rec.confidence >= 0.7 &&
      isSignalBackedSource(rec.source);
    return {
      emphasis: "standard",
      showInlineReason: highConfSignal,
      showInlineConfidence: rec.confidence != null && rec.confidence >= 0.5,
    };
  }

  // Featured: first card in top section that is high-priority AND either
  // actionable (has fieldKey) or high-confidence signal-backed.
  // Broadened from fieldKey-only based on analytics showing signal-backed
  // high-priority cards drive strong expand + action rates.
  if (
    indexInSection === 0 &&
    rec.priority === "high" &&
    (rec.fieldKey || (rec.confidence != null && rec.confidence >= 0.7 && isSignalBackedSource(rec.source)))
  ) {
    return {
      emphasis: "featured",
      showInlineReason: true,
      showInlineConfidence: rec.confidence != null,
    };
  }

  // Emphasized: top-section cards with inline reason when high-priority
  // or high-confidence + actionable
  const showReason =
    rec.priority === "high" ||
    (rec.fieldKey != null && rec.confidence != null && rec.confidence >= 0.7);

  return {
    emphasis: "emphasized",
    showInlineReason: showReason,
    showInlineConfidence: rec.confidence != null && rec.confidence >= 0.7,
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CustomerPoliciesPage() {
  const router = useRouter();
  const [policy, setPolicy] = useState<EffectivePolicyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [historySummary, setHistorySummary] = useState<ReceiptSummary | null>(null);
  // Short window (7-day) used alongside the 30-day baseline to derive trend signals.
  const [historySummaryShort, setHistorySummaryShort] = useState<ReceiptSummary | null>(null);
  const [marketConditions, setMarketConditions] = useState<MarketConditions | null>(null);
  const [pilRecommendations, setPilRecommendations] = useState<PilRecommendationsResponse | null>(null);
  const [cohortBenchmarks, setCohortBenchmarks] = useState<CohortBenchmarkResponse | null>(null);
  const [externalContext, setExternalContext] = useState<ExternalContextResponse | null>(null);
  const [refreshingSignals, setRefreshingSignals] = useState(false);
  const [signalRefreshCooldown, setSignalRefreshCooldown] = useState(false);
  const [expandedRecs, setExpandedRecs] = useState<Set<string>>(new Set());
  const [showMoreSuggestions, setShowMoreSuggestions] = useState(false);
  // Previous recommendation IDs loaded from localStorage — enables "New" badges.
  const [prevRecSnapshot, setPrevRecSnapshot] = useState<Set<string>>(new Set());
  // Previous recommendation entries (id + title + source) for the history panel.
  const [prevRecHistory, setPrevRecHistory] = useState<RecHistoryEntry[]>([]);
  // Ref to avoid saving the same snapshot multiple times per render cycle.
  const snapshotSavedRef = useRef<string>("");

  // ── Apply recommendation flow ──────────────────────────────────────────────
  // Which rec is showing its confirmation panel (before the user confirms).
  const [applyConfirmingRecId, setApplyConfirmingRecId] = useState<string | null>(null);
  // Which rec is actively being applied (API call in-flight).
  const [applyingRecId, setApplyingRecId] = useState<string | null>(null);
  // Per-rec result: "success" | "error" (cleared on cancel or re-apply).
  const [applyResults, setApplyResults] = useState<Record<string, "success" | "error">>({});
  // Prior override snapshot captured at apply time — enables safe undo.
  // Only populated for simulation-path recs where prior state is safely known.
  const [applyUndoStates, setApplyUndoStates] = useState<
    Record<string, { key: string; hadKey: boolean; prevValue: unknown }>
  >({});
  // Which rec has an undo API call in-flight.
  const [undoingRecId, setUndoingRecId] = useState<string | null>(null);
  // Per-rec undo error flag — set on undo failure, cleared on successful undo.
  const [undoErrors, setUndoErrors] = useState<Record<string, boolean>>({});

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

  // Fetch short-window receipt summary (7-day) for trend comparison (non-blocking).
  const loadHistorySummaryShort = useCallback(async () => {
    try {
      const summary = await fetchReceiptSummary(7);
      setHistorySummaryShort(summary);
    } catch {
      // Short-window summary is optional — degrade gracefully.
      setHistorySummaryShort(null);
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

  // Fetch PIL recommendations for Policy Intelligence source (non-blocking).
  const loadPilRecommendations = useCallback(async () => {
    try {
      const pil = await fetchPilRecommendations();
      setPilRecommendations(pil);
    } catch {
      // PIL is optional — degrade gracefully.
      setPilRecommendations(null);
    }
  }, []);

  const loadCohortBenchmarks = useCallback(async () => {
    try {
      const bench = await fetchCohortBenchmarks();
      setCohortBenchmarks(bench);
    } catch {
      // Benchmarks are optional — degrade gracefully.
      setCohortBenchmarks(null);
    }
  }, []);

  const loadExternalContext = useCallback(async () => {
    try {
      const ctx = await fetchExternalContext();
      setExternalContext(ctx);
    } catch {
      // External context is optional — degrade gracefully.
      setExternalContext(null);
    }
  }, []);

  // Targeted refresh for signal-backed sources only (market + external).
  const refreshSignals = useCallback(async () => {
    if (refreshingSignals || signalRefreshCooldown) return;
    const tier = policy?.plan_code ?? "free";
    trackSignalRefreshClick({ plan_tier: tier });
    setRefreshingSignals(true);
    try {
      const [mkt, ext] = await Promise.allSettled([
        fetchMarketConditions(),
        fetchExternalContext(),
      ]);
      const mktVal = mkt.status === "fulfilled" ? mkt.value : null;
      const extVal = ext.status === "fulfilled" ? ext.value : null;
      setMarketConditions(mktVal);
      setExternalContext(extVal);
      trackSignalRefreshComplete({
        plan_tier: tier,
        market_status: mktVal?.signal_freshness?.status,
        external_status: extVal?.signal_freshness?.status,
      });
    } finally {
      setRefreshingSignals(false);
      setSignalRefreshCooldown(true);
      setTimeout(() => setSignalRefreshCooldown(false), 10_000);
    }
  }, [refreshingSignals, signalRefreshCooldown, policy?.plan_code]);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
      return;
    }
    loadPolicy();
    loadHistorySummary();
    loadHistorySummaryShort();
    loadMarketConditions();
    loadPilRecommendations();
    loadCohortBenchmarks();
    loadExternalContext();
    // Load the previous recommendation snapshot for "New" badge detection.
    setPrevRecSnapshot(loadRecSnapshot());
    // Load the previous recommendation history for the "What changed" panel.
    setPrevRecHistory(loadRecHistoryEntry());
  }, [router, loadPolicy, loadHistorySummary, loadHistorySummaryShort, loadMarketConditions, loadPilRecommendations, loadCohortBenchmarks, loadExternalContext]);

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

  /**
   * Apply a single safe recommendation override directly, without entering
   * the full edit form.  Merges the mutation key into the current overrides
   * and calls updatePolicyOverrides.  On success, refreshes policy state.
   *
   * Only called for recommendations where applyable === true.
   */
  async function handleApplyRecommendation(rec: PolicyRecommendation) {
    if (!rec.applyMutation) return;
    const currentPlanCode = policy?.plan_code ?? "free";
    setApplyingRecId(rec.id);
    trackRecommendationApplyClick({
      recommendation_id: rec.id,
      recommendation_source: rec.source,
      recommendation_priority: rec.priority,
      plan_tier: currentPlanCode,
      mutation_key: rec.applyMutation.key,
    });
    // Capture prior override state before mutating — needed for safe undo.
    const priorOverrides = policy?.overrides ?? {};
    const undoKey = rec.applyMutation.key;
    const hadKey = Object.prototype.hasOwnProperty.call(priorOverrides, undoKey);
    const prevValue = priorOverrides[undoKey as keyof typeof priorOverrides];
    try {
      // Merge mutation into current overrides — preserves all existing overrides.
      const newOverrides: Record<string, unknown> = {
        ...(policy?.overrides ?? {}),
        [rec.applyMutation.key]: rec.applyMutation.value,
      };
      await updatePolicyOverrides(newOverrides);
      // Refresh policy so effective values update immediately.
      await loadPolicy();
      setApplyConfirmingRecId(null);
      setApplyResults((prev) => ({ ...prev, [rec.id]: "success" }));
      // Store prior state so undo can safely restore it.
      setApplyUndoStates((prev) => ({
        ...prev,
        [rec.id]: { key: undoKey, hadKey, prevValue },
      }));
      trackRecommendationApplySuccess({
        recommendation_id: rec.id,
        recommendation_source: rec.source,
        plan_tier: currentPlanCode,
        mutation_key: rec.applyMutation.key,
      });
    } catch {
      setApplyResults((prev) => ({ ...prev, [rec.id]: "error" }));
      trackRecommendationApplyError({
        recommendation_id: rec.id,
        recommendation_source: rec.source,
        plan_tier: currentPlanCode,
        mutation_key: rec.applyMutation.key,
      });
    } finally {
      setApplyingRecId(null);
    }
  }

  /**
   * Reverts a successfully-applied simulation recommendation by restoring the
   * prior override state captured at apply time.
   *
   * Undo behavior:
   *   - If the key existed before apply: restores the prior explicit value.
   *   - If the key was absent before apply: removes it from overrides entirely.
   * All unrelated override keys are preserved.
   */
  async function handleUndoRecommendation(recId: string) {
    const undoState = applyUndoStates[recId];
    if (!undoState) return;
    const currentPlanCode = policy?.plan_code ?? "free";
    setUndoingRecId(recId);
    trackRecommendationUndoClick({
      recommendation_id: recId,
      plan_tier: currentPlanCode,
      mutation_key: undoState.key,
    });
    try {
      const currentOverrides: Record<string, unknown> = { ...(policy?.overrides ?? {}) };
      let restoredOverrides: Record<string, unknown>;
      if (undoState.hadKey) {
        // Restore the override key to its prior explicit value.
        restoredOverrides = { ...currentOverrides, [undoState.key]: undoState.prevValue };
      } else {
        // The apply introduced this key — remove it entirely.
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [undoState.key as keyof typeof currentOverrides]: _removed, ...rest } =
          currentOverrides;
        restoredOverrides = rest;
      }
      await updatePolicyOverrides(restoredOverrides);
      await loadPolicy();
      // Clear apply result and undo state — the recommendation will naturally
      // reappear in the list if policy conditions still warrant it.
      setApplyResults((prev) => {
        const next = { ...prev };
        delete next[recId];
        return next;
      });
      setApplyUndoStates((prev) => {
        const next = { ...prev };
        delete next[recId];
        return next;
      });
      setUndoErrors((prev) => {
        const next = { ...prev };
        delete next[recId];
        return next;
      });
      trackRecommendationUndoSuccess({
        recommendation_id: recId,
        plan_tier: currentPlanCode,
        mutation_key: undoState.key,
      });
    } catch {
      setUndoErrors((prev) => ({ ...prev, [recId]: true }));
      trackRecommendationUndoError({
        recommendation_id: recId,
        plan_tier: currentPlanCode,
        mutation_key: undoState.key,
      });
    } finally {
      setUndoingRecId(null);
    }
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

            {/* Recent Policy Signals — lightweight trend surface */}
            {(() => {
              const receiptSignals = deriveReceiptTrendSignals(historySummaryShort, historySummary);
              const marketCue = getMarketConditionCue(marketConditions);
              const allTrendSignals = [
                ...receiptSignals,
                ...(marketCue ? [marketCue] : []),
              ];
              if (allTrendSignals.length === 0) return null;
              return (
                <section
                  className="rounded-xl border border-white/10 bg-white/[0.02] p-6 space-y-4"
                  data-testid="policy-trend-surface"
                >
                  <div>
                    <h2 className="text-sm font-medium text-slate-200">
                      Recent Policy Signals
                    </h2>
                    <p className="mt-1 text-[10px] text-slate-500">
                      Directional cues from your last 7 days vs. your 30-day baseline.
                    </p>
                  </div>
                  <div className="space-y-2.5" data-testid="trend-signal-list">
                    {allTrendSignals.map((signal) => (
                      <div
                        key={signal.key}
                        className="flex items-start gap-2.5"
                        data-testid={`trend-signal-${signal.key}`}
                      >
                        <span
                          className={`mt-1.5 shrink-0 h-1.5 w-1.5 rounded-full ${TREND_STATUS_DOT[signal.status]}`}
                          aria-hidden="true"
                        />
                        <div className="flex flex-wrap items-baseline gap-x-1.5">
                          <span className={`text-[11px] font-medium ${TREND_STATUS_TEXT[signal.status]}`}>
                            {signal.label}
                          </span>
                          <span className="text-[10px] text-slate-500 leading-relaxed">
                            {signal.detail}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[9px] text-slate-600">
                    Comparisons are directional, not predictive. Based on your own transaction activity.
                  </p>
                </section>
              );
            })()}

            {/* Policy Recommendations — sources merged, deduped, sorted */}
            {(() => {
              const canHistory = isSourceAvailable("Customer history", planCode);
              const canMarket = isSourceAvailable("Market analysis", planCode);
              const canPil = isSourceAvailable("Policy Intelligence", planCode);
              const canBenchmark = isSourceAvailable("Cohort benchmark", planCode);
              const canExternal = isSourceAvailable("External context", planCode);

              const deterministicRecs = generatePolicyRecommendations(effective, overrides, overridesEnabled);
              const historyRecs = canHistory && historySummary
                ? generateHistoryRecommendations(historySummary, effective)
                : [];
              const marketRecs = canMarket && marketConditions
                ? generateMarketRecommendations(marketConditions, effective)
                : [];
              const pilRecs = canPil && pilRecommendations
                ? generatePilRecommendations(pilRecommendations)
                : [];
              const benchmarkRecs = canBenchmark && cohortBenchmarks
                ? generateCohortBenchmarkRecommendations(cohortBenchmarks)
                : [];
              const externalRecs = canExternal && externalContext
                ? generateExternalContextRecommendations(externalContext)
                : [];
              // Merge, deduplicate by id, sort by multi-dimensional comparator
              const seenIds = new Set<string>();
              const allRecs: PolicyRecommendation[] = [];
              for (const rec of [...deterministicRecs, ...historyRecs, ...marketRecs, ...pilRecs, ...benchmarkRecs, ...externalRecs]) {
                if (!seenIds.has(rec.id)) {
                  seenIds.add(rec.id);
                  allRecs.push(rec);
                }
              }
              allRecs.sort(compareRecommendations);

              // Save the current recommendation IDs for "New" badge detection on
              // the next page load.  Only save when the set meaningfully changes.
              const currentIdSignature = allRecs.map((r) => r.id).sort().join("|");
              if (snapshotSavedRef.current !== currentIdSignature && allRecs.length > 0) {
                snapshotSavedRef.current = currentIdSignature;
                saveRecSnapshot(allRecs.map((r) => r.id));
                // Also persist richer history entries (id + title + source) for
                // the "What changed" panel on the next page load.
                saveRecHistoryEntry(
                  allRecs.map((r) => ({ id: r.id, title: r.title, source: r.source })),
                );
              }

              // Compute the set of newly-appearing recommendation IDs.
              // Only active when a prior snapshot exists (size > 0), so first-ever
              // page loads don't incorrectly badge everything as "New".
              const hasPriorSnapshot = prevRecSnapshot.size > 0;
              const isNewRec = (id: string): boolean =>
                hasPriorSnapshot && !prevRecSnapshot.has(id);

              // Classify recommendation changes for the history panel.
              // resolvedEntries: were present last visit, no longer active now.
              // newEntries: newly appeared since last visit.
              const { newEntries: historyNewEntries, resolvedEntries: historyResolvedEntries } =
                classifyRecChanges(
                  allRecs.map((r) => ({ id: r.id, title: r.title, source: r.source })),
                  prevRecHistory,
                );
              const hasHistoryChanges =
                historyNewEntries.length > 0 || historyResolvedEntries.length > 0;
              // Cap display to 3 resolved + 3 new for a compact panel.
              const displayedResolved = historyResolvedEntries.slice(0, 3);
              const displayedNew = historyNewEntries.slice(0, 3);

              // Split into display sections
              const topRecs = allRecs.filter((r) => classifyDisplaySection(r) === "top");
              const moreRecs = allRecs.filter((r) => classifyDisplaySection(r) === "more");

              // Count gated sources for teaser — sources that have data but
              // are not available at the caller's plan tier.
              const gatedSources: RecommendationSource[] = [];
              if (!canHistory && historySummary && historySummary.total_receipts > 0) {
                gatedSources.push("Customer history");
              }
              if (!canMarket && marketConditions) {
                gatedSources.push("Market analysis");
              }
              if (!canPil && pilRecommendations?.gated && (pilRecommendations.gated_count ?? 0) > 0) {
                gatedSources.push("Policy Intelligence");
              }
              if (!canBenchmark && cohortBenchmarks?.gated && (cohortBenchmarks.gated_count ?? 0) > 0) {
                gatedSources.push("Cohort benchmark");
              }
              if (!canExternal && externalContext?.gated && (externalContext.gated_count ?? 0) > 0) {
                gatedSources.push("External context");
              }

              if (allRecs.length === 0 && gatedSources.length === 0 && !hasHistoryChanges) return null;

              // Analytics: aggregate context for events
              const uniqueSources = new Set(allRecs.map((r) => r.source));
              const recAnalyticsCtx = {
                total_visible_count: allRecs.length,
                visible_sources_count: uniqueSources.size,
                has_gated_sources: gatedSources.length > 0,
              };

              // Reset impression deduplication each render cycle
              resetImpressionTracking();

              const hasHistoryRecs = historyRecs.length > 0;
              const hasMarketRecs = marketRecs.length > 0;
              const hasPilRecs = pilRecs.length > 0;
              const hasBenchmarkRecs = benchmarkRecs.length > 0;
              const hasExternalRecs = externalRecs.length > 0;
              return (
                <>
                {/* Recommendation History Panel — "What changed since your last review" */}
                {hasHistoryChanges && (
                  <section
                    className="rounded-xl border border-white/10 bg-white/[0.02] p-5 space-y-3"
                    data-testid="recommendation-history-panel"
                  >
                    <div>
                      <h2 className="text-sm font-medium text-slate-200">
                        What Changed Since Your Last Review
                      </h2>
                      <p className="mt-1 text-[10px] text-slate-500">
                        {displayedResolved.length > 0 && displayedNew.length > 0
                          ? `${historyResolvedEntries.length} resolved, ${historyNewEntries.length} new since your last visit.`
                          : displayedResolved.length > 0
                          ? `${historyResolvedEntries.length} recommendation${historyResolvedEntries.length !== 1 ? "s" : ""} resolved since your last visit.`
                          : `${historyNewEntries.length} new recommendation${historyNewEntries.length !== 1 ? "s" : ""} since your last visit.`}
                      </p>
                    </div>
                    <div className="space-y-2" data-testid="history-change-list">
                      {displayedResolved.map((entry) => (
                        <div
                          key={entry.id}
                          className="flex items-center gap-2"
                          data-testid={`history-resolved-${entry.id}`}
                        >
                          <span className="shrink-0 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-1.5 py-0.5 text-[9px] font-medium text-slate-500">
                            Resolved
                          </span>
                          <span className="text-[10px] text-slate-500 line-through leading-relaxed">
                            {entry.title}
                          </span>
                        </div>
                      ))}
                      {displayedNew.map((entry) => (
                        <div
                          key={entry.id}
                          className="flex items-center gap-2"
                          data-testid={`history-new-${entry.id}`}
                        >
                          <span className="shrink-0 inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-medium text-emerald-400">
                            New
                          </span>
                          <span className="text-[10px] text-slate-300 leading-relaxed">
                            {entry.title}
                          </span>
                        </div>
                      ))}
                    </div>
                    {(historyResolvedEntries.length > 3 || historyNewEntries.length > 3) && (
                      <p className="text-[9px] text-slate-600">
                        {(() => {
                          const extra =
                            (historyResolvedEntries.length > 3 ? historyResolvedEntries.length - 3 : 0) +
                            (historyNewEntries.length > 3 ? historyNewEntries.length - 3 : 0);
                          return `+${extra} more change${extra !== 1 ? "s" : ""} — see recommendations below.`;
                        })()}
                      </p>
                    )}
                  </section>
                )}

                {(allRecs.length > 0 || gatedSources.length > 0) && (
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
                      {hasHistoryRecs ? ", your recent transaction history" : ""}
                      {hasPilRecs ? ", policy intelligence analysis" : ""}
                      {hasBenchmarkRecs ? ", aggregated cohort benchmarks" : ""}
                      {hasExternalRecs ? ", external infrastructure signals" : ""}
                      {hasMarketRecs ? ", and current execution conditions" : ""}.
                    </p>
                    {/* Signal freshness badges for market and external context */}
                    {(canMarket || canExternal) && (() => {
                      const mktFresh = marketConditions?.signal_freshness;
                      const extFresh = externalContext?.signal_freshness;
                      const anyDegraded = (canMarket && mktFresh && mktFresh.status !== "fresh") || (canExternal && extFresh && extFresh.status !== "fresh");
                      const lastTs = [
                        canMarket ? mktFresh?.last_updated_at : undefined,
                        canExternal ? extFresh?.last_updated_at : undefined,
                      ].filter((t): t is number => t != null);
                      const oldestTs = lastTs.length > 0 ? Math.min(...lastTs) : undefined;
                      const updatedLabel = formatLastUpdated(oldestTs);
                      return (
                        <div className="flex items-center gap-3 mt-1" data-testid="signal-freshness-row">
                          {canMarket && mktFresh && (
                            <span className="inline-flex items-center gap-1.5 text-[9px] text-slate-500">
                              Market:
                              <SignalFreshnessBadge freshness={mktFresh} source="market-analysis" />
                            </span>
                          )}
                          {canExternal && extFresh && (
                            <span className="inline-flex items-center gap-1.5 text-[9px] text-slate-500">
                              External:
                              <SignalFreshnessBadge freshness={extFresh} source="external-context" />
                            </span>
                          )}
                          {updatedLabel && (
                            <span className="text-[9px] text-slate-600" data-testid="signal-last-updated">
                              Updated {updatedLabel}
                            </span>
                          )}
                          {anyDegraded && (
                            <button
                              type="button"
                              onClick={refreshSignals}
                              disabled={refreshingSignals || signalRefreshCooldown}
                              className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-white/[0.03] px-2 py-0.5 text-[9px] text-slate-400 transition hover:border-slate-500 hover:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed"
                              data-testid="refresh-signals-btn"
                            >
                              {refreshingSignals ? (
                                <>
                                  <svg className="h-2.5 w-2.5 animate-spin" viewBox="0 0 16 16" fill="none">
                                    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeDasharray="28" strokeDashoffset="8" />
                                  </svg>
                                  Rechecking…
                                </>
                              ) : (
                                <>
                                  <svg className="h-2.5 w-2.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M2 8a6 6 0 0 1 10.47-4M14 8a6 6 0 0 1-10.47 4" />
                                    <path d="M13 1v3.5h-3.5M3 15v-3.5h3.5" />
                                  </svg>
                                  Recheck signals
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                  <div className="space-y-3" data-testid="recommendation-cards">
                    {/* ── Top recommendations ── */}
                    {topRecs.length > 0 && (
                      <div className="space-y-3" data-testid="top-recommendations">
                        {topRecs.map((rec, idx) => {
                          const styles = PRIORITY_STYLES[rec.priority];
                          const expandable = hasExpandableDetail(rec);
                          const isExpanded = expandedRecs.has(rec.id);
                          const sourceFraming = getSourceDetailFraming(rec);
                          const section: DisplaySection = "top";
                          const displayMeta = computeCardEmphasis(rec, section, idx);
                          trackRecommendationImpression({
                            recommendation_id: rec.id,
                            recommendation_source: rec.source,
                            recommendation_priority: rec.priority,
                            plan_tier: planCode,
                            had_confidence: rec.confidence != null,
                            had_evidence: !!rec.evidence,
                            field_key_present: !!rec.fieldKey,
                            recommendation_display_section: section,
                            ...recAnalyticsCtx,
                          });
                          const isFeatured = displayMeta.emphasis === "featured";
                          return (
                            <div
                              key={rec.id}
                              className={`rounded-lg border ${isFeatured ? `${styles.border} bg-white/[0.03]` : `${styles.border} bg-white/[0.02]`} p-4 space-y-2`}
                              data-testid={`recommendation-${rec.id}`}
                              data-emphasis={displayMeta.emphasis}
                            >
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <div className="flex min-w-0 items-center gap-2">
                                  <span className="text-xs font-semibold text-slate-200 truncate">
                                    {rec.title}
                                  </span>
                                  {isNewRec(rec.id) && (
                                    <span
                                      className="inline-flex items-center rounded-full bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 text-[9px] font-semibold leading-none text-emerald-300"
                                      data-testid={`rec-new-badge-${rec.id}`}
                                    >
                                      New
                                    </span>
                                  )}
                                  {isFeatured && (
                                    <span
                                      className="inline-flex items-center rounded-full bg-red-500/10 border border-red-500/20 px-2 py-0.5 text-[9px] font-semibold leading-none text-red-300"
                                      data-testid="recommended-action-badge"
                                      role="status"
                                      aria-label="Recommended action"
                                    >
                                      Recommended action
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {displayMeta.showInlineConfidence && rec.confidence != null && (
                                    <span
                                      className="inline-flex items-center gap-1 rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-[9px] font-medium leading-none text-slate-500"
                                      data-testid="recommendation-inline-confidence"
                                    >
                                      {rec.confidence >= 0.7 ? "High" : rec.confidence >= 0.4 ? "Medium" : "Low"} confidence
                                    </span>
                                  )}
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
                              {displayMeta.showInlineReason && rec.why && (
                                <p
                                  className="text-[10px] text-slate-500 leading-relaxed"
                                  data-testid={`recommendation-inline-reason-${rec.id}`}
                                >
                                  <span className="font-medium text-slate-400">Why:</span>{" "}
                                  {rec.why}
                                </p>
                              )}
                              {expandable && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const wasExpanded = expandedRecs.has(rec.id);
                                    if (wasExpanded) {
                                      trackRecommendationCollapse({
                                        recommendation_id: rec.id,
                                        recommendation_source: rec.source,
                                        plan_tier: planCode,
                                      });
                                    } else {
                                      trackRecommendationExpand({
                                        recommendation_id: rec.id,
                                        recommendation_source: rec.source,
                                        recommendation_priority: rec.priority,
                                        plan_tier: planCode,
                                        had_confidence: rec.confidence != null,
                                        had_evidence: !!rec.evidence,
                                      });
                                    }
                                    setExpandedRecs((prev) => {
                                      const next = new Set(prev);
                                      if (next.has(rec.id)) next.delete(rec.id);
                                      else next.add(rec.id);
                                      return next;
                                    });
                                  }}
                                  className="inline-flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-300 transition"
                                  aria-expanded={isExpanded}
                                  data-testid={`recommendation-details-toggle-${rec.id}`}
                                >
                                  <svg
                                    className={`h-3 w-3 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                                    viewBox="0 0 16 16"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  >
                                    <path d="M6 4l4 4-4 4" />
                                  </svg>
                                  {displayMeta.showInlineReason ? "More detail" : "Why this recommendation?"}
                                </button>
                              )}
                              {isExpanded && (
                                <div
                                  className="ml-4 border-l border-white/5 pl-3 space-y-1.5"
                                  data-testid={`recommendation-details-${rec.id}`}
                                >
                                  {sourceFraming && (
                                    <p className="text-[9px] text-slate-600 leading-relaxed">
                                      {sourceFraming}
                                    </p>
                                  )}
                                  {!displayMeta.showInlineReason && (
                                    <p className="text-[10px] text-slate-500 leading-relaxed">
                                      <span className="font-medium text-slate-400">Why it matters:</span>{" "}
                                      {rec.why}
                                    </p>
                                  )}
                                  {rec.evidence && (
                                    <p className="text-[9px] text-slate-600 leading-relaxed italic">
                                      {rec.evidence}
                                    </p>
                                  )}
                                  {rec.confidence != null && !displayMeta.showInlineConfidence && (rec.source === "Policy Intelligence" || rec.source === "Cohort benchmark" || rec.source === "External context") && (
                                    <span
                                      className="inline-flex items-center gap-1 text-[9px] text-slate-600"
                                      data-testid="recommendation-confidence"
                                    >
                                      Confidence: {rec.confidence >= 0.7 ? "high" : rec.confidence >= 0.4 ? "medium" : "low"}
                                    </span>
                                  )}
                                </div>
                              )}
                              {overridesEnabled && (rec.applyable || rec.fieldKey) && (
                                <div className="flex flex-wrap items-center gap-2">
                                  {/* Apply button — only for applyable recs, hidden during confirm/success */}
                                  {rec.applyable && rec.applyMutation && applyResults[rec.id] !== "success" && applyConfirmingRecId !== rec.id && (
                                    <button
                                      type="button"
                                      onClick={() => setApplyConfirmingRecId(rec.id)}
                                      className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[10px] font-medium transition ${isFeatured ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20" : "border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"}`}
                                      data-testid={`apply-btn-${rec.id}`}
                                    >
                                      Apply
                                    </button>
                                  )}
                                  {/* Applied success indicator + Undo action — grouped to prevent orphaned layout */}
                                  {applyResults[rec.id] === "success" && (
                                    <div className="inline-flex items-center gap-2">
                                      <span
                                        className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400"
                                        data-testid={`apply-success-${rec.id}`}
                                        role="status"
                                      >
                                        &#10003; Applied
                                      </span>
                                      {applyUndoStates[rec.id] && (
                                        <button
                                          type="button"
                                          disabled={undoingRecId === rec.id}
                                          onClick={() => handleUndoRecommendation(rec.id)}
                                          className="inline-flex items-center rounded-md border border-slate-500/20 bg-white/5 px-2.5 py-1 text-[10px] text-slate-400 transition hover:text-slate-200 hover:bg-white/10 disabled:opacity-50"
                                          data-testid={`undo-btn-${rec.id}`}
                                          title={undoTitle(applyUndoStates[rec.id].key)}
                                        >
                                          {undoingRecId === rec.id ? "Undoing…" : "Undo"}
                                        </button>
                                      )}
                                      {undoErrors[rec.id] && (
                                        <span
                                          className="text-[10px] text-red-400"
                                          data-testid={`undo-error-${rec.id}`}
                                          role="alert"
                                        >
                                          Could not undo — edit the setting manually.
                                        </span>
                                      )}
                                    </div>
                                  )}
                                  {/* View setting — hidden during confirm/success */}
                                  {rec.fieldKey && applyConfirmingRecId !== rec.id && applyResults[rec.id] !== "success" && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        trackRecommendationViewSetting({
                                          recommendation_id: rec.id,
                                          recommendation_source: rec.source,
                                          recommendation_priority: rec.priority,
                                          plan_tier: planCode,
                                          field_key_present: true,
                                        });
                                        enterEditMode(rec.fieldKey);
                                      }}
                                      className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-medium text-slate-400 transition hover:bg-white/10 hover:text-slate-200"
                                      data-testid={`recommendation-action-${rec.id}`}
                                    >
                                      View setting
                                    </button>
                                  )}
                                </div>
                              )}
                              {/* Inline confirmation panel for apply flow */}
                              {applyConfirmingRecId === rec.id && rec.applyConfirmText && (
                                <div
                                  className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 space-y-2"
                                  data-testid={`apply-confirm-panel-${rec.id}`}
                                >
                                  <p className="text-[10px] text-amber-200 leading-relaxed">
                                    {rec.applyConfirmText}
                                  </p>
                                  {applyResults[rec.id] === "error" && (
                                    <p
                                      className="text-[10px] text-red-300"
                                      data-testid={`apply-error-${rec.id}`}
                                    >
                                      Could not apply. Please try again or edit the setting manually.
                                    </p>
                                  )}
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      disabled={applyingRecId === rec.id}
                                      onClick={() => handleApplyRecommendation(rec)}
                                      className="inline-flex items-center rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[10px] font-medium text-amber-200 transition hover:bg-amber-500/20 disabled:opacity-50"
                                      data-testid={`apply-confirm-btn-${rec.id}`}
                                    >
                                      {applyingRecId === rec.id ? "Applying…" : "Confirm"}
                                    </button>
                                    <button
                                      type="button"
                                      disabled={applyingRecId === rec.id}
                                      onClick={() => {
                                        setApplyConfirmingRecId(null);
                                        setApplyResults((prev) => {
                                          const next = { ...prev };
                                          delete next[rec.id];
                                          return next;
                                        });
                                      }}
                                      className="inline-flex items-center rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] text-slate-400 transition hover:text-slate-300 disabled:opacity-50"
                                      data-testid={`apply-cancel-btn-${rec.id}`}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {/* ── More suggestions (collapsed by default) ── */}
                    {moreRecs.length > 0 && (
                      <div data-testid="more-suggestions">
                        <button
                          type="button"
                          onClick={() => setShowMoreSuggestions((v) => !v)}
                          className="flex w-full items-center gap-2 rounded-lg border border-white/5 bg-white/[0.01] px-4 py-2.5 text-[11px] text-slate-500 transition hover:border-white/10 hover:text-slate-400"
                          aria-expanded={showMoreSuggestions}
                          data-testid="more-suggestions-toggle"
                        >
                          <svg
                            className={`h-3 w-3 transition-transform ${showMoreSuggestions ? "rotate-90" : ""}`}
                            viewBox="0 0 16 16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M6 4l4 4-4 4" />
                          </svg>
                          {showMoreSuggestions ? "Hide" : "Show"} {moreRecs.length} more suggestion{moreRecs.length !== 1 ? "s" : ""}
                        </button>
                        <div className={`mt-3 space-y-2 ${showMoreSuggestions ? "" : "hidden"}`} data-testid="more-suggestions-list">
                            {moreRecs.map((rec, idx) => {
                              const styles = PRIORITY_STYLES[rec.priority];
                              const expandable = hasExpandableDetail(rec);
                              const isExpanded = expandedRecs.has(rec.id);
                              const sourceFraming = getSourceDetailFraming(rec);
                              const section: DisplaySection = "more";
                              const displayMeta = computeCardEmphasis(rec, section, idx);
                              trackRecommendationImpression({
                                recommendation_id: rec.id,
                                recommendation_source: rec.source,
                                recommendation_priority: rec.priority,
                                plan_tier: planCode,
                                had_confidence: rec.confidence != null,
                                had_evidence: !!rec.evidence,
                                field_key_present: !!rec.fieldKey,
                                recommendation_display_section: section,
                                ...recAnalyticsCtx,
                              });
                              return (
                                <div
                                  key={rec.id}
                                  className={`rounded-lg border ${styles.border} bg-white/[0.015] px-3.5 py-2.5 space-y-1 opacity-80`}
                                  data-testid={`recommendation-${rec.id}`}
                                  data-emphasis={displayMeta.emphasis}
                                >
                                  <div className="flex items-center justify-between gap-2 flex-wrap">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[11px] font-medium text-slate-400">
                                        {rec.title}
                                      </span>
                                      {isNewRec(rec.id) && (
                                        <span
                                          className="inline-flex items-center rounded-full bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 text-[9px] font-semibold leading-none text-emerald-300"
                                          data-testid={`rec-new-badge-${rec.id}`}
                                        >
                                          New
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      {displayMeta.showInlineConfidence && rec.confidence != null && (
                                        <span
                                          className="inline-flex items-center gap-1 rounded-full bg-white/5 border border-white/10 px-1.5 py-0.5 text-[9px] font-medium leading-none text-slate-600"
                                          data-testid="recommendation-inline-confidence"
                                        >
                                          {rec.confidence >= 0.7 ? "High" : rec.confidence >= 0.4 ? "Medium" : "Low"} confidence
                                        </span>
                                      )}
                                      <span
                                        className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold leading-none ${styles.badge}`}
                                        data-testid="recommendation-priority"
                                      >
                                        {rec.priority === "high" ? "High" : rec.priority === "medium" ? "Med" : "Low"}
                                      </span>
                                      <span
                                        className="inline-flex items-center rounded-full bg-white/5 border border-white/10 px-1.5 py-0.5 text-[9px] font-medium leading-none text-slate-600"
                                        data-testid="recommendation-source"
                                      >
                                        {rec.source}
                                      </span>
                                    </div>
                                  </div>
                                  <p className={`text-[10px] text-slate-500 leading-relaxed ${isExpanded ? "" : "line-clamp-2"}`}>
                                    {rec.explanation}
                                  </p>
                                  {expandable && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const wasExpanded = expandedRecs.has(rec.id);
                                        if (wasExpanded) {
                                          trackRecommendationCollapse({
                                            recommendation_id: rec.id,
                                            recommendation_source: rec.source,
                                            plan_tier: planCode,
                                          });
                                        } else {
                                          trackRecommendationExpand({
                                            recommendation_id: rec.id,
                                            recommendation_source: rec.source,
                                            recommendation_priority: rec.priority,
                                            plan_tier: planCode,
                                            had_confidence: rec.confidence != null,
                                            had_evidence: !!rec.evidence,
                                          });
                                        }
                                        setExpandedRecs((prev) => {
                                          const next = new Set(prev);
                                          if (next.has(rec.id)) next.delete(rec.id);
                                          else next.add(rec.id);
                                          return next;
                                        });
                                      }}
                                      className="inline-flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-300 transition"
                                      aria-expanded={isExpanded}
                                      data-testid={`recommendation-details-toggle-${rec.id}`}
                                    >
                                      <svg
                                        className={`h-3 w-3 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                                        viewBox="0 0 16 16"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                      >
                                        <path d="M6 4l4 4-4 4" />
                                      </svg>
                                      {isExpanded ? "Hide detail" : "Why this recommendation?"}
                                    </button>
                                  )}
                                  {isExpanded && (
                                    <div
                                      className="ml-4 border-l border-white/5 pl-3 space-y-1.5"
                                      data-testid={`recommendation-details-${rec.id}`}
                                    >
                                      {sourceFraming && (
                                        <p className="text-[9px] text-slate-600 leading-relaxed">
                                          {sourceFraming}
                                        </p>
                                      )}
                                      <p className="text-[10px] text-slate-500 leading-relaxed">
                                        <span className="font-medium text-slate-400">Why it matters:</span>{" "}
                                        {rec.why}
                                      </p>
                                      {rec.evidence && (
                                        <p className="text-[9px] text-slate-600 leading-relaxed italic">
                                          {rec.evidence}
                                        </p>
                                      )}
                                      {rec.confidence != null && (rec.source === "Policy Intelligence" || rec.source === "Cohort benchmark" || rec.source === "External context") && (
                                        <span
                                          className="inline-flex items-center gap-1 text-[9px] text-slate-600"
                                          data-testid="recommendation-confidence"
                                        >
                                          Confidence: {rec.confidence >= 0.7 ? "high" : rec.confidence >= 0.4 ? "medium" : "low"}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                  {overridesEnabled && (rec.applyable || rec.fieldKey) && (
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      {/* Apply button — compact for more-section cards */}
                                      {rec.applyable && rec.applyMutation && applyResults[rec.id] !== "success" && applyConfirmingRecId !== rec.id && (
                                        <button
                                          type="button"
                                          onClick={() => setApplyConfirmingRecId(rec.id)}
                                          className="inline-flex items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-500/5 px-2 py-0.5 text-[9px] font-medium text-emerald-400 transition hover:bg-emerald-500/10 hover:text-emerald-300"
                                          data-testid={`apply-btn-${rec.id}`}
                                        >
                                          Apply
                                        </button>
                                      )}
                                      {applyResults[rec.id] === "success" && (
                                        <div className="inline-flex items-center gap-1.5">
                                          <span
                                            className="inline-flex items-center gap-1 text-[9px] font-medium text-emerald-400"
                                            data-testid={`apply-success-${rec.id}`}
                                            role="status"
                                          >
                                            &#10003; Applied
                                          </span>
                                          {applyUndoStates[rec.id] && (
                                            <button
                                              type="button"
                                              disabled={undoingRecId === rec.id}
                                              onClick={() => handleUndoRecommendation(rec.id)}
                                              className="inline-flex items-center rounded-md border border-slate-500/20 bg-white/5 px-2 py-0.5 text-[9px] text-slate-400 transition hover:text-slate-200 hover:bg-white/10 disabled:opacity-50"
                                              data-testid={`undo-btn-${rec.id}`}
                                              title={undoTitle(applyUndoStates[rec.id].key)}
                                            >
                                              {undoingRecId === rec.id ? "Undoing…" : "Undo"}
                                            </button>
                                          )}
                                          {undoErrors[rec.id] && (
                                            <span
                                              className="text-[9px] text-red-400"
                                              data-testid={`undo-error-${rec.id}`}
                                              role="alert"
                                            >
                                              Could not undo — edit manually.
                                            </span>
                                          )}
                                        </div>
                                      )}
                                      {rec.fieldKey && applyConfirmingRecId !== rec.id && applyResults[rec.id] !== "success" && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            trackRecommendationViewSetting({
                                              recommendation_id: rec.id,
                                              recommendation_source: rec.source,
                                              recommendation_priority: rec.priority,
                                              plan_tier: planCode,
                                              field_key_present: true,
                                            });
                                            enterEditMode(rec.fieldKey);
                                          }}
                                          className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-medium text-slate-500 transition hover:bg-white/10 hover:text-slate-300"
                                          data-testid={`recommendation-action-${rec.id}`}
                                        >
                                          View setting
                                        </button>
                                      )}
                                    </div>
                                  )}
                                  {applyConfirmingRecId === rec.id && rec.applyConfirmText && (
                                    <div
                                      className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-2.5 space-y-1.5"
                                      data-testid={`apply-confirm-panel-${rec.id}`}
                                    >
                                      <p className="text-[9px] text-amber-200 leading-relaxed">
                                        {rec.applyConfirmText}
                                      </p>
                                      {applyResults[rec.id] === "error" && (
                                        <p
                                          className="text-[9px] text-red-300"
                                          data-testid={`apply-error-${rec.id}`}
                                        >
                                          Could not apply. Please try again or edit the setting manually.
                                        </p>
                                      )}
                                      <div className="flex items-center gap-1.5">
                                        <button
                                          type="button"
                                          disabled={applyingRecId === rec.id}
                                          onClick={() => handleApplyRecommendation(rec)}
                                          className="inline-flex items-center rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[9px] font-medium text-amber-200 transition hover:bg-amber-500/20 disabled:opacity-50"
                                          data-testid={`apply-confirm-btn-${rec.id}`}
                                        >
                                          {applyingRecId === rec.id ? "Applying…" : "Confirm"}
                                        </button>
                                        <button
                                          type="button"
                                          disabled={applyingRecId === rec.id}
                                          onClick={() => {
                                            setApplyConfirmingRecId(null);
                                            setApplyResults((prev) => {
                                              const next = { ...prev };
                                              delete next[rec.id];
                                              return next;
                                            });
                                          }}
                                          className="inline-flex items-center rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] text-slate-400 transition hover:text-slate-300 disabled:opacity-50"
                                          data-testid={`apply-cancel-btn-${rec.id}`}
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                      </div>
                    )}
                  </div>
                  {/* Upgrade teaser for gated recommendation sources — shown before the advisory disclaimer */}
                  {gatedSources.length > 0 && (() => {
                    const hasEnterpriseGated = gatedSources.includes("External context");
                    const hasAdvancedGated = gatedSources.includes("Cohort benchmark");
                    const tierLabel = hasEnterpriseGated ? "Enterprise" : hasAdvancedGated ? "Advanced" : "Pro";
                    const rankedGated = sortGatedByValue(gatedSources);
                    const dominantSource = rankedGated[0] ?? null;
                    const sourceMix = gatedSources.length <= 1 ? "single" : gatedSources.length <= 3 ? "few" : "many";
                    // Rank bucket: "high" = Policy Intelligence / Cohort benchmark / External context
                    // (rank ≥ 4); "standard" = Customer history / Market analysis (rank < 4).
                    // Used in analytics to distinguish whether high-value dominant sources
                    // convert better than standard-value ones across the teaser-performance panel.
                    const dominantRank = dominantSource ? (SOURCE_VALUE_RANK[dominantSource] ?? 0) : 0;
                    const dominantSourceRankBucket: "high" | "standard" = dominantRank >= 4 ? "high" : "standard";
                    // Analytics: teaser impression (deduplicated per render cycle)
                    trackUpgradeTeaserView({
                      plan_tier: planCode,
                      gated_source_count: gatedSources.length,
                      gated_sources_present: gatedSources.join(","),
                      dominant_gated_source: dominantSource ?? "none",
                      highest_gated_tier: tierLabel,
                      gated_source_mix: sourceMix,
                      dominant_source_rank_bucket: dominantSourceRankBucket,
                    });
                    const headline = dominantSource && SOURCE_TEASER_HEADLINES[dominantSource]
                      ? SOURCE_TEASER_HEADLINES[dominantSource]
                      : "Unlock deeper policy intelligence";
                    return (
                    <div
                      className="rounded-lg border border-primary-400/20 bg-primary-500/5 p-4 space-y-3"
                      data-testid="recommendation-upgrade-teaser"
                    >
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center rounded-full border border-primary-400/30 bg-primary-500/10 px-2 py-0.5 text-[9px] font-semibold text-primary-300">
                          {tierLabel}
                        </span>
                        <span className="text-xs font-medium text-slate-200" data-testid="teaser-headline">
                          {headline}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        Upgrade to {tierLabel} to access{" "}
                        {teaserLeadText(gatedSources, dominantSource)}
                        {pilRecommendations?.gated_count
                          ? `, including ${pilRecommendations.gated_count} intelligence-backed suggestion${pilRecommendations.gated_count !== 1 ? "s" : ""} available now`
                          : ""}
                        {cohortBenchmarks?.gated_count
                          ? `, plus ${cohortBenchmarks.gated_count} cohort benchmark${cohortBenchmarks.gated_count !== 1 ? "s" : ""}`
                          : ""}
                        {externalContext?.gated_count
                          ? `, plus ${externalContext.gated_count} external context signal${externalContext.gated_count !== 1 ? "s" : ""}`
                          : ""}.
                      </p>
                      {gatedSources.length > 1 && (
                        <ul className="space-y-1.5 pl-1" data-testid="gated-source-details">
                          {rankedGated.map((src, idx) => (
                            <li key={src} className={`flex items-start gap-1.5 text-[10px] ${idx === 0 ? "text-slate-400" : "text-slate-500"}`}>
                              <span className={`mt-0.5 block h-1 w-1 shrink-0 rounded-full ${idx === 0 ? "bg-primary-400" : "bg-primary-400/50"}`} />
                              <span>
                                <span className={`font-medium ${idx === 0 ? "text-slate-300" : "text-slate-400"}`}>{src}</span>
                                {idx === 0 && (
                                  <span
                                    className="ml-1.5 inline-flex items-center rounded-full border border-primary-400/20 bg-primary-500/10 px-1.5 py-0 text-[8px] font-semibold leading-4 text-primary-400/70"
                                    data-testid="teaser-primary-source-badge"
                                  >
                                    primary
                                  </span>
                                )}
                                {SOURCE_DESCRIPTIONS[src] ? ` — ${SOURCE_DESCRIPTIONS[src]}` : ""}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                      <Link
                        href="/customer/upgrades"
                        onClick={() => trackUpgradeTeaserClick({
                          plan_tier: planCode,
                          gated_source_count: gatedSources.length,
                          target_tier: tierLabel,
                          dominant_gated_source: dominantSource ?? "none",
                          highest_gated_tier: tierLabel,
                          gated_source_mix: sourceMix,
                          dominant_source_rank_bucket: dominantSourceRankBucket,
                        })}
                        className="inline-flex items-center gap-1 rounded-md border border-primary-400/30 bg-primary-500/10 px-3 py-1.5 text-[10px] font-medium text-primary-300 transition hover:bg-primary-500/20 hover:text-primary-200"
                        data-testid="recommendation-upgrade-link"
                      >
                        {teaserCtaLabel(tierLabel, dominantSource)} &rarr;
                      </Link>
                    </div>
                    );
                  })()}
                  <p className="text-[9px] text-slate-600 text-center">
                    These recommendations are advisory. They are derived from your current policy configuration{hasHistoryRecs ? ", your own recent transaction history" : ""}{hasPilRecs ? ", policy intelligence analysis of your transaction patterns" : ""}{hasBenchmarkRecs ? ", anonymized cohort benchmarks" : ""}{hasExternalRecs ? ", external infrastructure signals" : ""}{hasMarketRecs ? ", and current execution infrastructure conditions" : ""}{!hasHistoryRecs && !hasMarketRecs && !hasPilRecs && !hasBenchmarkRecs && !hasExternalRecs ? ". They do not use live market data or cross-customer analysis" : ""}.
                  </p>
                </section>
                )}
                </>
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
                <div className="sticky bottom-4 z-10 rounded-xl border border-white/10 bg-neutral-900/95 backdrop-blur px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-lg shadow-black/30">
                  <div className="flex items-center gap-2">
                    {hasChanges && (
                      <span className="inline-block h-2 w-2 rounded-full bg-amber-400 animate-pulse" aria-hidden="true" />
                    )}
                    <span className="text-[10px] text-slate-500">
                      {hasChanges ? "Unsaved changes" : "No changes"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
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
