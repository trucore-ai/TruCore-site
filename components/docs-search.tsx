"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { trackEvent } from "@/lib/analytics";
import { docsIndex } from "@/lib/docs-index";

type SearchResult = {
  href: string;
  title: string;
  snippet: string;
};

function buildSnippet(title: string, snippets: string[], tags: string[], query: string) {
  const matchFromSnippet = snippets.find((snippet) =>
    snippet.toLowerCase().includes(query),
  );

  if (matchFromSnippet) {
    return matchFromSnippet;
  }

  const matchFromTag = tags.find((tag) => tag.toLowerCase().includes(query));
  if (matchFromTag) {
    return `Tag: ${matchFromTag}`;
  }

  return title;
}

export function DocsSearch() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const normalizedQuery = query.trim().toLowerCase();

  const results = useMemo<SearchResult[]>(() => {
    if (!normalizedQuery) {
      return [];
    }

    const scored = docsIndex
      .map((entry) => {
        const haystack = [
          entry.title,
          ...entry.contentSnippets,
          ...entry.tags,
        ]
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(normalizedQuery)) {
          return null;
        }

        let score = 0;
        if (entry.title.toLowerCase().includes(normalizedQuery)) {
          score += 4;
        }
        if (entry.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery))) {
          score += 2;
        }
        if (
          entry.contentSnippets.some((snippet) =>
            snippet.toLowerCase().includes(normalizedQuery),
          )
        ) {
          score += 1;
        }

        return {
          href: entry.href,
          title: entry.title,
          snippet: buildSnippet(
            entry.title,
            entry.contentSnippets,
            entry.tags,
            normalizedQuery,
          ),
          score,
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
      .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title))
      .slice(0, 8)
      .map(({ href, title, snippet }) => ({ href, title, snippet }));

    return scored;
  }, [normalizedQuery]);

  const safeActiveIndex = results.length
    ? Math.min(activeIndex, results.length - 1)
    : 0;

  useEffect(() => {
    function onOutsidePointer(event: MouseEvent) {
      if (!containerRef.current) {
        return;
      }

      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onOutsidePointer);
    return () => document.removeEventListener("mousedown", onOutsidePointer);
  }, []);

  function navigateTo(href: string) {
    trackEvent("docs_search_select", { href });
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!results.length) {
        return;
      }
      setActiveIndex((index) => (index + 1) % results.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!results.length) {
        return;
      }
      setActiveIndex((index) => (index - 1 + results.length) % results.length);
      return;
    }

    if (event.key === "Enter") {
      if (!results.length) {
        return;
      }
      event.preventDefault();
      navigateTo(results[safeActiveIndex].href);
      return;
    }

    if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-xl">
      <label htmlFor="docs-search" className="sr-only">
        Search docs
      </label>
      <input
        id="docs-search"
        type="search"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
          setActiveIndex(0);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="Search docs"
        className="w-full rounded-lg border border-white/15 bg-neutral-900/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400 focus:border-primary-300/50 focus:outline-none"
        role="combobox"
        aria-expanded={open}
        aria-controls="docs-search-results"
        aria-autocomplete="list"
      />

      {open && normalizedQuery ? (
        <div
          id="docs-search-results"
          className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 overflow-hidden rounded-lg border border-white/15 bg-neutral-950/95 shadow-xl"
          role="listbox"
          aria-label="Docs search results"
        >
          {results.length ? (
            <ul className="max-h-80 overflow-y-auto p-1">
              {results.map((result, index) => {
                const active = index === safeActiveIndex;
                return (
                  <li key={result.href}>
                    <button
                      type="button"
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => navigateTo(result.href)}
                      className={`block w-full rounded-md px-3 py-2 text-left transition-colors ${
                        active
                          ? "bg-primary-500/20 text-primary-50"
                          : "text-slate-200 hover:bg-white/5"
                      }`}
                      role="option"
                      aria-selected={active}
                    >
                      <p className="text-sm font-semibold">{result.title}</p>
                      <p className="mt-1 text-xs text-slate-400">{result.snippet}</p>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="px-3 py-3 text-sm text-slate-400">No matching docs found.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}