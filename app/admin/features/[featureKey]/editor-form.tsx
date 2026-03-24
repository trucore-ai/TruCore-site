"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface FeatureEditorFormProps {
  featureKey: string;
  initialData: {
    enabled: boolean;
    visibility: string;
    required_plan: string;
    access_mode: string;
    metered: boolean;
    title: string;
    description: string;
  };
}

export function FeatureEditorForm({
  featureKey,
  initialData,
}: FeatureEditorFormProps) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initialData.enabled);
  const [visibility, setVisibility] = useState(initialData.visibility);
  const [requiredPlan, setRequiredPlan] = useState(initialData.required_plan);
  const [accessMode, setAccessMode] = useState(initialData.access_mode);
  const [metered, setMetered] = useState(initialData.metered);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch(
        `/api/admin/features/${encodeURIComponent(featureKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            enabled,
            visibility,
            required_plan: requiredPlan,
            access_mode: accessMode,
            metered,
          }),
          cache: "no-store",
        },
      );
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        setError(`Failed: ${res.status} ${text}`);
      } else {
        setSuccess(true);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Enabled toggle */}
      <div>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="h-4 w-4 rounded border-white/20 bg-white/10"
          />
          <span className="text-sm font-medium text-slate-200">Enabled</span>
        </label>
        <p className="mt-1 text-xs text-slate-500">
          Disabled features cannot be accessed by any user.
        </p>
      </div>

      {/* Visibility */}
      <div>
        <label className="block text-sm font-medium text-slate-200">
          Visibility
        </label>
        <select
          value={visibility}
          onChange={(e) => setVisibility(e.target.value)}
          className="mt-1 w-full rounded border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100"
        >
          <option value="visible">Visible</option>
          <option value="hidden">Hidden</option>
          <option value="gated">Gated</option>
        </select>
        <p className="mt-1 text-xs text-slate-500">
          Hidden features are invisible in public catalog and UI.
          Gated features are shown but marked as requiring upgrade.
        </p>
      </div>

      {/* Required Plan */}
      <div>
        <label className="block text-sm font-medium text-slate-200">
          Required Plan
        </label>
        <select
          value={requiredPlan}
          onChange={(e) => setRequiredPlan(e.target.value)}
          className="mt-1 w-full rounded border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100"
        >
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="enterprise">Enterprise</option>
        </select>
      </div>

      {/* Access Mode */}
      <div>
        <label className="block text-sm font-medium text-slate-200">
          Access Mode
        </label>
        <select
          value={accessMode}
          onChange={(e) => setAccessMode(e.target.value)}
          className="mt-1 w-full rounded border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100"
        >
          <option value="self_serve">Self-serve</option>
          <option value="request_only">Request only</option>
          <option value="admin_only">Admin only</option>
        </select>
        <p className="mt-1 text-xs text-slate-500">
          Request-only features show a &ldquo;Contact sales&rdquo; prompt
          instead of allowing direct access.
        </p>
      </div>

      {/* Metered flag */}
      <div>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={metered}
            onChange={(e) => setMetered(e.target.checked)}
            className="h-4 w-4 rounded border-white/20 bg-white/10"
          />
          <span className="text-sm font-medium text-slate-200">Metered</span>
        </label>
        <p className="mt-1 text-xs text-slate-500">
          Metered features count toward usage quotas.
        </p>
      </div>

      {error && (
        <p className="rounded bg-red-900/30 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded bg-green-900/30 px-3 py-2 text-sm text-green-300">
          Feature policy updated successfully.
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-primary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-500 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
        <Link
          href="/admin/features"
          className="rounded border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/20"
        >
          Back to Features
        </Link>
      </div>
    </form>
  );
}
