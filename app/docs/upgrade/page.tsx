import type { Metadata } from "next";
import Link from "next/link";
import { HeadingAnchor } from "@/components/heading-anchor";
import { CopyBlock } from "@/components/copy-block";

export const metadata: Metadata = {
  title: "Upgrade & Access",
  description:
    "Request Pro or Enterprise access, understand what happens after approval, and how ATF feature gating works.",
};

const UPGRADE_REQUEST_CURL = `curl -sS https://api.trucore.xyz/customer/upgrades/request \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -d '{
    "requested_plan": "pro",
    "reason": "Scaling production bot to 2,000+ protect calls/day"
  }'`;

const UPGRADE_RESPONSE = `{
  "request_id": "upgr_a1b2c3d4",
  "status": "pending",
  "requested_plan": "pro",
  "reason": "Scaling production bot to 2,000+ protect calls/day",
  "created_at": "2026-03-21T00:00:00Z"
}`;

const LIST_REQUESTS_CURL = `curl -sS https://api.trucore.xyz/customer/upgrades \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`;

export default function UpgradePage() {
  return (
    <article className="space-y-10">
      <header className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
          Plan Management
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-accent-200 sm:text-5xl">
          Upgrade &amp; Access
        </h1>
        <p className="max-w-3xl text-lg leading-relaxed text-slate-300">
          How to request Pro or Enterprise access, what happens after review,
          and how feature gating works at a high level.
        </p>
      </header>

      {/* ── Upgrade Path ── */}
      <section className="space-y-4">
        <HeadingAnchor id="upgrade-path">Upgrade Path</HeadingAnchor>
        <div className="flex flex-wrap items-center gap-3 text-lg font-semibold text-slate-200">
          <span className="rounded-lg border border-white/20 bg-white/[0.03] px-4 py-2">Free</span>
          <span className="text-slate-500">&rarr;</span>
          <span className="rounded-lg border border-primary-400/30 bg-primary-500/10 px-4 py-2">Pro</span>
          <span className="text-slate-500">&rarr;</span>
          <span className="rounded-lg border border-accent-400/30 bg-accent-500/10 px-4 py-2">Enterprise</span>
        </div>
        <p className="text-slate-300">
          All accounts start on the Free tier. Upgrade requests are reviewed by the TruCore team
          and typically processed within 1–2 business days.
        </p>
      </section>

      {/* ── How to Request ── */}
      <section className="space-y-4">
        <HeadingAnchor id="how-to-request">How to Request an Upgrade</HeadingAnchor>

        <h3 className="text-xl font-bold text-accent-300">Via the Portal</h3>
        <p className="text-slate-300">
          Visit{" "}
          <Link href="/upgrade" className="font-semibold text-primary-200 hover:text-primary-100">
            trucore.xyz/upgrade
          </Link>{" "}
          and select your desired plan. You can also navigate from the pricing page
          or the dashboard.
        </p>

        <h3 className="text-xl font-bold text-accent-300">Via API</h3>
        <CopyBlock label="bash" value={UPGRADE_REQUEST_CURL} />
        <CopyBlock label="json" value={UPGRADE_RESPONSE} />
      </section>

      {/* ── Request Status ── */}
      <section className="space-y-4">
        <HeadingAnchor id="request-status">Checking Request Status</HeadingAnchor>
        <CopyBlock label="bash" value={LIST_REQUESTS_CURL} />

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left">
                <th className="pb-2 pr-4 font-semibold text-slate-300">Status</th>
                <th className="pb-2 font-semibold text-slate-300">Meaning</th>
              </tr>
            </thead>
            <tbody className="text-slate-400">
              <tr className="border-b border-white/5">
                <td className="py-2 pr-4 font-mono text-xs text-amber-300">pending</td>
                <td className="py-2">Your request has been submitted and is awaiting review.</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-2 pr-4 font-mono text-xs text-emerald-300">approved</td>
                <td className="py-2">Approved - your plan has been upgraded and new limits are active.</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-2 pr-4 font-mono text-xs text-red-300">rejected</td>
                <td className="py-2">Rejected - check the review note for details. You can submit a new request.</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-2 pr-4 font-mono text-xs text-slate-300">cancelled</td>
                <td className="py-2">Cancelled by you before review.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="text-slate-400">
          You can cancel a pending request via{" "}
          <code className="font-mono text-slate-300">POST /customer/upgrades/&#123;id&#125;/cancel</code>.
          Only pending requests can be cancelled.
        </p>
      </section>

      {/* ── What Happens After Approval ── */}
      <section className="space-y-4">
        <HeadingAnchor id="after-approval">What Happens After Approval</HeadingAnchor>
        <div className="space-y-3">
          <div className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-500/20 text-sm font-bold text-primary-200">1</span>
            <div>
              <p className="font-semibold text-slate-200">Plan tier is updated</p>
              <p className="text-sm text-slate-400">Your tenant is assigned the new plan. This takes effect immediately.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-500/20 text-sm font-bold text-primary-200">2</span>
            <div>
              <p className="font-semibold text-slate-200">Rate limits increase</p>
              <p className="text-sm text-slate-400">
                Your daily protect, execution, and receipt storage limits increase to the new plan&apos;s values.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-500/20 text-sm font-bold text-primary-200">3</span>
            <div>
              <p className="font-semibold text-slate-200">Gated features unlock</p>
              <p className="text-sm text-slate-400">
                Features requiring your new plan level become available. Self-serve features activate
                automatically; request-only features may need additional configuration.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-500/20 text-sm font-bold text-primary-200">4</span>
            <div>
              <p className="font-semibold text-slate-200">No service interruption</p>
              <p className="text-sm text-slate-400">
                Upgrades are applied without downtime. Your existing API keys, receipts, and
                configuration are preserved.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature Gating ── */}
      <section className="space-y-4">
        <HeadingAnchor id="feature-gating">How Feature Gating Works</HeadingAnchor>
        <p className="text-slate-300">
          Every feature in ATF has a <strong className="text-slate-100">required plan</strong> and an{" "}
          <strong className="text-slate-100">access mode</strong> that determines how you gain access:
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-white/10 p-5 space-y-2">
            <h4 className="font-bold text-accent-300">Self-serve features</h4>
            <p className="text-sm text-slate-400">
              Automatically available when your plan meets the requirement.
              No manual activation needed.
            </p>
            <p className="text-xs text-slate-500">
              Examples: increased rate limits, advanced analytics, priority support
            </p>
          </div>
          <div className="rounded-lg border border-white/10 p-5 space-y-2">
            <h4 className="font-bold text-accent-300">Request-only features</h4>
            <p className="text-sm text-slate-400">
              Require an upgrade request and operator review. Used for features
              that need custom configuration or onboarding.
            </p>
            <p className="text-xs text-slate-500">
              Examples: perps enforcement, custom policy configuration, audit log exports
            </p>
          </div>
        </div>
        <p className="text-slate-400">
          Browse the full public feature catalog at{" "}
          <code className="font-mono text-slate-300">GET /features/catalog</code> to see
          which features are available on your plan and their access modes.
        </p>
      </section>

      {/* ── Pro vs Enterprise ── */}
      <section className="space-y-4">
        <HeadingAnchor id="pro-vs-enterprise">Pro vs Enterprise</HeadingAnchor>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-primary-400/20 bg-primary-500/5 p-5 space-y-2">
            <h3 className="text-lg font-bold text-primary-200">Pro</h3>
            <ul className="space-y-1.5 text-sm text-slate-300">
              <li>5,000 protect calls / day</li>
              <li>500 execution calls / day</li>
              <li>10,000 stored receipts</li>
              <li>Priority support</li>
              <li>Advanced usage analytics</li>
            </ul>
            <p className="text-xs text-slate-500">Best for teams with production bots</p>
          </div>
          <div className="rounded-lg border border-accent-400/20 bg-accent-500/5 p-5 space-y-2">
            <h3 className="text-lg font-bold text-accent-200">Enterprise</h3>
            <ul className="space-y-1.5 text-sm text-slate-300">
              <li>Effectively unlimited capacity</li>
              <li>Dedicated support &amp; onboarding</li>
              <li>Custom policy configuration</li>
              <li>SLA guarantees</li>
              <li>Audit log exports</li>
            </ul>
            <p className="text-xs text-slate-500">Best for institutions and high-volume deployments</p>
          </div>
        </div>
      </section>

      {/* ── Next Steps ── */}
      <section className="space-y-4">
        <HeadingAnchor id="next-steps">Next Steps</HeadingAnchor>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/pricing"
            className="group rounded-lg border border-white/10 p-5 transition-colors hover:border-white/20"
          >
            <h3 className="font-bold text-accent-300 group-hover:text-accent-200">Pricing &rarr;</h3>
            <p className="mt-1 text-sm text-slate-400">Full pricing comparison with limits and FAQ.</p>
          </Link>
          <Link
            href="/docs/plans"
            className="group rounded-lg border border-white/10 p-5 transition-colors hover:border-white/20"
          >
            <h3 className="font-bold text-accent-300 group-hover:text-accent-200">Plans &amp; Feature Tiers &rarr;</h3>
            <p className="mt-1 text-sm text-slate-400">Detailed feature availability matrix by plan.</p>
          </Link>
        </div>
      </section>
    </article>
  );
}
