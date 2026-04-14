"use client";

import { useCallback, useEffect, useState } from "react";
import styles from "./premium-slider.module.css";

export interface PremiumSliderProps {
  /** id for the numeric input — connects to parent <label> via htmlFor */
  id: string;
  /** Current value as string ("" = unset / plan default) */
  value: string;
  /** Called with new string value */
  onChange: (value: string) => void;
  min: number;
  max: number;
  step?: number;
  disabled?: boolean;
  /** Format the live value badge, e.g. v => `$${v.toLocaleString()}` */
  formatDisplay?: (value: number) => string;
  placeholder?: string;
}

export function PremiumSlider({
  id,
  value,
  onChange,
  min,
  max,
  step = 1,
  disabled = false,
  formatDisplay,
  placeholder,
}: PremiumSliderProps) {
  const [dragging, setDragging] = useState(false);

  // Release drag state reliably with a global listener.
  useEffect(() => {
    if (!dragging) return;
    const up = () => setDragging(false);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [dragging]);

  const numericValue =
    value === "" || isNaN(Number(value)) ? min : Number(value);
  const clamped = Math.max(min, Math.min(max, numericValue));
  const percent = max === min ? 0 : ((clamped - min) / (max - min)) * 100;

  // Thumb half-width (22 px thumb → 11 px half) for badge centering.
  const thumbHalf = 11;
  const badgeLeft = `calc(${percent}% + ${thumbHalf - (percent * thumbHalf * 2) / 100}px)`;

  const display = formatDisplay
    ? formatDisplay(clamped)
    : clamped.toLocaleString();

  const handleSlider = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value),
    [onChange],
  );

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value),
    [onChange],
  );

  return (
    <div className="space-y-2">
      {/* Slider + badge + min/max markers */}
      <div className="relative pt-7 px-px">
        {/* Live value badge — tracks thumb position */}
        <div
          className={`${styles.valueBadge} absolute top-0 pointer-events-none select-none`}
          style={{
            left: badgeLeft,
            transform: "translateX(-50%)",
            opacity: value !== "" || dragging ? 1 : 0,
          }}
          aria-hidden="true"
        >
          <span
            className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-semibold tabular-nums whitespace-nowrap ${
              dragging
                ? "bg-amber-500/20 text-amber-100 shadow-sm shadow-amber-500/10"
                : "bg-white/[0.06] text-slate-300"
            }`}
          >
            {display}
          </span>
        </div>

        {/* Custom range slider */}
        <input
          type="range"
          className={styles.slider}
          style={{ "--slider-fill": `${percent}%` } as React.CSSProperties}
          min={min}
          max={max}
          step={step}
          value={clamped}
          disabled={disabled}
          onChange={handleSlider}
          onPointerDown={() => setDragging(true)}
          aria-label={`${id.replace("override-", "").replace(/_/g, " ")} slider`}
        />

        {/* Min / max markers */}
        <div className="flex justify-between mt-1.5 px-px">
          <span className="text-[10px] text-slate-500 tabular-nums select-none">
            {min.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500 tabular-nums select-none">
            {max.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Exact numeric input */}
      <input
        id={id}
        type="number"
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        value={value}
        onChange={handleInput}
        disabled={disabled}
        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 tabular-nums outline-none transition focus:border-amber-500/40 disabled:opacity-50"
      />
    </div>
  );
}
