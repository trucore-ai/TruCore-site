import type { Metadata } from "next";
import Link from "next/link";
import { HeadingAnchor } from "@/components/heading-anchor";
import { CopyBlock } from "@/components/copy-block";

export const metadata: Metadata = {
  title: "Receipt Operations — Customer Guide",
  description:
    "Browse, verify, and export your ATF receipts. Understand content hashes, decision badges, policy breakdowns, and proof bundles.",
  robots: { index: false, follow: false },
};

/* ── Constants (grounded in current product behavior) ── */

const VERIFY_PAGE = "/verify";
const RECEIPTS_PAGE = "/customer/receipts";
const DASHBOARD_PAGE = "/customer/dashboard";

/* ── Receipt fields table ── */

const RECEIPT_FIELDS = [
  {
    field: "receipt_id",
    description: "Unique identifier for the receipt (UUID).",
    where: "Receipt list, detail panel, CLI output.",
    note: "Used to select and inspect a specific receipt in the UI.",
  },
  {
    field: "decision",
    description: "Policy evaluation outcome: ALLOWED or DENIED.",
    where: "Decision badge in receipt list and detail panel.",
    note: "Displayed as a color-coded badge (emerald for ALLOWED, red for DENIED).",
  },
  {
    field: "content_hash",
    description: "Deterministic SHA-256 hash of the decision-relevant fields.",
    where: "Metadata section in detail panel.",
    note: "Primary verification value. Same input + same policy = identical hash.",
  },
  {
    field: "dry_run",
    description: "Whether this receipt was generated from a mock (dry-run) or real request.",
    where: "Mode badge in receipt list (amber for mock, blue for real).",
    note: "Mock receipts use the same hash algorithm but lack a real on-chain transaction.",
  },
  {
    field: "protected_by",
    description: "Identifier of the protection policy or adapter that produced the receipt.",
    where: "Metadata section in detail panel.",
    note: "Helps identify which policy configuration was active at receipt time.",
  },
  {
    field: "policy_breakdown",
    description: "Per-policy pass/fail results that contributed to the overall decision.",
    where: "Policy Breakdown section in detail panel.",
    note: "Shows each policy (e.g., token_allowlist, amount_cap, slippage_guard) and its result.",
  },
  {
    field: "created_at",
    description: "Unix timestamp of when the receipt was produced.",
    where: "Timestamp column in receipt list.",
    note: "Displayed in your local time zone. Timestamps over 1e12 are milliseconds; otherwise seconds.",
  },
  {
    field: "intent_type",
    description: "The type of intent that was evaluated (e.g., swap).",
    where: "Receipt summary and detail panel.",
    note: "Helps distinguish different receipt categories when browsing.",
  },
] as const;

/* ── Verification methods ── */

const VERIFY_METHODS = [
  {
    method: "Customer receipts UI",
    how: "Select a receipt → click \"Verify Receipt\" in the detail panel.",
    result: "Green banner (verified) or red banner (tampered / error).",
    when: "Quick one-off verification of a specific receipt.",
  },
  {
    method: "Public verify page",
    how: "Open /verify, paste a content_hash, optionally paste the full JSON.",
    result: "Format check, version check, recomputed hash comparison, optional Ed25519 signature verification.",
    when: "Sharing a verification link with a counterparty or verifying without logging in.",
  },
  {
    method: "CLI: atf verify",
    how: "Run atf verify <receipt_id> or pipe receipt JSON into atf receipts verify.",
    result: "Exit code 0 = valid, exit code 1 = tampered or missing.",
    when: "CI pipelines, automated verification gates, agent workflows.",
  },
  {
    method: "API: POST /v1/receipts/verify",
    how: "Send { \"content_hash\": \"<hex>\" } to the verification endpoint.",
    result: "JSON response with verified status.",
    when: "Programmatic verification from any language or environment.",
  },
] as const;

/* ── Troubleshooting table ── */

