import type { ReactNode } from "react";

type BadgeProps = {
  children: ReactNode;
  className?: string;
};

export function Badge({ children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-primary-300/40 bg-primary-500/20 px-5 py-2 text-base font-semibold tracking-wide text-primary-50 ${className}`.trim()}
    >
      {children}
    </span>
  );
}
