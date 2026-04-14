"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  isLoggedIn,
  fetchPolicy,
  updatePolicyOverrides,
  type EffectivePolicyResponse,
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
}

function computeRiskProfile(
  formValues: Record<string, string>,
  listValues: Record<string, string[]>,
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
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CustomerPoliciesPage() {
  const router = useRouter();
  const [policy, setPolicy] = useState<EffectivePolicyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit state
  const listInputRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [listValues, setListValues] = useState<Record<string, string[]>>({});
  const [editSnapshot, setEditSnapshot] = useState<{
    values: Record<string, string>;
    lists: Record<string, string[]>;
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

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
      return;
    }
    loadPolicy();
  }, [router, loadPolicy]);

  // Initialize form values from current overrides when entering edit mode.
  function enterEditMode() {
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
    setFormValues(values);
    setListValues(lists);
    setEditSnapshot({
      values: { ...values },
      lists: Object.fromEntries(
        Object.entries(lists).map(([k, v]) => [k, [...v]]),
      ),
    });
    setSaveError("");
    setSaveSuccess(false);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setEditSnapshot(null);
    setSaveError("");
    setSaveSuccess(false);
    setListValues({});
  }

  function applyPreset(preset: Preset) {
    setFormValues((prev) => ({ ...prev, ...preset.values }));
    setListValues({ allowed_programs: [], denied_programs: [] });
  }

  function updateField(key: string, value: string) {
    setFormValues((prev) => ({ ...prev, [key]: value }));
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
    const editableKeys = new Set<string>(EDITABLE_FIELDS.map((f) => f.key));

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
  const tokenKeys = ["allowed_mints", "denied_mints", "custom_token_allowlist_enabled"];
  const protectionKeys = ["max_slippage_bps", "require_simulation_success"];
  const programKeys = ["allowed_programs", "denied_programs", "blocked_programs"];

  // Live risk profile & preset detection
  const riskProfile = computeRiskProfile(formValues, listValues);
  const activePreset = detectPreset(formValues, listValues);

  // Detect unsaved changes
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
      }));

  function renderValue(key: string, val: unknown): string {
    if (val === null || val === undefined) return "—";
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
          {entries.map(({ key, value }) => (
            <div key={key} className="flex items-center justify-between py-2.5">
              <span className="text-xs text-slate-400">
                {EFFECTIVE_LABELS[key] ?? key}
              </span>
              <span className="text-xs text-slate-200 font-medium">
                {renderValue(key, value)}
              </span>
            </div>
          ))}
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
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
          <section className="rounded-xl border border-white/10 bg-white/[0.02] p-6 space-y-5">
            <h2 className="text-sm font-medium text-slate-300">
              Effective Policy
            </h2>
            <p className="text-[10px] text-slate-500">
              These are the merged values that the firewall enforces on every
              transaction. Plan defaults are combined with any custom overrides.
            </p>
            {renderEffectiveSection("Transaction Limits", limitKeys, effective)}
            {renderEffectiveSection("Execution Safety", protectionKeys, effective)}
            {renderEffectiveSection("Token Controls", tokenKeys, effective)}
            {renderEffectiveSection("Program Controls", programKeys, effective)}

            {/* Catch-all for any extra effective keys */}
            {(() => {
              const known = new Set([...limitKeys, ...tokenKeys, ...protectionKeys, ...programKeys]);
              const extra = Object.keys(effective).filter((k) => !known.has(k));
              return extra.length > 0
                ? renderEffectiveSection("Other", extra, effective)
                : null;
            })()}
          </section>
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
                  onClick={enterEditMode}
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
                  const groupFields = EDITABLE_FIELDS.filter(
                    (f) => f.group === group.id,
                  );
                  if (groupFields.length === 0) return null;
                  return (
                    <div
                      key={group.id}
                      className="rounded-xl border border-white/10 bg-white/[0.02] p-5 space-y-4"
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
                            <div key={field.key} className="space-y-1.5">
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
