"use client";

export type OsTab = {
  id: "mac" | "linux" | "windows";
  label: string;
};

type OsTabsProps = {
  tabs: OsTab[];
  activeTab: OsTab["id"];
  onChange: (tabId: OsTab["id"]) => void;
  ariaLabel?: string;
};

export function OsTabs({ tabs, activeTab, onChange, ariaLabel = "Operating systems" }: OsTabsProps) {
  return (
    <div role="tablist" aria-label={ariaLabel} className="mt-4 flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.id)}
            className={`rounded-lg border px-3.5 py-1.5 text-xs font-semibold tracking-wide transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 ${
              isActive
                ? "border-primary-400/40 bg-primary-500/15 text-primary-200"
                : "border-white/[0.08] bg-white/[0.02] text-slate-500 hover:border-white/[0.14] hover:text-slate-300"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
