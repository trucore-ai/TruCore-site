"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

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
 * Honors accessibility, not the site animation toggle: the toggle only
 * gates background effects, while scroll reveals always run. Only the
 * OS-level prefers-reduced-motion setting disables this animation
 * (CSS fallback included for the no-JS path).
 */
export function Reveal({ children, className = "", delay = 0, y = 24 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const mq = window.matchMedia(REDUCED_MOTION_QUERY);
    const syncReduced = () => {
      const r = mq.matches;
      setReduced(r);
      if (r) setVisible(true);
    };

    syncReduced();

    mq.addEventListener("change", syncReduced);

    let observer: IntersectionObserver | null = null;
    if (!mq.matches) {
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
      mq.removeEventListener("change", syncReduced);
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
