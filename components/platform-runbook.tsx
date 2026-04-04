"use client";

import { useState, type ReactNode } from "react";

type Platform = "macLinux" | "windows";

type PlatformRunbookProps = {
  /** Content shown when macOS/Linux is selected */
  macLinux: ReactNode;
  /** Content shown when Windows is selected */
  windows: ReactNode;
  /** Accessible label for the tab group */
  ariaLabel?: string;
};

/**
 * Tabbed container that shows platform-specific CLI runbook content.
 * Defaults to macOS/Linux. No negative wording, no shared command blocks.
 */
export function PlatformRunbook({
  macLinux,
  windows,
  ariaLabel = "Platform",
}: PlatformRunbookProps) {
  const [platform, setPlatform] = useState<Platform>("macLinux");

  const tabClass = (active: boolean) =>
    `rounded-lg border px-3.5 py-1.5 text-xs font-semibold tracking-wide transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 ${
      active
        ? "border-primary-400/40 bg-primary-500/15 text-primary-200"
        : "border-white/[0.08] bg-white/[0.02] text-slate-500 hover:border-white/[0.12] hover:text-slate-300"
    }`;

  return (
    <div data-testid="platform-runbook">
      <div role="tablist" aria-label={ariaLabel} className="flex flex-wrap gap-2">
        <button
          type="button"
          role="tab"
          aria-selected={platform === "macLinux"}
          tabIndex={platform === "macLinux" ? 0 : -1}
          onClick={() => setPlatform("macLinux")}
          className={tabClass(platform === "macLinux")}
        >
          macOS and Linux
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={platform === "windows"}
          tabIndex={platform === "windows" ? 0 : -1}
          onClick={() => setPlatform("windows")}
          className={tabClass(platform === "windows")}
        >
          Windows
        </button>
      </div>

      <div role="tabpanel" className="mt-4">
        {platform === "macLinux" ? macLinux : windows}
      </div>
    </div>
  );
}
