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
    hint: "Maximum allowed slippage in basis points (1–1000).",
  },
  {
    key: "max_notional_usd",
    label: "Max Transaction Value (USD)",
    type: "number" as const,
    min: 1,
    max: 10_000_000,
    placeholder: "e.g. 25000",
    hint: "Maximum notional transaction value in USD.",
  },
  {
    key: "max_value_sol",
    label: "Max Value (SOL)",
    type: "number" as const,
    min: 1,
    max: 100_000,
    placeholder: "e.g. 500",
    hint: "Maximum transaction value in SOL (1–100,000).",
  },
  {
    key: "require_simulation_success",
    label: "Require Simulation Success",
    type: "boolean" as const,
    hint: "When enabled, transactions must pass simulation before execution.",
  },
  {
    key: "allowed_programs",
    label: "Allowed Programs",
    type: "list" as const,
    maxItems: 50,
    itemMaxLen: 64,
    placeholder: "Program ID",
    hint: "Only these program IDs will be permitted. Leave empty for plan default.",
  },
  {
    key: "denied_programs",
    label: "Denied Programs",
    type: "list" as const,
    maxItems: 50,
    itemMaxLen: 64,
    placeholder: "Program ID",
    hint: "Transactions involving these program IDs will be blocked.",
  },
] as const;

type EditableKey = (typeof EDITABLE_FIELDS)[number]["key"];

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
    setSaveError("");
    setSaveSuccess(false);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setSaveError("");
    setSaveSuccess(false);
    setListValues({});
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

  function renderSection(
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
        <h3 className="text-xs font-medium text-slate-400">{title}</h3>
        <div className="divide-y divide-white/5">
          {entries.map(({ key, value }) => (
            <div key={key} className="flex items-center justify-between py-2">
              <span className="text-xs text-slate-400 font-mono">{key}</span>
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
      <div className="mx-auto max-w-2xl space-y-8">
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
            Your effective transaction policy is derived from your{" "}
            <span className="font-medium text-slate-300">
              {tierLabel(planCode)}
            </span>{" "}
            plan defaults{hasOverrides ? " with custom overrides applied" : ""}.
            {!overridesEnabled && " All values shown are read-only."}
          </p>
        </div>

        {/* Plan tier */}
        <section className="rounded-xl border border-primary-400/20 bg-primary-500/5 p-6 space-y-3">
          <h2 className="text-sm font-medium text-slate-300">Plan</h2>
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
        </section>

        {/* Effective policy */}
        <section className="rounded-xl border border-white/10 bg-white/[0.02] p-6 space-y-5">
          <h2 className="text-sm font-medium text-slate-300">
            Effective Policy
          </h2>
          <p className="text-[10px] text-slate-500">
            These are the merged values that the firewall enforces on every
            transaction. Plan defaults are combined with any custom overrides.
          </p>
          {renderSection("Limits", limitKeys, effective)}
          {renderSection("Token Controls", tokenKeys, effective)}
          {renderSection("Protection Rules", protectionKeys, effective)}
          {renderSection("Program Controls", programKeys, effective)}

          {/* Catch-all for any extra effective keys */}
          {(() => {
            const known = new Set([...limitKeys, ...tokenKeys, ...protectionKeys, ...programKeys]);
            const extra = Object.keys(effective).filter((k) => !known.has(k));
            return extra.length > 0
              ? renderSection("Other", extra, effective)
              : null;
          })()}
        </section>

        {/* Save success banner */}
        {saveSuccess && !editing && (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
            <p className="text-xs text-emerald-300">
              Policy overrides saved successfully.
            </p>
          </div>
        )}

        {/* Overrides — editable or read-only */}
        {overridesEnabled ? (
          <section className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-medium text-amber-300">
                  Custom Overrides
                </h2>
                <p className="mt-1 text-[10px] text-slate-500">
                  {editing
                    ? "Edit your override values below. Clear a field to revert to plan default."
                    : "These values override your plan defaults."}
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
              <div className="space-y-4">
                {EDITABLE_FIELDS.map((field) => (
                  <div key={field.key} className="space-y-1">
                    <label
                      htmlFor={`override-${field.key}`}
                      className="block text-xs font-medium text-slate-300"
                    >
                      {field.label}
                    </label>
                    {field.type === "boolean" ? (
                      <select
                        id={`override-${field.key}`}
                        value={formValues[field.key] ?? ""}
                        onChange={(e) => updateField(field.key, e.target.value)}
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
                          {(listValues[field.key] ?? []).length === 0 && (
                            <span className="text-[10px] text-slate-500 italic">
                              No entries — add program IDs below.
                            </span>
                          )}
                          {(listValues[field.key] ?? []).map((item, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-xs text-amber-200 font-mono"
                            >
                              {item}
                              <button
                                type="button"
                                onClick={() => removeListItem(field.key, idx)}
                                disabled={saving}
                                className="ml-1 text-amber-400 hover:text-red-400 disabled:opacity-50"
                                aria-label={`Remove ${item}`}
                              >
                                &times;
                              </button>
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <input
                            id={`override-${field.key}`}
                            ref={(el) => {
                              if (el) listInputRefs.current.set(field.key, el);
                              else listInputRefs.current.delete(field.key);
                            }}
                            type="text"
                            placeholder={field.placeholder}
                            disabled={saving}
                            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 font-mono outline-none transition focus:border-amber-500/40 disabled:opacity-50"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addListItem(field.key, (e.target as HTMLInputElement).value);
                                (e.target as HTMLInputElement).value = "";
                              }
                            }}
                          />
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => {
                              const input = listInputRefs.current.get(field.key);
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
                      <input
                        id={`override-${field.key}`}
                        type="number"
                        min={"min" in field ? field.min : undefined}
                        max={"max" in field ? field.max : undefined}
                        placeholder={"placeholder" in field ? field.placeholder : undefined}
                        value={formValues[field.key] ?? ""}
                        onChange={(e) => updateField(field.key, e.target.value)}
                        disabled={saving}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 outline-none transition focus:border-amber-500/40 disabled:opacity-50"
                      />
                    )}
                    <p className="text-[10px] text-slate-500">{field.hint}</p>
                  </div>
                ))}

                {saveError && (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
                    <p className="text-xs text-red-300">{saveError}</p>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-lg bg-amber-600 px-5 py-2 text-xs font-semibold text-white transition hover:bg-amber-500 disabled:opacity-50"
                  >
                    {saving ? "Saving…" : "Save Overrides"}
                  </button>
                  <button
                    onClick={cancelEdit}
                    disabled={saving}
                    className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/10 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : hasOverrides ? (
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
            ) : (
              <p className="text-xs text-slate-500">
                No custom overrides set. Click Edit Overrides to customize your policy.
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
