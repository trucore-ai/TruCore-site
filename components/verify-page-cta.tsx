"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { isLoggedIn } from "@/lib/customer-auth";
import { trackEvent } from "@/lib/analytics";

interface VerifyPageCtaProps {
  from: "share" | "verify" | "receipts" | "portal";
}

/**
 * Auth-aware CTA buttons for the verify page.
 *
 * - If logged in: "Go to dashboard" (primary) + "See how it works" (secondary)
 * - If not logged in: "Get started free" (primary) + "See how it works" (secondary)
 */
export function VerifyPageCta({ from }: VerifyPageCtaProps) {
  // Derive auth state synchronously (isLoggedIn reads from localStorage)
  const loggedIn = useMemo(() => {
    // Client-side only - on server this returns false
    if (typeof window === "undefined") return false;
    return isLoggedIn();
  }, []);

  useEffect(() => {
    // Track verify page view with source
    trackEvent("verify_page_view", { from });
  }, [from]);

  const handlePrimaryClick = () => {
    if (loggedIn) {
      trackEvent("verify_to_dashboard_click", { from });
    } else {
      trackEvent("verify_to_signup_click", { from });
    }
  };

  const handleSecondaryClick = () => {
    trackEvent("verify_to_docs_click", { from });
  };

  return (
    <div className="flex flex-wrap gap-3">
      <Link
        href={loggedIn ? "/customer/dashboard" : "/signup"}
        onClick={handlePrimaryClick}
        className="inline-flex items-center justify-center rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
      >
        {loggedIn ? "Go to dashboard" : "Get started free"}
      </Link>
      <Link
        href="/docs/first-protected-trade"
        onClick={handleSecondaryClick}
        className="inline-flex items-center justify-center rounded-lg border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
      >
        See how it works
      </Link>
    </div>
  );
}
