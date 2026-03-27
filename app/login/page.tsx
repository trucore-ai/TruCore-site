"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login, storeAuth, requestVerificationEmail, ApiError } from "@/lib/customer-auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [unverified, setUnverified] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await login(email, password);
      storeAuth(result.token, result.tenant_id, result.api_key);
      if (result.email_verified === false) {
        setUnverified(true);
      } else {
        router.push("/customer/dashboard");
      }
    } catch (err) {
      if (err instanceof ApiError && err.code === "rate_limit_exceeded") {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : "Login failed");
      }
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

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full min-w-0 max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-slate-100">
            Sign in to TruCore
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Access your ATF dashboard and API keys
          </p>
        </div>

        {unverified && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-4 space-y-3">
            <p className="text-sm text-amber-200">
              Your email is not verified. Some features (like managing API
              keys) are restricted until you verify.
            </p>
            {resendSuccess && (
              <p className="text-xs text-emerald-300">
                Verification email requested. It should arrive shortly.
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleResend}
                disabled={resending}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-white/10 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {resending ? "Resending…" : "Resend verification email"}
              </button>
              <button
                onClick={() => router.push("/customer/dashboard")}
                className="rounded-lg bg-primary-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-primary-400"
              >
                Continue to dashboard
              </button>
            </div>
          </div>
        )}

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
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-primary-400 focus:ring-2 focus:ring-primary-400/30"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-400 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>

          <div className="text-right">
            <Link
              href="/forgot-password"
              className="text-xs text-primary-400 hover:text-primary-300 transition"
            >
              Forgot password?
            </Link>
          </div>
        </form>

        <p className="text-center text-sm text-slate-400">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-primary-400 hover:text-primary-300 transition"
          >
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
