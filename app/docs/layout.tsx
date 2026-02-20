import type { ReactNode } from "react";
import { DocsSearch } from "@/components/docs-search";
import { Container } from "@/components/ui/container";
import { DocsSidebar } from "@/components/docs-sidebar";
import { DOCS_VERSION, LAST_UPDATED } from "@/lib/docs-nav";

export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <Container className="py-8 sm:py-10">
      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-8">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <DocsSidebar />
        </aside>
        <div className="min-w-0 rounded-xl border border-white/10 bg-neutral-900/30 p-5 sm:p-8">
          <div className="mb-6 space-y-4 border-b border-white/10 pb-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center rounded-full border border-primary-300/40 bg-primary-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-primary-50">
                ATF Docs {DOCS_VERSION}
              </span>
              <p className="text-xs text-slate-400">Updated {LAST_UPDATED}</p>
            </div>
            <DocsSearch />
          </div>
          {children}
        </div>
      </div>
    </Container>
  );
}