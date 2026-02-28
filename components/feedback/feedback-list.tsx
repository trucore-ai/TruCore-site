import type { FeedbackItem } from "@/lib/feedback-db";
import { FeedbackItemCard } from "./feedback-item-card";

interface FeedbackListProps {
  items: FeedbackItem[];
  isSignedIn: boolean;
}

export function FeedbackList({ items, isSignedIn }: FeedbackListProps) {
  if (items.length === 0) {
    return (
      <div className="glass-panel rounded-xl p-10 text-center">
        <p className="text-lg text-slate-300">
          No feedback items yet. Be the first to share your thoughts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <FeedbackItemCard key={item.id} item={item} isSignedIn={isSignedIn} />
      ))}
    </div>
  );
}
