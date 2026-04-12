"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isLoggedIn } from "@/lib/customer-auth";

/**
 * Client-side auth gate for /docs/guide/* pages.
 *
 * Uses the same localStorage-based customer auth check as /customer/* routes.
 * Unauthenticated visitors see a sign-in prompt instead of a redirect so they
 * retain context about what they were trying to access.
 */
export function GuideAuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authState, setAuthState] = useState<"loading" | "authenticated" | "unauthenticated">("loading");

  useEffect(() => {
    setAuthState(isLoggedIn() ? "authenticated" : "unauthenticated");
  }, []);

  if (authState === "loading") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-400 border-t-transparent" />
      </div>
    );
  }

  if (authState === "unauthenticated") {
    return (
      <div className="mx-auto max-w-xl space-y-6 py-16 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/[0.08] bg-neutral-900/60">
          <svg
            className="h-6 w-6 text-slate-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-accent-200">
          Sign in to view Customer Guides
        </h1>
        <p className="text-slate-400">
          Customer Guides provide operational guidance for your TruCore integration —
          key lifecycle, rate limits, webhook debugging, and more. Sign in with your
          TruCore account to access them.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/login"
            className="inline-flex items-center rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-400"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center rounded-lg border border-white/[0.08] px-5 py-2.5 text-sm font-semibold text-slate-300 transition-colors hover:border-white/[0.12] hover:text-slate-100"
          >
            Create account
          </Link>
        </div>
        <p className="text-sm text-slate-500">
          Looking for public docs?{" "}
          <Link href="/docs" className="text-primary-200 hover:text-primary-100">
            Browse documentation &rarr;
          </Link>
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
