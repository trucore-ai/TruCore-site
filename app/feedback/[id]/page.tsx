import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { FeedbackStatusBadge } from "@/components/feedback/feedback-status-badge";
import { FeedbackCategoryBadge } from "@/components/feedback/feedback-category-badge";
import { FeedbackUpvote } from "@/components/feedback/feedback-upvote";
import { FeedbackAdminPanel } from "@/components/feedback/feedback-admin-panel";
import { fetchFeedbackItem } from "@/app/actions/feedback";
import { getSessionUserId } from "@/lib/feedback-auth";
import { getFeedbackUserById } from "@/lib/feedback-db";

interface FeedbackDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: FeedbackDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const item = await fetchFeedbackItem(id);
  if (!item) {
    return { title: "Feedback Not Found" };
  }
  return {
    title: item.title,
    description: item.body.slice(0, 160),
  };
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function FeedbackDetailPage({
  params,
}: FeedbackDetailPageProps) {
  const { id } = await params;
  const item = await fetchFeedbackItem(id);
  if (!item) notFound();

  const userId = await getSessionUserId();
  const currentUser = userId ? await getFeedbackUserById(userId) : null;
  const isAdmin = currentUser?.is_admin ?? false;

  return (
    <Container>
      <Section className="fade-in-up">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/feedback"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-primary-100"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              className="text-slate-500"
              aria-hidden="true"
            >
              <path
                d="M9 11L5 7L9 3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back to board
          </Link>

          <div className="flex items-start gap-5">
            <FeedbackUpvote
              feedbackItemId={item.id}
              count={item.upvote_count}
              hasVoted={!!item.user_has_voted}
              isSignedIn={!!currentUser}
            />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                {item.pinned && (
                  <span className="inline-flex items-center rounded-full border border-amber-400/40 bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-300">
                    Pinned
                  </span>
                )}
                <FeedbackCategoryBadge category={item.category} />
                <FeedbackStatusBadge status={item.status} />
              </div>

              <h1 className="mt-3 text-3xl font-bold tracking-tight text-accent-200 sm:text-4xl">
                {item.title}
              </h1>

              <div className="mt-3 flex items-center gap-3 text-sm text-slate-400">
                {item.author_avatar_url && (
                  <Image
                    src={item.author_avatar_url}
                    alt=""
                    width={22}
                    height={22}
                    className="rounded-full"
                    unoptimized
                  />
                )}
                <span>{item.author_username ?? "Unknown"}</span>
                <span aria-hidden="true" className="text-slate-600">
                  ·
                </span>
                <time dateTime={item.created_at}>
                  {formatDate(item.created_at)}
                </time>
                {item.updated_at !== item.created_at && (
                  <>
                    <span aria-hidden="true" className="text-slate-600">
                      ·
                    </span>
                    <span>
                      Updated {formatDate(item.updated_at)}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section divider className="fade-in-up fade-delay-1">
        <div className="mx-auto max-w-3xl space-y-8">
          <div className="glass-panel rounded-xl p-6">
            <div className="prose prose-invert max-w-none text-slate-200">
              {item.body.split("\n").map((paragraph, i) => (
                <p key={i} className="mb-3 last:mb-0 leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>

          {isAdmin && (
            <FeedbackAdminPanel
              itemId={item.id}
              currentStatus={item.status}
              currentPinned={item.pinned}
              currentHidden={item.hidden}
            />
          )}
        </div>
      </Section>
    </Container>
  );
}
