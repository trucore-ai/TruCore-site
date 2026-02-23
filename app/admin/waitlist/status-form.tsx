"use client";

import { useRef, useState, useTransition } from "react";
import { setSignupStatus } from "./actions";

export function StatusForm({
  email,
  currentStatus,
  statuses,
}: {
  email: string;
  currentStatus: string;
  statuses: string[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      setSaved(false);
      const result = await setSignupStatus(formData);
      if (result?.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="flex items-center gap-1">
      <input type="hidden" name="email" value={email} />
      <select
        name="status"
        defaultValue={currentStatus}
        aria-label={`Update status for ${email}`}
        className="rounded border border-white/10 bg-white/10 px-1.5 py-0.5 text-xs text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
      >
        {statuses.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={isPending}
        className="rounded bg-primary-600 px-2 py-0.5 text-xs font-medium text-white transition hover:bg-primary-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 disabled:opacity-50"
      >
        {isPending ? "..." : "Save"}
      </button>
      {saved && (
        <span className="text-xs text-emerald-400">Saved</span>
      )}
    </form>
  );
}
