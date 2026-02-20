import type { Metadata } from "next";
import Link from "next/link";
import { BlogPostCard } from "@/components/blog-post-card";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { getAllPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Short technical posts from TruCore on permits, invariants, and secure autonomous finance infrastructure.",
};

export default function BlogIndexPage() {
  const allPosts = getAllPosts();

  return (
    <Container>
      <Section className="fade-in-up">
        <div className="max-w-3xl">
          <Badge className="mb-4">Blog</Badge>
          <h1 className="text-4xl font-bold tracking-tight text-[#ffe0b2] sm:text-6xl lg:text-7xl">
            TruCore Technical Posts
          </h1>
          <p className="mt-5 text-2xl leading-[1.4] text-slate-200 sm:text-3xl">
            Ongoing technical notes on policy-bound execution and trust-first agent systems.
          </p>
          <p className="mt-4 text-lg text-slate-300">
            Subscribe via{" "}
            <Link
              href="/blog/rss.xml"
              className="font-semibold text-primary-100 transition-colors hover:text-primary-200"
            >
              RSS
            </Link>
            .
          </p>
        </div>
      </Section>

      <Section className="border-t border-white/10 fade-in-up">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {allPosts.map((post) => (
            <BlogPostCard key={post.slug} post={post} />
          ))}
        </div>
      </Section>
    </Container>
  );
}
