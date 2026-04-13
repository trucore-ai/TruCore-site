import type { ReactNode } from "react";
import { GuideAuthGate } from "@/components/docs/guide-auth-gate";

/**
 * Layout for /docs/guide/* routes.
 *
 * The parent /docs/layout.tsx already provides DocsShell (sidebar,
 * breadcrumbs, search, TOC). This layout only adds the auth gate so
 * only authenticated customers see guide content.
 */
export default function GuideLayout({ children }: { children: ReactNode }) {
  return <GuideAuthGate>{children}</GuideAuthGate>;
}
