"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { TrackedLink } from "@/components/tracked-link";

const navLinks = [
  { href: "/atf", label: "ATF", external: false },
  { href: "https://provengraph.trucore.xyz", label: "ProvenGraph", external: true },
  { href: "https://x402fuel.trucore.xyz", label: "x402Fuel", external: true },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const toggle = useCallback(() => setOpen((prev) => !prev), []);
  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      {/* Hamburger button — visible only on mobile */}
      <button
        type="button"
        onClick={toggle}
        className="ml-auto shrink-0 sm:hidden rounded-lg p-2 text-slate-300 transition-colors hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
      >
        {open ? (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* Mobile overlay menu */}
      {open && (
        <div className="fixed inset-0 z-50 sm:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-neutral-950/80 backdrop-blur-sm"
            onClick={close}
            aria-hidden="true"
          />

          {/* Drawer */}
          <div className="absolute inset-y-0 right-0 w-72 max-w-[85vw] overflow-y-auto border-l border-white/10 bg-neutral-900 p-6">
            <div className="mb-6 flex items-center justify-between">
              <Link
                href="/"
                onClick={close}
                className="flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
              >
                <span className="text-lg font-bold tracking-tight text-white">
                  TruCore
                </span>
              </Link>
              <button
                type="button"
                onClick={close}
                className="rounded p-1 text-slate-400 transition-colors hover:text-slate-100"
                aria-label="Close menu"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <nav aria-label="Mobile navigation" className="space-y-1">
              {navLinks.map((link) =>
                link.external ? (
                  <TrackedLink
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-lg px-4 py-3 text-base font-medium text-slate-200 transition-colors hover:bg-white/[0.06] hover:text-white"
                    eventName="mobile_nav_click"
                    eventProps={{ target: link.label }}
                  >
                    {link.label}
                  </TrackedLink>
                ) : (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={close}
                    className="block rounded-lg px-4 py-3 text-base font-medium text-slate-200 transition-colors hover:bg-white/[0.06] hover:text-white"
                  >
                    {link.label}
                  </Link>
                )
              )}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}