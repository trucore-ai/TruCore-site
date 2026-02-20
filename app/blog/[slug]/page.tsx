import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogPostCta, mdxComponents } from "@/components/mdx-components";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { getAllPostsMeta, getPostBySlug } from "@/lib/mdx";

type BlogPostPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function formatDate(isoDate: string) {
  return new Date(isoDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export async function generateStaticParams() {
  const posts = await getAllPostsMeta();
  return posts.map((post) => ({ slug: post.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {
      title: "Post Not Found",
      description: "The requested blog post was not found.",
    };
  }

  return {
    title: post.title,
    description: post.description,
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const Content = post.Content;

  return (
    <Container>
      <Section className="fade-in-up">
        <div className="max-w-3xl">
          <Badge className="mb-4">Blog</Badge>
          <h1 className="text-4xl font-bold tracking-tight text-[#ffe0b2] sm:text-6xl">
            {post.title}
          </h1>
          <p className="mt-4 text-lg font-semibold uppercase tracking-[0.08em] text-slate-400">
            {formatDate(post.date)}
          </p>
          <p className="mt-5 text-2xl leading-[1.4] text-slate-200">{post.description}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <Badge key={tag} className="px-3 py-1 text-sm">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </Section>

      <Section className="border-t border-white/10 fade-in-up">
        <article className="prose prose-invert max-w-3xl prose-headings:text-[#e8944a] prose-p:text-xl prose-p:leading-[1.6] prose-p:text-slate-200 prose-strong:text-[#ffe0b2]">
          <Content components={mdxComponents} />
        </article>
      </Section>

      <Section className="border-t border-white/10 fade-in-up">
        <BlogPostCta />

        <div className="mt-8">
          <Link
            href="/blog"
            className="text-lg font-semibold text-primary-100 transition-colors hover:text-primary-200"
          >
            ← Back to blog
          </Link>
        </div>
      </Section>
    </Container>
  );
}