const TROUBLESHOOTING = [
  {
    symptom: "\"No receipts yet\" in the receipts page",
    cause: "No protected trade has been executed with the current API key.",
    fix: "Run a dry-run trade from the dashboard or CLI: atf trade --dry-run. The receipt will appear after the request completes.",
  },
  {
    symptom: "Verify button shows \"Tampered\"",
    cause: "The content_hash in the receipt does not match the recomputed hash of the decision-relevant fields.",
    fix: "If this is unexpected, copy the full receipt JSON and verify it on the /verify page for detailed diagnostics. If the receipt was manually modified, that is the expected result.",
  },
  {
    symptom: "Verification request failed",
    cause: "Network error, session expired, or the ATF API is temporarily unreachable.",
    fix: "Refresh the page and try again. If the issue persists, check API health with curl https://api.trucore.xyz/health.",
  },
  {
    symptom: "Receipts load but detail panel is empty",
    cause: "The detail fetch failed (network or authorization error).",
    fix: "Click the receipt row again to retry. If still empty, check the browser console for errors.",
  },
  {
    symptom: "Decision badge shows a different term than expected",
    cause: "The API may return different decision formats (e.g., \"ALLOW\", \"approved\"). The UI normalizes all variants to ALLOWED or DENIED.",
    fix: "This is expected behavior. If building automation, normalize decision values before comparing strings.",
  },
  {
    symptom: "Content hash is missing from the detail panel",
    cause: "Legacy receipts created before content hashing was introduced may lack this field.",
    fix: "Verification and proof export are unavailable for receipts without a content_hash. Newer receipts include it by default.",
  },
  {
    symptom: "Proof bundle export downloads empty or incomplete JSON",
    cause: "The receipt detail has not finished loading, or the content_hash is null.",
    fix: "Wait for the detail panel to fully render before clicking export. Verify the content_hash is present in the metadata section.",
  },
  {
    symptom: "CLI verify exits with code 1 on a receipt you believe is valid",
    cause: "The receipt JSON may have been reformatted (whitespace changes do not affect hashes, but field changes do). Version mismatch between v0 and v1 hash algorithms.",
    fix: "Run atf receipts hash --file receipt.json to see both v0 and v1 computed hashes and compare them to the stored values.",
  },
] as const;

/* ── Export/storage checklist ── */

const STORAGE_CHECKLIST = [
  {
    item: "Copy receipt JSON",
    detail: "Click \"Copy JSON\" in the detail panel to copy the full receipt to your clipboard.",
    action: "Paste into your audit log, ticket, or storage system.",
  },
  {
    item: "Export proof bundle",
    detail: "Click \"Export JSON\" in the proof bundle actions to download a sanitized, portable proof file.",
    action: "Store the .json file alongside your transaction records.",
  },
  {
    item: "Copy verify link",
    detail: "Use the proof links card to copy a shareable verification URL.",
    action: "Send the link to a counterparty or include it in an audit report.",
  },
  {
    item: "Download proof packet",
    detail: "Use the Developer / Agent Output section to download a machine-readable proof packet.",
    action: "Ingest into agent pipelines, CI systems, or automated compliance workflows.",
  },
] as const;

/* ── Hash algorithm summary ── */

const HASH_ALGORITHM = [
  { step: "1", action: "Extract decision-relevant fields", detail: "decision, reasons, policy_hash (if present), params (if present)." },
  { step: "2", action: "Normalize", detail: "Lowercase the decision value. Omit fields that are null or empty." },
  { step: "3", action: "Sort", detail: "Recursively sort all object keys alphabetically. Preserve array order." },
  { step: "4", action: "Serialize", detail: "JSON.stringify with compact encoding (no whitespace)." },
  { step: "5", action: "Hash", detail: "SHA-256 over the UTF-8 bytes of the canonical JSON string." },
  { step: "6", action: "Encode", detail: "Hex-encode the hash digest. Result is always 64 lowercase hex characters." },
] as const;

/* ── Page ── */

