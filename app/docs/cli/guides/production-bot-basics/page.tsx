import type { Metadata } from "next";
import Link from "next/link";
import { HeadingAnchor } from "@/components/heading-anchor";
import { AtfCopyCommand } from "@/components/atf-copy-command";
import { getAtfCliVersion } from "@/lib/version";

export const metadata: Metadata = {
  title: "ATF CLI Guide: Production Bot Basics",
  description:
    "Operational guide for running ATF-secured bots in production: profile separation, receipts retention, audit workflows, and monitoring.",
};

const cliVersion = getAtfCliVersion();

export default function ProductionBotBasicsGuidePage() {
  return (
    <article className="space-y-10">
      <header className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
          CLI &rsaquo; Guides &rsaquo; Production Bot Basics
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-accent-200 sm:text-5xl">
          Production Bot Basics
        </h1>
        <p className="max-w-3xl text-lg leading-relaxed text-slate-300">
          Operational hygiene for running automated agents with ATF in production.
          This guide covers profile separation, receipts retention, and audit workflows.
        </p>
      </header>

      {/* ── Prerequisites ── */}
      <section className="space-y-4">
        <HeadingAnchor id="prerequisites">Prerequisites</HeadingAnchor>
        <ul className="list-disc space-y-1 pl-6 text-sm text-slate-300">
          <li>You have completed the Simulate, Verify, Execute guide and understand the core workflow.</li>
          <li>You have a mainnet-beta profile with a funded wallet and Helius RPC.</li>
          <li>Your bot or agent script can call the ATF CLI programmatically.</li>
        </ul>
      </section>

      {/* ── Profile Separation ── */}
      <section className="space-y-6">
        <HeadingAnchor id="profile-separation">1. Profile Separation</HeadingAnchor>
        <div className="max-w-3xl space-y-3 text-slate-300">
          <p>
            Use separate profiles for each environment and each bot. This keeps wallet keys,
            RPC endpoints, and network settings isolated. A misconfigured devnet profile should
            never accidentally execute on mainnet.
          </p>
        </div>
        <AtfCopyCommand
          label="Create production profile"
          command={`npx @trucore/atf@${cliVersion} profile create --name prod-bot-alpha`}
        />
        <AtfCopyCommand
          label="Create staging profile"
          command={`npx @trucore/atf@${cliVersion} profile create --name staging-bot-alpha`}
        />
        <div className="rounded-lg border border-primary-300/20 bg-primary-950/10 p-4">
          <p className="text-sm text-slate-300">
            <strong className="text-primary-100">Naming convention:</strong> Use a pattern like{" "}
            <code className="font-mono text-slate-200">{"{env}-{bot}-{identifier}"}</code> (e.g.{" "}
            <code className="font-mono text-slate-200">prod-bot-alpha</code>,{" "}
            <code className="font-mono text-slate-200">staging-bot-alpha</code>). This makes
            profile listing and audit trails clear.
          </p>
        </div>
      </section>

      {/* ── Receipts Retention ── */}
      <section className="space-y-6">
        <HeadingAnchor id="receipts-retention">2. Receipts Retention</HeadingAnchor>
        <div className="max-w-3xl space-y-3 text-slate-300">
          <p>
            Every simulation produces a receipt. In production, store these receipts durably.
            They serve as your audit trail and can be re-verified at any time without
            contacting the ATF server.
          </p>
          <p>
            At minimum, retain these fields for each transaction:
          </p>
        </div>
        <ul className="list-disc space-y-1 pl-6 text-sm text-slate-300">
          <li><code className="font-mono text-slate-200">request_id</code> for correlation</li>
          <li><code className="font-mono text-slate-200">decision</code> (ALLOWED or BLOCKED)</li>
          <li><code className="font-mono text-slate-200">content_hash</code> for integrity proof</li>
          <li><code className="font-mono text-slate-200">timestamp</code> for ordering</li>
          <li>Transaction signature (after send) for on-chain correlation</li>
        </ul>
        <AtfCopyCommand
          label="List receipts"
          command={`npx @trucore/atf@${cliVersion} receipts list`}
        />
        <AtfCopyCommand
          label="Export receipt as JSON"
          command={`npx @trucore/atf@${cliVersion} receipts verify --receipt last --json`}
        />
        <p className="text-sm text-slate-400">
          Pipe the JSON output to a file or logging system for durable storage.
        </p>
      </section>

      {/* ── Audit Workflow ── */}
      <section className="space-y-6">
        <HeadingAnchor id="audit-workflow">3. Audit and Re-verification</HeadingAnchor>
        <div className="max-w-3xl space-y-3 text-slate-300">
          <p>
            Receipts use a deterministic content hash model. Given the same receipt fields,
            the same hash is always produced. This means you can re-verify any receipt later:
          </p>
        </div>
        <AtfCopyCommand
          label="Re-verify a stored receipt"
          command={`npx @trucore/atf@${cliVersion} receipts verify --file ./archived-receipt.json`}
        />
        <pre className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4 text-sm text-slate-200">
{`Receipt: req_prod_20260228_001
Decision: ALLOWED
Content hash (server):  0x4d8f...c3e2
Content hash (local):   0x4d8f...c3e2
Status: Integrity verified`}
        </pre>
        <div className="max-w-3xl space-y-3 text-slate-300">
          <p>
            If the hashes match, the receipt is intact. No server contact is needed.
            This is the foundation of ATF&apos;s trustless verification model.
          </p>
        </div>
      </section>

      {/* ── Monitoring ── */}
      <section className="space-y-6">
        <HeadingAnchor id="monitoring">4. Monitoring and Alerting</HeadingAnchor>
        <div className="max-w-3xl space-y-3 text-slate-300">
          <p>
            For production bots, build monitoring around these signals:
          </p>
        </div>
        <ul className="list-disc space-y-1 pl-6 text-sm text-slate-300">
          <li><strong className="text-slate-100">Decision rate:</strong> Track the ratio of ALLOWED to BLOCKED decisions. A sudden spike in blocks may indicate a policy misconfiguration or market condition change.</li>
          <li><strong className="text-slate-100">Verification failures:</strong> Any hash mismatch should trigger an alert. This should never happen under normal conditions.</li>
          <li><strong className="text-slate-100">RPC latency:</strong> Monitor <code className="font-mono text-slate-200">rpc ping</code> results. Degraded RPC performance affects the entire workflow.</li>
          <li><strong className="text-slate-100">Receipt gaps:</strong> If a simulation succeeds but no receipt is stored, your logging pipeline may have a gap.</li>
        </ul>
      </section>

      {/* ── Checklist ── */}
      <section className="space-y-4">
        <HeadingAnchor id="checklist">Production Readiness Checklist</HeadingAnchor>
        <ul className="space-y-2 pl-1 text-sm text-slate-300">
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-primary-200">&#9744;</span>
            Dedicated production profile with mainnet-beta network
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-primary-200">&#9744;</span>
            Helius (or equivalent) RPC endpoint configured and tested
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-primary-200">&#9744;</span>
            Doctor passes with all checks green
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-primary-200">&#9744;</span>
            Receipt storage pipeline in place
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-primary-200">&#9744;</span>
            Verify gate enabled in bot workflow (simulate --verify before send)
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-primary-200">&#9744;</span>
            Monitoring and alerts for BLOCKED decisions and verification failures
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-primary-200">&#9744;</span>
            Pinned CLI version (no @latest)
          </li>
        </ul>
      </section>

      <nav className="pt-4 text-sm text-slate-400">
        <Link href="/docs/cli/guides" className="font-semibold text-primary-100 transition-colors hover:text-primary-200">
          &larr; Back to Guides
        </Link>
      </nav>
    </article>
  );
}
