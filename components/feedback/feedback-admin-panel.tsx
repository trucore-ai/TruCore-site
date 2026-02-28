"use client";

import { useActionState } from "react";
import { adminUpdateFeedback } from "@/app/actions/feedback";
import { FEEDBACK_STATUSES } from "@/lib/validation/feedback";

const initialState = { ok: false, message: "" };

function formAction(
  _prev: { ok: boolean; message: string },
  formData: FormData,
) {
  return adminUpdateFeedback(formData) as Promise<{
    ok: boolean;
    message: string;
  }>;
}

interface FeedbackAdminPanelProps {
  itemId: string;
  currentStatus: string;
  currentPinned: boolean;
  currentHidden: boolean;
}

export function FeedbackAdminPanel({
  itemId,
  currentStatus,
  currentPinned,
  currentHidden,
}: FeedbackAdminPanelProps) {
  const [state, action, isPending] = useActionState(formAction, initialState);

  const inputClass =
    "rounded-lg border border-white/10 bg-neutral-900/80 px-3 py-2 text-sm text-slate-200 transition-colors focus:border-primary-300/50 focus:outline-none focus:ring-1 focus:ring-primary-300/30";

  return (
    <div className="rounded-xl border border-amber-400/30 bg-amber-500/5 p-5">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-amber-300">
        Admin Controls
      </h3>

      {state.message && (
        <div
          className={`mb-3 rounded-lg border px-3 py-2 text-sm ${
            state.ok
              ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-200"
              : "border-red-400/40 bg-red-500/15 text-red-200"
          }`}
          role={state.ok ? "status" : "alert"}
        >
          {state.message}
        </div>
      )}

      <form action={action} className="flex flex-wrap items-end gap-3">
        <input type="hidden" name="id" value={itemId} />

        <div>
          <label
            htmlFor="admin-status"
            className="mb-1 block text-xs font-medium text-slate-300"
          >
            Status
          </label>
          <select
            id="admin-status"
            name="status"
            defaultValue={currentStatus}
            className={inputClass}
          >
            {FEEDBACK_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st === "Wont Implement" ? "Won't Implement" : st}
              </option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            name="pinned"
            value="true"
            defaultChecked={currentPinned}
            className="rounded border-white/20 bg-neutral-800"
          />
          Pinned
        </label>

        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            name="hidden"
            value="true"
            defaultChecked={currentHidden}
            className="rounded border-white/20 bg-neutral-800"
          />
          Hidden
        </label>

        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-amber-500/20 px-4 py-2 text-sm font-medium text-amber-200 transition-colors hover:bg-amber-500/30 disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save"}
        </button>
      </form>
    </div>
  );
}
