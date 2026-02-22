import { type ReactNode } from "react";

/* -- Glass pane with visible diagonal film reflection ----------
 *  Each card gets a prominent diagonal reflective film strip
 *  (like real glass), plus an animated sweeping highlight.
 *  CSS custom properties on .glass-panel nth-child selectors
 *  stagger timing and angles so every card looks unique.
 *
 *  Exports:
 *    GlassFrontOverlay  - film + sheen overlay for Card
 *    GlassInnerPanel    - smaller nested glass sub-card
 * ---------------------------------------------------------------- */

/* -- Front-face overlay (renders inside the Card article) --------- */

export function GlassFrontOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden rounded-[inherit]">
      {/* ── Static diagonal film / glare strip ── */}
      <div className="glass-film" />

      {/* ── Small bright sparkle dots at edges ── */}
      <div className="glass-sparkle glass-sparkle-tl" />
      <div className="glass-sparkle glass-sparkle-br" />

      {/* ── Subtle top-edge highlight ── */}
      <div
        className="absolute inset-x-0 top-0"
        style={{
          height: 1,
          background:
            "linear-gradient(90deg, transparent 0%, rgba(180,220,248,0.06) 20%, rgba(200,235,255,0.1) 50%, rgba(180,220,248,0.06) 80%, transparent 100%)",
        }}
      />

      {/* ── Drifting reflection spot ── */}
      <div className="glass-reflection-spot" />

      {/* ── Soft ambient glow near top ── */}
      <div
        className="absolute inset-0 rounded-[inherit]"
        style={{
          background:
            "radial-gradient(100% 60% at 50% -10%, rgba(200,235,255,0.03) 0%, transparent 55%)",
          mixBlendMode: "screen",
        }}
      />
    </div>
  );
}

/* -- Inner glass panel (for nested sub-cards inside a parent card) -- */

export function GlassInnerPanel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative h-full overflow-hidden rounded-lg border border-primary-300/10 px-7 py-5 ${className}`.trim()}
      style={{
        background:
          "linear-gradient(180deg, rgba(8,28,48,0.18) 0%, rgba(3,12,24,0.26) 100%)",
        backdropFilter: "blur(1px) saturate(105%)",
        WebkitBackdropFilter: "blur(1px) saturate(105%)",
      }}
    >
      {/* Top edge highlight */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 rounded-t-[inherit]"
        style={{
          height: 1,
          background:
            "linear-gradient(90deg, transparent 0%, rgba(180,225,248,0.08) 20%, rgba(190,230,255,0.10) 50%, rgba(180,225,248,0.08) 80%, transparent 100%)",
        }}
      />
      {/* Inset glow ring */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[inherit]"
        style={{
          boxShadow: "inset 0 0 0 1px rgba(150,215,245,0.03)",
        }}
      />
      <div className="relative z-[2]">{children}</div>
    </div>
  );
}
