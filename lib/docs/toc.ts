/**
 * Slugify a heading string to create a URL-safe anchor id.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export type TocItem = {
  id: string;
  text: string;
  level: 2 | 3;
};

/**
 * Query the DOM for h2 and h3 elements inside a container and return
 * a list of TOC items. Headings without an `id` are skipped.
 */
export function extractTocFromDom(container: HTMLElement): TocItem[] {
  const headings = container.querySelectorAll<HTMLHeadingElement>("h2[id], h3[id]");
  const items: TocItem[] = [];

  headings.forEach((heading) => {
    const id = heading.id;
    const text = heading.textContent?.trim() ?? "";
    if (!id || !text) return;

    const level = heading.tagName === "H2" ? 2 : 3;
    items.push({ id, text, level });
  });

  return items;
}
