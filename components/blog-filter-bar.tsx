"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { BlogPostMeta } from "@/lib/mdx";

type BlogFilterBarProps = {
  posts: BlogPostMeta[];
};

function formatDate(isoDate: string) {
  return new Date(isoDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

function toSearchableString(post: BlogPostMeta) {
  return `${post.title} ${post.description} ${post.tags.join(" ")}`.toLowerCase();
}

export function BlogFilterBar({ posts }: BlogFilterBarProps) {
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const allTags = useMemo(() => {
    const uniqueTags = new Set<string>();

    for (const post of posts) {
      for (const tag of post.tags) {
        uniqueTags.add(tag);
      }
    }

    return Array.from(uniqueTags).sort((a, b) => a.localeCompare(b));
  }, [posts]);

  const filteredPosts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return posts.filter((post) => {
      const tagMatch = activeTag ? post.tags.includes(activeTag) : true;
      const searchMatch = normalizedQuery
        ? toSearchableString(post).includes(normalizedQuery)
        : true;

      return tagMatch && searchMatch;
    });
  }, [activeTag, posts, query]);

  const clearFilters = () => {
    setQuery("");
    setActiveTag(null);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-white/10 bg-neutral-900/40 p-5 backdrop-blur-md">
        <div className="flex flex-col gap-4">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search posts"
            aria-label="Search posts"
            className="w-full rounded-lg border border-primary-300/30 bg-primary-500/10 px-4 py-3 text-lg text-primary-50 outline-none transition-colors placeholder:text-slate-400 focus:border-primary-300/70"
          />

          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => {
              const isActive = activeTag === tag;

              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setActiveTag(isActive ? null : tag)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold tracking-wide transition-colors ${
                    isActive
                      ? "border-accent-400 bg-accent-500/20 text-accent-400"
                      : "border-primary-300/40 bg-primary-500/20 text-primary-50 hover:border-primary-300/70"
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-lg text-slate-300">
              Showing {filteredPosts.length} of {posts.length} posts
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm font-semibold text-primary-100 transition-colors hover:text-primary-200"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {filteredPosts.length === 0 ? (
        <p className="text-xl text-slate-300">No posts match your filters.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map((post) => (
            <Card key={post.slug} className="h-full">
              <p className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-400">
                {formatDate(post.date)}
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#e8944a]">
                <Link href={`/blog/${post.slug}`} className="transition-colors hover:text-[#f0a050]">
                  {post.title}
                </Link>
              </h2>
              <p className="mt-3 text-xl leading-[1.5] text-slate-200">{post.description}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Badge key={tag} className="px-3 py-1 text-sm">
                    {tag}
                  </Badge>
                ))}
              </div>
              <div className="mt-6">
                <Link
                  href={`/blog/${post.slug}`}
                  className="text-lg font-semibold text-primary-100 transition-colors hover:text-primary-200"
                >
                  Read post →
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}