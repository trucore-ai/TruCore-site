/* ────────────────────────────────────────────────────────────────
 *  PortalPremiumSection - hidden gating wrapper for premium
 *  analytics sections in the tenant-facing portal.
 *
 *  Renders children only when the tenant has an active premium
 *  analytics entitlement (preview, paid, or bundled).
 *  For inactive/expired tenants, renders nothing - no paywall,
 *  no upgrade prompt, no visible indication of gating.
 *
 *  Usage:
 *    <PortalPremiumSection entitlement={premiumEntitlement}>
 *      <EnhancedUsageTrends ... />
 *    </PortalPremiumSection>
 *
 *  Internal only. No public pricing or upsell copy.
 * ──────────────────────────────────────────────────────────── */

import type { ReactNode } from "react";
import type { PremiumAnalyticsEntitlement } from "@/lib/premium-analytics";
import { hasPremiumAnalytics } from "@/lib/premium-analytics";

type Props = {
  entitlement: PremiumAnalyticsEntitlement | undefined | null;
  children: ReactNode;
};

export function PortalPremiumSection({ entitlement, children }: Props) {
  if (!hasPremiumAnalytics(entitlement)) {
    return null;
  }
  return <>{children}</>;
}
