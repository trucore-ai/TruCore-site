"use client";

import { useActionState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { joinWaitlist, type WaitlistResult, type WaitlistIntent } from "@/app/actions/waitlist";
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

export function WaitlistForm() {
  const searchParams = useSearchParams();
  const intent: WaitlistIntent =
    searchParams.get("intent") === "design_partner" ? "design_partner" : "standard";
  const isDesignPartner = intent === "design_partner";

  const [state, dispatch, isPending] = useActionState(formAction, initialState);
  const formMetaRef = useRef({
    roleSelected: false,
    hasUseCase: false,
    integrationsCount: 0,
    txBucketSelected: false,
    buildStageSelected: false,
  });

  useEffect(() => {
    if (state.ok && state.message) {
      if (state.intent === "design_partner") {
        trackEvent("design_partner_application_submit_success", {
          source: "waitlist",
          integrationsCount: formMetaRef.current.integrationsCount,
          txBucketSelected: formMetaRef.current.txBucketSelected,
          buildStageSelected: formMetaRef.current.buildStageSelected,
        });
      } else {
        trackEvent("waitlist_signup_success", {
          source: "homepage",
          roleSelected: formMetaRef.current.roleSelected,
          hasUseCase: formMetaRef.current.hasUseCase,
        });
      }
    }
  }, [state.ok, state.message, state.intent]);

  if (state.ok && state.message) {
    return (
      <div className="rounded-xl border border-primary-300/30 bg-primary-500/10 px-6 py-5">
        <p className="text-xl font-semibold text-primary-100">
          &#10003; {state.message}
        </p>
      </div>
    );
  }

  return (
    <form action={dispatch} className="space-y-4" noValidate>
      {/* Hidden intent field */}
      <input type="hidden" name="intent" value={intent} />

      {/* Honeypot - hidden from real users */}
      <div className="absolute left-[-9999px]" aria-hidden="true">
        <label htmlFor="wl-company">Company</label>
        <input
          id="wl-company"
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {/* Email (required) */}
      <div>
        <label htmlFor="waitlist-email" className="block text-lg font-medium text-primary-100">
          Email address <span className="text-red-400">*</span>
        </label>
        <input
          id="waitlist-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@company.com"
          className={`${inputStyles} mt-1`}
          aria-invalid={!state.ok && Boolean(state.message)}
          aria-describedby="waitlist-status"
        />
      </div>

      {/* Role (optional) */}
      <div>
        <label htmlFor="waitlist-role" className="block text-lg font-medium text-primary-100">
          Role <span className="text-slate-500">(optional)</span>
        </label>
        <select
          id="waitlist-role"
          name="role"
          className={`${inputStyles} mt-1 appearance-none`}
          defaultValue=""
          onChange={(e) => { formMetaRef.current.roleSelected = e.target.value !== ""; }}
        >
          <option value="">Select a role...</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {/* Use case (optional) */}
      <div>
        <label htmlFor="waitlist-usecase" className="block text-lg font-medium text-primary-100">
          Use case <span className="text-slate-500">(optional)</span>
        </label>
        <input
          id="waitlist-usecase"
          name="useCase"
          type="text"
          maxLength={500}
          placeholder="e.g. Automated treasury management"
          className={`${inputStyles} mt-1`}
          onChange={(e) => { formMetaRef.current.hasUseCase = e.target.value.trim().length > 0; }}
        />
      </div>

      {/* ── Design Partner fields ── */}
      {isDesignPartner && (
        <>
          {/* Project / Company name (required) */}
          <div>
            <label htmlFor="waitlist-project" className="block text-lg font-medium text-primary-100">
              Project / Company name <span className="text-red-400">*</span>
            </label>
            <input
              id="waitlist-project"
              name="projectName"
              type="text"
              required
              minLength={2}
              maxLength={80}
              placeholder="e.g. Acme Trading"
              className={`${inputStyles} mt-1`}
            />
          </div>

          {/* Integrations interest (checkbox group, required at least 1) */}
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
                      // Count checked integration boxes via DOM query
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

          {/* Expected tx volume (required) */}
          <div>
            <label htmlFor="waitlist-tx-volume" className="block text-lg font-medium text-primary-100">
              Expected transaction volume <span className="text-red-400">*</span>
            </label>
            <select
              id="waitlist-tx-volume"
              name="txVolumeBucket"
              required
              className={`${inputStyles} mt-1 appearance-none`}
              defaultValue=""
              onChange={(e) => { formMetaRef.current.txBucketSelected = e.target.value !== ""; }}
            >
              <option value="">Select a range...</option>
              {TX_VOLUME_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Build stage (required) */}
          <div>
            <label htmlFor="waitlist-build-stage" className="block text-lg font-medium text-primary-100">
              Current build stage <span className="text-red-400">*</span>
            </label>
            <select
              id="waitlist-build-stage"
              name="buildStage"
              required
              className={`${inputStyles} mt-1 appearance-none`}
              defaultValue=""
              onChange={(e) => { formMetaRef.current.buildStageSelected = e.target.value !== ""; }}
            >
              <option value="">Select a stage...</option>
              {BUILD_STAGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      {/* Submit */}
      <Button variant="primary" type="submit" disabled={isPending} className="h-12 w-full sm:w-auto">
        {isPending
          ? "Submitting..."
          : isDesignPartner
            ? "Submit Application"
            : "Join Waitlist"}
      </Button>

      {/* Status messages */}
      <p id="waitlist-status" role={!state.ok && state.message ? "alert" : "status"} className="text-lg">
        {!state.ok && state.message && (
          <span className="text-red-300">{state.message}</span>
        )}
      </p>
    </form>
  );
}
