"use client";

import type { ReactNode } from "react";
import { DocsBreadcrumbs } from "@/components/docs/docs-breadcrumbs";
import { DocsNavSidebar } from "@/components/docs/docs-nav-sidebar";
import { DocsToc } from "@/components/docs/docs-toc";

type DocsShellProps = {
  children: ReactNode;
};

/**
 * Three-column docs shell providing sidebar navigation, breadcrumbs,
 * main content area, and a right-side table of contents.
 *
 * Layout:
 * - Left: Sidebar (sticky, collapsible on mobile via drawer)
 * - Center: Breadcrumbs + main content
 * - Right: Table of Contents (sticky, collapsible on mobile)
 */
export function DocsShell({ children }: DocsShellProps) {
  return (
    <div className="docs-shell mx-auto max-w-[90rem] px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      <div className="lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-12 xl:grid-cols-[260px_minmax(0,1fr)_220px] xl:gap-14">
        {/* Left: sidebar (mobile drawer trigger + desktop sticky aside) */}
        <DocsNavSidebar />

        {/* Center: Content */}
        <div className="min-w-0">
          <div className="mb-8">
            <DocsBreadcrumbs />
            <div className="gradient-divider mt-5" aria-hidden="true" />
          </div>

          <div id="docs-content" className="docs-content prose-docs">
            {children}
          </div>
        </div>

        {/* Right: single DocsToc instance. It renders a desktop sticky panel
            (hidden xl:block) and a mobile accordion (xl:hidden) internally,
            so there is no need to render it twice. */}
        <DocsToc />
      </div>
    </div>
  );
}
