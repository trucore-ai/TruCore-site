"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { extractTocFromDom, type TocItem } from "@/lib/docs/toc";

/* ── External stores (separate from DocsToc to avoid coupling) ── */

const SERVER_ITEMS: TocItem[] = [];
const SERVER_ACTIVE = "";

let guideItems: TocItem[] = SERVER_ITEMS;
const itemListeners = new Set<() => void>();

function subItems(cb: () => void) {
  itemListeners.add(cb);
  return () => { itemListeners.delete(cb); };
}
function getItems() { return guideItems; }
function getServerItems() { return SERVER_ITEMS; }
function setItems(next: TocItem[]) {
  guideItems = next;
  itemListeners.forEach((cb) => cb());
}

let guideActiveId = "";
const activeListeners = new Set<() => void>();

function subActive(cb: () => void) {
  activeListeners.add(cb);
  return () => { activeListeners.delete(cb); };
}
function getActive() { return guideActiveId; }
function getServerActive() { return SERVER_ACTIVE; }
function setActive(id: string) {
  guideActiveId = id;
  activeListeners.forEach((cb) => cb());
}

/* ── Component ── */

const MIN_SECTIONS = 4;

export function GuideProgress() {
  const allItems = useSyncExternalStore(subItems, getItems, getServerItems);
  const activeId = useSyncExternalStore(subActive, getActive, getServerActive);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Only h2-level sections (skip h3 sub-headings)
  const sections = allItems.filter((item) => item.level === 2);

  useEffect(() => {
    setItems(SERVER_ITEMS);
    setActive(SERVER_ACTIVE);
    setOpen(false);

    const content = document.getElementById("docs-content");
    if (!content) return;

    const tocItems = extractTocFromDom(content);
    setItems(tocItems);

    const h2Items = tocItems.filter((i) => i.level === 2);
    if (h2Items.length < MIN_SECTIONS) return;

    const headingElements = h2Items
      .map((item) => document.getElementById(item.id))
      .filter(Boolean) as HTMLElement[];

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) {
          setActive(visible[0].target.id);
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 },
    );

    headingElements.forEach((el) => observerRef.current?.observe(el));

    return () => { observerRef.current?.disconnect(); };
  }, [pathname]);

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
      window.history.replaceState(null, "", `#${id}`);
      setActive(id);
      setOpen(false);
    },
    [],
  );

  if (sections.length < MIN_SECTIONS) return null;

  const activeIndex = sections.findIndex((s) => s.id === activeId);
  const currentSection = activeIndex >= 0 ? activeIndex + 1 : 1;
  const total = sections.length;
  const progressPct = (currentSection / total) * 100;

  return (
    <div
      className="mb-8 rounded-lg border border-white/[0.06] bg-neutral-900/40"
      data-testid="guide-progress"
    >
      {/* Header bar with progress */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
        aria-expanded={open}
        aria-controls="guide-progress-list"
      >
        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary-300/70">
          In this guide
        </span>
        <span className="text-[11px] tabular-nums text-slate-500">
          Section {currentSection} of {total}
        </span>

        {/* Mini progress bar */}
        <span
          className="relative ml-auto hidden h-1 w-20 overflow-hidden rounded-full bg-white/[0.06] sm:block"
          aria-hidden="true"
        >
          <span
            className="absolute inset-y-0 left-0 rounded-full bg-primary-400/50 transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </span>

        <svg
          className={`h-3.5 w-3.5 shrink-0 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expandable section list */}
      {open && (
        <ol
          id="guide-progress-list"
          className="border-t border-white/[0.04] px-4 py-3"
        >
          {sections.map((section, i) => {
            const isActive = section.id === activeId;
            const isPast = activeIndex >= 0 && i < activeIndex;

            return (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  onClick={(e) => handleClick(e, section.id)}
                  className={`flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors ${
                    isActive
                      ? "font-medium text-primary-200"
                      : isPast
                        ? "text-slate-500"
                        : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                      isActive
                        ? "bg-primary-500/20 text-primary-300"
                        : isPast
                          ? "bg-white/[0.04] text-slate-600"
                          : "bg-white/[0.04] text-slate-500"
                    }`}
                  >
                    {i + 1}
                  </span>
                  {section.text}
                </a>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
