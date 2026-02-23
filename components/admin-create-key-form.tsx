"use client";

import { useState, useTransition } from "react";

type CreateKeyResponse = {
  ok: true;
  key: {
    id: string;
    name: string;
    created_at: string;
    revoked_at: string | null;
  };
  raw_key: string;
};

export function AdminCreateKeyForm() {
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreateKeyResponse | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      setError(null);
      setCreated(null);

      try {
        const response = await fetch("/api/keys/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name }),
          cache: "no-store",
        });

        if (!response.ok) {
          setError("Unable to create key. Please try again.");
          return;
        }

        const data = (await response.json()) as CreateKeyResponse;
        setCreated(data);
        setName("");
      } catch {
        setError("Unable to create key. Please try again.");
      }
    });
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
        Create API Key
      </h2>
      <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex-1">
          <span className="mb-1 block text-xs text-slate-400">Name</span>
          <input
            type="text"
            name="name"
            maxLength={120}
            placeholder="Partner name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
          />
        </label>
        <button
          type="submit"
          disabled={isPending}
          className="rounded bg-primary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 disabled:opacity-60"
        >
          {isPending ? "Creating..." : "Create key"}
        </button>
      </form>

      {error && <p className="mt-3 text-sm text-red-300">{error}</p>}

      {created && (
        <div className="mt-4 rounded border border-emerald-500/30 bg-emerald-500/10 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">
            Raw key, shown once
          </p>
          <p className="mt-2 break-all rounded bg-black/30 px-2 py-1 font-mono text-xs text-emerald-200">
            {created.raw_key}
          </p>
          <p className="mt-2 text-xs text-emerald-200/90">
            Save this key now. Only the hash is stored server-side.
          </p>
        </div>
      )}
    </div>
  );
}
