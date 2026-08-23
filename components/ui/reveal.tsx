"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

const MOTION_PREFERENCE_CHANGED_EVENT = "trucore:motion-preference-change";

function isMotionReduced(): boolean {
  return document.documentElement.dataset.reduceMotion === "true";
}

interface RevealProps {
  children: ReactNode;
  /** Extra classes merged onto the wrapper */
  className?: string;
  /** Stagger delay in ms (applied as transition-delay) */
  delay?: number;
  /**
   * Distance the element travels up on reveal, in px.
   * Default 24 - matches Tavily-style gentle rise.
   */
  y?: number;
}

/**
 * Scroll-triggered reveal wrapper (Tavily-inspired flow).
 *
 * Elements start invisible + translated down, then fade/rise into place
 * the first time they enter the viewport. Uses IntersectionObserver:
 * no scroll listeners, no layout thrash.
 *
 * Honors the site motion-preference system:
 *  - html[data-reduce-motion="true"] → content renders instantly visible
 *  - prefers-reduced-motion media query → same (CSS fallback)
 *  - live toggle via trucore:motion-preference-change event
 */
export function Reveal({ children, className = "", delay = 0, y = 24 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const syncReduced = () => {
      const r = isMotionReduced();
      setReduced(r);
      if (r) setVisible(true);
    };

    syncReduced();

    window.addEventListener(MOTION_PREFERENCE_CHANGED_EVENT, syncReduced);

    let observer: IntersectionObserver | null = null;
    if (!isMotionReduced()) {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              setVisible(true);
              observer?.disconnect();
              break;
            }
          }
        },
        { threshold: 0.12, rootMargin: "0px 0px -48px 0px" },
      );
      observer.observe(el);
    } else {
      setVisible(true);
    }

    return () => {
      observer?.disconnect();
      window.removeEventListener(MOTION_PREFERENCE_CHANGED_EVENT, syncReduced);
    };
  }, []);

  const style = reduced
    ? undefined
    : {
        transitionDelay: delay ? `${delay}ms` : undefined,
        ["--reveal-y" as string]: `${y}px`,
      };

  return (
    <div
      ref={ref}
      className={`reveal ${visible ? "reveal-visible" : ""} ${className}`.trim()}
      style={style}
    >
      {children}
    </div>
  );
}
