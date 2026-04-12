import type { Metadata } from "next";
import Link from "next/link";
import { HeadingAnchor } from "@/components/heading-anchor";
import { CopyBlock } from "@/components/copy-block";

export const metadata: Metadata = {
  title: "Reconcile & State Recovery — Customer Guide",
  description:
    "Assess agent health, detect drift, plan repairs with dry-run, trigger token rotation, and respond to reconcile webhook events.",
  robots: { index: false, follow: false },
};

/* ── Constants ── */

const RECONCILE_ENDPOINT = "POST /v1/agent/reconcile";
const RECONCILE_CLI = "atf agent reconcile";

/* ── Reconcile statuses ── */

const RECONCILE_STATUSES = [
  {
    status: "healthy",
    meaning: "No issues detected. Token, API key, drift, and readiness all pass.",
    action: "No action required. Continue normal operation.",
    color: "emerald",
  },
  {
    status: "repaired",
    meaning:
      "At least one issue was detected and automatically repaired (e.g. token rotated, metadata corrected).",
    action:
      "Review actions_taken in the response. Update local environment if repair_plan indicates local changes needed.",
    color: "amber",
  },
  {
    status: "failed",
    meaning:
      "An issue was detected but could not be automatically repaired. Manual intervention required.",
    action:
      "Check repair_plan for next_steps. Run readiness checks. Contact support if unresolved.",
    color: "red",
  },
] as const;

/* ── Drift assessment statuses ── */

const DRIFT_STATUSES = [
  {
    status: "ALIGNED",
    meaning: "Local environment matches server state.",
    action: "No action needed.",
  },
  {
    status: "STALE",
    meaning:
      "Local state is outdated (e.g. env file references an old token or expired metadata).",
    action: "Re-run bootstrap or rotation to refresh local state.",
  },
  {
    status: "MISSING",
    meaning: "Expected local state is absent (e.g. no .env file, no API key stored).",
    action: "Run atf setup or re-bootstrap your environment.",
  },
  {
    status: "INVALID",
    meaning: "Local state exists but is malformed or incompatible.",
    action: "Delete the corrupted state file and re-bootstrap.",
  },
  {
    status: "UNKNOWN",
    meaning: "Server could not assess local state (client_local_state not provided).",
    action: "Include client_local_state in your next reconcile request.",
  },
] as const;

/* ── Reconcile webhook events ── */

const RECONCILE_EVENTS = [
  {
    event: "agent.reconcile.healthy",
    trigger: "Reconcile passed with no issues.",
    defaultOn: false,
    notes: "Opt-in only. High-frequency heartbeat — subscribe explicitly.",
  },
  {
    event: "agent.reconcile.repaired",
    trigger: "Reconcile detected and repaired at least one issue.",
    defaultOn: true,
    notes: "Carries reconcile_status, actions_taken, warnings, next_steps.",
  },
  {
    event: "agent.reconcile.failed",
    trigger: "Reconcile could not restore health — manual attention required.",
    defaultOn: true,
    notes: "Carries reconcile_status, actions_taken, warnings, next_steps.",
  },
] as const;

/* ── What reconcile can and cannot repair ── */

const CAN_REPAIR = [
  {
    area: "Service token rotation",
    description:
      "Rotates expired or near-expiry service tokens automatically. New token returned in response.",
  },
  {
    area: "API key health verification",
    description:
      "Detects revoked, suspended, or invalid API keys and reports status.",
  },
  {
    area: "Drift metadata correction",
    description:
      "Corrects server-side metadata when local environment drift is detected.",
  },
  {
    area: "Bootstrap detection",
    description:
      "Identifies missing environment files or API key state and flags for re-setup.",
  },
] as const;

const CANNOT_REPAIR = [
  {
    area: "Local environment files",
    description:
      "Reconcile runs server-side. It cannot write to your local .env file or file system — you must apply local changes manually.",
  },
  {
    area: "Revoked API keys",
    description:
      "If your API key is revoked, reconcile reports the problem but cannot un-revoke it. Generate a new key from the Keys dashboard.",
  },
  {
    area: "On-chain transaction state",
    description:
      "Transaction-level reconciliation (comparing on-chain vs expected state) is not yet available. This guide covers credential and session health only.",
  },
  {
    area: "Network or RPC issues",
    description:
      "Reconcile assesses ATF-managed state. External network failures or RPC outages are outside its scope — use readiness checks instead.",
  },
] as const;

