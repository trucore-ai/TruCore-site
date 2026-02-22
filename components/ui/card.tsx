"use client";

import { type ReactNode, useMemo, useRef, useCallback } from "react";
import { GlassFrontOverlay } from "@/components/ui/glass-slab-canvas";

type CardProps = {
  children: ReactNode;
  className?: string;
};

/** Small deterministic-looking random helper seeded per render */
function rand(min: number, max: number) {
  return Math.round((min + Math.random() * (max - min)) * 10) / 10;
}

export function Card({ children, className = "" }: CardProps) {
  const flashRef = useRef<HTMLDivElement>(null);

  /* Generate truly random reflection parameters per card instance */
  const vars = useMemo(
    () =>
      ({
        "--sheen-delay": `${rand(0, 3)}s`,
        "--sheen-dur": `${rand(25, 35)}s`,
        "--sheen-angle": `${rand(95, 130)}deg`,
        "--reflect-delay": `${rand(0, 3)}s`,
        "--reflect-dur": `${rand(8, 14)}s`,
        "--film-angle": `${rand(115, 155)}deg`,
        "--film-x": `${rand(40, 78)}%`,
        "--film-y": `${rand(15, 45)}%`,
        "--sparkle-tl-x": `${rand(5, 22)}%`,
        "--sparkle-tl-y": `${rand(4, 18)}%`,
        "--sparkle-br-x": `${rand(74, 95)}%`,
        "--sparkle-br-y": `${rand(76, 95)}%`,
        "--flash-delay": `${rand(0, 5)}s`,
        "--flash-dur": `${rand(15, 20)}s`,
      }) as React.CSSProperties,
    [],
  );

  /* Fire a bright light-band sweep via Web Animations API (reliable, no class-toggle) */
  const onMouseEnter = useCallback(() => {
    const el = flashRef.current;
    if (!el) return;
    // Cancel any in-flight animation and re-run
    el.getAnimations().forEach((a) => a.cancel());
    el.animate(
      [
        { transform: "translateX(-130%)", opacity: 1 },
        { transform: "translateX(130%)", opacity: 0.4 },
      ],
      {
        duration: 600,
        easing: "cubic-bezier(0.22, 0.68, 0.32, 1)",
        fill: "forwards",
      },
    );
  }, []);

  return (
    <article
      className={`glass-panel h-full rounded-xl p-8 ${className}`.trim()}
      style={vars}
      onMouseEnter={onMouseEnter}
    >
      <GlassFrontOverlay />
      {/* Auto-playing dynamic light flash */}
      <div className="glass-light-flash" />
      {/* Hover flash sweep element (animated via JS) */}
      <div ref={flashRef} className="glass-hover-flash" />
      <div className="relative z-[3]">{children}</div>
    </article>
  );
}
