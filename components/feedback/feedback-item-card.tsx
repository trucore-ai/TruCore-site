import Image from "next/image";
import Link from "next/link";
import type { FeedbackItem } from "@/lib/feedback-db";
import { FeedbackStatusBadge } from "./feedback-status-badge";
import { FeedbackCategoryBadge } from "./feedback-category-badge";
import { FeedbackUpvote } from "./feedback-upvote";

interface FeedbackItemCardProps {
  item: FeedbackItem;
  isSignedIn: boolean;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(months / 12);
  return `${years}y ago`;
}

export function FeedbackItemCard({ item, isSignedIn }: FeedbackItemCardProps) {
  return (
    <div className="glass-panel flex items-start gap-4 rounded-xl p-5">
      <FeedbackUpvote
        feedbackItemId={item.id}
        count={item.upvote_count}
        hasVoted={!!item.user_has_voted}
        isSignedIn={isSignedIn}
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
        <Link
          href={`/feedback/${item.id}`}
          className="mt-2 block text-lg font-semibold text-slate-100 transition-colors hover:text-primary-100"
        >
          {item.title}
        </Link>
        <p className="mt-1 line-clamp-2 text-sm text-slate-400">
          {item.body}
        </p>
        <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
          {item.author_avatar_url && (
            <Image
              src={item.author_avatar_url}
              alt=""
              width={18}
              height={18}
              className="rounded-full"
              unoptimized
            />
          )}
          <span>{item.author_username ?? "Anonymous"}</span>
          <span aria-hidden="true" className="text-slate-600">
            ·
          </span>
          <time dateTime={item.updated_at}>{timeAgo(item.updated_at)}</time>
        </div>
      </div>
    </div>
  );
}
