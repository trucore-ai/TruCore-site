import type { Metadata } from "next";
import Link from "next/link";
import { HeadingAnchor } from "@/components/heading-anchor";

export const metadata: Metadata = {
  title: "Support Deflection — Customer Guide",
  description:
    "Decide when to self-serve, what to try first, what to collect before escalation, and when to contact support.",
  robots: { index: false, follow: false },
};

/* ── Symptom → guide mapping ── */

type SymptomRoute = {
  symptom: string;
  guide: string;
  href: string;
  tryFirst: string;
};

const SYMPTOM_ROUTES: SymptomRoute[] = [
  {
    symptom: "401 / 403 errors, key revoked, scope mismatch, lost secret",
    guide: "API Key Lifecycle",
    href: "/docs/guide/key-lifecycle",
    tryFirst: "Verify key is active at /customer/keys. Check scopes match endpoint requirements.",
  },
  {
    symptom: "429 errors, quota exhausted, rate-limit headers, backoff",
    guide: "Rate Limits & Recovery",
    href: "/docs/guide/rate-limits",
    tryFirst: "Check usage in /customer/dashboard. Honor Retry-After header. Wait for midnight UTC reset.",
  },
  {
    symptom: "Webhook failures, signature mismatch, dead-letter queue, no deliveries",
    guide: "Webhook Setup & Debugging",
    href: "/docs/guide/webhooks",
    tryFirst: "Confirm endpoint reachable. Verify HMAC uses raw body. Check DLQ for retry details.",
  },
  {
    symptom: "atf doctor failures, RPC unreachable, connectivity issues",
    guide: "Readiness & Health Checks",
    href: "/docs/guide/readiness",
    tryFirst: "Run atf doctor in the failing environment. Compare output against passing environment.",
  },
  {
    symptom: "Receipt verification fails, content_hash mismatch, \"Tampered\" badge",
    guide: "Receipt Operations",
    href: "/docs/guide/receipts-ops",
    tryFirst: "Verify you haven't reformatted the receipt. Check CLI verify output for hash details.",
  },
  {
    symptom: "Dashboard stepper stuck, activation errors, trade flow failures",
    guide: "Troubleshooting",
    href: "/docs/guide/troubleshooting",
    tryFirst: "Match your exact error message to the symptom table. Follow the recovery action listed.",
  },
  {
    symptom: "Bot preflight fails, dry-run errors, rollout issues, production checklist",
    guide: "Production Bot Configuration",
    href: "/docs/guide/production-bot",
    tryFirst: "Run the production checklist. Verify all BLOCKING items pass before going live.",
  },
];

/* ── Issue categories ── */

type IssueCategory = {
  category: string;
  nature: "transient" | "config" | "account" | "integration";
  label: string;
  examples: string[];
  expectation: string;
};

const ISSUE_CATEGORIES: IssueCategory[] = [
  {
    category: "Transient",
    nature: "transient",
    label: "Wait & retry",
    examples: [
      "429 with Retry-After header",
      "\"Service temporarily unavailable\"",
      "\"Connection refused\" during known maintenance",
      "Webhook delivery temporarily failing (< 8 consecutive)",
    ],
    expectation: "Resolves on its own within minutes. Retry with backoff.",
  },
  {
    category: "Configuration",
    nature: "config",
    label: "Fix & retry",
    examples: [
      "401/403 from missing or mis-scoped key",
      "atf doctor ✗ on API key or RPC endpoint",
      "Webhook signature mismatch (wrong secret or body encoding)",
      "ATF_API_KEY env var not set in execution context",
    ],
    expectation: "Self-serve fix. Correct the setting, re-test, confirm.",
  },
  {
    category: "Account state",
    nature: "account",
    label: "Action required",
    examples: [
      "Daily quota exhausted (429 without Retry-After)",
      "Key limit reached (plan tier)",
      "Email not verified (blocks key creation)",
      "Plan usage at 100%",
    ],
    expectation: "Requires account action: verify email, revoke unused keys, wait for reset, or upgrade plan.",
  },
  {
    category: "Integration bug",
    nature: "integration",
    label: "Investigate",
    examples: [
      "Receipt content_hash mismatch after local reformatting",
      "Decision badge shows UNKNOWN consistently",
      "CLI verify exits code 1 on valid receipt",
      "Bot loop never reaches protect step",
    ],
    expectation: "Requires investigation in your code. Check guide for exact diagnostic steps.",
  },
];

