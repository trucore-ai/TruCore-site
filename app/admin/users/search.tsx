"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function AdminUserSearch({ initialEmail }: { initialEmail: string }) {
  const [email, setEmail] = useState(initialEmail);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    startTransition(() => {
      const params = new URLSearchParams();
      if (email.trim()) params.set("email", email.trim());
      router.push(`/admin/users?${params.toString()}`);
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
    >
      <label className="flex-1">
        <span className="mb-1 block text-xs text-slate-400">
          Search by email
        </span>
        <input
          type="text"
          name="email"
          maxLength={255}
          placeholder="user@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
        />
      </label>
      <button
        type="submit"
        disabled={isPending}
        className="rounded bg-primary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 disabled:opacity-60"
      >
        {isPending ? "Searching…" : "Search"}
      </button>
    </form>
  );
}
