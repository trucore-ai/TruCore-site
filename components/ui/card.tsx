import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className = "" }: CardProps) {
  return (
    <article
      className={`rounded-xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm ${className}`.trim()}
    >
      {children}
    </article>
  );
}
