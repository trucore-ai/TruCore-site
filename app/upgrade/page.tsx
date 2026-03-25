"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  isLoggedIn,
  submitUpgradeRequest,
  fetchUpgradeRequests,
  cancelUpgradeRequest,
  ApiError,
  type UpgradeRequestData,
} from "@/lib/customer-auth";

const PLAN_OPTIONS = [
  { value: "pro", label: "Pro" },
  { value: "enterprise", label: "Enterprise" },
] as const;

function statusBadge(status: string) {
  const map: Record<string, string> = {
    pending: "bg-amber-500/10 text-amber-300 border-amber-400/30",
    approved: "bg-emerald-500/10 text-emerald-300 border-emerald-400/30",
    rejected: "bg-red-500/10 text-red-300 border-red-400/30",
    cancelled: "bg-slate-500/10 text-slate-400 border-slate-400/30",
  };
  return map[status] ?? "bg-white/10 text-slate-300 border-white/20";
}

function fmtDate(epoch: number) {
  if (!epoch) return "-";
  return new Date(epoch * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function UpgradePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPlan = searchParams.get("plan") ?? "";

  const [plan, setPlan] = useState(
    preselectedPlan === "enterprise" ? "enterprise" : "pro",
  );
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [requests, setRequests] = useState<UpgradeRequestData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login?redirect=/upgrade");
      return;
    }
    loadRequests();
  }, [router]);

  async function loadRequests() {
    try {
      const data = await fetchUpgradeRequests();
      setRequests(data.requests);
    } catch {
      // Silently handle - requests list is supplementary
    } finally {
      setLoading(false);
    }
  }

  const hasPending = requests.some((r) => r.status === "pending");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await submitUpgradeRequest({
        requested_plan: plan,
        reason,
      });
      setSuccess(true);
      await loadRequests();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel(requestId: string) {
    try {
      await cancelUpgradeRequest(requestId);
      await loadRequests();
    } catch {
      setError("Failed to cancel request.");
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 p-6 text-slate-100 md:p-10">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <header className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-accent-200">
            Request Upgrade
          </h1>
          <p className="mt-2 text-slate-400">
            Submit a request to upgrade your plan. Our team will review and
            respond promptly.
          </p>
        </header>

        {/* Success state */}
        {success && (
          <div className="mb-8 rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-6">
            <h2 className="text-lg font-semibold text-emerald-300">
              Request Submitted
            </h2>
            <p className="mt-2 text-sm text-emerald-200/80">
              Your upgrade request has been submitted and is pending review.
              You&apos;ll see the status update on your{" "}
              <Link
                href="/customer/dashboard"
                className="underline hover:text-emerald-100"
              >
                dashboard
              </Link>
              .
            </p>
            <button
              onClick={() => {
                setSuccess(false);
                setReason("");
              }}
              className="mt-4 rounded px-4 py-2 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/20"
            >
              Submit Another
            </button>
          </div>
        )}

        {/* Request form */}
        {!success && (
          <form
            onSubmit={handleSubmit}
            className="rounded-xl border border-white/10 bg-white/[0.02] p-6"
          >
            <div className="mb-6">
              <label
                htmlFor="plan"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Desired Plan
              </label>
              <select
                id="plan"
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                disabled={hasPending}
                className="w-full rounded-lg border border-white/10 bg-neutral-900 px-4 py-2.5 text-slate-100 transition focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400 disabled:opacity-50"
              >
                {PLAN_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-6">
              <label
                htmlFor="reason"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Use Case / Reason{" "}
                <span className="text-slate-500">(optional)</span>
              </label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={hasPending}
                maxLength={2000}
                rows={4}
                placeholder="Tell us about your use case and why you need a higher plan..."
                className="w-full rounded-lg border border-white/10 bg-neutral-900 px-4 py-2.5 text-slate-100 placeholder:text-slate-600 transition focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400 disabled:opacity-50"
              />
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {hasPending ? (
              <div className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
                You already have a pending upgrade request. Cancel it first to
                submit a new one.
              </div>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-primary-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "Submitting…" : "Submit Upgrade Request"}
              </button>
            )}
          </form>
        )}

        {/* Existing requests */}
        {!loading && requests.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 text-lg font-semibold text-slate-200">
              Your Requests
            </h2>
            <div className="space-y-3">
              {requests.map((req) => (
                <div
                  key={req.request_id}
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] px-5 py-4"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="font-medium capitalize text-slate-200">
                        {req.requested_plan}
                      </span>
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${statusBadge(req.status)}`}
                      >
                        {req.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      Submitted {fmtDate(req.created_at)}
                      {req.reviewed_at
                        ? ` · Reviewed ${fmtDate(req.reviewed_at)}`
                        : ""}
                    </p>
                    {req.review_note && (
                      <p className="mt-1 text-xs text-slate-400 italic">
                        &ldquo;{req.review_note}&rdquo;
                      </p>
                    )}
                  </div>
                  {req.status === "pending" && (
                    <button
                      onClick={() => handleCancel(req.request_id)}
                      className="ml-4 shrink-0 rounded px-3 py-1.5 text-xs font-medium text-slate-400 transition hover:bg-white/10 hover:text-slate-200"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Back link */}
        <div className="mt-8 text-center">
          <Link
            href="/pricing"
            className="text-sm text-slate-500 transition hover:text-slate-300"
          >
            ← Back to Pricing
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function UpgradePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-950 p-6 text-slate-100 md:p-10">
          <div className="mx-auto max-w-2xl">
            <p className="text-slate-500">Loading…</p>
          </div>
        </div>
      }
    >
      <UpgradePageInner />
    </Suspense>
  );
}
