import type { ReactNode } from "react";

type AdmonitionVariant = "note" | "warning" | "tip";

type AdmonitionProps = {
  variant?: AdmonitionVariant;
  title?: string;
  children: ReactNode;
};

const config: Record<AdmonitionVariant, { icon: string; defaultTitle: string; classes: string }> = {
  note: {
    icon: "ℹ",
    defaultTitle: "Note",
    classes: "border-primary-400/30 bg-primary-500/5 text-primary-100",
  },
  warning: {
    icon: "⚠",
    defaultTitle: "Warning",
    classes: "border-accent-400/30 bg-accent-500/5 text-accent-400",
  },
  tip: {
    icon: "💡",
    defaultTitle: "Tip",
    classes: "border-emerald-400/30 bg-emerald-500/5 text-emerald-300",
  },
};

/**
 * Lightweight callout/admonition component for documentation. Renders a
 * styled box with an icon, title, and body content.
 */
export function Admonition({ variant = "note", title, children }: AdmonitionProps) {
  const cfg = config[variant];

  return (
    <aside
      role="note"
      className={`my-4 rounded-lg border-l-4 px-4 py-3 ${cfg.classes}`}
    >
      <p className="mb-1 flex items-center gap-2 text-sm font-semibold">
        <span aria-hidden="true">{cfg.icon}</span>
        {title ?? cfg.defaultTitle}
      </p>
      <div className="text-sm leading-relaxed text-slate-300">{children}</div>
    </aside>
  );
}
