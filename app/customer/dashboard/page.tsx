"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  isLoggedIn,
  getApiKey,
  fetchDashboard,
  clearAuth,
  fetchSampleIntent,
  simulateProtection,
  executeSample,
  fetchActivation,
  markActivationStep,
  fetchReceipts,
  requestVerificationEmail,
  fetchUpgradeRequests,
  ApiError,
  type UpgradeRequestData,
} from "@/lib/customer-auth";
import { buildVerifyUrl } from "@/lib/share-utils";
import RunTestRequest from "@/components/run-test-request";
import {
  trackQuickTradeStarted,
  trackQuickTradeCompleted,
  trackQuickTradeFailed,
} from "@/lib/client/quick-trade-telemetry";
import { ProofLinksCard } from "@/components/proof-links-card";
import { ProofBundleActions } from "@/components/proof-bundle-actions";
import { ProofPacketView } from "@/components/proof-packet-view";
import { DistributionActions } from "@/components/distribution-actions";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UsageBucket {
  used: number;
  limit: number;
}

interface PlanInfo {
  tier: string;
  limits: {
    protect_calls_per_day: number;
    execution_calls_per_day: number;
    receipt_storage_limit: number;
  };
  usage: {
    protect_calls: UsageBucket;
    execution_calls: UsageBucket;
    receipts_created: UsageBucket;
  };
}

interface DashboardData {
  user_id: string;
  email: string;
  email_verified?: boolean;
  tenant_id: string;
  tenant: { plan_tier: string; status: string; real_execution_enabled?: boolean; real_execution_network?: string } | null;
  api_keys: Array<{
    key_id: string;
    label: string;
    status: string;
    created_at: number;
  }>;
  activation?: ActivationState;
  receipt_count?: number;
  plan?: PlanInfo;
}

interface ActivationState {
  onboarding_completed: boolean;
  steps_completed: string[];
  first_receipt_id: string | null;
}

interface ReceiptSummary {
  receipt_id: string;
  created_at: number;
  decision: string;
  dry_run: boolean;
  content_hash: string;
  protected_by: string;
  summary: string;
  intent_type: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Derive the onboarding step (0-4) from backend activation state. */
function stepFromActivation(act: ActivationState | null): 0 | 1 | 2 | 3 | 4 {
  if (!act) return 0;
  if (act.onboarding_completed) return 4;
  const s = new Set(act.steps_completed);
  if (s.has("execution_completed")) return 4;
  if (s.has("dry_run_completed")) return 3;
  if (s.has("sample_generated")) return 2;
  return 0;
}

// ---------------------------------------------------------------------------
// Usage Meter
// ---------------------------------------------------------------------------

function UsageMeter({
  label,
  used,
  limit,
}: {
  label: string;
  used: number;
  limit: number;
}) {
  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const isWarning = pct >= 80 && pct < 100;
  const isExceeded = pct >= 100;

  const barColor = isExceeded
    ? "bg-red-500"
    : isWarning
      ? "bg-amber-500"
      : "bg-primary-500";

  const textColor = isExceeded
    ? "text-red-300"
    : isWarning
      ? "text-amber-300"
      : "text-slate-300";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400">{label}</span>
        <span className={textColor}>
          {used.toLocaleString()} / {limit.toLocaleString()}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {isExceeded && (
        <p className="text-[10px] text-red-400">
          Limit reached -{" "}
          <Link
            href="/pricing"
            className="underline hover:text-red-300"
          >
            upgrade your plan
          </Link>
        </p>
      )}
      {isWarning && !isExceeded && (
        <p className="text-[10px] text-amber-400">
          Approaching limit -{" "}
          <Link
            href="/pricing"
            className="underline hover:text-amber-300"
          >
            view plans
          </Link>
        </p>
      )}
    </div>
  );
}

