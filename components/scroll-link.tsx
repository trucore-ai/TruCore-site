"use client";

import { useCallback, type ReactNode, type MouseEvent } from "react";

type ScrollLinkProps = {
  targetId: string;
  children: ReactNode;
  className?: string;
};

/**
 * A client-side link that smoothly scrolls to a target element by ID.
 * If the element doesn't exist on the current page (cross-page link),
 * navigates to /#targetId so the browser lands on the right section.
 */
export function ScrollLink({ targetId, children, className = "" }: ScrollLinkProps) {
  const handleClick = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      const el = document.getElementById(targetId);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        window.history.pushState(null, "", `#${targetId}`);
      } else {
        // Element not on this page — let the browser navigate to /#targetId
        e.preventDefault();
        window.location.href = `/#${targetId}`;
      }
    },
    [targetId],
  );

  return (
    <a href={`/#${targetId}`} className={className} onClick={handleClick}>
      {children}
    </a>
  );
}
