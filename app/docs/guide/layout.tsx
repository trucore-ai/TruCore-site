import type { ReactNode } from "react";
import { DocsShell } from "@/components/docs/docs-shell";
import { GuideAuthGate } from "@/components/docs/guide-auth-gate";

/**
 * Layout for /docs/guide/* routes.
 *
 * Renders the standard docs shell (sidebar, breadcrumbs, TOC) but wraps
 * children in the GuideAuthGate so only authenticated customers see content.
 */
export default function GuideLayout({ children }: { children: ReactNode }) {
  return (
    <DocsShell>
      <GuideAuthGate>{children}</GuideAuthGate>
    </DocsShell>
  );
}
