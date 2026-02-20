"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { trackEvent } from "@/lib/analytics";

type HeadingAnchorProps = {
  id: string;
  children: ReactNode;
  className?: string;
};

export function HeadingAnchor({ id, children, className = "" }: HeadingAnchorProps) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    const url = new URL(window.location.href);
    url.hash = id;
    const href = `${url.pathname}${url.hash}`;

    try {
      await navigator.clipboard.writeText(url.toString());
      setCopied(true);
      trackEvent("docs_anchor_copy", { id, href });
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <h2 id={id} className={`group scroll-mt-28 text-2xl font-semibold text-slate-100 ${className}`.trim()}>
      <span>{children}</span>
      <button
        type="button"
        onClick={onCopy}
        className="ml-2 inline-flex h-6 w-6 items-center justify-center rounded text-slate-400 opacity-0 transition hover:text-primary-100 focus:opacity-100 focus:outline-none group-hover:opacity-100"
        aria-label={`Copy link to ${typeof children === "string" ? children : "section"}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07L11 4" />
          <path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 0 0 7.07 7.07L13 19" />
        </svg>
      </button>
      <span className="ml-2 text-xs font-medium text-primary-100 opacity-0 transition group-hover:opacity-100">
        {copied ? "Copied" : ""}
      </span>
    </h2>
  );
}