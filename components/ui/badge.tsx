import type { ReactNode } from "react";

type BadgeProps = {
  children: ReactNode;
  className?: string;
};

export function Badge({ children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-primary-300/35 bg-primary-500/15 px-3 py-1 text-xs font-medium tracking-wide text-primary-100 ${className}`.trim()}
    >
      {children}
    </span>
  );
}
