"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { sections, type DocsNavSection } from "@/lib/docs-nav";

const STORAGE_KEY = "trucore:docs-nav-open";

/* ── External store for open/closed section state ── */
// Using an external store avoids calling setState inside useEffect (which
// violates the react-hooks/set-state-in-effect lint rule in this project).

function buildAllOpenState(): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  for (const section of sections) {
    result[section.title] = true;
  }
  return result;
}

// SERVER_OPEN_SECTIONS_SNAPSHOT is the stable constant used as the server
// snapshot AND as the initial store value, so Object.is() comparison during
// React hydration passes (same object reference on both sides).
const SERVER_OPEN_SECTIONS_SNAPSHOT: Record<string, boolean> = buildAllOpenState();

let openSectionsStore: Record<string, boolean> = SERVER_OPEN_SECTIONS_SNAPSHOT;
const openSectionsListeners = new Set<() => void>();

function subscribeOpenSections(cb: () => void) {
  openSectionsListeners.add(cb);
  return () => {
    openSectionsListeners.delete(cb);
  };
}

function getOpenSectionsSnapshot() {
  return openSectionsStore;
}

function getServerOpenSectionsSnapshot() {
  return SERVER_OPEN_SECTIONS_SNAPSHOT;
}

function setOpenSectionsStore(next: Record<string, boolean>) {
  openSectionsStore = next;
  openSectionsListeners.forEach((cb) => cb());
}

/* ── localStorage helpers ── */

function readOpenState(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

function persistOpenState(state: Record<string, boolean>) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage errors are non-blocking.
  }
}

function isActivePath(pathname: string, href: string): boolean {
  return pathname === href;
}

/* ── Sidebar search (built-in) ── */

function filterSections(query: string, navSections: DocsNavSection[]): DocsNavSection[] {
  if (!query.trim()) return navSections;

  const normalized = query.trim().toLowerCase();

  return navSections
    .map((section) => {
      const matchedItems = section.items.filter(
        (item) =>
          item.title.toLowerCase().includes(normalized) ||
          item.description.toLowerCase().includes(normalized),
      );

      if (matchedItems.length === 0) return null;

      return { ...section, items: matchedItems };
    })
    .filter(Boolean) as DocsNavSection[];
}

/* ── Main sidebar component ── */

export function DocsNavSidebar() {
  const pathname = usePathname();
  // openSections comes from an external store so we can hydrate from
  // localStorage in a useEffect without triggering the setState-in-effect rule.
  const openSections = useSyncExternalStore(
    subscribeOpenSections,
    getOpenSectionsSnapshot,
    getServerOpenSectionsSnapshot,
  );
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Sync from localStorage after mount. Updates the external store (not
  // React state) so this is an allowed "external system update" pattern.
  useEffect(() => {
    const stored = readOpenState();
    if (Object.keys(stored).length === 0) return;

    const next = { ...getOpenSectionsSnapshot() };
    for (const key of Object.keys(stored)) {
      if (key in next) next[key] = stored[key];
    }
    setOpenSectionsStore(next);
  }, []);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const toggleSection = useCallback((title: string) => {
    const next = { ...getOpenSectionsSnapshot(), [title]: !getOpenSectionsSnapshot()[title] };
    persistOpenState(next);
    setOpenSectionsStore(next);
  }, []);

  const filtered = useMemo(() => filterSections(search, sections), [search]);

  const sidebarContent = (onNavigate?: () => void) => (
    <div className="flex h-full flex-col">
      {/* Search input */}
      <div className="mb-4">
        <label htmlFor="docs-sidebar-search" className="sr-only">
          Search docs
        </label>
        <div className="relative">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            id="docs-sidebar-search"
            type="search"
            placeholder="Search docs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-neutral-900/60 py-2 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
          />
        </div>
      </div>

      {/* Nav sections */}
      <nav aria-label="Documentation" className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <p className="px-1 py-4 text-sm text-slate-500">No results found.</p>
        )}
        {filtered.map((section) => {
          const isOpen = openSections[section.title] ?? true;

          return (
            <div key={section.title} className="mb-4">
              <button
                type="button"
                onClick={() => toggleSection(section.title)}
                className="flex w-full items-center justify-between rounded px-1 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-slate-400 transition-colors hover:text-slate-200"
                aria-expanded={isOpen}
              >
                <span>{section.title}</span>
                <svg
                  className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isOpen && (
                <ul className="mt-1 space-y-0.5">
                  {section.items.map((item) => {
                    const active = isActivePath(pathname, item.href);

                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={onNavigate}
                          className={`block rounded-md px-3 py-1.5 text-sm transition-colors ${
                            active
                              ? "bg-primary-500/15 font-medium text-primary-200"
                              : "text-slate-300 hover:bg-white/5 hover:text-slate-100"
                          }`}
                        >
                          {item.title}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );

  return (
    <>
      {/* Mobile drawer trigger */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-neutral-900/50 px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:border-white/20 hover:text-slate-100"
          aria-label="Open documentation navigation"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          Docs Menu
        </button>
      </div>

      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-neutral-950/80 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer panel */}
          <div className="absolute inset-y-0 left-0 w-80 max-w-[85vw] overflow-y-auto border-r border-white/10 bg-neutral-900 p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-bold uppercase tracking-[0.12em] text-slate-300">
                Docs Navigation
              </p>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="rounded p-1 text-slate-400 transition-colors hover:text-slate-100"
                aria-label="Close navigation"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {sidebarContent(closeDrawer)}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside
        className="docs-sidebar hidden lg:block lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto"
        aria-label="Documentation navigation"
      >
        {sidebarContent()}
      </aside>
    </>
  );
}
