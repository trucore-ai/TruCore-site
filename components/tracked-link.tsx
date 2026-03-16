"use client";

import { trackEvent } from "@/lib/analytics";
import type { MouseEvent, ReactNode } from "react";

type TrackedLinkProps = {
  href: string;
  children: ReactNode;
  eventName: string;
  eventProps?: Record<string, string | number | boolean>;
  className?: string;
  target?: string;
  rel?: string;
  ariaLabel?: string;
  "data-testid"?: string;
};

export function TrackedLink({
  href,
  children,
  eventName,
  eventProps,
  className,
  target,
  rel,
  ariaLabel,
  "data-testid": testId,
}: TrackedLinkProps) {
  const baseClassName =
    "rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950";

  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.defaultPrevented) {
      return;
    }
    trackEvent(eventName, eventProps);
  };

  return (
    <a
      href={href}
      className={className ? `${baseClassName} ${className}` : baseClassName}
      target={target}
      rel={rel}
      aria-label={ariaLabel}
      data-testid={testId}
      onClick={onClick}
    >
      {children}
    </a>
  );
}
