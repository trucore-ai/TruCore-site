import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { getAllPosts, getPost } from "@/lib/blog";

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

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);

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
  const post = getPost(slug);

  if (!post) {
    notFound();
  }

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
        <article className="max-w-3xl space-y-10">
          {post.body.map((section, index) => (
            <section key={`${post.slug}-section-${index}`} className="space-y-4">
              {section.heading && (
                <h2 className="text-3xl font-bold tracking-tight text-[#e8944a]">
                  {section.heading}
                </h2>
              )}

              {section.paragraphs.map((paragraph, paragraphIndex) => (
                <p
                  key={`${post.slug}-paragraph-${index}-${paragraphIndex}`}
                  className="text-xl leading-[1.6] text-slate-200"
                >
                  {paragraph}
                </p>
              ))}

              {section.code && (
                <div className="overflow-hidden rounded-lg border border-white/10 bg-neutral-900/70">
                  <div className="border-b border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
                    {section.code.language}
                  </div>
                  <pre className="overflow-x-auto p-4 font-mono text-sm leading-relaxed text-slate-100">
                    <code>{section.code.content}</code>
                  </pre>
                </div>
              )}
            </section>
          ))}
        </article>
      </Section>

      <Section className="border-t border-white/10 fade-in-up">
        <div className="max-w-3xl rounded-xl border border-primary-300/25 bg-primary-500/10 p-6 sm:p-8">
          <h2 className="text-3xl font-bold tracking-tight text-[#e8944a]">
            Build with TruCore
          </h2>
          <p className="mt-4 text-xl leading-[1.5] text-slate-200">
            If you are building autonomous finance workflows and need policy-bound execution from day one,
            apply to the design partner program.
          </p>
          <div className="mt-6">
            <Button href="/atf/apply">Apply as Design Partner</Button>
          </div>
        </div>

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
