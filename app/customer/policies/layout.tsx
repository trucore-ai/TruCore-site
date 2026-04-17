/**
 * Policies route gate — server component.
 *
 * Reads POLICIES_ENABLED from the server environment at request time.
 * When set to "false", returns a 404 so the route is unreachable without
 * any client-side code changes.  All other values (including unset) allow
 * the route through — opt-out semantics mean existing deployments are
 * unaffected until the variable is explicitly set to "false".
 *
 * Rollback procedure:
 *   1. In Vercel dashboard → Project → Settings → Environment Variables,
 *      set POLICIES_ENABLED = false (production scope).
 *   2. Trigger a redeploy (Vercel dashboard → Deployments → Redeploy, or
 *      push a no-op commit).
 *   3. Verify: unauthenticated and authenticated GET /customer/policies
 *      both return 404.
 *   4. To re-enable: set POLICIES_ENABLED = true (or delete the variable)
 *      and redeploy.
 *
 * See: docs/policy-v1-launch.md § Rollback Switch
 */

import { notFound } from "next/navigation";
import type { ReactNode } from "react";

export default function PoliciesLayout({ children }: { children: ReactNode }) {
  if (process.env.POLICIES_ENABLED === "false") {
    notFound();
  }
  return <>{children}</>;
}
