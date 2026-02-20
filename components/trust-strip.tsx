const controls = [
  "Security headers enforced",
  "Audit logging enabled",
  "CSP violation monitoring",
  "Admin access hardened",
  "Health endpoint monitored",
];

export function TrustStrip() {
  return (
    <div className="rounded-xl border border-white/10 bg-neutral-900/40 px-6 py-6 sm:px-8">
      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-primary-200/70">
        Operational Controls
      </p>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {controls.map((item) => (
          <li key={item} className="flex items-center gap-2 text-sm text-slate-300">
            <svg
              className="h-4 w-4 shrink-0 text-primary-400"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M3 8.5l3.5 3.5L13 4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