/* ── Common recovery patterns ── */

const RECOVERY_PATTERNS = [
  {
    scenario: "Service token expired during overnight batch",
    symptoms: "401 errors after long idle period; reconcile status = repaired",
    steps: [
      "Run reconcile with rotate_if_recommended: true",
      "Update local environment with new token from rotation_result",
      "Confirm with a subsequent dry-run reconcile (status should be healthy)",
    ],
  },
  {
    scenario: "API key revoked after team rotation",
    symptoms: "403 errors on all requests; reconcile status = failed",
    steps: [
      "Run reconcile with verify_api_key: true to confirm revocation",
      "Generate a new API key from /customer/keys",
      "Update local .env and re-run atf doctor",
      "Run reconcile again to confirm healthy status",
    ],
  },
  {
    scenario: "Environment drift after deploy",
    symptoms:
      "Reconcile reports STALE drift; webhook events stopped; readiness intermittent",
    steps: [
      "Run dry-run reconcile to see planned_actions",
      "Re-bootstrap environment: atf setup",
      "Run real reconcile to verify and correct server metadata",
      "Confirm drift_assessment returns ALIGNED",
    ],
  },
  {
    scenario: "Missing bootstrap state on new instance",
    symptoms:
      "Reconcile reports MISSING drift; no .env file present; token unknown",
    steps: [
      "Run atf setup to create initial environment file",
      "Configure API key via atf whoami",
      "Run reconcile to verify server sees aligned state",
    ],
  },
  {
    scenario: "Unknown state after infrastructure migration",
    symptoms: "Unclear whether old tokens and keys are still valid",
    steps: [
      "Run dry-run reconcile with verify_api_key: true and client_local_state",
      "Review planned_actions to understand what would change",
      "If safe, run real reconcile with rotate_if_recommended: true",
      "Update local environment with any new credentials",
      "Run readiness checks to confirm end-to-end health",
    ],
  },
] as const;

/* ── Page ── */

