"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signup, storeAuth, requestVerificationEmail } from "@/lib/customer-auth";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verificationPending, setVerificationPending] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const result = await signup(email, password);
      storeAuth(result.token, result.tenant_id, result.api_key);
      setVerificationPending(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    setResendSuccess(false);
    setError("");
    try {
      await requestVerificationEmail(email);
      setResendSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification email is temporarily unavailable. Please try again shortly.");
    } finally {
      setResending(false);
    }
  }

  if (verificationPending) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-500/20">
            <svg className="h-8 w-8 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-slate-100">
            Check your email
          </h1>
          <p className="text-sm text-slate-400">
            We&apos;re preparing your verification email for{" "}
            <span className="font-medium text-slate-200">{email}</span>.
            <br />
            Click the link in that email to activate your account.
          </p>
          <p className="text-xs text-slate-500">
            If it doesn&apos;t arrive right away, check spam or try resending
            in a few minutes.
          </p>

          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4 text-left">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              What happens next
            </p>
            <ol className="space-y-2 text-sm text-slate-300">
              <li className="flex gap-2">
                <span className="shrink-0 font-bold text-accent-300">1.</span>
                Verify your email (check spam if you don&apos;t see it)
              </li>
              <li className="flex gap-2">
                <span className="shrink-0 font-bold text-slate-400">2.</span>
                Log in and find your API key on the dashboard
              </li>
              <li className="flex gap-2">
                <span className="shrink-0 font-bold text-slate-400">3.</span>
                Run your first protected trade
              </li>
              <li className="flex gap-2">
                <span className="shrink-0 font-bold text-slate-400">4.</span>
                View your receipt and verify it
              </li>
            </ol>
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {resendSuccess && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
              Verification email requested. It should arrive shortly.
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleResend}
              disabled={resending}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/10 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {resending ? "Resending…" : "Resend verification email"}
            </button>
            <button
              onClick={() => router.push("/customer/dashboard")}
              className="w-full rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-400"
            >
              Continue to dashboard
            </button>
          </div>

          <p className="text-xs text-slate-500">
            You can browse your dashboard now, but email verification is
            required to manage API keys.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-slate-100">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Free tier: 100 protect calls/day, tamper-evident receipts, and a dashboard.
            No credit card required.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-xs font-medium text-slate-400"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-primary-400 focus:ring-2 focus:ring-primary-400/30"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-xs font-medium text-slate-400"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-primary-400 focus:ring-2 focus:ring-primary-400/30"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label
              htmlFor="confirm"
              className="mb-1 block text-xs font-medium text-slate-400"
            >
              Confirm password
            </label>
            <input
              id="confirm"
              type="password"
              required
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-primary-400 focus:ring-2 focus:ring-primary-400/30"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-accent-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-accent-400 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-primary-400 hover:text-primary-300 transition"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
