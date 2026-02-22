"use client";

import type { ReactNode } from "react";

type TiltProps = {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
  perspective?: number;
};
export function Tilt({ children, className = "" }: TiltProps) {
  return (
    <div className={className}>{children}</div>
  );
}
