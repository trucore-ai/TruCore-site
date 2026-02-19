"use client";

import { useActionState, useRef, useEffect } from "react";
import { joinWaitlist, type WaitlistResult } from "@/app/actions/waitlist";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";

const ROLES = ["Builder", "Founder", "Researcher", "Security", "Other"] as const;

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
  const [state, dispatch, isPending] = useActionState(formAction, initialState);
  const formMetaRef = useRef({ roleSelected: false, hasUseCase: false });

  useEffect(() => {
    if (state.ok && state.message) {
      trackEvent("waitlist_signup_success", {
        source: "homepage",
        roleSelected: formMetaRef.current.roleSelected,
        hasUseCase: formMetaRef.current.hasUseCase,
      });
    }
  }, [state.ok, state.message]);

  if (state.ok && state.message) {
    return (
      <div className="rounded-xl border border-primary-300/30 bg-primary-500/10 px-6 py-5">
        <p className="text-xl font-semibold text-primary-100">
          ✓ {state.message}
        </p>
      </div>
    );
  }

  return (
    <form action={dispatch} className="space-y-4" noValidate>
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
          <option value="">Select a role…</option>
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
          maxLength={200}
          placeholder="e.g. Automated treasury management"
          className={`${inputStyles} mt-1`}
          onChange={(e) => { formMetaRef.current.hasUseCase = e.target.value.trim().length > 0; }}
        />
      </div>

      {/* Submit */}
      <Button variant="primary" type="submit" disabled={isPending} className="h-12 w-full sm:w-auto">
        {isPending ? "Submitting…" : "Join Waitlist"}
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
