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
    <div role="tablist" aria-label={ariaLabel} className="mt-3 flex flex-wrap gap-2">
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
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 ${
              isActive
                ? "border-accent-400 bg-accent-500/20 text-accent-300"
                : "border-primary-300/40 bg-primary-500/20 text-primary-100 hover:border-primary-300/70"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
