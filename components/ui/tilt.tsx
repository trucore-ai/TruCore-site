"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

type TiltProps = {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
  perspective?: number;
};

const EPSILON = 0.02;

export function Tilt({
  children,
  className = "",
  maxTilt = 8,
  perspective = 900,
}: TiltProps) {
  const frameRef = useRef<number | null>(null);
  const elementRef = useRef<HTMLDivElement>(null);
  const currentRef = useRef({ x: 0, y: 0 });
  const targetRef = useRef({ x: 0, y: 0 });
  const hoveringRef = useRef(false);
  const [isDisabled, setIsDisabled] = useState(false);

  useEffect(() => {
    const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarseQuery = window.matchMedia("(pointer: coarse)");

    const updateState = () => {
      setIsDisabled(reduceQuery.matches || coarseQuery.matches);
    };

    updateState();

    reduceQuery.addEventListener("change", updateState);
    coarseQuery.addEventListener("change", updateState);

    return () => {
      reduceQuery.removeEventListener("change", updateState);
      coarseQuery.removeEventListener("change", updateState);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  const animateToTarget = () => {
    const element = elementRef.current;

    if (!element) {
      frameRef.current = null;
      return;
    }

    currentRef.current.x += (targetRef.current.x - currentRef.current.x) * 0.14;
    currentRef.current.y += (targetRef.current.y - currentRef.current.y) * 0.14;

    element.style.setProperty("--tilt-rx", `${currentRef.current.x.toFixed(3)}deg`);
    element.style.setProperty("--tilt-ry", `${currentRef.current.y.toFixed(3)}deg`);

    const doneX = Math.abs(targetRef.current.x - currentRef.current.x) < EPSILON;
    const doneY = Math.abs(targetRef.current.y - currentRef.current.y) < EPSILON;

    if (doneX && doneY && !hoveringRef.current) {
      frameRef.current = null;
      return;
    }

    frameRef.current = requestAnimationFrame(animateToTarget);
  };

  const ensureAnimation = () => {
    if (frameRef.current) {
      return;
    }

    frameRef.current = requestAnimationFrame(animateToTarget);
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isDisabled) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const xPercent = (event.clientX - rect.left) / rect.width;
    const yPercent = (event.clientY - rect.top) / rect.height;

    const rotateY = (xPercent - 0.5) * 2 * maxTilt;
    const rotateX = (0.5 - yPercent) * 2 * maxTilt;

    targetRef.current = {
      x: rotateX,
      y: rotateY,
    };

    ensureAnimation();
  };

  const handleMouseEnter = () => {
    if (isDisabled) {
      return;
    }

    hoveringRef.current = true;
    ensureAnimation();
  };

  const handleMouseLeave = () => {
    hoveringRef.current = false;
    targetRef.current = { x: 0, y: 0 };
    ensureAnimation();
  };

  return (
    <div
      ref={elementRef}
      className={`tilt-wrapper ${className}`.trim()}
      style={{
        "--tilt-rx": "0deg",
        "--tilt-ry": "0deg",
        "--tilt-perspective": `${perspective}px`,
      } as React.CSSProperties}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-tilt-disabled={isDisabled ? "true" : "false"}
    >
      <div className="tilt-inner">{children}</div>
    </div>
  );
}
