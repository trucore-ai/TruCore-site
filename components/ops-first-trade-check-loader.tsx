"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { OpsFirstTradeCheck } from "@/components/ops-first-trade-check";

function OpsFirstTradeCheckInner() {
  const params = useSearchParams();
  const opsKey = params.get("ops_key");

  if (!opsKey) return null;

  return <OpsFirstTradeCheck opsKey={opsKey} />;
}

/**
 * Suspense-wrapped loader that only renders the first-trade check panel
 * when ?ops_key=<key> is present in the URL.
 */
export function OpsFirstTradeCheckLoader() {
  return (
    <Suspense fallback={null}>
      <OpsFirstTradeCheckInner />
    </Suspense>
  );
}
