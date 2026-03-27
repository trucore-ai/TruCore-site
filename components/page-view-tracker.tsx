"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/track";

type PageViewTrackerProps = {
  page: string;
};

/**
 * Drop into any server (or client) page to fire a page_view event on mount.
 * Renders nothing visible.
 */
export function PageViewTracker({ page }: PageViewTrackerProps) {
  useEffect(() => {
    trackEvent("page_view", { page });
  }, [page]);

  return null;
}
