"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { OpsJourneyFunnel } from "@/components/ops-journey-funnel";

function OpsJourneyFunnelInner() {
  const params = useSearchParams();
  const opsKey = params.get("ops_key");

  if (!opsKey) return null;

  return <OpsJourneyFunnel opsKey={opsKey} />;
}

/**
 * Suspense-wrapped loader that only renders the journey funnel panel
 * when ?ops_key=<key> is present in the URL.
 */
export function OpsJourneyFunnelLoader() {
  return (
    <Suspense fallback={null}>
      <OpsJourneyFunnelInner />
    </Suspense>
  );
}