export default function ReceiptOpsGuide() {
  return (
    <article className="space-y-10">
      {/* ── Header ── */}
      <header className="space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
          Customer Guide
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-accent-200 sm:text-5xl">
          Receipt Operations
        </h1>
        <p className="max-w-3xl text-lg leading-relaxed text-slate-300">
          Browse, verify, and export your ATF receipts. Understand what each
          receipt field means operationally, how to prove integrity, and when to
          store receipts externally. For the conceptual foundation, see{" "}
          <Link
            href="/docs/receipts-and-trust"
            className="font-semibold text-primary-200 transition-colors hover:text-primary-100"
          >
            Receipts &amp; Trust
          </Link>{" "}
          and the{" "}
          <Link
            href="/docs/receipt-specification-v1"
            className="font-semibold text-primary-200 transition-colors hover:text-primary-100"
          >
            Receipt Specification v1
          </Link>{" "}
          in the public docs.
        </p>
        <div className="gradient-divider mt-2" aria-hidden="true" />
      </header>

      {/* ── What this guide is for ── */}
      <section className="space-y-4">
        <HeadingAnchor id="overview">What this guide is for</HeadingAnchor>
        <p className="text-slate-300">
          Every time ATF evaluates a trade request, it produces a receipt — a
          tamper-evident record of the decision, the policy evaluation, and the
          parameters that were considered. Receipts are the operational backbone
          of ATF&apos;s trust model.
        </p>
        <p className="text-slate-300">
          This guide covers the day-to-day operations you perform with receipts:
          browsing the receipt list, interpreting decision badges, verifying
          integrity, copying JSON for audit trails, and exporting portable proof
          bundles. It does <em>not</em> redefine the receipt specification; for
          the normative schema, see the{" "}
          <Link
            href="/docs/receipt-specification-v1"
            className="font-semibold text-primary-200 hover:text-primary-100"
          >
            Receipt Specification v1
          </Link>
          .
        </p>
      </section>

      {/* ── What receipts are operationally useful for ── */}
      <section className="space-y-4">
        <HeadingAnchor id="use-cases">
          What receipts are operationally useful for
        </HeadingAnchor>
        <ul className="ml-5 list-disc space-y-2 text-slate-300">
          <li>
            <strong className="text-slate-200">Audit trails</strong> — every
            policy decision is recorded with a deterministic content hash. You
            can prove what decision was made and why, at any point in the future.
          </li>
          <li>
            <strong className="text-slate-200">Debugging denied trades</strong>{" "}
            — the policy breakdown shows which specific policies passed and which
            failed, so you can identify the exact rule that denied a trade.
          </li>
          <li>
            <strong className="text-slate-200">Trust verification</strong> — a
            counterparty (or your own compliance team) can independently verify
            that a receipt has not been tampered with, using the public verify
            page or the CLI.
          </li>
          <li>
            <strong className="text-slate-200">Agent pipelines</strong> — bots
            and agents can gate execution on receipt verification (require{" "}
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
              verified: true
            </code>{" "}
            before proceeding) and archive receipts for post-trade analysis.
          </li>
          <li>
            <strong className="text-slate-200">Mock vs real distinction</strong>{" "}
            — receipts from dry-run requests are clearly flagged, so you can test
            your pipeline without confusing test data with production records.
          </li>
        </ul>
      </section>

      {/* ── Browsing and inspecting receipts ── */}
      <section className="space-y-4">
        <HeadingAnchor id="browsing">
          Browsing and inspecting receipts
        </HeadingAnchor>
        <p className="text-slate-300">
          Your{" "}
          <Link
            href={RECEIPTS_PAGE}
            className="font-semibold text-primary-200 hover:text-primary-100"
          >
            receipts page
          </Link>{" "}
          displays a table of your most recent protected trade receipts, sorted
          by timestamp (newest first). Each row shows:
        </p>
        <ul className="ml-5 list-disc space-y-1 text-slate-300">
          <li>
            <strong className="text-slate-200">Receipt ID</strong> — truncated
            for display (first 8 + last 6 characters). Click to expand.
          </li>
          <li>
            <strong className="text-slate-200">Decision badge</strong> —
            <span className="ml-1 inline-block rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold uppercase text-emerald-300">
              ALLOWED
            </span>{" "}
            or{" "}
            <span className="inline-block rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-semibold uppercase text-red-300">
              DENIED
            </span>
            .
          </li>
          <li>
            <strong className="text-slate-200">Timestamp</strong> — displayed in
            your local time zone.
          </li>
          <li>
            <strong className="text-slate-200">Mode</strong> —
            <span className="ml-1 inline-block rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-300">
              mock
            </span>{" "}
            (dry-run) or{" "}
            <span className="inline-block rounded-full bg-blue-500/20 px-2 py-0.5 text-xs font-semibold text-blue-300">
              real
            </span>
            .
          </li>
        </ul>
        <p className="text-slate-300">
          Click any row to open the <strong>detail panel</strong>, which
          contains:
        </p>
        <ol className="ml-5 list-decimal space-y-2 text-slate-300">
          <li>
            <strong className="text-slate-200">Policy Breakdown</strong> — a
            per-policy pass/fail table showing every policy that was evaluated.
            This is the fastest way to diagnose why a trade was denied.
          </li>
          <li>
            <strong className="text-slate-200">Metadata</strong> — the{" "}
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
              content_hash
            </code>{" "}
            and{" "}
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
              protected_by
            </code>{" "}
            fields.
          </li>
          <li>
            <strong className="text-slate-200">
              Developer / Agent Output
            </strong>{" "}
            — a machine-readable proof packet that agents and CI pipelines can
            consume directly.
          </li>
          <li>
            <strong className="text-slate-200">Proof Links</strong> — copyable
            verification and OG preview URLs.
          </li>
          <li>
            <strong className="text-slate-200">Proof Bundle Actions</strong> —
            export JSON and share card buttons.
          </li>
          <li>
            <strong className="text-slate-200">Full Receipt JSON</strong> — the
            complete, scrollable receipt payload for inspection or copying.
          </li>
        </ol>
      </section>

      {/* ── Understanding receipt fields ── */}
      <section className="space-y-4">
        <HeadingAnchor id="fields">
          Receipt fields that matter operationally
        </HeadingAnchor>
        <p className="text-slate-300">
          Receipts contain many fields, but these are the ones you will
          interact with most during day-to-day operations:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-slate-400">
                <th className="pb-2 pr-4 font-medium">Field</th>
                <th className="pb-2 pr-4 font-medium">Description</th>
                <th className="pb-2 pr-4 font-medium">Where you see it</th>
                <th className="pb-2 font-medium">Note</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {RECEIPT_FIELDS.map((row) => (
                <tr
                  key={row.field}
                  className="border-b border-white/[0.04]"
                >
                  <td className="py-2.5 pr-4 font-mono text-xs font-medium text-slate-200">
                    {row.field}
                  </td>
                  <td className="py-2.5 pr-4">{row.description}</td>
                  <td className="py-2.5 pr-4 text-slate-400">{row.where}</td>
                  <td className="py-2.5 text-slate-400">{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Verifying a receipt ── */}
      <section className="space-y-4">
        <HeadingAnchor id="verifying">Verifying a receipt</HeadingAnchor>
        <p className="text-slate-300">
          Verification confirms that a receipt has not been modified since it was
          produced. ATF verification is deterministic: given the same decision-
          relevant fields and the same policy, the{" "}
          <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
            content_hash
          </code>{" "}
          will always be identical. If someone changes even one field, the
          recomputed hash will differ and verification fails.
        </p>
        <p className="text-slate-300">
          There are four ways to verify a receipt, depending on your context:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-slate-400">
                <th className="pb-2 pr-4 font-medium">Method</th>
                <th className="pb-2 pr-4 font-medium">How</th>
                <th className="pb-2 pr-4 font-medium">Result</th>
                <th className="pb-2 font-medium">Best for</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {VERIFY_METHODS.map((row) => (
                <tr
                  key={row.method}
                  className="border-b border-white/[0.04]"
                >
                  <td className="py-2.5 pr-4 font-medium text-slate-200">
                    {row.method}
                  </td>
                  <td className="py-2.5 pr-4">{row.how}</td>
                  <td className="py-2.5 pr-4">{row.result}</td>
                  <td className="py-2.5 text-slate-400">{row.when}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="rounded-lg border border-sky-500/20 bg-sky-500/[0.06] px-4 py-3 text-sm text-sky-200">
          <strong>Tip:</strong> When sharing a verification link with a third
          party, use the{" "}
          <Link
            href={VERIFY_PAGE}
            className="underline hover:text-sky-100"
          >
            public verify page
          </Link>
          . It does not require authentication and accepts any valid
          content_hash.
        </div>

        <h3
          id="verify-ui"
          className="text-lg font-bold tracking-tight text-accent-300"
        >
          Verification in the receipts UI
        </h3>
        <p className="text-slate-300">
          In the{" "}
          <Link
            href={RECEIPTS_PAGE}
            className="font-semibold text-primary-200 hover:text-primary-100"
          >
            receipts page
          </Link>
          :
        </p>
        <ol className="ml-5 list-decimal space-y-1 text-slate-300">
          <li>Click a receipt row to open the detail panel.</li>
          <li>
            Click <strong className="text-slate-200">Verify Receipt</strong>.
          </li>
          <li>
            The panel displays a result banner:
            <ul className="ml-5 mt-1 list-disc space-y-1">
              <li>
                <span className="text-emerald-300">
                  ✅ Verified — receipt integrity confirmed.
                </span>
              </li>
              <li>
                <span className="text-red-300">
                  ❌ Tampered — receipt integrity check failed.
                </span>
              </li>
              <li>
                <span className="text-red-300">
                  Verification request failed — network or session error.
                </span>
              </li>
            </ul>
          </li>
        </ol>

        <h3
          id="verify-cli"
          className="text-lg font-bold tracking-tight text-accent-300"
        >
          Verification via CLI
        </h3>
        <p className="text-slate-300">
          The CLI provides offline verification with detailed diagnostics:
        </p>
        <CopyBlock
          label="Verify a receipt by ID"
          value="atf verify <receipt_id>"
        />
        <CopyBlock
          label="Verify a receipt from a JSON file"
          value="atf receipts verify --file receipt.json"
        />
        <p className="text-slate-300">
          The verify command exits with code 0 on success and code 1 on failure.
          Use it in CI pipelines as a gate:
        </p>
        <CopyBlock
          label="CI verification gate"
          value={`atf receipts verify --file receipt.json && echo "PASS" || echo "FAIL"`}
        />
      </section>

      {/* ── How content_hash works ── */}
      <section className="space-y-4">
        <HeadingAnchor id="content-hash">
          How content_hash works
        </HeadingAnchor>
        <p className="text-slate-300">
          The{" "}
          <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
            content_hash
          </code>{" "}
          is the primary integrity value for every receipt. It is a deterministic
          SHA-256 hash computed from only the decision-relevant fields of the
          receipt. Fields like timestamps, receipt IDs, and execution metadata
          are <em>not</em> included in the hash — which means the hash proves
          the decision, not the delivery.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-slate-400">
                <th className="pb-2 pr-4 font-medium">Step</th>
                <th className="pb-2 pr-4 font-medium">Action</th>
                <th className="pb-2 font-medium">Detail</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {HASH_ALGORITHM.map((row) => (
                <tr
                  key={row.step}
                  className="border-b border-white/[0.04]"
                >
                  <td className="py-2.5 pr-4 font-medium text-slate-200">
                    {row.step}
                  </td>
                  <td className="py-2.5 pr-4">{row.action}</td>
                  <td className="py-2.5">{row.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-slate-300">
          The result is always a 64-character lowercase hexadecimal string.
          Example:
        </p>
        <CopyBlock
          label="Example content_hash"
          value="c9a0310ba2a8a48d62cc0336b7d2beb27f9e31565162ef9daba4fe280f9295a4"
        />
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3 text-sm text-amber-200">
          <strong>Note:</strong> The{" "}
          <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-amber-100">
            receipt_hash
          </code>{" "}
          field (if present) is a legacy v0 hash or a permit-chain hash. For
          current verification, always use{" "}
          <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-amber-100">
            content_hash
          </code>
          . The CLI automatically detects the version and applies the correct
          algorithm.
        </div>
      </section>

      {/* ── What verification proves (and what it does not) ── */}
      <section className="space-y-4">
        <HeadingAnchor id="what-verification-proves">
          What verification proves — and what it does not
        </HeadingAnchor>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.04] p-5">
            <h3 className="text-sm font-bold text-emerald-300">
              ✓ Verification proves
            </h3>
            <ul className="mt-3 ml-4 list-disc space-y-1 text-sm text-slate-300">
              <li>The receipt has not been modified since it was issued.</li>
              <li>The decision matches the content_hash (deterministic).</li>
              <li>The same input and policy would produce the same hash (reproducibility).</li>
              <li>Independent parties can verify without ATF access (using the public verify page).</li>
            </ul>
          </div>
          <div className="rounded-lg border border-red-500/20 bg-red-500/[0.04] p-5">
            <h3 className="text-sm font-bold text-red-300">
              ✗ Verification does not prove
            </h3>
            <ul className="mt-3 ml-4 list-disc space-y-1 text-sm text-slate-300">
              <li>That the policy itself was correct or optimal.</li>
              <li>That the upstream RPC returned accurate data.</li>
              <li>That external market conditions were favorable.</li>
              <li>That the trade was actually executed (only the decision receipt proves the decision).</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── Copying, exporting, and storing receipts ── */}
      <section className="space-y-4">
        <HeadingAnchor id="export">
          Copying, exporting, and storing receipts
        </HeadingAnchor>
        <p className="text-slate-300">
          ATF does not impose a specific storage strategy. Your receipts are
          available through the API and UI as long as your account is active.
          However, if you need receipts for long-term audit, compliance, or
          external sharing, the UI provides several export options.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-slate-400">
                <th className="pb-2 pr-4 font-medium">Action</th>
                <th className="pb-2 pr-4 font-medium">How</th>
                <th className="pb-2 font-medium">Use for</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {STORAGE_CHECKLIST.map((row) => (
                <tr
                  key={row.item}
                  className="border-b border-white/[0.04]"
                >
                  <td className="py-2.5 pr-4 font-medium text-slate-200">
                    {row.item}
                  </td>
                  <td className="py-2.5 pr-4">{row.detail}</td>
                  <td className="py-2.5">{row.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="rounded-lg border border-sky-500/20 bg-sky-500/[0.06] px-4 py-3 text-sm text-sky-200">
          <strong>Proof bundles vs full JSON:</strong> Proof bundles are
          <em> sanitized</em> exports that exclude sensitive fields (wallet
          addresses, private keys, raw policy internals). Use proof bundles
          when sharing externally. Use full JSON when you need complete data
          for internal debugging.
        </div>
      </section>

      {/* ── Using receipts for debugging, audit, and trust ── */}
      <section className="space-y-4">
        <HeadingAnchor id="workflows">
          Receipts in debugging, audit, and trust workflows
        </HeadingAnchor>

        <h3
          id="debugging"
          className="text-lg font-bold tracking-tight text-accent-300"
        >
          Debugging a denied trade
        </h3>
        <ol className="ml-5 list-decimal space-y-2 text-slate-300">
          <li>
            Open the{" "}
            <Link
              href={RECEIPTS_PAGE}
              className="font-semibold text-primary-200 hover:text-primary-100"
            >
              receipts page
            </Link>{" "}
            and locate the receipt for the denied trade.
          </li>
          <li>
            Click the row to open the detail panel. Look at the{" "}
            <strong className="text-slate-200">Policy Breakdown</strong> — the
            failing policy will show a red result.
          </li>
          <li>
            Check the <strong className="text-slate-200">Full Receipt JSON</strong> for
            the exact parameters that were evaluated (amount, slippage, token
            pair, etc.).
          </li>
          <li>
            If the denial is unexpected, use{" "}
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
              atf receipts explain --file receipt.json
            </code>{" "}
            for a human-readable breakdown of the decision, including reason
            codes and parameter analysis.
          </li>
        </ol>

        <h3
          id="audit"
          className="text-lg font-bold tracking-tight text-accent-300"
        >
          Building an audit trail
        </h3>
        <p className="text-slate-300">
          For compliance or post-trade review, a minimal audit record contains:
        </p>
        <ul className="ml-5 list-disc space-y-1 text-slate-300">
          <li>
            The{" "}
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
              receipt_id
            </code>{" "}
            (unique reference).
          </li>
          <li>
            The{" "}
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
              content_hash
            </code>{" "}
            (integrity proof).
          </li>
          <li>
            The{" "}
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
              decision
            </code>{" "}
            and{" "}
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
              created_at
            </code>{" "}
            (what happened and when).
          </li>
          <li>
            The full receipt JSON (for future recomputation if needed).
          </li>
        </ul>
        <CopyBlock
          label="Minimal audit archival pattern"
          value={`# Archive a receipt with its content hash for later verification
atf receipts verify --file receipt.json
cp receipt.json "archive/\$(jq -r .receipt_id receipt.json).json"`}
        />

        <h3
          id="agent-pipelines"
          className="text-lg font-bold tracking-tight text-accent-300"
        >
          Agent pipeline verification gate
        </h3>
        <p className="text-slate-300">
          Agents and bots should verify receipts before using them as execution
          gates. The recommended pattern:
        </p>
        <CopyBlock
          label="Agent verification gate"
          value={`# 1. Protect the trade
atf trade --intent swap --amount 10 --token-in SOL --token-out USDC > receipt.json

# 2. Verify the receipt before proceeding
atf receipts verify --file receipt.json
if [ $? -ne 0 ]; then
  echo "Receipt verification failed — aborting execution"
  exit 1
fi

# 3. Proceed with execution only after verification passes
echo "Receipt verified — proceeding with trade execution"`}
        />
      </section>

      {/* ── Dry-run receipts ── */}
      <section className="space-y-4">
        <HeadingAnchor id="dry-run">Dry-run receipts</HeadingAnchor>
        <p className="text-slate-300">
          Dry-run receipts are produced by{" "}
          <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
            atf trade --dry-run
          </code>{" "}
          or the dashboard&apos;s test request flow. They evaluate the full policy
          stack and produce a valid content_hash, but no on-chain transaction
          is submitted.
        </p>
        <ul className="ml-5 list-disc space-y-1 text-slate-300">
          <li>
            Dry-run receipts appear in the receipts list with a{" "}
            <span className="inline-block rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-300">
              mock
            </span>{" "}
            mode badge.
          </li>
          <li>
            They use the same hash algorithm as real receipts — verification
            works identically.
          </li>
          <li>
            Dry-run requests do <em>not</em> consume quota or generate webhook
            events.
          </li>
          <li>
            Use dry-runs to test policy changes, validate pipeline
            integration, or generate sample receipts without side effects.
          </li>
        </ul>
        <CopyBlock
          label="Generate a dry-run receipt"
          value="atf trade --dry-run --intent swap --amount 10 --token-in SOL --token-out USDC"
        />
      </section>

      {/* ── Common mistakes / troubleshooting ── */}
      <section className="space-y-4">
        <HeadingAnchor id="troubleshooting">
          Common mistakes and troubleshooting
        </HeadingAnchor>
        <p className="text-slate-300">
          The table below covers the most frequently encountered receipt
          operation issues and their resolutions.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-slate-400">
                <th className="pb-2 pr-4 font-medium">Symptom</th>
                <th className="pb-2 pr-4 font-medium">Likely cause</th>
                <th className="pb-2 font-medium">Fix</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {TROUBLESHOOTING.map((row) => (
                <tr
                  key={row.symptom}
                  className="border-b border-white/[0.04]"
                >
                  <td className="py-2.5 pr-4 font-medium text-slate-200">
                    {row.symptom}
                  </td>
                  <td className="py-2.5 pr-4">{row.cause}</td>
                  <td className="py-2.5">{row.fix}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Relationship to public receipt/spec/verification pages ── */}
      <section className="space-y-4">
        <HeadingAnchor id="public-docs">
          Relationship to public documentation
        </HeadingAnchor>
        <p className="text-slate-300">
          ATF receipt documentation spans three public pages and this
          operational guide. Each has a distinct purpose:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-slate-400">
                <th className="pb-2 pr-4 font-medium">Page</th>
                <th className="pb-2 pr-4 font-medium">Purpose</th>
                <th className="pb-2 font-medium">When to use</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              <tr className="border-b border-white/[0.04]">
                <td className="py-2.5 pr-4">
                  <Link
                    href="/docs/receipts-and-trust"
                    className="font-semibold text-primary-200 hover:text-primary-100"
                  >
                    Receipts &amp; Trust
                  </Link>
                </td>
                <td className="py-2.5 pr-4">
                  Conceptual introduction to receipts, trust model, and verification theory.
                </td>
                <td className="py-2.5 text-slate-400">
                  First time learning what receipts are and why they exist.
                </td>
              </tr>
              <tr className="border-b border-white/[0.04]">
                <td className="py-2.5 pr-4">
                  <Link
                    href="/docs/receipt-specification-v1"
                    className="font-semibold text-primary-200 hover:text-primary-100"
                  >
                    Receipt Specification v1
                  </Link>
                </td>
                <td className="py-2.5 pr-4">
                  Normative schema: canonical JSON structure, hash algorithm, versioning rules.
                </td>
                <td className="py-2.5 text-slate-400">
                  Building a custom verifier or understanding the exact hash algorithm.
                </td>
              </tr>
              <tr className="border-b border-white/[0.04]">
                <td className="py-2.5 pr-4">
                  <Link
                    href="/docs/verify"
                    className="font-semibold text-primary-200 hover:text-primary-100"
                  >
                    Verification
                  </Link>
                </td>
                <td className="py-2.5 pr-4">
                  Verification API, CLI reference, what is proven vs not proven, production patterns.
                </td>
                <td className="py-2.5 text-slate-400">
                  Integrating verification into a pipeline or understanding guarantees.
                </td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 font-medium text-accent-300">
                  This guide
                </td>
                <td className="py-2.5 pr-4">
                  Day-to-day operations: browse, inspect, verify, export, debug, archive.
                </td>
                <td className="py-2.5 text-slate-400">
                  Using receipts in your workflow — you already know what they are.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Ed25519 signatures ── */}
      <section className="space-y-4">
        <HeadingAnchor id="signatures">
          Ed25519 receipt signatures
        </HeadingAnchor>
        <p className="text-slate-300">
          When available, ATF signs receipt hashes with an Ed25519 key. This
          provides cryptographic proof that a specific receipt was issued by
          ATF rather than fabricated locally. Signature verification is
          available on the{" "}
          <Link
            href={VERIFY_PAGE}
            className="font-semibold text-primary-200 hover:text-primary-100"
          >
            public verify page
          </Link>{" "}
          — paste a content_hash and the form will check both hash integrity
          and signature validity if a signing key is configured.
        </p>
        <p className="text-slate-300">
          Signature availability depends on the deployment configuration. The
          verify page auto-detects whether a signing key is available and
          adjusts the verification display accordingly.
        </p>
      </section>

      {/* ── Next steps ── */}
      <section className="space-y-4">
        <HeadingAnchor id="next-steps">Next steps</HeadingAnchor>
        <ul className="ml-5 list-disc space-y-2 text-slate-300">
          <li>
            <Link
              href={RECEIPTS_PAGE}
              className="font-semibold text-primary-200 hover:text-primary-100"
            >
              Open your receipts page
            </Link>{" "}
            — browse and verify your latest receipts.
          </li>
          <li>
            <Link
              href={VERIFY_PAGE}
              className="font-semibold text-primary-200 hover:text-primary-100"
            >
              Public verify page
            </Link>{" "}
            — verify a receipt by content_hash without logging in.
          </li>
          <li>
            <Link
              href="/docs/guide/key-lifecycle"
              className="font-semibold text-primary-200 hover:text-primary-100"
            >
              API Key Lifecycle
            </Link>{" "}
            — manage the keys that generate your receipts.
          </li>
          <li>
            <Link
              href="/docs/guide/webhooks"
              className="font-semibold text-primary-200 hover:text-primary-100"
            >
              Webhook Setup &amp; Debugging
            </Link>{" "}
            — get notified when new receipts are generated.
          </li>
          <li>
            <Link
              href="/docs/guide/readiness"
              className="font-semibold text-primary-200 hover:text-primary-100"
            >
              Readiness &amp; Health Checks
            </Link>{" "}
            — confirm your integration is ready before generating production receipts.
          </li>
          <li>
            <Link
              href="/docs/guide"
              className="font-semibold text-primary-200 hover:text-primary-100"
            >
              All customer guides
            </Link>{" "}
            — return to the full guide index.
          </li>
        </ul>
      </section>
    </article>
  );
}
