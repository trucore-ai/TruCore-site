import type { ReactNode } from "react";
import { GuideAuthGate } from "@/components/docs/guide-auth-gate";
import { GuideProgress } from "@/components/docs/guide-progress";

/**
 * Layout for /docs/guide/* routes.
 *
 * The parent /docs/layout.tsx already provides DocsShell (sidebar,
 * breadcrumbs, search, TOC). This layout adds the auth gate so only
 * authenticated customers see guide content, and the in-page progress
 * affordance for long guides.
 */
export default function GuideLayout({ children }: { children: ReactNode }) {
  return (
    <GuideAuthGate>
      <GuideProgress />
      {children}
    </GuideAuthGate>
  );
}