function planBadgeClasses(tier: string) {
  switch (tier) {
    case "enterprise":
      return "bg-accent-500/20 text-accent-300 border-accent-400/30";
    case "pro":
      return "bg-primary-500/20 text-primary-200 border-primary-400/30";
    default:
      return "bg-white/10 text-slate-300 border-white/20";
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CustomerDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loadState, setLoadState] = useState<
    "loading" | "ready" | "ready_empty" | "error"
  >("loading");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // Scoped error for dashboard data fetch (plan/usage/account info)
  // When set, only affects data-dependent sections, not the whole page
  const [dashboardDataError, setDashboardDataError] = useState("");

  // Activation / onboarding
  const [activationLoading, setActivationLoading] = useState(true);
  const [activationBootstrapped, setActivationBootstrapped] = useState(false);
  const [activation, setActivation] = useState<ActivationState | null>(null);
  const [obStep, setObStep] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [obLoading, setObLoading] = useState(false);
  const [obIntent, setObIntent] = useState<Record<string, unknown> | null>(
    null,
  );
  const [obDryRun, setObDryRun] = useState<Record<string, unknown> | null>(
    null,
  );
  const [obReceipt, setObReceipt] = useState<Record<string, unknown> | null>(
    null,
  );
  const [obError, setObError] = useState("");
  const [receiptCopied, setReceiptCopied] = useState(false);
  const [shareLinkCopied, setShareLinkCopied] = useState(false);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  // Quick trade (one-click fast path) state
  const [quickTradeActive, setQuickTradeActive] = useState(false);
  const [quickTradeStep, setQuickTradeStep] = useState<0 | 1 | 2 | 3>(0);
  const [quickTradeError, setQuickTradeError] = useState("");
  const [quickTradeFailedStep, setQuickTradeFailedStep] = useState<string | null>(null);

  // Receipt awareness
  const [receiptCount, setReceiptCount] = useState(0);
  const [recentReceipt, setRecentReceipt] = useState<ReceiptSummary | null>(
    null,
  );

  // Upgrade requests
  const [pendingUpgrade, setPendingUpgrade] = useState<UpgradeRequestData | null>(null);

  // Verification
  const [emailVerified, setEmailVerified] = useState(true);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const savedApiKey = typeof window !== "undefined" ? getApiKey() : null;

  /**
   * Merge backend activation progress into local onboarding state without
   * regressing an in-flight local step transition.
   */
  const mergeBackendOnboardingStep = useCallback((act: ActivationState) => {
    const backendStep = stepFromActivation(act);
    setObStep((prev) => (prev > backendStep ? prev : backendStep));
  }, []);

  // -----------------------------------------------------------------------
  // Initial load: dashboard + activation + receipts
  // -----------------------------------------------------------------------

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
      return;
    }

    // Track completion of both dashboard and activation fetches
    let dashboardDone = false;
    let activationDone = false;
    let dashboardFailed = false;
    let activationFailed = false;
    let dashboardErrorMsg = "";

    // Evaluate final load state once both fetches complete
    const evaluateLoadState = () => {
      if (!dashboardDone || !activationDone) return;

      // If dashboard failed but activation succeeded, the first-trade flow
      // can still work. Show scoped error for data sections, not global banner.
      if (dashboardFailed && !activationFailed) {
        // Activation works, so first-trade flow is available
        setLoadState("ready_empty");
        setActivationBootstrapped(true);
        // dashboardDataError is already set in the catch block
        return;
      }

      // If both failed, show global error (true service unavailable)
      if (dashboardFailed && activationFailed) {
        setLoadState("error");
        setError(dashboardErrorMsg || "We couldn't load your dashboard right now. Please try again in a moment.");
        return;
      }

      // Dashboard succeeded - loadState already set in success handler
    };

    // Dashboard data
    fetchDashboard()
      .then((d) => {
        const dd = d as unknown as DashboardData;
        setData(dd);
        if (dd.email_verified !== undefined) setEmailVerified(dd.email_verified);
        if (dd.receipt_count !== undefined) setReceiptCount(dd.receipt_count);
        // Determine if this is a genuinely empty account or an active one
        const hasActivity =
          (dd.api_keys && dd.api_keys.length > 0) ||
          (dd.receipt_count !== undefined && dd.receipt_count > 0) ||
          dd.activation?.onboarding_completed;
        setLoadState(hasActivity ? "ready" : "ready_empty");
        // If the dashboard already returns activation, use it
        if (dd.activation) {
          setActivation(dd.activation);
          setActivationBootstrapped(true);
          mergeBackendOnboardingStep(dd.activation);
          setActivationLoading(false);
        }
      })
      .catch((err) => {
        if (err instanceof ApiError && err.code === "unauthorized") {
          router.replace("/login");
          return;
        }
        // Set scoped error for dashboard data sections
        dashboardFailed = true;
        dashboardErrorMsg = err instanceof ApiError
          ? err.message
          : "We couldn't load your dashboard data right now.";
        setDashboardDataError(dashboardErrorMsg);
        // Do NOT set global error yet - wait for activation fetch result
      })
      .finally(() => {
        dashboardDone = true;
        evaluateLoadState();
      });

    // Activation state (dedicated call - covers case where /dashboard/me
    // doesn't embed activation yet)
    fetchActivation()
      .then((act) => {
        const a = act as unknown as ActivationState;
        setActivation(a);
        setActivationBootstrapped(true);
        mergeBackendOnboardingStep(a);
      })
      .catch(() => {
        // Track failure but don't error yet - check dashboard too
        activationFailed = true;
      })
      .finally(() => {
        activationDone = true;
        setActivationLoading(false);
        evaluateLoadState();
      });

    // Recent receipts
    fetchReceipts({ limit: 1 })
      .then((res) => {
        const r = res as { receipts?: ReceiptSummary[]; count?: number };
        if (r.count !== undefined) setReceiptCount((prev) => Math.max(prev, r.count!));
        if (r.receipts && r.receipts.length > 0) setRecentReceipt(r.receipts[0]);
      })
      .catch(() => {
        // Non-fatal
      });

    // Pending upgrade requests
    fetchUpgradeRequests()
      .then((res) => {
        const pending = (res.requests || []).find(
          (r: UpgradeRequestData) => r.status === "pending",
        );
        if (pending) setPendingUpgrade(pending);
      })
      .catch(() => {
        // Non-fatal
      });
  }, [mergeBackendOnboardingStep, router]);

  // -----------------------------------------------------------------------
  // Copy helpers
  // -----------------------------------------------------------------------

  function handleCopy() {
    if (!savedApiKey) return;
    navigator.clipboard.writeText(savedApiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleLogout() {
    clearAuth();
    router.push("/login");
  }

  async function handleCopyShareLink(hash: string) {
    try {
      await navigator.clipboard.writeText(buildVerifyUrl(hash));
      setShareLinkCopied(true);
      setTimeout(() => setShareLinkCopied(false), 1800);
    } catch {
      setShareLinkCopied(false);
    }
  }

  function handleCopyReceipt() {
    if (!obReceipt) return;
    navigator.clipboard.writeText(JSON.stringify(obReceipt, null, 2));
    setReceiptCopied(true);
    setTimeout(() => setReceiptCopied(false), 2000);
  }

  function handleCopyKeyId(keyId: string) {
    navigator.clipboard.writeText(keyId);
    setCopiedKeyId(keyId);
    setTimeout(() => setCopiedKeyId(null), 2000);
  }

  // -----------------------------------------------------------------------
  // Onboarding handlers - now with backend persistence
  // -----------------------------------------------------------------------

  const handleGenerateSample = useCallback(async () => {
    setObLoading(true);
    setObError("");
    try {
      const res = await fetchSampleIntent();
      setObIntent(res.intent as Record<string, unknown>);
      setObStep(1);

      // Persist step
      try {
        const act = (await markActivationStep("sample_generated")) as unknown as ActivationState;
        setActivation(act);
      } catch {
        // Step completed in UI even if persistence fails - will retry on next refresh
      }
    } catch (e) {
      setObError(
        e instanceof ApiError ? e.message : "Sample trade generation is temporarily unavailable.",
      );
    } finally {
      setObLoading(false);
    }
  }, []);

  const handleSimulate = useCallback(async () => {
    if (!obIntent) return;
    setObLoading(true);
    setObError("");
    try {
      const res = await simulateProtection(obIntent);
      setObDryRun(res);
      setObStep(2);

      try {
        const receiptId = (res as Record<string, unknown>).receipt
          ? ((res as Record<string, unknown>).receipt as Record<string, unknown>)
              .receipt_id as string
          : undefined;
        const act = (await markActivationStep(
          "dry_run_completed",
          receiptId,
        )) as unknown as ActivationState;
        setActivation(act);
        setReceiptCount((c) => c + 1);
      } catch {
        // Non-fatal
      }
    } catch (e) {
      setObError(e instanceof ApiError ? e.message : "Protection simulation is temporarily unavailable.");
    } finally {
      setObLoading(false);
    }
  }, [obIntent]);

  const handleExecute = useCallback(async () => {
    if (!obIntent) return;
    setObLoading(true);
    setObError("");
    try {
      const res = await executeSample(obIntent);
      setObReceipt(res);
      setObStep(3);

      try {
        const receiptId = (res as Record<string, unknown>).receipt
          ? ((res as Record<string, unknown>).receipt as Record<string, unknown>)
              .receipt_id as string
          : undefined;
        const act = (await markActivationStep(
          "execution_completed",
          receiptId,
        )) as unknown as ActivationState;
        setActivation(act);
        setReceiptCount((c) => c + 1);
      } catch {
        // Non-fatal
      }
    } catch (e) {
      setObError(e instanceof ApiError ? e.message : "Sample trade execution is temporarily unavailable.");
    } finally {
      setObLoading(false);
    }
  }, [obIntent]);

  // -----------------------------------------------------------------------
  // Quick Trade Flow - One-click orchestrator
  // -----------------------------------------------------------------------

  const runQuickTradeFlow = useCallback(async () => {
    const startTime = Date.now();
    setQuickTradeActive(true);
    setQuickTradeStep(0);
    setQuickTradeError("");
    setQuickTradeFailedStep(null);
    setObError("");

    trackQuickTradeStarted();

    try {
      // Step 1: Generate sample intent
      setQuickTradeStep(1);
      const sampleRes = await fetchSampleIntent();
      const intent = sampleRes.intent as Record<string, unknown>;
      setObIntent(intent);

      try {
        const act = (await markActivationStep("sample_generated")) as unknown as ActivationState;
        setActivation(act);
      } catch {
        // Continue anyway
      }

      // Step 2: Protect (dry run)
      setQuickTradeStep(2);
      const protectRes = await simulateProtection(intent);
      setObDryRun(protectRes);

      try {
        const receiptId = (protectRes as Record<string, unknown>).receipt
          ? ((protectRes as Record<string, unknown>).receipt as Record<string, unknown>).receipt_id as string
          : undefined;
        const act = (await markActivationStep("dry_run_completed", receiptId)) as unknown as ActivationState;
        setActivation(act);
        setReceiptCount((c) => c + 1);
      } catch {
        // Non-fatal
      }

      // Check if protection was denied
      const decision = (protectRes as Record<string, unknown>).decision as string;
      if (decision !== "ALLOW") {
        setQuickTradeError("Trade was blocked by protection policies. Execution skipped.");
        setQuickTradeFailedStep("protect");
        trackQuickTradeFailed("protect");
        setQuickTradeActive(false);
        setObStep(2);
        return;
      }

      // Step 3: Execute sample
      setQuickTradeStep(3);
      const executeRes = await executeSample(intent);
      setObReceipt(executeRes);
      setObStep(3);

      try {
        const receiptId = (executeRes as Record<string, unknown>).receipt
          ? ((executeRes as Record<string, unknown>).receipt as Record<string, unknown>).receipt_id as string
          : undefined;
        const act = (await markActivationStep("execution_completed", receiptId)) as unknown as ActivationState;
        setActivation(act);
        setReceiptCount((c) => c + 1);
      } catch {
        // Non-fatal
      }

      const durationMs = Date.now() - startTime;
      trackQuickTradeCompleted(durationMs);
    } catch (e) {
      const failedStep =
        quickTradeStep === 1 ? "generate" :
        quickTradeStep === 2 ? "protect" : "execute";
      setQuickTradeError(
        e instanceof ApiError ? e.message : `Trade stopped during ${failedStep} step. Please try again.`
      );
      setQuickTradeFailedStep(failedStep);
      trackQuickTradeFailed(failedStep);
    } finally {
      setQuickTradeActive(false);
    }
  }, [quickTradeStep]);

  // -----------------------------------------------------------------------
  // Quick Trade Reset - allows retry or switching to step-by-step
  // -----------------------------------------------------------------------

  const resetQuickTrade = useCallback(() => {
    setQuickTradeActive(false);
    setQuickTradeStep(0);
    setQuickTradeError("");
    setQuickTradeFailedStep(null);
    setObIntent(null);
    setObDryRun(null);
    setObReceipt(null);
    setObError("");
    setObStep(0);
  }, []);

  // Derived state
  const onboardingComplete =
    activation?.onboarding_completed || obStep >= 3;

  // -----------------------------------------------------------------------
  // Error classifier — maps ApiError codes to user-friendly categories
  // -----------------------------------------------------------------------

  function classifyError(raw: string): {
    message: string;
    category: "unavailable" | "rate_limited" | "network" | "unknown";
  } {
    const lower = raw.toLowerCase();
    if (lower.includes("rate limit") || lower.includes("too many"))
      return { message: "Too many requests. Please wait a moment.", category: "rate_limited" };
    if (lower.includes("network") || lower.includes("reach") || lower.includes("fetch"))
      return { message: "Network issue detected. Check your connection.", category: "network" };
    if (lower.includes("unavailable") || lower.includes("couldn't load") || lower.includes("temporarily"))
      return { message: "Service temporarily unavailable. Please try again shortly.", category: "unavailable" };
    return { message: "Something went wrong. Please try again.", category: "unknown" };
  }

  // -----------------------------------------------------------------------
  // Retry handler — reloads dashboard data without full page reload
  // -----------------------------------------------------------------------

  const handleRetry = useCallback(() => {
    setLoadState("loading");
    setError("");
    setDashboardDataError("");

    // Retry both dashboard and activation fetches
    let dashboardDone = false;
    let activationDone = false;
    let dashboardFailed = false;
    let activationFailed = false;
    let dashboardErrorMsg = "";

    const evaluateRetryState = () => {
      if (!dashboardDone || !activationDone) return;

      if (dashboardFailed && !activationFailed) {
        setLoadState("ready_empty");
        setActivationBootstrapped(true);
        return;
      }

      if (dashboardFailed && activationFailed) {
        setLoadState("error");
        setError(dashboardErrorMsg || "We couldn't load your dashboard right now. Please try again in a moment.");
        return;
      }
    };

    fetchDashboard()
      .then((d) => {
        const dd = d as unknown as DashboardData;
        setData(dd);
        if (dd.email_verified !== undefined) setEmailVerified(dd.email_verified);
        if (dd.receipt_count !== undefined) setReceiptCount(dd.receipt_count);
        const hasActivity =
          (dd.api_keys && dd.api_keys.length > 0) ||
          (dd.receipt_count !== undefined && dd.receipt_count > 0) ||
          dd.activation?.onboarding_completed;
        setLoadState(hasActivity ? "ready" : "ready_empty");
        if (dd.activation) {
          setActivation(dd.activation);
          setActivationBootstrapped(true);
          mergeBackendOnboardingStep(dd.activation);
        }
      })
      .catch((err) => {
        if (err instanceof ApiError && err.code === "unauthorized") {
          router.replace("/login");
          return;
        }
        dashboardFailed = true;
        dashboardErrorMsg = err instanceof ApiError
          ? err.message
          : "We couldn't load your dashboard data right now.";
        setDashboardDataError(dashboardErrorMsg);
      })
      .finally(() => {
        dashboardDone = true;
        evaluateRetryState();
      });

    fetchActivation()
      .then((act) => {
        const a = act as unknown as ActivationState;
        setActivation(a);
        setActivationBootstrapped(true);
        mergeBackendOnboardingStep(a);
      })
      .catch(() => {
        activationFailed = true;
      })
      .finally(() => {
        activationDone = true;
        evaluateRetryState();
      });
  }, [mergeBackendOnboardingStep, router]);

  if (typeof window !== "undefined" && !isLoggedIn()) return null;

  // Classify the current error for display
  const classifiedError = error ? classifyError(error) : null;

  return (
    <main className="min-h-screen px-4 py-12">
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-100">
              Dashboard
            </h1>
            {data && (
              <p className="mt-1 text-sm text-slate-400">
                {data.email} &middot;{" "}
                <span className="capitalize">
                  {data.tenant?.plan_tier ?? "free"} plan
                </span>
              </p>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10"
          >
            Sign out
          </button>
        </div>

        {loadState === "error" && classifiedError && (
          <div
            role="alert"
            className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-4 text-sm text-red-300 space-y-3"
          >
            <p>{classifiedError.message}</p>
            <button
              onClick={handleRetry}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/10"
            >
              Retry
            </button>
          </div>
        )}

        {/* Ready-state welcome banner for new users */}
        {loadState === "ready_empty" && !error && !dashboardDataError && (
          <div className="rounded-xl border border-primary-400/20 bg-primary-500/5 px-6 py-8 text-center space-y-2">
            <h2 className="text-xl font-semibold text-slate-100">
              Your account is ready
            </h2>
            <p className="text-sm text-slate-400">
              Run your first protected trade to activate your dashboard.
            </p>
          </div>
        )}

        {/* Email verification banner */}
        {!emailVerified && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-4 space-y-2">
            <p className="text-sm text-amber-200">
              Your email is not verified. Verify to unlock full access
              (API key management and other sensitive actions).
            </p>
            {resendSuccess && (
              <p className="text-xs text-emerald-300">
                Verification email requested. It should arrive shortly.
              </p>
            )}
            <button
              onClick={async () => {
                setResending(true);
                setResendSuccess(false);
                try {
                  await requestVerificationEmail();
                  setResendSuccess(true);
                } catch {
                  setError("Verification email is temporarily unavailable. Please try again shortly.");
                }
                setResending(false);
              }}
              disabled={resending}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-white/10 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {resending ? "Resending…" : "Resend verification email"}
            </button>
          </div>
        )}

        {/* First Protected Trade - Onboarding Flow (primary action) */}
        <section
          data-testid="first-trade-section"
          className="rounded-xl border-2 border-accent-400/30 bg-accent-500/5 p-8 space-y-6"
        >
          {/* Header - adapts to completion state */}
          <div className="text-center space-y-2">
            {onboardingComplete ? (
              <>
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20">
                  <span className="text-xl">&#x2705;</span>
                </div>
                <h2 data-testid="trust-headline" className="text-xl font-semibold text-emerald-300">
                  Protected trade completed successfully
                </h2>
                <p data-testid="trust-subline" className="text-sm text-slate-400">
                  ATF evaluated, enforced, and recorded this transaction.
                </p>

                {/* Trust Card: Receipt metadata row */}
                {(() => {
                  const receiptId = (obReceipt as Record<string, unknown>)?.receipt
                    ? ((obReceipt as Record<string, unknown>).receipt as Record<string, unknown>).receipt_id as string
                    : activation?.first_receipt_id ?? null;
                  const decision = (obDryRun as Record<string, unknown>)?.decision as string ?? "ALLOW";
                  const executionTime = obReceipt ? new Date().toLocaleString() : null;
                  const hasReceipt = !!(receiptId || receiptCount > 0);

                  return hasReceipt ? (
                    <div data-testid="trust-metadata" className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 space-y-2">
                      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs">
                        {receiptId && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-500">Receipt:</span>
                            <span className="font-mono text-emerald-200">{receiptId.length > 16 ? `${receiptId.slice(0, 8)}…${receiptId.slice(-6)}` : receiptId}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-500">Decision:</span>
                          <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${decision === "ALLOW" ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"}`}>
                            {decision}
                          </span>
                        </div>
                        {executionTime && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-500">Timestamp:</span>
                            <span className="text-slate-300">{executionTime}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-500">Verification:</span>
                          <span className="text-emerald-300">Available</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div data-testid="trust-metadata-pending" className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
                      <p className="text-xs text-amber-300">
                        Your receipt is being prepared. You can check receipt history shortly.
                      </p>
                    </div>
                  );
                })()}

                {/* Verification explainer */}
                <p data-testid="verification-explainer" className="mt-3 text-xs text-slate-500 italic">
                  Receipts are tamper-evident records you can independently verify.
                </p>

                {/* Primary receipt actions */}
                {(() => {
                  const receiptObj = (obReceipt as Record<string, unknown>)?.receipt as Record<string, unknown> | undefined;
                  const receiptId = receiptObj?.receipt_id as string ?? activation?.first_receipt_id ?? null;
                  const contentHash = receiptObj?.content_hash as string ?? null;
                  const hasReceipt = !!(receiptId || receiptCount > 0);
                  const verifyUrl = contentHash ? `/verify?hash=${encodeURIComponent(contentHash)}&from=share` : null;
                  const ogPreviewUrl = contentHash ? `/api/og/receipt?hash=${encodeURIComponent(contentHash)}` : null;

                  return (
                    <div data-testid="trust-actions" className="mt-4 flex flex-wrap items-center justify-center gap-3">
                      {/* Primary: View receipt / history */}
                      <Link
                        href="/customer/receipts"
                        className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-500"
                      >
                        View protected trade receipts
                      </Link>
                      {/* Secondary: Verify receipt */}
                      {hasReceipt && contentHash && verifyUrl && (
                        <Link
                          href={verifyUrl}
                          data-testid="verify-action"
                          className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-5 py-2.5 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/20"
                        >
                          View Receipt
                          <span aria-hidden="true" className="sr-only"> Verify Receipt</span>
                        </Link>
                      )}
                      {hasReceipt && contentHash && (
                        <button
                          type="button"
                          data-testid="share-receipt-action"
                          onClick={() => void handleCopyShareLink(contentHash)}
                          className="rounded-lg border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-slate-300 transition hover:bg-white/10"
                        >
                          {shareLinkCopied ? "Link Copied" : "Share Receipt"}
                        </button>
                      )}
                      {hasReceipt && contentHash && ogPreviewUrl && (
                        <a
                          data-testid="preview-share-card-action"
                          href={ogPreviewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-slate-300 transition hover:bg-white/10"
                        >
                          Preview Share Card
                        </a>
                      )}
                      {/* Tertiary: Run another trade */}
                      <button
                        onClick={() => {
                          setObStep(0);
                          setObIntent(null);
                          setObDryRun(null);
                          setObReceipt(null);
                        }}
                        className="rounded-lg border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-slate-300 transition hover:bg-white/10"
                      >
                        Run another trade
                      </button>
                    </div>
                  );
                })()}

                {/* Compact proof links — raw URLs for power users / developers */}
                {(() => {
                  const receiptObj = (obReceipt as Record<string, unknown>)?.receipt as Record<string, unknown> | undefined;
                  const contentHash = receiptObj?.content_hash as string ?? null;
                  return contentHash ? (
                    <div className="mt-2 space-y-2">
                      <ProofLinksCard hash={contentHash} compact />
                      <ProofBundleActions hash={contentHash} compact surface="dashboard" />
                      <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">Developer / Agent Output</p>
                        <ProofPacketView hash={contentHash} compact surface="dashboard" />
                      </div>
                      <DistributionActions hash={contentHash} compact surface="dashboard" />
                      <p className="text-center text-[10px] text-slate-600">
                        <Link href="/docs/proof" className="hover:text-slate-400 transition-colors">
                          What is this proof?
                        </Link>
                      </p>
                    </div>
                  ) : null;
                })()}
              </>
            ) : (
              <>
                <h2 className="text-xl font-semibold text-slate-100">
                  Run Your First Protected Trade
                </h2>
                <p className="text-sm text-slate-400">
                  This will simulate and execute a sample SOL → USDC trade through ATF.
                </p>
              </>
            )}
          </div>

          {/* Loading activation */}
          {activationLoading && (
            <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Loading progress&hellip;
            </div>
          )}

          {/* Onboarding error with classified message + retry */}
          {obError && (() => {
            const classified = classifyError(obError);
            return (
              <div
                data-testid="ob-error"
                className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-4 text-sm text-red-300 space-y-3"
              >
                <p>{classified.message}</p>
                <button
                  onClick={() => {
                    setObError("");
                    if (obStep === 0) handleGenerateSample();
                    else if (obStep === 1) handleSimulate();
                    else if (obStep === 2) handleExecute();
                  }}
                  className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/10"
                >
                  Retry
                </button>
              </div>
            );
          })()}

          {/* Step indicators */}
          {!activationLoading && (
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs">
              {(["Generate", "Simulate", "Execute", "Receipt"] as const).map(
                (label, i) => {
                  const completed = obStep > i || (onboardingComplete && i < 4);
                  const current = obStep === i && !onboardingComplete;
                  return (
                    <div key={label} className="flex items-center gap-2">
                      <span
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                          completed
                            ? "bg-emerald-500/20 text-emerald-300"
                            : current
                              ? "bg-accent-500/30 text-accent-200 ring-2 ring-accent-400/40"
                              : "bg-white/5 text-slate-500"
                        }`}
                      >
                        {completed ? "\u2713" : i + 1}
                      </span>
                      <span className={`font-medium ${completed ? "text-emerald-300" : current ? "text-slate-200" : "text-slate-500"}`}>
                        {label}
                      </span>
                      {i < 3 && (
                        <span className="mx-1 text-slate-600">&rarr;</span>
                      )}
                    </div>
                  );
                },
              )}
            </div>
          )}

          {/* Step 1: Generate -- or Quick Trade one-click */}
          {!activationLoading && obStep === 0 && !obError && !quickTradeActive && !quickTradeError && (
            <div className="text-center space-y-4">
              <button
                data-testid="quick-trade-btn"
                onClick={runQuickTradeFlow}
                disabled={obLoading}
                className="rounded-lg bg-emerald-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-500 hover:shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Run Your First Protected Trade
              </button>
              <p className="text-xs text-slate-500">
                One click - we&apos;ll handle the rest
              </p>
              <div className="pt-2 border-t border-white/5">
                <button
                  data-testid="generate-btn"
                  onClick={handleGenerateSample}
                  disabled={obLoading}
                  className="text-xs text-slate-400 hover:text-slate-300 transition underline"
                >
                  Or try step-by-step
                </button>
              </div>
            </div>
          )}

          {/* Quick Trade Progress UI */}
          {quickTradeActive && (
            <div data-testid="quick-trade-progress" className="space-y-4">
              <div className="flex items-center justify-center gap-4">
                {[
                  { step: 1, label: "Preparing" },
                  { step: 2, label: "Protecting" },
                  { step: 3, label: "Executing" },
                ].map(({ step, label }) => {
                  const isActive = quickTradeStep === step;
                  const isComplete = quickTradeStep > step;
                  return (
                    <div key={step} className="flex items-center gap-2">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all ${
                          isComplete
                            ? "bg-emerald-500/20 text-emerald-300"
                            : isActive
                              ? "bg-accent-500/30 text-accent-200 ring-2 ring-accent-400/40 animate-pulse"
                              : "bg-white/5 text-slate-500"
                        }`}
                      >
                        {isComplete ? "\u2713" : step}
                      </div>
                      <span className={`text-sm ${isActive ? "text-slate-200" : isComplete ? "text-emerald-300" : "text-slate-500"}`}>
                        {label}
                      </span>
                      {step < 3 && <span className="text-slate-600">{"\u2192"}</span>}
                    </div>
                  );
                })}
              </div>
              <p className="text-center text-sm text-slate-400">
                {quickTradeStep === 1 && "Generating sample trade..."}
                {quickTradeStep === 2 && "Running protection check..."}
                {quickTradeStep === 3 && "Executing protected trade..."}
              </p>
            </div>
          )}

          {/* Quick Trade Error State */}
          {quickTradeError && !quickTradeActive && (
            <div data-testid="quick-trade-error" className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-4 space-y-3">
              <p className="text-sm text-red-300">
                {quickTradeError}
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={runQuickTradeFlow}
                  className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/10"
                >
                  Retry
                </button>
                <button
                  onClick={resetQuickTrade}
                  className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/10"
                >
                  Try step-by-step
                </button>
              </div>
            </div>
          )}

          {/* Step 1 result: show intent */}
          {obStep >= 1 && obIntent && (
            <div className="rounded-lg border border-white/10 bg-neutral-900 p-4">
              <h3 className="text-xs font-medium text-slate-400 mb-2">
                Sample Intent
              </h3>
              <pre className="overflow-x-auto text-xs text-slate-200 font-mono">
                {JSON.stringify(obIntent, null, 2)}
              </pre>
            </div>
          )}

          {/* Step 2: Simulate - show if at step 1 (intent generated, not yet simulated) */}
          {!activationLoading && obStep === 1 && !obError && (
            <div className="text-center">
              <button
                data-testid="simulate-btn"
                onClick={handleSimulate}
                disabled={obLoading}
                className="rounded-lg bg-accent-500 px-8 py-3 text-sm font-semibold text-white transition hover:bg-accent-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {obLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Simulating protection&hellip;
                  </span>
                ) : "Simulate Protection"}
              </button>
            </div>
          )}

          {/* Step 2 result: policy breakdown */}
          {obStep >= 2 && obDryRun && (
            <div className="rounded-lg border border-white/10 bg-neutral-900 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-medium text-slate-400">
                  Policy Evaluation
                </h3>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    (obDryRun as Record<string, unknown>).decision === "ALLOW"
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-red-500/20 text-red-300"
                  }`}
                >
                  {(obDryRun as Record<string, unknown>).decision as string}
                </span>
              </div>
              <div className="space-y-1">
                {(
                  (obDryRun as Record<string, unknown>).policy_breakdown as Array<{
                    policy: string;
                    result: string;
                    reason: string;
                  }>
                )?.map((p) => (
                  <div
                    key={p.policy}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-slate-300 font-mono">
                      {p.policy}
                    </span>
                    <span
                      className={
                        p.result === "PASS"
                          ? "text-emerald-400"
                          : "text-red-400"
                      }
                    >
                      {p.result}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500 italic">
                Protected by ATF &middot; Dry run - no on-chain transaction
              </p>
            </div>
          )}

          {/* Step 3: Execute - show if at step 2 (simulation done, not yet executed) */}
          {!activationLoading && obStep === 2 && !obError && (
            <div className="text-center space-y-2">
              <button
                data-testid="execute-btn"
                onClick={handleExecute}
                disabled={obLoading}
                className="rounded-lg bg-emerald-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {obLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Executing trade&hellip;
                  </span>
                ) : "Execute Sample Trade"}
              </button>
              <p className="text-[10px] text-slate-500">
                {data?.tenant?.real_execution_enabled
                  ? `Real execution enabled \u00b7 ${data.tenant.real_execution_network ?? "devnet"}`
                  : "Simulated mode \u2014 no on-chain transaction"}
              </p>
            </div>
          )}

          {/* Step 3 result: receipt */}
          {obStep >= 3 && obReceipt && (
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-medium text-emerald-300">
                  &#x2705; Trade Receipt
                </h3>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                      (obReceipt as Record<string, unknown>).execution_mode === "real"
                        ? "bg-blue-500/20 text-blue-300"
                        : "bg-slate-500/20 text-slate-300"
                    }`}
                  >
                    {(obReceipt as Record<string, unknown>).execution_mode === "real"
                      ? "Executed on-chain"
                      : "Simulated execution"}
                  </span>
                  <button
                    onClick={handleCopyReceipt}
                    className="rounded-md border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300 transition hover:bg-white/10"
                  >
                    {receiptCopied ? "Copied!" : "Copy JSON"}
                  </button>
                </div>
              </div>
              {/* Show tx signature for real executions */}
              {!!((obReceipt as Record<string, unknown>).receipt as Record<string, unknown>)?.tx_signature && (() => {
                const sig = ((obReceipt as Record<string, unknown>).receipt as Record<string, unknown>).tx_signature as string;
                const network = ((obReceipt as Record<string, unknown>).network as string) ?? "devnet";
                const explorerUrl = `https://explorer.solana.com/tx/${encodeURIComponent(sig)}${network === "devnet" ? "?cluster=devnet" : ""}`;
                return (
                  <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 px-3 py-2">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-[10px] text-blue-400 font-medium">Transaction Signature</p>
                      <a
                        href={explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-blue-400 hover:text-blue-300 underline transition"
                      >
                        View on Solana Explorer &rarr;
                      </a>
                    </div>
                    <p className="text-xs text-blue-200 font-mono break-all">{sig}</p>
                  </div>
                );
              })()}
              {/* Show execution error if real mode failed */}
              {!!((obReceipt as Record<string, unknown>).receipt as Record<string, unknown>)?.execution_error && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2">
                  <p className="text-[10px] text-red-400 font-medium mb-0.5">Execution Error</p>
                  <p className="text-xs text-red-300">
                    {((obReceipt as Record<string, unknown>).receipt as Record<string, unknown>).execution_error as string}
                  </p>
                </div>
              )}
              <pre className="overflow-x-auto rounded-lg bg-neutral-900 p-3 text-xs text-slate-200 font-mono">
                {JSON.stringify(obReceipt, null, 2)}
              </pre>
              <p className="text-xs text-slate-500 italic">
                Protected by ATF &middot; Your first trade is complete!
              </p>
            </div>
          )}

          {/* Resume banner - shown when restored from backend mid-onboarding */}
          {!activationLoading &&
            !onboardingComplete &&
            obStep > 0 &&
            !obIntent && (
              <div className="rounded-lg border border-accent-400/20 bg-accent-500/10 px-4 py-3 text-center">
                <p className="text-sm text-accent-300">
                  Resume onboarding - you left off at step {obStep + 1}.
                </p>
                <button
                  onClick={handleGenerateSample}
                  disabled={obLoading}
                  className="mt-2 rounded-lg bg-accent-500 px-5 py-2 text-sm font-medium text-white transition hover:bg-accent-400 disabled:opacity-50"
                >
                  {obLoading ? "Loading\u2026" : "Continue"}
                </button>
              </div>
            )}

          {/* Quickstart link */}
          <div className="text-center space-y-2">
            <p className="text-xs text-slate-500">
              All transactions are policy-protected and verifiable.
            </p>
            <Link
              href="/quickstart"
              className="text-xs text-slate-500 underline hover:text-slate-300"
            >
              Or follow the full quickstart guide
            </Link>
          </div>
        </section>

        {/* API Key card */}
        {savedApiKey && (
          <section className="rounded-xl border border-primary-400/20 bg-primary-500/5 p-6">
            <h2 className="text-sm font-medium text-primary-300">
              Your API Key
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Copy this now - it will not be shown again.
            </p>
            <div className="mt-3 flex items-center gap-3">
              <code className="flex-1 overflow-x-auto rounded-lg border border-white/10 bg-neutral-900 px-4 py-2.5 font-mono text-sm text-slate-100">
                {savedApiKey}
              </code>
              <button
                onClick={handleCopy}
                className="shrink-0 rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-400"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </section>
        )}

        {/* Scoped error for dashboard data sections when activation still works */}
        {!data && dashboardDataError && activationBootstrapped && (
          <section className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-6 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-amber-400">&#9888;</span>
              <h2 className="text-sm font-medium text-amber-300">
                Plan and usage data unavailable
              </h2>
            </div>
            <p className="text-xs text-amber-200">
              {dashboardDataError}
            </p>
            <button
              onClick={handleRetry}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/10"
            >
              Retry
            </button>
          </section>
        )}

        {/* Plan & Usage */}
        {data && (() => {
          const tier = data.plan?.tier ?? data.tenant?.plan_tier ?? "free";
          const plan = data.plan;
          return (
            <section className="rounded-xl border border-primary-400/20 bg-primary-500/5 p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-sm font-medium text-slate-300">
                    Your Plan
                  </h2>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold capitalize ${planBadgeClasses(tier)}`}
                    >
                      {tier} plan
                    </span>
                    {data.tenant?.status && (
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          data.tenant.status === "active"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-amber-500/20 text-amber-300"
                        }`}
                      >
                        {data.tenant.status}
                      </span>
                    )}
                    {data.tenant?.real_execution_enabled && (
                      <span className="inline-block rounded-full bg-blue-500/20 border border-blue-400/30 px-2 py-0.5 text-[10px] font-semibold text-blue-300">
                        Real Execution &middot; {data.tenant.real_execution_network ?? "devnet"}
                      </span>
                    )}
                  </div>
                </div>
                {tier === "free" && (
                  <Link
                    href="/upgrade?plan=pro"
                    className="rounded-lg bg-accent-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-400"
                  >
                    Upgrade to Pro
                  </Link>
                )}
                {tier !== "free" && (
                  <Link
                    href="/pricing"
                    className="text-xs text-primary-400 hover:text-primary-300 transition"
                  >
                    View plans &rarr;
                  </Link>
                )}
              </div>

              {plan?.usage && (
                <div className="space-y-3">
                  <UsageMeter
                    label="Protect calls (daily)"
                    used={plan.usage.protect_calls.used}
                    limit={plan.usage.protect_calls.limit}
                  />
                  <UsageMeter
                    label="Execution calls (daily)"
                    used={plan.usage.execution_calls.used}
                    limit={plan.usage.execution_calls.limit}
                  />
                  <UsageMeter
                    label="Receipts stored"
                    used={plan.usage.receipts_created.used}
                    limit={plan.usage.receipts_created.limit}
                  />
                </div>
              )}

              {!plan?.usage && (
                <p className="text-xs text-slate-500">
                  Usage data not yet available. Complete your first protected
                  trade to start tracking.
                </p>
              )}

              {tier === "free" && (
                <p className="text-xs text-slate-500">
                  You&apos;re on the <span className="text-slate-300 font-medium">Free plan</span>.{" "}
                  <Link
                    href="/upgrade?plan=pro"
                    className="text-primary-400 underline hover:text-primary-300"
                  >
                    Upgrade to Pro
                  </Link>{" "}
                  for higher limits and real execution capacity.
                </p>
              )}

              {/* Pending upgrade request notice */}
              {pendingUpgrade && (
                <div className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-4 py-3">
                  <p className="text-xs text-amber-300">
                    You have a pending upgrade request for the{" "}
                    <span className="font-semibold capitalize">
                      {pendingUpgrade.requested_plan}
                    </span>{" "}
                    plan.{" "}
                    <Link
                      href="/upgrade"
                      className="underline hover:text-amber-200"
                    >
                      View status
                    </Link>
                  </p>
                </div>
              )}
            </section>
          );
        })()}

        {/* Tenant info */}
        {data && (
          <section className="rounded-xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
            <h2 className="text-sm font-medium text-slate-300">
              Account details
            </h2>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-slate-500">Tenant ID</dt>
                <dd className="mt-0.5 font-mono text-slate-200">
                  {data.tenant_id}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Plan</dt>
                <dd className="mt-0.5 capitalize text-slate-200">
                  {data.plan?.tier ?? data.tenant?.plan_tier ?? "free"}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Status</dt>
                <dd className="mt-0.5 text-slate-200">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      data.tenant?.status === "active"
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "bg-amber-500/20 text-amber-300"
                    }`}
                  >
                    {data.tenant?.status ?? "active"}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">API keys</dt>
                <dd className="mt-0.5 text-slate-200">
                  {data.api_keys?.length ?? 0}
                </dd>
              </div>
            </dl>
          </section>
        )}

        {/* API Keys table */}
        {data && data.api_keys && data.api_keys.length > 0 && (
          <section className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-medium text-slate-300">
                API Keys
              </h2>
              <Link
                href="/customer/keys"
                className="text-xs text-primary-400 hover:text-primary-300 transition"
              >
                Manage API Keys &rarr;
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-xs text-slate-500">
                    <th className="pb-2 pr-4 font-medium">Key ID</th>
                    <th className="pb-2 pr-4 font-medium">Label</th>
                    <th className="pb-2 pr-4 font-medium">Status</th>
                    <th className="pb-2 pr-4 font-medium">Created</th>
                    <th className="pb-2 font-medium"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {data.api_keys.map((k) => (
                    <tr
                      key={k.key_id}
                      className="border-b border-white/5 last:border-0"
                    >
                      <td className="py-2.5 pr-4 font-mono text-slate-200">
                        {k.key_id}
                      </td>
                      <td className="py-2.5 pr-4 text-slate-300">
                        {k.label || "-"}
                      </td>
                      <td className="py-2.5 pr-4">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                            k.status === "active"
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-red-500/20 text-red-300"
                          }`}
                        >
                          {k.status}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 text-slate-400">
                        {new Date(k.created_at * 1000).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleCopyKeyId(k.key_id)}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-400"
                        >
                          {copiedKeyId === k.key_id ? (
                            <>
                              <svg className="h-3.5 w-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              Copy Key ID
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Receipt awareness section */}
        {receiptCount > 0 && (
          <section className="rounded-xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-slate-300">
                Protected Trade Receipts
              </h2>
              <Link
                href="/customer/receipts"
                className="text-xs text-primary-400 hover:text-primary-300 transition"
              >
                View protected trade receipts &rarr;
              </Link>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-semibold text-slate-100">
                  {receiptCount}
                </div>
                <div className="text-xs text-slate-500">Receipts created</div>
              </div>
              {recentReceipt && (
                <div className="flex-1 rounded-lg border border-white/5 bg-neutral-900 px-4 py-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Latest</span>
                    <span
                      className={`rounded-full px-2 py-0.5 font-medium ${
                        recentReceipt.decision === "ALLOW" ||
                        recentReceipt.decision === "approved"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-red-500/20 text-red-300"
                      }`}
                    >
                      {recentReceipt.decision}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-300 truncate">
                    {recentReceipt.summary || recentReceipt.intent_type || "Protected trade"}
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-500 font-mono truncate">
                    {recentReceipt.receipt_id}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Quick Test Request */}
        <RunTestRequest apiKey={savedApiKey} />
      </div>
    </main>
  );
}
