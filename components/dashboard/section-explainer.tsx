/* ────────────────────────────────────────────────────────────────
 *  SectionExplainer - collapsible inline explainer for dashboard
 *
 *  Lightweight disclosure UI that answers "what is this section,
 *  why does it matter, and how should I read it?" using a native
 *  <details>/<summary> element for zero-JS progressive behavior.
 *
 *  Stays visually subtle so it never competes with actual data.
 * ──────────────────────────────────────────────────────────── */

type SectionExplainerProps = {
  /** Short label shown on the collapsed trigger (e.g. "What is this?"). */
  label?: string;
  /** Explanation paragraphs. Each string becomes its own <p>. */
  children: React.ReactNode;
};

export function SectionExplainer({
  label = "What is this?",
  children,
}: SectionExplainerProps) {
  return (
    <details className="group mt-3" data-testid="section-explainer">
      <summary className="inline-flex cursor-pointer select-none items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium text-slate-500 transition-colors hover:bg-white/[0.04] hover:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/40 [&::-webkit-details-marker]:hidden">
        {/* Chevron rotates on open */}
        <svg
          aria-hidden="true"
          className="h-3 w-3 shrink-0 transition-transform duration-200 group-open:rotate-90"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4.5 2.5 8 6l-3.5 3.5" />
        </svg>
        {label}
      </summary>

      <div className="mt-2.5 rounded-lg border border-white/[0.04] bg-gradient-to-b from-white/[0.02] to-white/[0.008] px-4 py-3.5 text-[12px] leading-relaxed text-slate-500 space-y-2.5 shadow-sm shadow-black/10">
        {children}
      </div>
    </details>
  );
}
