"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  FEEDBACK_CATEGORIES,
  FEEDBACK_STATUSES,
  FEEDBACK_SORT_OPTIONS,
} from "@/lib/validation/feedback";

export function FeedbackFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentCategory = searchParams.get("category") ?? "";
  const currentStatus = searchParams.get("status") ?? "";
  const currentSort = searchParams.get("sort") ?? "top";

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/feedback?${params.toString()}`);
  }

  const selectClass =
    "rounded-lg border border-white/10 bg-neutral-900/80 px-3 py-2 text-sm text-slate-200 transition-colors hover:border-primary-300/30 focus:border-primary-300/50 focus:outline-none focus:ring-1 focus:ring-primary-300/30";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={currentCategory}
        onChange={(e) => updateFilter("category", e.target.value)}
        className={selectClass}
        aria-label="Filter by category"
      >
        <option value="">All categories</option>
        {FEEDBACK_CATEGORIES.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>

      <select
        value={currentStatus}
        onChange={(e) => updateFilter("status", e.target.value)}
        className={selectClass}
        aria-label="Filter by status"
      >
        <option value="">All statuses</option>
        {FEEDBACK_STATUSES.map((st) => (
          <option key={st} value={st}>
            {st === "Wont Implement" ? "Won't Implement" : st}
          </option>
        ))}
      </select>

      <select
        value={currentSort}
        onChange={(e) => updateFilter("sort", e.target.value)}
        className={selectClass}
        aria-label="Sort by"
      >
        {FEEDBACK_SORT_OPTIONS.map((opt) => (
          <option key={opt} value={opt}>
            {opt === "top" ? "Top" : opt === "new" ? "New" : "Shipped"}
          </option>
        ))}
      </select>
    </div>
  );
}