/* ── Escalation checklist ── */

const ESCALATION_CHECKLIST = [
  "Error message or HTTP status code (exact text, not paraphrased)",
  "Endpoint or CLI command that produced the error",
  "Timestamp (UTC) when the error first occurred",
  "Environment: production / staging / devnet",
  "atf doctor output (run in the affected environment)",
  "API key ID (not the secret) used in the failing request",
  "Steps already tried and their results",
  "Whether the issue is intermittent or consistent",
];

/* ── Pre-support checklist ── */

const PRE_SUPPORT_STEPS = [
  {
    step: "Match symptom to a guide",
    detail: "Use the symptom → guide table above. If your symptom appears, follow that guide first.",
  },
  {
    step: "Run atf doctor",
    detail: "Catches key, connectivity, and RPC issues before you investigate further.",
  },
  {
    step: "Check /customer/dashboard",
    detail: "Usage meters, plan status, and error banners often reveal the root cause.",
  },
  {
    step: "Try the documented fix",
    detail: "Each guide provides exact recovery actions. Complete all steps before escalating.",
  },
  {
    step: "Reproduce in a clean environment",
    detail: "If possible, test with a fresh key or profile to rule out local state.",
  },
  {
    step: "Note exact error text",
    detail: "Copy-paste the error. Paraphrased messages are much harder to diagnose.",
  },
];

/* ── Nature badge colors ── */

const NATURE_STYLES: Record<IssueCategory["nature"], string> = {
  transient: "border-sky-500/20 bg-sky-500/10 text-sky-400",
  config: "border-amber-500/20 bg-amber-500/10 text-amber-400",
  account: "border-purple-500/20 bg-purple-500/10 text-purple-400",
  integration: "border-rose-500/20 bg-rose-500/10 text-rose-400",
};

/* ── Page ── */

