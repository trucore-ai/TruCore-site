"use client";

import { useState, useTransition } from "react";
import {
  resendVerification,
  revokeVerification,
  revokePasswordReset,
} from "./actions";

interface Props {
  userId: string;
  emailVerified: boolean;
  hasPendingVerificationToken: boolean;
  hasPendingResetToken: boolean;
}

type ActionKind = "resend" | "revoke-verification" | "revoke-reset";

export function UserActionPanel({
  userId,
  emailVerified,
  hasPendingVerificationToken,
  hasPendingResetToken,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState<ActionKind | null>(null);
  const [feedback, setFeedback] = useState<{
    kind: "ok" | "error";
    message: string;
  } | null>(null);

  function clearFeedback() {
    setTimeout(() => setFeedback(null), 4000);
  }

  function submitAction(action: ActionKind) {
    startTransition(async () => {
      setConfirming(null);
      setFeedback(null);

      const fd = new FormData();
      fd.set("userId", userId);

      let result: { ok?: boolean; error?: string };

      if (action === "resend") {
        result = await resendVerification(fd);
      } else if (action === "revoke-verification") {
        result = await revokeVerification(fd);
      } else {
        result = await revokePasswordReset(fd);
      }

      if (result?.ok) {
        setFeedback({ kind: "ok", message: "Action completed." });
      } else {
        setFeedback({
          kind: "error",
          message: result?.error ?? "Action temporarily unavailable.",
        });
      }
      clearFeedback();
    });
  }

  const btnBase =
    "rounded border px-3 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 disabled:opacity-40";

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
        Actions
      </h2>

      {/* Resend Verification */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={isPending || emailVerified}
          onClick={() =>
            confirming === "resend"
              ? submitAction("resend")
              : setConfirming("resend")
          }
          className={`${btnBase} ${
            confirming === "resend"
              ? "border-emerald-500 bg-emerald-600 text-white"
              : "border-white/10 bg-white/10 text-slate-300 hover:bg-white/20"
          }`}
        >
          {isPending && confirming === null
            ? "..."
            : confirming === "resend"
              ? "Click again to confirm"
              : "Resend Verification Email"}
        </button>
        {confirming === "resend" && (
          <button
            type="button"
            onClick={() => setConfirming(null)}
            className="text-xs text-slate-400 hover:text-slate-200"
          >
            Cancel
          </button>
        )}
        {emailVerified && (
          <span className="text-xs text-slate-500">
            Already verified — not available.
          </span>
        )}
      </div>

      {/* Revoke Pending Verification */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={isPending || !hasPendingVerificationToken}
          onClick={() =>
            confirming === "revoke-verification"
              ? submitAction("revoke-verification")
              : setConfirming("revoke-verification")
          }
          className={`${btnBase} ${
            confirming === "revoke-verification"
              ? "border-red-500 bg-red-600 text-white"
              : "border-white/10 bg-white/10 text-slate-300 hover:bg-white/20"
          }`}
        >
          {confirming === "revoke-verification"
            ? "Click again to confirm"
            : "Revoke Pending Verification Token"}
        </button>
        {confirming === "revoke-verification" && (
          <button
            type="button"
            onClick={() => setConfirming(null)}
            className="text-xs text-slate-400 hover:text-slate-200"
          >
            Cancel
          </button>
        )}
        {!hasPendingVerificationToken && (
          <span className="text-xs text-slate-500">No pending token.</span>
        )}
      </div>

      {/* Revoke Pending Password Reset */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={isPending || !hasPendingResetToken}
          onClick={() =>
            confirming === "revoke-reset"
              ? submitAction("revoke-reset")
              : setConfirming("revoke-reset")
          }
          className={`${btnBase} ${
            confirming === "revoke-reset"
              ? "border-red-500 bg-red-600 text-white"
              : "border-white/10 bg-white/10 text-slate-300 hover:bg-white/20"
          }`}
        >
          {confirming === "revoke-reset"
            ? "Click again to confirm"
            : "Revoke Pending Password Reset"}
        </button>
        {confirming === "revoke-reset" && (
          <button
            type="button"
            onClick={() => setConfirming(null)}
            className="text-xs text-slate-400 hover:text-slate-200"
          >
            Cancel
          </button>
        )}
        {!hasPendingResetToken && (
          <span className="text-xs text-slate-500">No pending token.</span>
        )}
      </div>

      {/* Feedback */}
      {feedback && (
        <p
          className={`text-sm font-medium ${
            feedback.kind === "ok" ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {feedback.message}
        </p>
      )}
    </div>
  );
}
