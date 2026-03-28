"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { OpsRouteFailures } from "@/components/ops-route-failures";

function OpsRouteFailuresInner() {
  const params = useSearchParams();
  const opsKey = params.get("ops_key");

  if (!opsKey) return null;

  return <OpsRouteFailures opsKey={opsKey} />;
}

/**
 * Suspense-wrapped loader that only renders the ops panel
 * when ?ops_key=<key> is present in the URL.
 */
export function OpsRouteFailuresLoader() {
  return (
    <Suspense fallback={null}>
      <OpsRouteFailuresInner />
    </Suspense>
  );
}
