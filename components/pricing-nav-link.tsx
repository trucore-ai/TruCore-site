import Link from "next/link";
import { getFeatureFlags } from "@/lib/feature-flags";

/**
 * Pricing nav link that reads monetization feature flags server-side.
 * Only renders the link if pricing_page_enabled is true.
 */
export async function PricingNavLink({
  className,
}: {
  className: string;
}) {
  const flags = await getFeatureFlags();
  if (!flags.pricing_page_enabled) return null;
  return (
    <Link href="/pricing" className={className}>
      Pricing
    </Link>
  );
}
