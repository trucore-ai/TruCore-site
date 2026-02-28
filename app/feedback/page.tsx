import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { FeedbackList } from "@/components/feedback/feedback-list";
import { FeedbackFilters } from "@/components/feedback/feedback-filters";
import { FeedbackAuthBar } from "@/components/feedback/feedback-auth-bar";
import { fetchFeedbackItems } from "@/app/actions/feedback";
import { getSessionUserId } from "@/lib/feedback-auth";
import { getFeedbackUserById } from "@/lib/feedback-db";
import type { FeedbackSortOption } from "@/lib/validation/feedback";

export const metadata: Metadata = {
  title: "Feedback and Roadmap",
  description:
    "High-signal, public feedback for developers building bots, agents, and custody workflows with ATF.",
};

interface FeedbackPageProps {
  searchParams: Promise<{
    category?: string;
    status?: string;
    sort?: string;
    error?: string;
  }>;
}

export default async function FeedbackPage({ searchParams }: FeedbackPageProps) {
  const params = await searchParams;
  const { category, status, sort = "top", error } = params;

  const userId = await getSessionUserId();
  const user = userId ? await getFeedbackUserById(userId) : null;

  const items = await fetchFeedbackItems({
    category,
    status,
    sort: sort as FeedbackSortOption,
  });

  return (
    <Container>
      <Section className="fade-in-up">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-[#ffe0b2] sm:text-5xl">
                ATF Feedback and Roadmap
              </h1>
              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-300">
                High-signal, public feedback for developers building bots, agents, and custody workflows.
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-3">
              <FeedbackAuthBar user={user} />
              {user && (
                <Link
                  href="/feedback/new"
                  className="inline-flex items-center justify-center rounded-xl bg-accent-500 px-5 py-2.5 text-sm font-semibold text-neutral-950 transition-colors hover:bg-accent-400"
                >
                  Submit feedback
                </Link>
              )}
            </div>
          </div>

          {error && (
            <div
              className="mt-4 rounded-lg border border-red-400/40 bg-red-500/15 px-4 py-3 text-sm text-red-200"
              role="alert"
            >
              {error === "state_mismatch"
                ? "Authentication failed. Please try again."
                : error === "auth_failed"
                  ? "Could not complete sign in. Please try again."
                  : error === "oauth_config"
                    ? "GitHub sign in is not configured yet."
                    : `Authentication error: ${error}`}
            </div>
          )}
        </div>
      </Section>

      <Section className="border-t border-white/10 fade-in-up fade-delay-1">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Suspense fallback={null}>
              <FeedbackFilters />
            </Suspense>
            <p className="text-sm text-slate-500">
              {items.length} {items.length === 1 ? "item" : "items"}
            </p>
          </div>

          <FeedbackList items={items} isSignedIn={!!user} />
        </div>
      </Section>
    </Container>
  );
}
