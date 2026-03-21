/**
 * Feature flags resolver.
 *
 * Fetches monetization settings and the public feature catalog from the
 * ATF backend to determine which UI features are enabled.
 *
 * Used by pricing-nav-link.tsx (and other gated UI components) to
 * conditionally render features based on operator configuration.
 */

import {
  fetchPublicFeatureCatalog,
  type PublicFeatureEntry,
} from "@/lib/dashboard-client";

// ---------------------------------------------------------------------------
// Monetization flags (from /admin/monetization or env fallback)
// ---------------------------------------------------------------------------

interface FeatureFlags {
  pricing_page_enabled: boolean;
  upgrade_cta_enabled: boolean;
  monetization_enabled: boolean;
}

/**
 * Resolve top-level feature flags for UI rendering.
 *
 * Attempts to fetch from ATF backend; falls back to env-based defaults
 * if the backend is unreachable (graceful degradation).
 */
export async function getFeatureFlags(): Promise<FeatureFlags> {
  try {
    const base = process.env.NEXT_PUBLIC_ATF_DASHBOARD_URL?.replace(
      /\/+$/,
      "",
    );
    if (!base) {
      return _envDefaults();
    }

    const headers: Record<string, string> = { Accept: "application/json" };
    const apiKey = process.env.ATF_API_KEY;
    if (apiKey) {
      headers["x-api-key"] = apiKey;
    }

    const res = await fetch(`${base}/admin/monetization`, {
      headers,
      next: { revalidate: 30 },
    });

    if (!res.ok) return _envDefaults();

    const json = await res.json();
    const settings = json?.settings ?? json?.result?.settings ?? json;

    return {
      pricing_page_enabled: Boolean(settings?.pricing_page_enabled),
      upgrade_cta_enabled: Boolean(settings?.upgrade_cta_enabled),
      monetization_enabled: Boolean(settings?.monetization_enabled),
    };
  } catch {
    return _envDefaults();
  }
}

function _envDefaults(): FeatureFlags {
  return {
    pricing_page_enabled:
      process.env.ATF_PRICING_PAGE_ENABLED === "true",
    upgrade_cta_enabled:
      process.env.ATF_UPGRADE_CTA_ENABLED === "true",
    monetization_enabled:
      process.env.ATF_MONETIZATION_ENABLED === "true",
  };
}

// ---------------------------------------------------------------------------
// Public feature catalog helpers
// ---------------------------------------------------------------------------

/**
 * Fetch the public feature catalog, optionally filtered by surface.
 * Returns empty array on failure (graceful degradation).
 */
export async function getPublicFeatures(
  surface?: string,
): Promise<PublicFeatureEntry[]> {
  const result = await fetchPublicFeatureCatalog(surface);
  if (!result.ok) return [];
  return result.data.features;
}

/** Group features by required_plan for pricing display. */
export function groupFeaturesByPlan(
  features: PublicFeatureEntry[],
): Record<string, PublicFeatureEntry[]> {
  const groups: Record<string, PublicFeatureEntry[]> = {
    free: [],
    pro: [],
    enterprise: [],
  };
  for (const f of features) {
    const plan = f.required_plan;
    if (plan in groups) {
      groups[plan].push(f);
    }
  }
  return groups;
}
