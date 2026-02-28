"use client";

import { useEffect, useState } from "react";
import {
  persistMotionPreference,
  readStoredMotionPreference,
  resolveReducedMotion,
  type MotionPreference,
} from "@/lib/motion-preference";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const MOTION_PREFERENCE_CHANGED_EVENT = "trucore:motion-preference-change";

function applyReduceMotionAttribute(preference: MotionPreference, systemReduced: boolean) {
  const reduced = resolveReducedMotion({
    storedPreference: preference,
    systemReduced,
  });

  document.documentElement.dataset.reduceMotion = reduced ? "true" : "false";
}

export function MotionToggle() {
  const [preference, setPreference] = useState<MotionPreference>(() => {
    if (typeof window === "undefined") {
      return "system";
    }

    return readStoredMotionPreference(window.localStorage);
  });
  const [systemReduced, setSystemReduced] = useState<boolean>(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.matchMedia(REDUCED_MOTION_QUERY).matches;
  });

  useEffect(() => {
    const mq = window.matchMedia(REDUCED_MOTION_QUERY);

    const onSystemChange = (event: MediaQueryListEvent) => {
      setSystemReduced(event.matches);
    };

    mq.addEventListener("change", onSystemChange);
    return () => {
      mq.removeEventListener("change", onSystemChange);
    };
  }, []);

  useEffect(() => {
    applyReduceMotionAttribute(preference, systemReduced);
  }, [preference, systemReduced]);

  const animationsEnabled = !resolveReducedMotion({
    storedPreference: preference,
    systemReduced,
  });

  const onToggle = () => {
    // Toggle between "enable" (animations on) and "system" (animations off)
    const nextPreference: MotionPreference = preference === "enable" ? "system" : "enable";

    persistMotionPreference(nextPreference, window.localStorage);
    setPreference(nextPreference);
    applyReduceMotionAttribute(nextPreference, systemReduced);
    window.dispatchEvent(new CustomEvent(MOTION_PREFERENCE_CHANGED_EVENT));
  };

  return (
    <button
      type="button"
      aria-pressed={animationsEnabled}
      onClick={onToggle}
      title="Animations are off by default. Toggle to enable background effects."
      className="rounded-sm border border-white/20 bg-white/5 px-3 py-1 text-sm font-medium text-slate-100 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
    >
      {animationsEnabled ? "Animations: On" : "Animations: Off"}
    </button>
  );
}
