import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className = "" }: CardProps) {
  return (
    <article
      className={`rounded-xl border border-sky-300/20 bg-sky-950/25 p-8 shadow-[inset_0_1px_1px_rgba(186,230,253,0.08),0_2px_12px_rgba(0,0,0,0.35)] ring-1 ring-sky-400/[0.07] backdrop-blur-xl ${className}`.trim()}
    >
      {children}
    </article>
  );
}