export default function ReconcileGuide() {
  return (
    <div className="space-y-12">
      {/* ── Header ── */}
      <header className="space-y-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
          Customer Guide · Phase D
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-accent-200 sm:text-5xl">
          Reconcile &amp; State Recovery
        </h1>
        <p className="max-w-3xl text-lg leading-relaxed text-slate-300">
          Reconcile assesses the health of your agent&apos;s credentials,
          tokens, and environment — detecting drift, repairing what it can
          server-side, and telling you exactly what to fix locally. This
          guide covers when to reconcile, how to use dry-run mode, what the
          statuses mean, and safe recovery patterns.
        </p>
        <div className="gradient-divider mt-2" aria-hidden="true" />
      </header>

      {/* ── Scope banner ── */}
      <div className="rounded-lg border border-primary-400/20 bg-primary-400/[0.06] px-4 py-3 text-sm text-slate-300">
        <strong className="text-primary-200">Scope:</strong> This guide
        covers credential and session health reconciliation — service tokens,
        API keys, environment drift, and bootstrap state. Transaction-level
        reconciliation (on-chain state comparison) is a future capability not
        yet available.
      </div>

      {/* ── Section 1: What this guide is for ── */}
      <section className="space-y-4">
        <HeadingAnchor id="what-this-guide-is-for">
          What this guide is for
        </HeadingAnchor>
        <p className="text-slate-300">
          Use this guide when you need to:
        </p>
        <ul className="ml-5 list-disc space-y-2 text-slate-300">
          <li>Verify that your agent&apos;s credentials are still valid after a deploy, migration, or idle period</li>
          <li>Diagnose why requests are failing with 401/403 errors</li>
          <li>Rotate an expiring service token before it causes downtime</li>
          <li>Detect and correct drift between your local environment and server state</li>
          <li>Preview repairs with dry-run before applying them</li>
          <li>Respond to{" "}
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-sm text-slate-200">
              agent.reconcile.repaired
            </code>{" "}
            or{" "}
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-sm text-slate-200">
              agent.reconcile.failed
            </code>{" "}
            webhook events
          </li>
        </ul>
        <p className="text-slate-300">
          If you are setting up for the first time or checking whether your
          integration <em>can</em> operate, start with the{" "}
          <Link
            href="/docs/guide/readiness"
            className="font-semibold text-primary-200 hover:text-primary-100"
          >
            Readiness &amp; Health Checks
          </Link>{" "}
          guide instead. Reconcile is for verifying that things <em>did</em>{" "}
          work and recovering when they didn&apos;t.
        </p>
      </section>

      {/* ── Section 2: What reconcile means in ATF ── */}
      <section className="space-y-4">
        <HeadingAnchor id="what-reconcile-means">
          What reconcile means in ATF
        </HeadingAnchor>
        <p className="text-slate-300">
          Reconcile is a server-side health assessment and repair cycle for
          your agent&apos;s authentication and environment state. When you
          call the reconcile endpoint, it:
        </p>
        <ol className="ml-5 list-decimal space-y-2 text-slate-300">
          <li>Checks your service token status (expiry, revocation, rotation eligibility)</li>
          <li>Optionally verifies your API key (active, revoked, or suspended)</li>
          <li>Compares server state with your reported local state (drift detection)</li>
          <li>Runs readiness checks to confirm overall integration health</li>
          <li>Performs repairs if requested and possible (token rotation, metadata correction)</li>
          <li>Emits a webhook event with the result</li>
        </ol>
        <p className="text-slate-300">
          The endpoint is available at{" "}
          <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-sm text-slate-200">
            {RECONCILE_ENDPOINT}
          </code>{" "}
          and via the CLI as{" "}
          <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-sm text-slate-200">
            {RECONCILE_CLI}
          </code>
          .
        </p>
      </section>

      {/* ── Section 3: Readiness vs reconcile ── */}
      <section className="space-y-4">
        <HeadingAnchor id="readiness-vs-reconcile">
          How reconcile differs from readiness
        </HeadingAnchor>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-slate-400">
                <th className="pb-2 pr-6 font-medium">Aspect</th>
                <th className="pb-2 pr-6 font-medium">Readiness</th>
                <th className="pb-2 font-medium">Reconcile</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              <tr className="border-b border-white/[0.04]">
                <td className="py-2.5 pr-6 font-medium text-slate-200">Question answered</td>
                <td className="py-2.5 pr-6">&ldquo;Can my integration operate?&rdquo;</td>
                <td className="py-2.5">&ldquo;Did it operate correctly? Is state consistent?&rdquo;</td>
              </tr>
              <tr className="border-b border-white/[0.04]">
                <td className="py-2.5 pr-6 font-medium text-slate-200">When to use</td>
                <td className="py-2.5 pr-6">Before first trade, after setup changes</td>
                <td className="py-2.5">After deploys, after failures, on a schedule</td>
              </tr>
              <tr className="border-b border-white/[0.04]">
                <td className="py-2.5 pr-6 font-medium text-slate-200">Mutations</td>
                <td className="py-2.5 pr-6">Read-only — no state changes</td>
                <td className="py-2.5">Can rotate tokens, correct metadata</td>
              </tr>
              <tr className="border-b border-white/[0.04]">
                <td className="py-2.5 pr-6 font-medium text-slate-200">Dry-run mode</td>
                <td className="py-2.5 pr-6">N/A (already read-only)</td>
                <td className="py-2.5">Yes — preview repairs without applying</td>
              </tr>
              <tr className="border-b border-white/[0.04]">
                <td className="py-2.5 pr-6 font-medium text-slate-200">Webhook events</td>
                <td className="py-2.5 pr-6">None</td>
                <td className="py-2.5">healthy, repaired, failed</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-6 font-medium text-slate-200">CLI command</td>
                <td className="py-2.5 pr-6">atf doctor</td>
                <td className="py-2.5">atf agent reconcile</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-slate-300">
          In practice, readiness is your first-line diagnostic.
          Reconcile is the deeper assessment that can also take corrective
          action.
        </p>
      </section>

      {/* ── Section 4: Dry-run vs real ── */}
      <section className="space-y-4">
        <HeadingAnchor id="dry-run-vs-real">
          Dry-run vs real reconcile
        </HeadingAnchor>
        <p className="text-slate-300">
          Every reconcile request accepts a{" "}
          <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-sm text-slate-200">
            dry_run
          </code>{" "}
          flag. When enabled, the full assessment runs but no mutations
          are applied:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-slate-400">
                <th className="pb-2 pr-6 font-medium">Behavior</th>
                <th className="pb-2 pr-6 font-medium">dry_run: true</th>
                <th className="pb-2 font-medium">dry_run: false</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              <tr className="border-b border-white/[0.04]">
                <td className="py-2.5 pr-6">Health assessment</td>
                <td className="py-2.5 pr-6">✓ Full assessment runs</td>
                <td className="py-2.5">✓ Full assessment runs</td>
              </tr>
              <tr className="border-b border-white/[0.04]">
                <td className="py-2.5 pr-6">Token rotation</td>
                <td className="py-2.5 pr-6">✗ Skipped — shows in planned_actions</td>
                <td className="py-2.5">✓ Applied if recommended</td>
              </tr>
              <tr className="border-b border-white/[0.04]">
                <td className="py-2.5 pr-6">Metadata correction</td>
                <td className="py-2.5 pr-6">✗ Skipped — shows in planned_actions</td>
                <td className="py-2.5">✓ Applied if needed</td>
              </tr>
              <tr className="border-b border-white/[0.04]">
                <td className="py-2.5 pr-6">Webhook emission</td>
                <td className="py-2.5 pr-6">✗ No events emitted</td>
                <td className="py-2.5">✓ Event dispatched</td>
              </tr>
              <tr className="border-b border-white/[0.04]">
                <td className="py-2.5 pr-6">Audit log entry</td>
                <td className="py-2.5 pr-6">✗ Not recorded</td>
                <td className="py-2.5">✓ Recorded</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-6">Response includes</td>
                <td className="py-2.5 pr-6">planned_actions (what would change)</td>
                <td className="py-2.5">actions_taken (what did change)</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-slate-300">
          <strong className="text-slate-200">Best practice:</strong> Always
          run a dry-run first when diagnosing issues. Review{" "}
          <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-sm text-slate-200">
            planned_actions
          </code>{" "}
          to understand what will change before committing to a real reconcile.
        </p>

        <h4 className="text-sm font-semibold text-slate-200">CLI</h4>
        <CopyBlock label="Dry-run reconcile" value="atf agent reconcile --dry-run --output=json" />

        <h4 className="text-sm font-semibold text-slate-200">HTTP</h4>
        <CopyBlock
          label="Dry-run reconcile (API)"
          value={`curl -s -X POST https://api.trucore.xyz/v1/agent/reconcile \\
  -H "Authorization: Bearer \$ATF_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"dry_run": true, "verify_api_key": true}'`}
        />
      </section>

      {/* ── Section 5: When to use reconcile ── */}
      <section className="space-y-4">
        <HeadingAnchor id="when-to-use">
          When customers should use reconcile
        </HeadingAnchor>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-slate-400">
                <th className="pb-2 pr-6 font-medium">Scenario</th>
                <th className="pb-2 pr-6 font-medium">Recommended mode</th>
                <th className="pb-2 font-medium">Why</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              <tr className="border-b border-white/[0.04]">
                <td className="py-2.5 pr-6">After deploy or infra migration</td>
                <td className="py-2.5 pr-6">Dry-run first, then real</td>
                <td className="py-2.5">Verify state survived the change before auto-repairing</td>
              </tr>
              <tr className="border-b border-white/[0.04]">
                <td className="py-2.5 pr-6">After unexpected 401/403 errors</td>
                <td className="py-2.5 pr-6">Real with rotate_if_recommended</td>
                <td className="py-2.5">Diagnose and fix token/key issues in one call</td>
              </tr>
              <tr className="border-b border-white/[0.04]">
                <td className="py-2.5 pr-6">Scheduled health check (cron)</td>
                <td className="py-2.5 pr-6">Real (low frequency)</td>
                <td className="py-2.5">Catch expiring tokens before they cause failures</td>
              </tr>
              <tr className="border-b border-white/[0.04]">
                <td className="py-2.5 pr-6">After receiving reconcile.failed webhook</td>
                <td className="py-2.5 pr-6">Dry-run to diagnose</td>
                <td className="py-2.5">Understand what failed before retrying repairs</td>
              </tr>
              <tr className="border-b border-white/[0.04]">
                <td className="py-2.5 pr-6">Before going live in production</td>
                <td className="py-2.5 pr-6">Dry-run</td>
                <td className="py-2.5">Confirm no drift or stale state from staging</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-6">New team member onboarding a new instance</td>
                <td className="py-2.5 pr-6">Real with client_local_state</td>
                <td className="py-2.5">Bootstrap detection identifies missing environment setup</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Section 6: What reconcile can and cannot repair ── */}
      <section className="space-y-4">
        <HeadingAnchor id="can-and-cannot-repair">
          What reconcile can and cannot repair
        </HeadingAnchor>
        <h4 className="text-sm font-semibold text-emerald-400">
          ✓ Can repair (server-side)
        </h4>
        <div className="space-y-3">
          {CAN_REPAIR.map((item) => (
            <div
              key={item.area}
              className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-3"
            >
              <p className="text-sm font-semibold text-emerald-300">{item.area}</p>
              <p className="mt-1 text-sm text-slate-300">{item.description}</p>
            </div>
          ))}
        </div>

        <h4 className="mt-6 text-sm font-semibold text-red-400">
          ✗ Cannot repair
        </h4>
        <div className="space-y-3">
          {CANNOT_REPAIR.map((item) => (
            <div
              key={item.area}
              className="rounded-lg border border-red-500/20 bg-red-500/[0.06] px-4 py-3"
            >
              <p className="text-sm font-semibold text-red-300">{item.area}</p>
              <p className="mt-1 text-sm text-slate-300">{item.description}</p>
            </div>
          ))}
        </div>

        <p className="text-slate-300">
          <strong className="text-slate-200">Key principle:</strong> Reconcile
          is honest about its boundaries. When it cannot fix something
          server-side, the{" "}
          <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-sm text-slate-200">
            repair_plan
          </code>{" "}
          response tells you exactly what you need to do locally.
        </p>
      </section>

      {/* ── Section 7: Reconcile and webhooks ── */}
      <section className="space-y-4">
        <HeadingAnchor id="webhooks-and-receipts">
          How reconcile interacts with webhooks and receipts
        </HeadingAnchor>
        <p className="text-slate-300">
          Real (non-dry-run) reconcile cycles emit webhook events so you
          can build automated monitoring and alerting around agent health.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-slate-400">
                <th className="pb-2 pr-6 font-medium">Event</th>
                <th className="pb-2 pr-6 font-medium">Trigger</th>
                <th className="pb-2 pr-6 font-medium">Default</th>
                <th className="pb-2 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {RECONCILE_EVENTS.map((evt) => (
                <tr key={evt.event} className="border-b border-white/[0.04]">
                  <td className="py-2.5 pr-6">
                    <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
                      {evt.event}
                    </code>
                  </td>
                  <td className="py-2.5 pr-6">{evt.trigger}</td>
                  <td className="py-2.5 pr-6">
                    {evt.defaultOn ? (
                      <span className="text-emerald-400">On</span>
                    ) : (
                      <span className="text-amber-400">Opt-in</span>
                    )}
                  </td>
                  <td className="py-2.5">{evt.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-slate-300">
          Each webhook payload includes{" "}
          <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-sm text-slate-200">
            reconcile_status
          </code>
          ,{" "}
          <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-sm text-slate-200">
            actions_taken
          </code>
          ,{" "}
          <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-sm text-slate-200">
            warnings
          </code>
          , and{" "}
          <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-sm text-slate-200">
            next_steps
          </code>
          . For full event schema details, see the{" "}
          <Link
            href="/docs/guide/webhooks#event-types"
            className="font-semibold text-primary-200 hover:text-primary-100"
          >
            Webhook Setup &amp; Debugging
          </Link>{" "}
          guide.
        </p>
        <p className="text-slate-300">
          <strong className="text-slate-200">Receipts:</strong> Reconcile
          does not generate trade receipts (it is an operational endpoint,
          not a trade endpoint). To verify trade-level execution integrity,
          use the{" "}
          <Link
            href="/docs/guide/receipts-ops"
            className="font-semibold text-primary-200 hover:text-primary-100"
          >
            Receipt Operations
          </Link>{" "}
          guide.
        </p>
      </section>

      {/* ── Section 8: Reconcile outcomes / statuses ── */}
      <section className="space-y-4">
        <HeadingAnchor id="statuses">
          Reconcile outcomes and statuses
        </HeadingAnchor>
        <p className="text-slate-300">
          Every reconcile response includes a top-level{" "}
          <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-sm text-slate-200">
            status
          </code>{" "}
          field with one of three values:
        </p>
        <div className="space-y-3">
          {RECONCILE_STATUSES.map((s) => (
            <div
              key={s.status}
              className={`rounded-lg border px-4 py-3 ${
                s.color === "emerald"
                  ? "border-emerald-500/20 bg-emerald-500/[0.06]"
                  : s.color === "amber"
                    ? "border-amber-500/20 bg-amber-500/[0.06]"
                    : "border-red-500/20 bg-red-500/[0.06]"
              }`}
            >
              <div className="flex items-center gap-2">
                <code
                  className={`rounded px-1.5 py-0.5 text-sm font-semibold ${
                    s.color === "emerald"
                      ? "bg-emerald-500/20 text-emerald-300"
                      : s.color === "amber"
                        ? "bg-amber-500/20 text-amber-300"
                        : "bg-red-500/20 text-red-300"
                  }`}
                >
                  {s.status}
                </code>
              </div>
              <p className="mt-2 text-sm text-slate-300">{s.meaning}</p>
              <p className="mt-1 text-sm text-slate-400">
                <strong className="text-slate-300">Action:</strong> {s.action}
              </p>
            </div>
          ))}
        </div>

        <h4 className="mt-6 text-sm font-semibold text-slate-200">
          Drift assessment statuses
        </h4>
        <p className="text-slate-300">
          When you include{" "}
          <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-sm text-slate-200">
            client_local_state
          </code>{" "}
          in your request, the response includes a{" "}
          <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-sm text-slate-200">
            drift_assessment
          </code>{" "}
          field:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-slate-400">
                <th className="pb-2 pr-6 font-medium">Status</th>
                <th className="pb-2 pr-6 font-medium">Meaning</th>
                <th className="pb-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {DRIFT_STATUSES.map((d) => (
                <tr key={d.status} className="border-b border-white/[0.04]">
                  <td className="py-2.5 pr-6">
                    <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs font-semibold text-slate-200">
                      {d.status}
                    </code>
                  </td>
                  <td className="py-2.5 pr-6">{d.meaning}</td>
                  <td className="py-2.5">{d.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Section 9: Response structure ── */}
      <section className="space-y-4">
        <HeadingAnchor id="response-structure">
          Understanding the response
        </HeadingAnchor>
        <p className="text-slate-300">
          The reconcile response includes several important sections. Here
          are the key fields to check:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-slate-400">
                <th className="pb-2 pr-6 font-medium">Field</th>
                <th className="pb-2 pr-6 font-medium">Type</th>
                <th className="pb-2 font-medium">Description</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              <tr className="border-b border-white/[0.04]">
                <td className="py-2.5 pr-6"><code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">status</code></td>
                <td className="py-2.5 pr-6">string</td>
                <td className="py-2.5">&ldquo;healthy&rdquo; | &ldquo;repaired&rdquo; | &ldquo;failed&rdquo;</td>
              </tr>
              <tr className="border-b border-white/[0.04]">
                <td className="py-2.5 pr-6"><code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">dry_run</code></td>
                <td className="py-2.5 pr-6">boolean</td>
                <td className="py-2.5">Echoes your input — true if this was a planning-only run</td>
              </tr>
              <tr className="border-b border-white/[0.04]">
                <td className="py-2.5 pr-6"><code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">actions_taken</code></td>
                <td className="py-2.5 pr-6">array</td>
                <td className="py-2.5">List of repairs performed (empty in dry-run mode)</td>
              </tr>
              <tr className="border-b border-white/[0.04]">
                <td className="py-2.5 pr-6"><code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">planned_actions</code></td>
                <td className="py-2.5 pr-6">array</td>
                <td className="py-2.5">Repairs that would be performed (only in dry-run mode)</td>
              </tr>
              <tr className="border-b border-white/[0.04]">
                <td className="py-2.5 pr-6"><code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">repair_plan</code></td>
                <td className="py-2.5 pr-6">object</td>
                <td className="py-2.5">Declarative plan: requires_local_rebootstrap, requires_token_rotation, next_steps</td>
              </tr>
              <tr className="border-b border-white/[0.04]">
                <td className="py-2.5 pr-6"><code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">rotation_result</code></td>
                <td className="py-2.5 pr-6">object | null</td>
                <td className="py-2.5">New token credentials if rotation was performed</td>
              </tr>
              <tr className="border-b border-white/[0.04]">
                <td className="py-2.5 pr-6"><code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">agent_status</code></td>
                <td className="py-2.5 pr-6">object</td>
                <td className="py-2.5">Detailed auth, token, drift, and readiness sub-statuses</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-6"><code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">reconcile_cycle_id</code></td>
                <td className="py-2.5 pr-6">string</td>
                <td className="py-2.5">Unique ID for this cycle — use for idempotency and debugging</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Section 10: Rate limiting ── */}
      <section className="space-y-4">
        <HeadingAnchor id="rate-limiting">
          Rate limiting
        </HeadingAnchor>
        <p className="text-slate-300">
          The reconcile endpoint is rate-limited per customer to prevent
          accidental overload. Default limits:
        </p>
        <ul className="ml-5 list-disc space-y-2 text-slate-300">
          <li>
            <strong className="text-slate-200">2 requests per second</strong>{" "}
            sustained rate
          </li>
          <li>
            <strong className="text-slate-200">10 request burst</strong>{" "}
            capacity
          </li>
        </ul>
        <p className="text-slate-300">
          Standard rate-limit response headers are included on every response:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-slate-400">
                <th className="pb-2 pr-6 font-medium">Header</th>
                <th className="pb-2 font-medium">Meaning</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              <tr className="border-b border-white/[0.04]">
                <td className="py-2.5 pr-6"><code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">X-RateLimit-Limit</code></td>
                <td className="py-2.5">Burst capacity for your account</td>
              </tr>
              <tr className="border-b border-white/[0.04]">
                <td className="py-2.5 pr-6"><code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">X-RateLimit-Remaining</code></td>
                <td className="py-2.5">Tokens remaining after this request</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-6"><code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">X-RateLimit-Reset</code></td>
                <td className="py-2.5">Seconds until full replenishment</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-slate-300">
          If you exceed the limit, you receive an HTTP 429 with a{" "}
          <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-sm text-slate-200">
            Retry-After
          </code>{" "}
          header. Apply the same backoff patterns described in the{" "}
          <Link
            href="/docs/guide/rate-limits"
            className="font-semibold text-primary-200 hover:text-primary-100"
          >
            Rate Limits &amp; Recovery
          </Link>{" "}
          guide.
        </p>
      </section>

      {/* ── Section 11: Safe recovery patterns ── */}
      <section className="space-y-4">
        <HeadingAnchor id="recovery-patterns">
          Safe customer recovery patterns
        </HeadingAnchor>
        <p className="text-slate-300">
          These are the most common scenarios where reconcile helps, along
          with step-by-step recovery actions:
        </p>
        <div className="space-y-6">
          {RECOVERY_PATTERNS.map((pattern, i) => (
            <div
              key={i}
              className="rounded-lg border border-white/[0.08] bg-white/[0.02] px-5 py-4"
            >
              <h4 className="text-sm font-bold text-accent-300">
                {pattern.scenario}
              </h4>
              <p className="mt-1 text-xs text-slate-400">
                <strong className="text-slate-300">Symptoms:</strong>{" "}
                {pattern.symptoms}
              </p>
              <ol className="ml-5 mt-3 list-decimal space-y-1 text-sm text-slate-300">
                {pattern.steps.map((step, j) => (
                  <li key={j}>{step}</li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section 12: CLI reference ── */}
      <section className="space-y-4">
        <HeadingAnchor id="cli-reference">
          CLI quick reference
        </HeadingAnchor>
        <p className="text-slate-300">
          The CLI wraps the reconcile API with convenient defaults:
        </p>
        <div className="space-y-3">
          <CopyBlock
            label="Single reconcile (dry-run)"
            value="atf agent reconcile --once --dry-run --output=json"
          />
          <CopyBlock
            label="Single reconcile (real, with rotation)"
            value="atf agent reconcile --once --output=json"
          />
          <CopyBlock
            label="Reconcile loop (scheduled health check)"
            value="atf agent reconcile"
          />
          <CopyBlock
            label="Force re-bootstrap"
            value="atf agent reconcile --once --force-bootstrap"
          />
          <CopyBlock
            label="Target a specific service token"
            value="atf agent reconcile --once --target-token-id TOKEN_UUID"
          />
        </div>
        <p className="text-slate-300">
          In loop mode (without{" "}
          <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-sm text-slate-200">
            --once
          </code>
          ), the CLI runs reconcile on a continuous schedule, suitable for
          background health monitoring in production deployments.
        </p>
      </section>

      {/* ── Section 13: Common mistakes ── */}
      <section className="space-y-4">
        <HeadingAnchor id="common-mistakes">
          Common mistakes
        </HeadingAnchor>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-slate-400">
                <th className="pb-2 pr-6 font-medium">Mistake</th>
                <th className="pb-2 font-medium">Fix</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              <tr className="border-b border-white/[0.04]">
                <td className="py-2.5 pr-6">Running real reconcile without reviewing dry-run first</td>
                <td className="py-2.5">Always dry-run first, especially after migrations or failures</td>
              </tr>
              <tr className="border-b border-white/[0.04]">
                <td className="py-2.5 pr-6">Ignoring repair_plan.requires_local_rebootstrap</td>
                <td className="py-2.5">Server can&apos;t write your .env — apply local changes promptly</td>
              </tr>
              <tr className="border-b border-white/[0.04]">
                <td className="py-2.5 pr-6">Not updating local env after token rotation</td>
                <td className="py-2.5">When rotation_result includes a new token, update your .env immediately</td>
              </tr>
              <tr className="border-b border-white/[0.04]">
                <td className="py-2.5 pr-6">Omitting client_local_state from requests</td>
                <td className="py-2.5">Without it, drift assessment returns UNKNOWN — include it for full diagnostics</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-6">Polling reconcile at high frequency</td>
                <td className="py-2.5">Rate-limited to 2 RPS default. Use webhook events for real-time monitoring instead</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Section 14: Related guides ── */}
      <section className="space-y-4">
        <HeadingAnchor id="related-guides">
          Related guides
        </HeadingAnchor>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            {
              title: "Readiness & Health Checks",
              href: "/docs/guide/readiness",
              description:
                "First-line diagnostics. Start here if you are unsure whether the issue is readiness or reconcile.",
            },
            {
              title: "Webhook Setup & Debugging",
              href: "/docs/guide/webhooks",
              description:
                "Configure and troubleshoot webhook delivery for reconcile events.",
            },
            {
              title: "API Key Lifecycle",
              href: "/docs/guide/key-lifecycle",
              description:
                "Create, rotate, and revoke API keys. Relevant when reconcile reports key issues.",
            },
            {
              title: "Rate Limits & Recovery",
              href: "/docs/guide/rate-limits",
              description:
                "Backoff strategies for the reconcile rate limit and all other endpoints.",
            },
            {
              title: "Receipt Operations",
              href: "/docs/guide/receipts-ops",
              description:
                "Trade-level verification. Reconcile covers session health; receipts cover trade integrity.",
            },
            {
              title: "Troubleshooting",
              href: "/docs/guide/troubleshooting",
              description:
                "Broader symptom-driven error classification and recovery across all integration surfaces.",
            },
            {
              title: "Production Bot Configuration",
              href: "/docs/guide/production-bot",
              description:
                "Environment setup and operational hygiene. Reconcile fits into the production health loop.",
            },
            {
              title: "Support Deflection",
              href: "/docs/guide/support-deflection",
              description:
                "When to self-serve vs escalate. Run reconcile before contacting support.",
            },
          ].map((guide) => (
            <Link key={guide.href} href={guide.href} className="block">
              <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-4 transition-colors hover:border-white/[0.14]">
                <h4 className="text-sm font-bold text-accent-300">
                  {guide.title}
                </h4>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">
                  {guide.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Still stuck? ── */}
      <section className="glass-panel rounded-xl p-7">
        <HeadingAnchor id="still-stuck">Still stuck?</HeadingAnchor>
        <p className="mt-3 text-slate-400">
          If reconcile reports{" "}
          <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-sm text-slate-200">
            failed
          </code>{" "}
          and the recovery patterns above don&apos;t resolve the issue:
        </p>
        <ol className="ml-5 mt-3 list-decimal space-y-2 text-slate-400">
          <li>
            Save the full JSON response (include{" "}
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
              reconcile_cycle_id
            </code>
            )
          </li>
          <li>
            Run{" "}
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
              atf doctor
            </code>{" "}
            and save its output
          </li>
          <li>
            Check the{" "}
            <Link
              href="/docs/guide/support-deflection"
              className="font-semibold text-primary-200 hover:text-primary-100"
            >
              Support Deflection
            </Link>{" "}
            guide to confirm this warrants escalation
          </li>
          <li>
            Submit feedback via{" "}
            <Link
              href="/feedback"
              className="font-semibold text-primary-200 hover:text-primary-100"
            >
              the feedback form
            </Link>{" "}
            with both outputs attached
          </li>
        </ol>
      </section>
    </div>
  );
}
