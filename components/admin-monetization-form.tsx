"use client";

import { useState } from "react";
import type { MonetizationSettings } from "@/lib/dashboard-client";

type Props = {
  initial: MonetizationSettings;
};

const LABELS: Record<keyof MonetizationSettings, string> = {
  monetization_enabled: "Monetization Enabled",
  pricing_page_enabled: "Pricing Page Visible",
  upgrade_cta_enabled: "Upgrade CTA Visible",
  quota_enforcement_mode: "Quota Enforcement Mode",
  paid_feature_gates_enabled: "Paid Feature Gates",
  real_execution_paid_gate_enabled: "Real Execution Paid Gate",
  pro_self_serve_enabled: "Pro Self-Serve Signup",
  enterprise_contact_only: "Enterprise Contact-Only",
};

const DESCRIPTIONS: Record<keyof MonetizationSettings, string> = {
  monetization_enabled: "Master switch for all monetization surfaces.",
  pricing_page_enabled: "Show the /pricing page and nav links.",
  upgrade_cta_enabled: "Show upgrade CTAs on dashboard and usage meters.",
  quota_enforcement_mode: "off = bypass, soft = warn only, hard = block at limit.",
  paid_feature_gates_enabled: "Enable paid feature gating checks.",
  real_execution_paid_gate_enabled: "Block free-tier users from real execution.",
  pro_self_serve_enabled: "Allow Pro self-serve signup (future).",
  enterprise_contact_only: "Enterprise tier is contact-only (no self-serve).",
};

const BOOL_FIELDS: (keyof MonetizationSettings)[] = [
  "monetization_enabled",
  "pricing_page_enabled",
  "upgrade_cta_enabled",
  "paid_feature_gates_enabled",
  "real_execution_paid_gate_enabled",
  "pro_self_serve_enabled",
  "enterprise_contact_only",
];

export function MonetizationForm({ initial }: Props) {
  const [settings, setSettings] = useState<MonetizationSettings>(initial);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  async function handleToggle(field: keyof MonetizationSettings) {
    setSaving(true);
    setStatus(null);
    const newVal = !settings[field];
    try {
      const res = await fetch("/api/admin/monetization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: newVal }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        setStatus({
          type: "error",
          message: json.error?.message || `Failed to update ${field}`,
        });
      } else {
        setSettings(json.settings);
        setStatus({ type: "success", message: `Updated ${LABELS[field]}` });
      }
    } catch {
      setStatus({ type: "error", message: "Network error" });
    } finally {
      setSaving(false);
    }
  }

  async function handleQuotaMode(mode: "off" | "soft" | "hard") {
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch("/api/admin/monetization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quota_enforcement_mode: mode }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        setStatus({
          type: "error",
          message: json.error?.message || "Failed to update quota mode",
        });
      } else {
        setSettings(json.settings);
        setStatus({ type: "success", message: "Updated Quota Enforcement Mode" });
      }
    } catch {
      setStatus({ type: "error", message: "Network error" });
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    setResetting(true);
    setStatus(null);
    try {
      const res = await fetch("/api/admin/monetization/reset", {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        setStatus({
          type: "error",
          message: json.error?.message || "Failed to reset",
        });
      } else {
        setSettings(json.settings);
        setStatus({ type: "success", message: "Reset to defaults" });
      }
    } catch {
      setStatus({ type: "error", message: "Network error" });
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Status banner */}
      {status && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            status.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-red-500/30 bg-red-500/10 text-red-300"
          }`}
        >
          {status.message}
        </div>
      )}

      {/* Boolean toggles */}
      <div className="space-y-4">
        {BOOL_FIELDS.map((field) => (
          <div
            key={field}
            className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium text-slate-200">
                {LABELS[field]}
              </p>
              <p className="text-xs text-slate-500">{DESCRIPTIONS[field]}</p>
            </div>
            <button
              type="button"
              disabled={saving}
              onClick={() => handleToggle(field)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 disabled:opacity-50 ${
                settings[field]
                  ? "bg-accent-500"
                  : "bg-white/10"
              }`}
              aria-label={`Toggle ${LABELS[field]}`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                  settings[field] ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      {/* Quota enforcement mode selector */}
      <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3">
        <div className="mb-3">
          <p className="text-sm font-medium text-slate-200">
            {LABELS.quota_enforcement_mode}
          </p>
          <p className="text-xs text-slate-500">
            {DESCRIPTIONS.quota_enforcement_mode}
          </p>
        </div>
        <div className="flex gap-2">
          {(["off", "soft", "hard"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              disabled={saving}
              onClick={() => handleQuotaMode(mode)}
              className={`rounded-md px-4 py-1.5 text-xs font-medium transition ${
                settings.quota_enforcement_mode === mode
                  ? mode === "hard"
                    ? "bg-red-500/20 text-red-300 ring-1 ring-red-500/40"
                    : mode === "soft"
                      ? "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40"
                      : "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40"
                  : "bg-white/5 text-slate-400 hover:bg-white/10"
              } disabled:opacity-50`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Reset button */}
      <div className="flex justify-end border-t border-white/[0.06] pt-4">
        <button
          type="button"
          disabled={resetting || saving}
          onClick={handleReset}
          className="rounded-md border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-400 transition hover:bg-white/10 hover:text-slate-200 disabled:opacity-50"
        >
          {resetting ? "Resetting…" : "Reset to Defaults"}
        </button>
      </div>
    </div>
  );
}
