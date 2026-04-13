"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { buildBreadcrumbs } from "@/lib/docs/breadcrumbs";

export function DocsBreadcrumbs() {
  const pathname = usePathname();
  const crumbs = buildBreadcrumbs(pathname);

  if (crumbs.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" className="docs-breadcrumbs">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;

          return (
            <li key={crumb.href} className="flex items-center gap-1.5">
              {index > 0 && (
                <svg className="h-3.5 w-3.5 text-slate-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M9 6l6 6-6 6" />
                </svg>
              )}
              {isLast ? (
                <span className="font-medium text-slate-300" aria-current="page">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className={`transition-colors hover:text-primary-200 ${
                    crumb.href === "/docs/guide"
                      ? "text-primary-300/70"
                      : "text-slate-500"
                  }`}
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
