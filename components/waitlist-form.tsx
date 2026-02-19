"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      setError("Please enter a valid email address.");
      setIsSuccess(false);
      return;
    }

    setError("");
    setIsSuccess(true);
    setEmail("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3" noValidate>
      <label htmlFor="waitlist-email" className="block text-lg font-medium text-primary-100">
        Email address
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id="waitlist-email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (error) {
              setError("");
            }
          }}
          placeholder="you@company.com"
          className="h-12 w-full rounded-xl border border-white/15 bg-neutral-950/70 px-5 text-lg text-slate-100 placeholder:text-slate-400"
          aria-invalid={Boolean(error)}
          aria-describedby="waitlist-status"
        />
        <Button variant="primary" type="submit" className="h-11">
          Join Waitlist
        </Button>
      </div>

      <p id="waitlist-status" role={error ? "alert" : "status"} className="text-base">
        {error && <span className="text-red-300">{error}</span>}
        {!error && isSuccess && (
          <span className="text-primary-100">
            You’re on the list. We’ll share early-access updates soon.
          </span>
        )}
      </p>
    </form>
  );
}
