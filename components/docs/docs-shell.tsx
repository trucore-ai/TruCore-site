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
    <div className="docs-shell mx-auto max-w-[90rem] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-8 xl:grid-cols-[260px_minmax(0,1fr)_220px]">
        {/* Left: sidebar (mobile drawer trigger + desktop sticky aside) */}
        <DocsNavSidebar />

        {/* Center: Content */}
        <div className="min-w-0">
          <div className="mb-4">
            <DocsBreadcrumbs />
          </div>

          {/* Mobile TOC (shown before content on smaller screens) */}
          <div className="mb-4 xl:hidden">
            <DocsToc />
          </div>

          <div id="docs-content" className="docs-content prose-docs">
            {children}
          </div>
        </div>

        {/* Right: Desktop TOC */}
        <div className="hidden xl:block">
          <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto">
            <DocsToc />
          </div>
        </div>
      </div>
    </div>
  );
}
