"use client";

import { useRef, useState, useTransition } from "react";
import { updateAdminNotes } from "./actions";

export function NoteForm({
  email,
  currentNotes,
}: {
  email: string;
  currentNotes: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      setSaved(false);
      const result = await updateAdminNotes(formData);
      if (result?.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="flex flex-col gap-1.5 w-full">
      <input type="hidden" name="email" value={email} />
      <textarea
        name="notes"
        defaultValue={currentNotes}
        maxLength={2000}
        rows={3}
        placeholder="Internal notes..."
        className="rounded bg-white/10 border border-white/10 px-2 py-1 text-xs text-slate-200 resize-y focus:outline-none focus:ring-1 focus:ring-primary-500 w-full min-w-[200px]"
      />
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded bg-primary-600 px-2 py-0.5 text-xs font-medium text-white hover:bg-primary-500 disabled:opacity-50 transition"
        >
          {isPending ? "..." : "Save note"}
        </button>
        {saved && (
          <span className="text-xs text-emerald-400">Saved</span>
        )}
      </div>
    </form>
  );
}
