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
  /**
   * If set, renders a small plan-default tick below the slider track at
   * the given position.  Only meaningful when the user has NOT overridden
   * this field (i.e. the effective value IS the plan default).
   */
  planDefaultValue?: number;
  /**
   * PIL recommendation context.  When provided, renders a small indicator
   * on the track at the recommended value (or direction hint when no
   * concrete value is available).
   */
  pilContext?: {
    /** Concrete recommended value (number), if the PIL has a specific target */
    value?: number;
    /** Directional hint — used when no concrete value is available */
    direction?: "lower" | "higher" | "none";
    /** True when the current lever value already satisfies the recommendation */
    satisfied: boolean;
    /** Short label for the PIL indicator tooltip / aria */
    label?: string;
  };
  /** True when the current value comes from a stored user override */
  isOverride?: boolean;
  /** When set, shows a "Clear override" link that calls this handler */
  onClearOverride?: () => void;
  /**
   * When true, renders the control in a premium-but-read-only gated state.
   * Shows the slider layout with a "Pro required" overlay instead of interaction.
   */
  gated?: boolean;
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
  planDefaultValue,
  pilContext,
  isOverride,
  onClearOverride,
  gated = false,
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

  // Helpers for marker positioning.
  function markerPercent(v: number): number {
    if (max === min) return 0;
    return Math.max(0, Math.min(100, ((v - min) / (max - min)) * 100));
  }

  const handleSlider = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value),
    [onChange],
  );

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value),
    [onChange],
  );

  // Show plan-default marker when we have the value and it differs from current.
  const showPlanDefault =
    planDefaultValue !== undefined &&
    Math.abs(planDefaultValue - clamped) > 0.001 &&
    !gated;
  const pdPct = planDefaultValue !== undefined ? markerPercent(planDefaultValue) : 0;
  const pdLeft = `calc(${pdPct}% + ${thumbHalf - (pdPct * thumbHalf * 2) / 100}px)`;

  // PIL marker: concrete value or direction.
  const pilValue = pilContext?.value;
  const showPilMarker =
    pilValue !== undefined &&
    !gated &&
    Math.abs(pilValue - clamped) > 0.001;
  const pilPct = pilValue !== undefined ? markerPercent(pilValue) : 0;
  const pilLeft = `calc(${pilPct}% + ${thumbHalf - (pilPct * thumbHalf * 2) / 100}px)`;

  // PIL direction-only hint (no concrete value).
  const showPilDirectionHint =
    !showPilMarker &&
    pilContext !== undefined &&
    pilContext.direction !== undefined &&
    pilContext.direction !== "none" &&
    !gated;

  // Override status line.
  const showOverrideStatus = (isOverride !== undefined) && !gated;

  return (
    <div className="space-y-2">
      {/* Slider + badge + markers */}
      <div className={`relative pt-7 px-px ${gated ? "opacity-40 pointer-events-none select-none" : ""}`}>
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
          disabled={disabled || gated}
          onChange={handleSlider}
          onPointerDown={() => setDragging(true)}
          aria-label={`${id.replace("override-", "").replace(/_/g, " ")} slider`}
        />

        {/* Plan-default marker — small tick below track */}
        {showPlanDefault && (
          <div
            className="absolute pointer-events-none select-none"
            style={{ left: pdLeft, top: "2.1rem", transform: "translateX(-50%)" }}
            aria-hidden="true"
          >
            <div
              className="h-2 w-0.5 rounded-full bg-slate-500/60 mx-auto"
              title={`Plan default: ${formatDisplay ? formatDisplay(planDefaultValue!) : planDefaultValue!.toLocaleString()}`}
            />
            <span className="block text-[9px] text-slate-600 tabular-nums whitespace-nowrap mt-0.5 text-center leading-none">
              default
            </span>
          </div>
        )}

        {/* PIL recommended marker */}
        {showPilMarker && (
          <div
            className="absolute pointer-events-none select-none"
            style={{ left: pilLeft, top: "2.1rem", transform: "translateX(-50%)" }}
            aria-hidden="true"
            data-testid={`${id}-pil-marker`}
          >
            <div
              className={`h-2 w-0.5 rounded-full mx-auto ${pilContext!.satisfied ? "bg-emerald-400/50" : "bg-cyan-400/60"}`}
              title={pilContext?.label ?? "PIL recommended"}
            />
            <span
              className={`block text-[9px] tabular-nums whitespace-nowrap mt-0.5 text-center leading-none ${
                pilContext!.satisfied ? "text-emerald-500/70" : "text-cyan-500/70"
              }`}
            >
              {pilContext!.satisfied ? "✓ met" : "PIL"}
            </span>
          </div>
        )}

        {/* Min / max markers — add extra bottom margin when we show sub-track markers */}
        <div className={`flex justify-between px-px ${showPlanDefault || showPilMarker ? "mt-7" : "mt-1.5"}`}>
          <span className="text-[10px] text-slate-500 tabular-nums select-none">
            {min.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500 tabular-nums select-none">
            {max.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Exact numeric input */}
      {gated ? (
        <div
          className="w-full rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-xs text-slate-600 tabular-nums cursor-default"
          data-testid={`${id}-gated-input`}
        >
          {display}
        </div>
      ) : (
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
      )}

      {/* Override status + clear link */}
      {showOverrideStatus && (
        <div className="flex items-center justify-between" data-testid={`${id}-override-status`}>
          <span className={`text-[10px] ${isOverride ? "text-amber-400/80" : "text-slate-600"}`}>
            {isOverride ? "Override active" : "Using plan default"}
          </span>
          {isOverride && onClearOverride && (
            <button
              type="button"
              disabled={disabled}
              onClick={onClearOverride}
              className="text-[10px] text-slate-500 hover:text-slate-300 transition underline underline-offset-2 disabled:opacity-40"
              data-testid={`${id}-clear-override`}
            >
              Clear override
            </button>
          )}
        </div>
      )}

      {/* PIL direction-only hint (when no concrete target value is available) */}
      {showPilDirectionHint && (
        <p
          className={`text-[10px] ${pilContext!.satisfied ? "text-emerald-500/70" : "text-cyan-400/70"}`}
          data-testid={`${id}-pil-hint`}
        >
          {pilContext!.satisfied
            ? "Already meets policy intelligence recommendation"
            : pilContext!.direction === "lower"
              ? "PIL recommends a lower value"
              : "PIL recommends a higher value"}
        </p>
      )}
    </div>
  );
}
