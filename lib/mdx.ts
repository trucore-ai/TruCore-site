import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import type { ComponentType } from "react";

const BLOG_CONTENT_DIR = path.join(process.cwd(), "content", "blog");

export type BlogPostMeta = {
  slug: string;
  title: string;
  date: string;
  description: string;
  tags: string[];
};

export type BlogPostWithContent = BlogPostMeta & {
  Content: ComponentType<{ components?: Record<string, unknown> }>;
};

function normalizeFrontmatter(slug: string, data: Record<string, unknown>): BlogPostMeta {
  const title = typeof data.title === "string" ? data.title : slug;
  const dateInput =
    typeof data.date === "string" || data.date instanceof Date ? data.date : null;
  const normalizedDate = dateInput ? new Date(dateInput) : null;
  const date = normalizedDate && !Number.isNaN(normalizedDate.valueOf())
    ? normalizedDate.toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);
  const description = typeof data.description === "string" ? data.description.trim() : "";
  const tags = Array.isArray(data.tags)
    ? data.tags
      .filter((tag): tag is string => typeof tag === "string")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0)
    : [];

  return {
    slug,
    title,
    date,
    description,
    tags,
  };
}

async function readPostMetaFromFile(fileName: string): Promise<BlogPostMeta> {
  const slug = fileName.replace(/\.mdx$/, "");
  const filePath = path.join(BLOG_CONTENT_DIR, fileName);
  const raw = await readFile(filePath, "utf-8");
  const { data } = matter(raw);

  return normalizeFrontmatter(slug, data);
}

export async function getAllPostsMeta(): Promise<BlogPostMeta[]> {
  const entries = await readdir(BLOG_CONTENT_DIR);
  const mdxFiles = entries.filter((entry) => entry.endsWith(".mdx"));
  const posts = await Promise.all(mdxFiles.map((fileName) => readPostMetaFromFile(fileName)));

  return posts.sort((a, b) => b.date.localeCompare(a.date));
}

export async function getPostBySlug(slug: string): Promise<BlogPostWithContent | null> {
  const fileName = `${slug}.mdx`;
  const entries = await readdir(BLOG_CONTENT_DIR);

  if (!entries.includes(fileName)) {
    return null;
  }

  const meta = await readPostMetaFromFile(fileName);
  const mdxModule = await import(
    /* webpackInclude: /\.mdx$/ */
    `@/content/blog/${slug}.mdx`
  );

  return {
    ...meta,
    Content: mdxModule.default,
  };
}
