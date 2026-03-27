"use client";

import { type ReactNode } from "react";
import { GlassFrontOverlay } from "@/components/ui/glass-slab-canvas";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className = "" }: CardProps) {
  return (
    <article
      className={`glass-panel h-full rounded-2xl border bg-background p-6 shadow-sm transition-all duration-150 hover:shadow-md ${className}`.trim()}
    >
      <GlassFrontOverlay />
      <div className="glass-hover-flash" />
      <div className="relative z-[3]">{children}</div>
    </article>
  );
}
