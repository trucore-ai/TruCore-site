import type { ReactNode } from "react";
import { HeadingAnchor } from "@/components/heading-anchor";

type SpecSectionProps = {
  id: string;
  title: string;
  children: ReactNode;
};

export function SpecSection({ id, title, children }: SpecSectionProps) {
  return (
    <section className="space-y-4">
      <HeadingAnchor id={id}>{title}</HeadingAnchor>
      <div className="space-y-3 text-slate-300">{children}</div>
    </section>
  );
}
