import { sections, type DocsNavItem, type DocsNavSection } from "@/lib/docs-nav";

export type BreadcrumbSegment = {
  label: string;
  href: string;
};

/**
 * Build a breadcrumb trail for the given docs pathname.
 *
 * Strategy:
 * 1. Always starts with "Documentation" pointing to /docs.
 * 2. Tries to match the pathname against the nav tree to get human-readable
 *    labels. Falls back to Title-Cased slug segments when no match is found.
 */
export function buildBreadcrumbs(pathname: string): BreadcrumbSegment[] {
  const crumbs: BreadcrumbSegment[] = [{ label: "Documentation", href: "/docs" }];

  if (pathname === "/docs" || pathname === "/docs/") {
    return crumbs;
  }

  // Build lookup map from nav sections
  const navLookup = new Map<string, { item: DocsNavItem; section: DocsNavSection }>();
  for (const section of sections) {
    for (const item of section.items) {
      navLookup.set(item.href, { item, section });
    }
  }

  // Check for exact nav match first
  const match = navLookup.get(pathname);
  if (match) {
    // If the item is in a subsection (CLI Deep Dives, CLI Guides), add the
    // parent section crumb pointing to the group's first page.
    if (match.section.title !== "Documentation") {
      crumbs.push({ label: match.section.title, href: sectionFirstHref(match.section) });
    }

    // Always add the current page crumb
    crumbs.push({ label: match.item.title, href: match.item.href });

    return crumbs;
  }

  // Fallback: derive crumbs from pathname segments
  const segments = pathname.replace(/^\/docs\/?/, "").split("/").filter(Boolean);
  let builtPath = "/docs";

  for (const segment of segments) {
    builtPath += `/${segment}`;
    const navMatch = navLookup.get(builtPath);
    crumbs.push({
      label: navMatch ? navMatch.item.title : titleCase(segment),
      href: builtPath,
    });
  }

  return crumbs;
}

function sectionFirstHref(section: DocsNavSection): string {
  return section.items[0]?.href ?? "/docs";
}

function titleCase(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
