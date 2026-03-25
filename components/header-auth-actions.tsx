"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { isLoggedIn } from "@/lib/customer-auth";

// localStorage does not emit events for same-tab mutations, and auth state
// only changes on navigation (login/signup/logout redirect), so a no-op
// subscribe is fine here.
const subscribe = () => () => {};

function getSnapshot(): boolean | null {
  return isLoggedIn();
}

function getServerSnapshot(): boolean | null {
  return null;
}

export function HeaderAuthActions() {
  const authed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Server render / pre-hydration: render nothing to avoid mismatch
  if (authed === null) return null;

  if (authed) {
    return (
      <Link
        href="/customer/dashboard"
        className="rounded-lg bg-accent-500 px-4 py-1.5 text-xs font-semibold text-neutral-950 transition-all duration-200 hover:bg-accent-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 sm:text-sm"
      >
        Dashboard
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/login"
        className="rounded-md px-3 py-1.5 text-xs font-medium text-slate-300 transition-all duration-200 hover:bg-white/[0.05] hover:text-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 sm:text-sm"
      >
        Log In
      </Link>
      <Link
        href="/signup"
        className="rounded-lg bg-accent-500 px-4 py-1.5 text-xs font-semibold text-neutral-950 transition-all duration-200 hover:bg-accent-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 sm:text-sm"
      >
        Sign Up
      </Link>
    </div>
  );
}
