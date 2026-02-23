"use client";

import { useEffect, useId, useRef, useState } from "react";
import { trackEvent } from "@/lib/analytics";

export function Sha256InfoPopover() {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || buttonRef.current?.contains(target)) {
        return;
      }

      setIsOpen(false);
      buttonRef.current?.focus();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      event.preventDefault();
      setIsOpen(false);
      buttonRef.current?.focus();
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  const togglePopover = () => {
    setIsOpen((prev) => {
      const next = !prev;
      if (next) {
        trackEvent("whitepaper_hash_info_open", { location: "whitepaper_page" });
      }
      return next;
    });
  };

  return (
    <div className="relative inline-flex">
      <button
        ref={buttonRef}
        type="button"
        onClick={togglePopover}
        aria-label="What is SHA-256?"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={titleId}
        className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-primary-300/40 bg-primary-500/15 text-xs font-semibold text-primary-100 transition-colors hover:bg-primary-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
      >
        ?
      </button>

      {isOpen ? (
        <div
          ref={panelRef}
          id={titleId}
          role="dialog"
          aria-modal="false"
          aria-label="What is SHA-256?"
          className="absolute left-0 top-8 z-20 w-[20rem] rounded-xl border border-white/10 bg-neutral-950/95 p-4 text-sm text-slate-200 shadow-xl"
        >
          <p className="font-semibold text-primary-100">What is SHA-256?</p>
          <ul className="mt-2 space-y-2 text-sm text-slate-300">
            <li>SHA-256 is a cryptographic fingerprint of the PDF.</li>
            <li>If the document changes by even 1 byte, the fingerprint changes.</li>
            <li>Match the fingerprint to verify you have the authentic document.</li>
          </ul>
          <p className="mt-3 text-xs text-slate-400">
            Tip: You can verify in-browser (no upload) or using your terminal.
          </p>
        </div>
      ) : null}
    </div>
  );
}