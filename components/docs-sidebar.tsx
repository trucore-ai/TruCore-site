"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { sections } from "@/lib/docs-nav";

function isActivePath(pathname: string, href: string) {
  return pathname === href;
}

export function DocsSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const navItems = sections.flatMap((section) => section.items);
  const selectedHref =
    navItems.find((item) => isActivePath(pathname, item.href))?.href ?? "/docs";

  return (
    <div className="flex flex-col gap-4">
      <div className="lg:hidden">
        <label
          htmlFor="docs-nav"
          className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-slate-300"
        >
          Documentation
        </label>
        <select
          id="docs-nav"
          aria-label="Documentation navigation"
          value={selectedHref}
          onChange={(event) => router.push(event.target.value)}
          className="w-full rounded-lg border border-white/15 bg-neutral-900/70 px-3 py-2 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
        >
          {sections.map((section) => (
            <optgroup key={section.title} label={section.title}>
              {section.items.map((item) => (
                <option key={item.href} value={item.href}>
                  {item.title}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      <nav
        aria-label="Documentation"
        className="glass-panel hidden rounded-xl p-4 lg:block"
      >
        {sections.map((section) => (
          <div key={section.title} className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-300">
              {section.title}
            </p>
            <ul className="space-y-2">
              {section.items.map((item) => {
                const active = isActivePath(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`block rounded-lg border px-3 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 ${
                        active
                          ? "border-primary-300/40 bg-primary-500/20 text-primary-100"
                          : "border-white/10 text-slate-200 hover:border-primary-300/30 hover:text-primary-100"
                      }`}
                    >
                      <span className="block text-sm font-semibold">{item.title}</span>
                      <span className="mt-1 block text-xs leading-relaxed text-slate-300">
                        {item.description}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  );
}