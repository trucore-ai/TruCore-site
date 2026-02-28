"use client";

import { useTransition } from "react";
import { voteFeedback } from "@/app/actions/feedback";

interface FeedbackUpvoteProps {
  feedbackItemId: string;
  count: number;
  hasVoted: boolean;
  isSignedIn: boolean;
}

export function FeedbackUpvote({
  feedbackItemId,
  count,
  hasVoted,
  isSignedIn,
}: FeedbackUpvoteProps) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!isSignedIn) {
      window.location.href = "/api/auth/github";
      return;
    }
    startTransition(async () => {
      await voteFeedback(feedbackItemId);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-label={hasVoted ? "Remove upvote" : "Upvote"}
      className={`group flex flex-col items-center gap-0.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
        hasVoted
          ? "border-accent-500/50 bg-accent-500/15 text-accent-400"
          : "border-white/10 bg-white/5 text-slate-300 hover:border-primary-300/40 hover:bg-primary-500/10 hover:text-primary-100"
      } ${isPending ? "opacity-50" : ""}`}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        className={`transition-colors ${hasVoted ? "text-accent-400" : "text-slate-400 group-hover:text-primary-200"}`}
        aria-hidden="true"
      >
        <path
          d="M8 3L13 9H3L8 3Z"
          fill="currentColor"
        />
      </svg>
      <span>{count}</span>
    </button>
  );
}
