import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { FeedbackForm } from "@/components/feedback/feedback-form";
import { getSessionUserId } from "@/lib/feedback-auth";

export const metadata: Metadata = {
  title: "Submit Feedback",
  description: "Share your feedback, feature requests, or questions about ATF.",
};

export default async function NewFeedbackPage() {
  const userId = await getSessionUserId();

  if (!userId) {
    redirect("/api/auth/github");
  }

  return (
    <Container>
      <Section className="fade-in-up">
        <div className="mx-auto max-w-2xl">
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

          <h1 className="text-3xl font-bold tracking-tight text-accent-200 sm:text-4xl">
            Submit Feedback
          </h1>
          <p className="mt-3 text-lg text-slate-300">
            Share a feature request, report a bug, or ask a question. Your feedback helps shape ATF.
          </p>
        </div>
      </Section>

      <Section divider className="fade-in-up fade-delay-1">
        <div className="mx-auto max-w-2xl">
          <FeedbackForm />
        </div>
      </Section>
    </Container>
  );
}
