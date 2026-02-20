import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { BlogPostMeta } from "@/lib/mdx";

type BlogPostCardProps = {
  post: BlogPostMeta;
};

function formatDate(isoDate: string) {
  return new Date(isoDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function BlogPostCard({ post }: BlogPostCardProps) {
  return (
    <Card className="h-full">
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
  );
}
