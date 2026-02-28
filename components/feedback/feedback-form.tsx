"use client";

import { useActionState } from "react";
import { submitFeedback } from "@/app/actions/feedback";
import { FEEDBACK_CATEGORIES } from "@/lib/validation/feedback";

const initialState = { ok: false, message: "" };

function formAction(
  _prev: { ok: boolean; message: string },
  formData: FormData,
) {
  return submitFeedback(formData) as Promise<{ ok: boolean; message: string }>;
}

export function FeedbackForm() {
  const [state, action, isPending] = useActionState(formAction, initialState);

  const inputClass =
    "w-full rounded-lg border border-white/10 bg-neutral-900/80 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 transition-colors focus:border-primary-300/50 focus:outline-none focus:ring-1 focus:ring-primary-300/30";

  return (
    <form action={action} className="space-y-5">
      {state.message && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            state.ok
              ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-200"
              : "border-red-400/40 bg-red-500/15 text-red-200"
          }`}
          role={state.ok ? "status" : "alert"}
        >
          {state.message}
        </div>
      )}

      <div>
        <label
          htmlFor="fb-title"
          className="mb-1.5 block text-sm font-medium text-slate-200"
        >
          Title
        </label>
        <input
          id="fb-title"
          name="title"
          type="text"
          required
          maxLength={120}
          placeholder="Short, descriptive title"
          className={inputClass}
        />
      </div>

      <div>
        <label
          htmlFor="fb-category"
          className="mb-1.5 block text-sm font-medium text-slate-200"
        >
          Category
        </label>
        <select
          id="fb-category"
          name="category"
          required
          className={inputClass}
          defaultValue=""
        >
          <option value="" disabled>
            Select a category
          </option>
          {FEEDBACK_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="fb-body"
          className="mb-1.5 block text-sm font-medium text-slate-200"
        >
          Description
        </label>
        <textarea
          id="fb-body"
          name="body"
          required
          maxLength={4000}
          rows={6}
          placeholder="Describe your feedback, use case, or question in detail."
          className={inputClass}
        />
        <p className="mt-1 text-xs text-slate-500">
          Plain text. 20 to 4,000 characters.
        </p>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center justify-center rounded-xl bg-accent-500 px-7 py-3 text-base font-semibold text-neutral-950 transition-colors hover:bg-accent-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Submitting..." : "Submit feedback"}
      </button>
    </form>
  );
}
