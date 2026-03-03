"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { extractTocFromDom, type TocItem } from "@/lib/docs/toc";

/* ── External store for TOC items (avoids setState in useEffect) ── */

let tocSnapshot: TocItem[] = [];
const tocListeners = new Set<() => void>();

// Stable module-level constants for server snapshots — must not create new
// references on each call or React will throw "getServerSnapshot should be
// cached to avoid an infinite loop".
const SERVER_TOC_SNAPSHOT: TocItem[] = [];
const SERVER_ACTIVE_SNAPSHOT = "";

function subscribeToc(callback: () => void) {
  tocListeners.add(callback);
  return () => {
    tocListeners.delete(callback);
  };
}

function getTocSnapshot() {
  return tocSnapshot;
}

function getServerTocSnapshot() {
  return SERVER_TOC_SNAPSHOT;
}

function setTocItems(next: TocItem[]) {
  tocSnapshot = next;
  tocListeners.forEach((cb) => cb());
}

/* ── External store for active heading id ── */

let activeSnapshot = "";
const activeListeners = new Set<() => void>();

function subscribeActive(callback: () => void) {
  activeListeners.add(callback);
  return () => {
    activeListeners.delete(callback);
  };
}

function getActiveSnapshot() {
  return activeSnapshot;
}

function getServerActiveSnapshot() {
  return SERVER_ACTIVE_SNAPSHOT;
}

function setActiveHeading(id: string) {
  activeSnapshot = id;
  activeListeners.forEach((cb) => cb());
}

/**
 * Right-column Table of Contents that auto-generates entries from h2/h3
 * headings in the main content area. Highlights the currently visible
 * section using IntersectionObserver. Respects reduced-motion preferences.
 */
export function DocsToc() {
  const items = useSyncExternalStore(subscribeToc, getTocSnapshot, getServerTocSnapshot);
  const activeId = useSyncExternalStore(subscribeActive, getActiveSnapshot, getServerActiveSnapshot);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Scan the content area for headings once mounted
  useEffect(() => {
    const content = document.getElementById("docs-content");
    if (!content) return;

    const tocItems = extractTocFromDom(content);
    setTocItems(tocItems);

    if (tocItems.length === 0) return;

    // Observe each heading for active-section highlighting
    const headingElements = tocItems
      .map((item) => document.getElementById(item.id))
      .filter(Boolean) as HTMLElement[];

    observerRef.current = new IntersectionObserver(
      (entries) => {
        // Pick the first visible entry from the top
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) {
          setActiveHeading(visible[0].target.id);
        }
      },
      {
        rootMargin: "-80px 0px -60% 0px",
        threshold: 0,
      },
    );

    headingElements.forEach((el) => observerRef.current?.observe(el));

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
      event.preventDefault();
      const target = document.getElementById(id);
      if (!target) return;

      const prefersReduced =
        document.documentElement.dataset.reduceMotion === "true" ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      target.scrollIntoView({
        behavior: prefersReduced ? "instant" : "smooth",
        block: "start",
      });

      // Update URL hash without scrolling
      window.history.replaceState(null, "", `#${id}`);
      setActiveHeading(id);
    },
    [],
  );

  if (items.length === 0) return null;

  return (
    <nav aria-label="Table of contents" className="docs-toc">
      {/* Desktop: always visible */}
      <div className="hidden xl:block">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
          On this page
        </p>
        <ul className="space-y-1 border-l border-white/10">
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                onClick={(e) => handleClick(e, item.id)}
                className={`block border-l-2 py-1 text-sm leading-snug transition-colors ${
                  item.level === 3 ? "pl-6" : "pl-4"
                } ${
                  activeId === item.id
                    ? "border-primary-400 font-medium text-primary-200"
                    : "border-transparent text-slate-400 hover:border-slate-500 hover:text-slate-200"
                }`}
              >
                {item.text}
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* Mobile: collapsible accordion */}
      <MobileToc items={items} activeId={activeId} onNavigate={handleClick} />
    </nav>
  );
}

/* ── Mobile TOC (collapsible) ── */

type MobileTocProps = {
  items: TocItem[];
  activeId: string;
  onNavigate: (event: React.MouseEvent<HTMLAnchorElement>, id: string) => void;
};

function MobileToc({ items, activeId, onNavigate }: MobileTocProps) {
  const [open, setOpen] = useState(false);

  if (items.length === 0) return null;

  return (
    <div className="xl:hidden">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-neutral-900/50 px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:border-white/20 hover:text-slate-100"
        aria-expanded={open}
      >
        <span>On this page</span>
        <svg
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <ul className="mt-2 space-y-1 border-l border-white/10 pl-1">
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                onClick={(e) => {
                  onNavigate(e, item.id);
                  setOpen(false);
                }}
                className={`block py-1 text-sm leading-snug ${
                  item.level === 3 ? "pl-6" : "pl-4"
                } ${
                  activeId === item.id
                    ? "font-medium text-primary-200"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {item.text}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
