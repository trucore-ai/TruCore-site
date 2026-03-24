"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface Props {
  requestId: string;
}

async function reviewAction(
  requestId: string,
  action: "approve" | "reject",
  note: string,
): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(`/api/admin/upgrades/${requestId}/${action}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ note }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return { ok: false, error: `HTTP ${res.status}: ${text}` };
  }
  return { ok: true };
}

export function UpgradeReviewActions({ requestId }: Props) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [acting, setActing] = useState(false);

  async function handleAction(action: "approve" | "reject") {
    setError("");
    setActing(true);
    const result = await reviewAction(requestId, action, note);
    if (!result.ok) {
      setError(result.error || "Action failed.");
      setActing(false);
      return;
    }
    startTransition(() => {
      router.refresh();
    });
  }

  const disabled = acting || isPending;

  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor="review-note"
          className="mb-2 block text-xs text-slate-400"
        >
          Review Note <span className="text-slate-600">(optional)</span>
        </label>
        <textarea
          id="review-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={disabled}
          maxLength={2000}
          rows={3}
          placeholder="Add an optional note for the requester..."
          className="w-full rounded-lg border border-white/10 bg-neutral-900 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 transition focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400 disabled:opacity-50"
        />
      </div>

      {error && (
        <div className="rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-xs text-red-300">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => handleAction("approve")}
          disabled={disabled}
          className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {disabled ? "Processing…" : "Approve & Assign Plan"}
        </button>
        <button
          onClick={() => handleAction("reject")}
          disabled={disabled}
          className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {disabled ? "Processing…" : "Reject"}
        </button>
      </div>

      <p className="text-[10px] text-slate-600">
        Approving will assign the requested plan tier to the tenant
        immediately.
      </p>
    </div>
  );
}
