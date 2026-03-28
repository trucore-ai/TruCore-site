#!/usr/bin/env python3
"""
Script to add one-click fast path changes to dashboard page.
"""

import re

FILE_PATH = "app/customer/dashboard/page.tsx"

def main():
    with open(FILE_PATH, "r") as f:
        content = f.read()
    
    # 1. Add import after RunTestRequest
    old_import = 'import RunTestRequest from "@/components/run-test-request";'
    new_import = '''import RunTestRequest from "@/components/run-test-request";
import {
  trackQuickTradeStarted,
  trackQuickTradeCompleted,
  trackQuickTradeFailed,
} from "@/lib/client/quick-trade-telemetry";'''
    
    content = content.replace(old_import, new_import)
    print("✓ Added telemetry import")
    
    # 2. Add quick trade state after receiptCopied
    old_state = '''const [receiptCopied, setReceiptCopied] = useState(false);

  // Receipt awareness'''
    new_state = '''const [receiptCopied, setReceiptCopied] = useState(false);

  // Quick trade (one-click fast path) state
  const [quickTradeActive, setQuickTradeActive] = useState(false);
  const [quickTradeStep, setQuickTradeStep] = useState<0 | 1 | 2 | 3>(0);
  const [quickTradeError, setQuickTradeError] = useState("");
  const [quickTradeFailedStep, setQuickTradeFailedStep] = useState<string | null>(null);

  // Receipt awareness'''
    
    content = content.replace(old_state, new_state)
    print("✓ Added quick trade state variables")
    
    # 3. Add orchestrator function after handleExecute
    # Find the end of handleExecute callback
    old_execute_end = '''setObError(e instanceof Error ? e.message : "Execution failed");
    } finally {
      setObLoading(false);
    }
  }, [obIntent]);

  // Derived state'''
    
    new_execute_end = '''setObError(e instanceof Error ? e.message : "Execution failed");
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

    // Track telemetry
    trackQuickTradeStarted();

    try {
      // Step 1: Generate sample intent
      setQuickTradeStep(1);
      const sampleRes = await fetchSampleIntent();
      const intent = sampleRes.intent as Record<string, unknown>;
      setObIntent(intent);

      // Persist step (non-fatal if fails)
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

      // Persist step
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

      // Check if protection was denied - stop execution if DENY
      const decision = (protectRes as Record<string, unknown>).decision as string;
      if (decision !== "ALLOW") {
        // Protection denied - stop at simulation
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

      // Persist step
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

      // Success!
      const durationMs = Date.now() - startTime;
      trackQuickTradeCompleted(durationMs);
    } catch (e) {
      const failedStep =
        quickTradeStep === 1 ? "generate" :
        quickTradeStep === 2 ? "protect" : "execute";
      setQuickTradeError(
        e instanceof Error ? e.message : `Trade stopped during ${failedStep} step`
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

  // Derived state'''
    
    content = content.replace(old_execute_end, new_execute_end)
    print("✓ Added quick trade orchestrator function")
    
    # 4. Find the first protected trade section and add Quick Start button
    # Look for the "Generate Sample Trade" button section
    old_generate_section = '''          {/* Step 1: Generate */}
          {!activationLoading && obStep === 0 && (
            <div className="text-center">
              <button
                onClick={handleGenerateSample}
                disabled={obLoading}
                className="rounded-lg bg-accent-500 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-accent-400 disabled:opacity-50"
              >
                {obLoading ? "Generating\\u2026" : "Generate Sample Trade"}
              </button>
            </div>
          )}'''
    
    new_generate_section = '''          {/* Quick Start Trade - One-Click Fast Path */}
          {!activationLoading && obStep === 0 && !quickTradeActive && !onboardingComplete && (
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
                        {isComplete ? "\\u2713" : step}
                      </div>
                      <span className={`text-sm ${isActive ? "text-slate-200" : isComplete ? "text-emerald-300" : "text-slate-500"}`}>
                        {label}
                      </span>
                      {step < 3 && <span className="text-slate-600">\\u2192</span>}
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

          {/* Step 1: Generate (manual mode) */}
          {!activationLoading && obStep === 0 && !quickTradeActive && !quickTradeError && onboardingComplete && (
            <div className="text-center">
              <button
                onClick={handleGenerateSample}
                disabled={obLoading}
                className="rounded-lg bg-accent-500 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-accent-400 disabled:opacity-50"
              >
                {obLoading ? "Generating\\u2026" : "Generate Sample Trade"}
              </button>
            </div>
          )}'''
    
    content = content.replace(old_generate_section, new_generate_section)
    print("✓ Added Quick Start Trade UI")
    
    with open(FILE_PATH, "w") as f:
        f.write(content)
    
    print("\\nDashboard page updated successfully!")

if __name__ == "__main__":
    main()
