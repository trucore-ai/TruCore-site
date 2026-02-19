import type { ReactNode } from "react";

type BadgeProps = {
  children: ReactNode;
  className?: string;
};

export function Badge({ children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-primary-300/40 bg-primary-500/20 px-4 py-1.5 text-sm font-semibold tracking-wide text-primary-50 ${className}`.trim()}
    >
      {children}
    </span>
  );
}
