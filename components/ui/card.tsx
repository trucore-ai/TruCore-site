import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className = "" }: CardProps) {
  return (
    <article
      className={`rounded-xl border border-white/15 bg-neutral-950/65 p-6 backdrop-blur-lg ${className}`.trim()}
    >
      {children}
    </article>
  );
}
