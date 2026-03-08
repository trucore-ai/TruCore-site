import type { ReactNode } from "react";

type SectionProps = {
  id?: string;
  children: ReactNode;
  className?: string;
  /** Render a subtle gradient divider at the top of the section */
  divider?: boolean;
};

export function Section({ id, children, className = "", divider = false }: SectionProps) {
  return (
    <section id={id} className={`relative py-16 sm:py-20 ${className}`.trim()}>
      {divider && (
        <div
          className="gradient-divider absolute inset-x-0 top-0"
          aria-hidden="true"
        />
      )}
      {children}
    </section>
  );
}