export default function SupportDeflectionGuide() {
  return (
    <div className="space-y-10">
      {/* ── Header ── */}
      <header className="space-y-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
          Customer Guide
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-accent-200 sm:text-5xl">
          Support Deflection
        </h1>
        <p className="max-w-3xl text-lg leading-relaxed text-slate-300">
          Most ATF integration issues are self-serve. This guide helps you
          decide whether you can fix the problem yourself, which guide to
          consult first, and what to gather before contacting support.
        </p>
        <div className="rounded-lg border border-primary-400/20 bg-primary-500/5 px-4 py-3 text-sm text-slate-300">
          <strong className="text-primary-200">How to use this page:</strong>{" "}
          Start with the symptom → guide table. If your issue matches a row,
          follow that guide. Come back here only if the guide didn&apos;t
          resolve it.
        </div>
        <div className="gradient-divider mt-2" aria-hidden="true" />
      </header>

      {/* ── 1. Symptom → Guide mapping ── */}
      <section className="space-y-4">
        <HeadingAnchor id="symptom-guide-map">
          Start here: match your symptom to a guide
        </HeadingAnchor>
        <p className="text-slate-300">
          Find the row that best matches what you&apos;re seeing.
          The <strong className="text-slate-200">Try first</strong> column
          gives you the fastest path to resolution.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.08] text-left text-slate-400">
                <th className="pb-2 pr-4 font-medium">Symptom</th>
                <th className="pb-2 pr-4 font-medium">Guide</th>
                <th className="pb-2 font-medium">Try first</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {SYMPTOM_ROUTES.map((row) => (
                <tr
                  key={row.href}
                  className="border-b border-white/[0.04]"
                >
                  <td className="py-3 pr-4 align-top">{row.symptom}</td>
                  <td className="py-3 pr-4 align-top whitespace-nowrap">
                    <Link
                      href={row.href}
                      className="font-semibold text-primary-200 hover:text-primary-100"
                    >
                      {row.guide}
                    </Link>
                  </td>
                  <td className="py-3 align-top text-slate-400">
                    {row.tryFirst}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── 2. What to try before contacting support ── */}
      <section className="space-y-4">
        <HeadingAnchor id="try-before-support">
          What to try before contacting support
        </HeadingAnchor>
        <p className="text-slate-300">
          Work through these steps in order. Most issues resolve by step 4.
        </p>
        <ol className="ml-5 list-decimal space-y-3 text-slate-300">
          {PRE_SUPPORT_STEPS.map((item) => (
            <li key={item.step}>
              <strong className="text-slate-200">{item.step}</strong>
              {" — "}
              {item.detail}
            </li>
          ))}
        </ol>
      </section>

      {/* ── 3. Issue classification ── */}
      <section className="space-y-4">
        <HeadingAnchor id="issue-classification">
          Issue classification: transient vs. config vs. account vs. integration
        </HeadingAnchor>
        <p className="text-slate-300">
          Understanding the category of your issue helps you choose the right
          response. Most issues fall into one of four types:
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {ISSUE_CATEGORIES.map((cat) => (
            <div
              key={cat.nature}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-3"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${NATURE_STYLES[cat.nature]}`}
                >
                  {cat.category}
                </span>
                <span className="text-sm font-medium text-slate-300">
                  {cat.label}
                </span>
              </div>
              <ul className="ml-4 list-disc space-y-1 text-sm text-slate-400">
                {cat.examples.map((ex) => (
                  <li key={ex}>{ex}</li>
                ))}
              </ul>
              <p className="text-xs text-slate-500">{cat.expectation}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 4. Escalation criteria ── */}
      <section className="space-y-4">
        <HeadingAnchor id="when-to-contact-support">
          When to contact support
        </HeadingAnchor>
        <p className="text-slate-300">
          Contact support when all of the following are true:
        </p>
        <ul className="ml-5 list-disc space-y-2 text-slate-300">
          <li>
            You have matched your symptom to a guide and followed every
            recovery step listed.
          </li>
          <li>
            The issue <strong className="text-slate-200">persists</strong>{" "}
            after completing the documented fix.
          </li>
          <li>
            You can reproduce the issue consistently (or it has been
            intermittent for more than 30 minutes).
          </li>
        </ul>
        <p className="mt-2 text-slate-300">
          <strong className="text-slate-200">
            Contact support immediately
          </strong>{" "}
          (skip self-serve) if:
        </p>
        <ul className="ml-5 list-disc space-y-2 text-slate-300">
          <li>
            You suspect unauthorized use of your API key — revoke first at{" "}
            <Link
              href="/customer/keys"
              className="font-semibold text-primary-200 hover:text-primary-100"
            >
              /customer/keys
            </Link>
            , then report.
          </li>
          <li>
            You want to report a security vulnerability — follow the{" "}
            <Link
              href="/docs/auth"
              className="font-semibold text-primary-200 hover:text-primary-100"
            >
              responsible disclosure process
            </Link>
            .
          </li>
          <li>
            You see evidence of a service-wide outage (all endpoints returning
            5xx for all keys).
          </li>
        </ul>
      </section>

      {/* ── 5. Support-ready checklist ── */}
      <section className="space-y-4">
        <HeadingAnchor id="support-ready-checklist">
          Support-ready checklist
        </HeadingAnchor>
        <p className="text-slate-300">
          If you need to escalate, include the following in your{" "}
          <Link
            href="/feedback"
            className="font-semibold text-primary-200 hover:text-primary-100"
          >
            feedback submission
          </Link>
          . Complete information leads to faster resolution.
        </p>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
          <ul className="space-y-2">
            {ESCALATION_CHECKLIST.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-white/[0.1] bg-white/[0.04] text-[10px] font-bold text-slate-400">
                  {i + 1}
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sm text-slate-400">
          <strong className="text-slate-300">Tip:</strong> Run{" "}
          <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-sm text-slate-200">
            atf doctor
          </code>{" "}
          and paste the full output into your submission. It captures most
          of items 5–6 automatically.
        </p>
      </section>

      {/* ── 6. Common mistakes that delay resolution ── */}
      <section className="space-y-4">
        <HeadingAnchor id="common-mistakes">
          Common mistakes that delay resolution
        </HeadingAnchor>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.08] text-left text-slate-400">
                <th className="pb-2 pr-4 font-medium">Mistake</th>
                <th className="pb-2 font-medium">Better approach</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              <tr className="border-b border-white/[0.04]">
                <td className="py-2.5 pr-4">Paraphrasing the error message</td>
                <td className="py-2.5">Copy-paste the exact text or HTTP status code</td>
              </tr>
              <tr className="border-b border-white/[0.04]">
                <td className="py-2.5 pr-4">Submitting the API key secret</td>
                <td className="py-2.5">
                  Share the key <strong className="text-slate-200">ID</strong> only —
                  never the secret
                </td>
              </tr>
              <tr className="border-b border-white/[0.04]">
                <td className="py-2.5 pr-4">Skipping atf doctor</td>
                <td className="py-2.5">
                  Doctor output catches 80% of config issues in seconds
                </td>
              </tr>
              <tr className="border-b border-white/[0.04]">
                <td className="py-2.5 pr-4">Escalating transient 429 errors</td>
                <td className="py-2.5">
                  Honor Retry-After first — most 429s resolve in under a
                  minute
                </td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4">Testing prod issues in devnet</td>
                <td className="py-2.5">
                  Reproduce in the same environment (keys, RPC, profile) where
                  the issue occurred
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ── 7. Related guides ── */}
      <section className="space-y-4">
        <HeadingAnchor id="related-guides">Related guides</HeadingAnchor>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "Troubleshooting",
              href: "/docs/guide/troubleshooting",
              description: "40+ classified symptoms with exact recovery steps.",
            },
            {
              title: "API Key Lifecycle",
              href: "/docs/guide/key-lifecycle",
              description: "Create, rotate, revoke, and scope your keys.",
            },
            {
              title: "Rate Limits & Recovery",
              href: "/docs/guide/rate-limits",
              description: "Headers, backoff strategies, and quota recovery.",
            },
            {
              title: "Webhook Setup & Debugging",
              href: "/docs/guide/webhooks",
              description: "Signatures, dead-letter queues, and delivery health.",
            },
            {
              title: "Readiness & Health Checks",
              href: "/docs/guide/readiness",
              description: "CLI doctor, RPC connectivity, and preflight checks.",
            },
            {
              title: "Receipt Operations",
              href: "/docs/guide/receipts-ops",
              description: "Browse, verify, and export with content_hash validation.",
            },
            {
              title: "Production Bot Configuration",
              href: "/docs/guide/production-bot",
              description: "Environment setup, rollout stages, and monitoring.",
            },
          ].map((card) => (
            <Link key={card.href} href={card.href} className="block">
              <div className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition-colors hover:border-white/[0.12]">
                <h3 className="text-sm font-bold text-accent-300 group-hover:text-accent-200">
                  {card.title}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">
                  {card.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <section className="glass-panel rounded-xl p-7">
        <HeadingAnchor id="still-stuck">Still stuck?</HeadingAnchor>
        <p className="mt-3 text-slate-400">
          If you&apos;ve worked through the relevant guide and completed the{" "}
          <a
            href="#support-ready-checklist"
            className="font-semibold text-primary-200 hover:text-primary-100"
          >
            support-ready checklist
          </a>
          , submit a request via{" "}
          <Link
            href="/feedback"
            className="font-semibold text-primary-200 hover:text-primary-100"
          >
            feedback
          </Link>
          . Include the checklist items and we&apos;ll get back to you as
          quickly as possible.
        </p>
      </section>
    </div>
  );
}
