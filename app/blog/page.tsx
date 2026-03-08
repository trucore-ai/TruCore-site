import type { Metadata } from "next";
import Link from "next/link";
import { BlogFilterBar } from "@/components/blog-filter-bar";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { getAllPostsMeta } from "@/lib/mdx";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Short technical posts from TruCore on permits, invariants, and secure autonomous finance infrastructure.",
  openGraph: {
    title: "TruCore Blog",
    description: "Infrastructure for Autonomous Finance",
    images: [
      {
        url: "/blog/opengraph-image",
        width: 1200,
        height: 630,
        alt: "TruCore Blog social preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TruCore Blog",
    description: "Infrastructure for Autonomous Finance",
    images: ["/blog/opengraph-image"],
  },
};

export default async function BlogIndexPage() {
  const allPosts = await getAllPostsMeta();

  return (
    <Container>
      <Section className="fade-in-up">
        <div className="max-w-3xl">
          <Badge className="mb-4">Blog</Badge>
          <h1 className="text-4xl font-bold tracking-tight text-accent-200 sm:text-6xl lg:text-7xl">
            TruCore Technical Posts
          </h1>
          <p className="mt-5 text-2xl leading-[1.4] text-slate-200 sm:text-3xl">
            Ongoing technical notes on policy-bound execution and trust-first agent systems.
          </p>
          <p className="mt-4 text-lg text-slate-300">
            Category definition: {" "}
            <Link
              href="/agent-transaction-firewall"
              className="font-semibold text-primary-100 transition-colors hover:text-primary-200"
            >
              Agent Transaction Firewall
            </Link>
            .
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

      <Section divider className="fade-in-up">
        <BlogFilterBar posts={allPosts} />
      </Section>
    </Container>
  );
}
