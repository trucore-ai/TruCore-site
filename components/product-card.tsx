"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Tilt } from "@/components/ui/tilt";

type ProductStatus = "live" | "coming-soon";

interface ProductCardProps {
  name: string;
  tagline: string;
  description: string;
  href: string;
  status: ProductStatus;
  cta: string;
  logoSrc?: string;
}

export function ProductCard({
  name,
  tagline,
  description,
  href,
  status,
  cta,
  logoSrc,
}: ProductCardProps) {
  const isExternal = href.startsWith("http");

  return (
    <Tilt maxTilt={5}>
      <Link
        href={href}
        className="block h-full group"
        {...(isExternal
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {})}
      >
        <Card className="h-full transition-all duration-300 group-hover:border-primary-300/30 group-hover:shadow-glow">
          <div className="space-y-4">
            {/* Status badge */}
            <div className="flex items-center gap-2">
              {status === "live" ? (
                <>
                  <span className="block h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.4)]" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                    Live
                  </span>
                </>
              ) : (
                <>
                  <span className="block h-2 w-2 rounded-full bg-amber-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-amber-400/70">
                    Coming Soon
                  </span>
                </>
              )}
            </div>

            {/* Name + tagline */}
            <div>
              <h3 className="text-2xl font-bold text-accent-300">{name}</h3>
              <p className="mt-1 text-sm font-medium text-primary-200">
                {tagline}
              </p>
            </div>

            {/* Description */}
            <p className="text-base leading-relaxed text-slate-300">
              {description}
            </p>

            {/* CTA */}
            <div className="pt-2">
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary-200 transition-colors group-hover:text-primary-100">
                {cta}
                <span
                  aria-hidden="true"
                  className="transition-transform group-hover:translate-x-0.5"
                >
                  →
                </span>
              </span>
            </div>
          </div>
        </Card>
      </Link>
    </Tilt>
  );
}