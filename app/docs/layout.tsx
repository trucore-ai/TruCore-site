import type { ReactNode } from "react";
import { Container } from "@/components/ui/container";
import { DocsSidebar } from "@/components/docs-sidebar";

export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <Container className="py-8 sm:py-10">
      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-8">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <DocsSidebar />
        </aside>
        <div className="min-w-0 rounded-xl border border-white/10 bg-neutral-900/30 p-5 sm:p-8">
          {children}
        </div>
      </div>
    </Container>
  );
}