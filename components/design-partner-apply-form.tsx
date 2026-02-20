"use client";

import { useActionState, useRef, useEffect } from "react";
import { joinWaitlist, type WaitlistResult } from "@/app/actions/waitlist";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";

const ROLES = ["Builder", "Founder", "Researcher", "Security", "Other"] as const;

const INTEGRATION_OPTIONS = [
  { value: "jupiter", label: "Jupiter (swaps)" },
  { value: "solend", label: "Solend (lending)" },
] as const;

const TX_VOLUME_OPTIONS = [
  { value: "lt_10k", label: "< $10k / month" },
  { value: "10k_100k", label: "$10k\u2013$100k / month" },
  { value: "100k_1m", label: "$100k\u2013$1M / month" },
  { value: "gt_1m", label: "> $1M / month" },
] as const;

const BUILD_STAGE_OPTIONS = [
  { value: "idea", label: "Idea" },
  { value: "prototype", label: "Prototype" },
  { value: "prod", label: "In Production" },
] as const;

const inputStyles =
  "h-12 w-full rounded-xl border border-white/15 bg-neutral-950/70 px-5 text-lg text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 focus:ring-offset-neutral-950";

const initialState: WaitlistResult = { ok: false, message: "" };

async function formAction(
  _prev: WaitlistResult,
  formData: FormData,
): Promise<WaitlistResult> {
  return joinWaitlist(formData);
}

export function DesignPartnerApplyForm() {
  const [state, dispatch, isPending] = useActionState(formAction, initialState);
  const formMetaRef = useRef({
    integrationsCount: 0,
    hasUseCase: false,
  });

  useEffect(() => {
    if (state.ok && state.message) {
      trackEvent("design_partner_apply_page_submit_success", {
        source: "atf_apply_page",
        integrationsCount: formMetaRef.current.integrationsCount,
        hasUseCase: formMetaRef.current.hasUseCase,
      });
    }
  }, [state.ok, state.message]);

  if (state.ok && state.message) {
    return (
      <div className="rounded-xl border border-primary-300/30 bg-primary-500/10 px-6 py-5 space-y-4">
        <p className="text-xl font-semibold text-primary-100">
          &#10003; Application received
        </p>

        <p className="text-lg text-slate-200">
          Next: book a 15-minute fit check so we can learn about your setup and
          share what ATF can do for your stack.
        </p>

        {state.schedulingUrl ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <a
              href={state.schedulingUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                trackEvent("design_partner_book_click", {
                  location: "atf_apply_success",
                })
              }
              className="inline-flex h-12 items-center justify-center rounded-xl bg-accent-500 px-6 text-lg font-semibold text-white shadow-md transition-all hover:bg-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 focus:ring-offset-neutral-950"
            >
              Book a fit check
            </a>
            <span className="text-sm text-slate-400">
              Prefer email?{" "}
              <a
                href="mailto:info@trucore.xyz"
                className="font-medium text-primary-300 underline underline-offset-2 transition-colors hover:text-primary-200"
              >
                Reply to your confirmation.
              </a>
            </span>
          </div>
        ) : (
          <p className="text-sm text-slate-400">
            Scheduling link unavailable. We&apos;ll email you within one
            business day.
          </p>
        )}
      </div>
    );
  }

  return (
    <form action={dispatch} className="space-y-5" noValidate>
      {/* Hidden intent */}
      <input type="hidden" name="intent" value="design_partner" />

      {/* Honeypot */}
      <div className="absolute left-[-9999px]" aria-hidden="true">
        <label htmlFor="apply-company">Company</label>
        <input
          id="apply-company"
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {/* Email */}
      <div>
        <label htmlFor="apply-email" className="block text-lg font-medium text-primary-100">
          Email address <span className="text-red-400">*</span>
        </label>
        <input
          id="apply-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@company.com"
          className={`${inputStyles} mt-1`}
          aria-invalid={!state.ok && Boolean(state.message)}
          aria-describedby="apply-status"
        />
      </div>

      {/* Project name */}
      <div>
        <label htmlFor="apply-project" className="block text-lg font-medium text-primary-100">
          Project / Company name <span className="text-red-400">*</span>
        </label>
        <input
          id="apply-project"
          name="projectName"
          type="text"
          required
          minLength={2}
          maxLength={80}
          placeholder="e.g. Acme Trading"
          className={`${inputStyles} mt-1`}
        />
      </div>

      {/* Integrations */}
      <fieldset>
        <legend className="block text-lg font-medium text-primary-100">
          Integrations of interest <span className="text-red-400">*</span>
        </legend>
        <div className="mt-2 flex flex-wrap gap-4">
          {INTEGRATION_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2 cursor-pointer text-lg text-slate-200"
            >
              <input
                type="checkbox"
                name="integrationsInterest"
                value={opt.value}
                className="h-5 w-5 rounded border-white/20 bg-neutral-950/70 text-accent-500 focus:ring-accent-500"
                onChange={() => {
                  const checked = document.querySelectorAll(
                    'input[name="integrationsInterest"]:checked',
                  ).length;
                  formMetaRef.current.integrationsCount = checked;
                }}
              />
              {opt.label}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Build stage */}
      <div>
        <label htmlFor="apply-build-stage" className="block text-lg font-medium text-primary-100">
          Current build stage <span className="text-red-400">*</span>
        </label>
        <select
          id="apply-build-stage"
          name="buildStage"
          required
          className={`${inputStyles} mt-1 appearance-none`}
          defaultValue=""
        >
          <option value="">Select a stage...</option>
          {BUILD_STAGE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Expected volume */}
      <div>
        <label htmlFor="apply-tx-volume" className="block text-lg font-medium text-primary-100">
          Expected transaction volume <span className="text-red-400">*</span>
        </label>
        <select
          id="apply-tx-volume"
          name="txVolumeBucket"
          required
          className={`${inputStyles} mt-1 appearance-none`}
          defaultValue=""
        >
          <option value="">Select a range...</option>
          {TX_VOLUME_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Role (optional) */}
      <div>
        <label htmlFor="apply-role" className="block text-lg font-medium text-primary-100">
          Your role <span className="text-slate-500">(optional)</span>
        </label>
        <select
          id="apply-role"
          name="role"
          className={`${inputStyles} mt-1 appearance-none`}
          defaultValue=""
        >
          <option value="">Select a role...</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {/* Use case (optional textarea) */}
      <div>
        <label htmlFor="apply-usecase" className="block text-lg font-medium text-primary-100">
          Use case or context <span className="text-slate-500">(optional, 500 chars)</span>
        </label>
        <textarea
          id="apply-usecase"
          name="useCase"
          maxLength={500}
          rows={3}
          placeholder="Tell us about your agent setup, what you're building, or what you want to test with ATF."
          className={`${inputStyles} mt-1 h-auto py-3`}
          onChange={(e) => {
            formMetaRef.current.hasUseCase = e.target.value.trim().length > 0;
          }}
        />
      </div>

      {/* Submit */}
      <Button variant="primary" type="submit" disabled={isPending} className="h-12 w-full sm:w-auto">
        {isPending ? "Submitting..." : "Submit Application"}
      </Button>

      {/* Status */}
      <p id="apply-status" role={!state.ok && state.message ? "alert" : "status"} className="text-lg">
        {!state.ok && state.message && (
          <span className="text-red-300">{state.message}</span>
        )}
      </p>
    </form>
  );
}
