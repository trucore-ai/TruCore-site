/* ────────────────────────────────────────────────────────────────
 *  EvidenceRow - compact basis metadata for interpreted summaries
 *
 *  A small, reusable treatment that sits below an interpreted
 *  summary to surface the supporting evidence. Keeps evidence
 *  visually subordinate: subdued text sizing, muted color,
 *  and a consistent dot-separated layout.
 *
 *  Usage:
 *    <EvidenceRow basis="3 auth failures · 1 quota event · current interval" />
 *    <EvidenceRow label="basis" basis="suspended tenant + recent enforcement events" />
 * ──────────────────────────────────────────────────────────── */

type EvidenceRowProps = {
  /** The compact evidence string, typically dot-separated key facts. */
  basis: string;
  /** Optional prefix label displayed before the basis text.  Default: none. */
  label?: string;
  /** Additional Tailwind classes applied to the outer container. */
  className?: string;
};

export function EvidenceRow({ basis, label, className = "" }: EvidenceRowProps) {
  if (!basis) return null;

  return (
    <p
      className={`text-[10px] leading-snug text-slate-600 mt-0.5 ${className}`.trim()}
      aria-label={label ? `${label}: ${basis}` : basis}
    >
      {label && (
        <span className="font-medium text-slate-500">{label}: </span>
      )}
      {basis}
    </p>
  );
}
