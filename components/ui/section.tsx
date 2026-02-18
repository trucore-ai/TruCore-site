import type { ReactNode } from "react";

type SectionProps = {
  id?: string;
  children: ReactNode;
  className?: string;
};

export function Section({ id, children, className = "" }: SectionProps) {
  return (
    <section id={id} className={`py-12 sm:py-16 ${className}`.trim()}>
      {children}
    </section>
  );
}
