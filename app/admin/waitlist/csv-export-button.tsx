"use client";

import { useState, useTransition } from "react";
import { exportDesignPartnersCsv } from "./actions";

export function CsvExportButton() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleExport() {
    startTransition(async () => {
      setError(null);
      const fd = new FormData();
      const result = await exportDesignPartnersCsv(fd);

      if ("error" in result) {
        setError(result.error ?? "Unknown error");
        return;
      }

      // Trigger browser download
      const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleExport}
        disabled={isPending}
        className="rounded bg-white/10 border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/20 disabled:opacity-50 transition"
      >
        {isPending ? "Exporting..." : "Export Design Partners (CSV)"}
      </button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
