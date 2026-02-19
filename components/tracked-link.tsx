"use client";

import { trackEvent } from "@/lib/analytics";
import type { ReactNode } from "react";

type TrackedLinkProps = {
  href: string;
  children: ReactNode;
  eventName: string;
  eventProps?: Record<string, string | number | boolean>;
  className?: string;
  target?: string;
  rel?: string;
};

export function TrackedLink({
  href,
  children,
  eventName,
  eventProps,
  className,
  target,
  rel,
}: TrackedLinkProps) {
  return (
    <a
      href={href}
      className={className}
      target={target}
      rel={rel}
      onClick={() => trackEvent(eventName, eventProps)}
    >
      {children}
    </a>
  );
}
