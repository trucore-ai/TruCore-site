"use client";

import { useEffect } from "react";

/**
 * Adds `is-scrolled` to the site header once the page scrolls past a small
 * threshold, so the sticky header gains depth (shadow + denser background)
 * as it follows the user down the page (Tavily-style sticky nav behavior).
 *
 * Renders nothing; purely a scroll-state side effect on <header>.
 */
export function HeaderScrollState() {
  useEffect(() => {
    const header = document.querySelector<HTMLElement>("header.site-header");
    if (!header) return;

    const THRESHOLD = 12;
    let ticking = false;

    const update = () => {
      ticking = false;
      const scrolled = window.scrollY > THRESHOLD;
      header.classList.toggle("is-scrolled", scrolled);
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return null;
}
