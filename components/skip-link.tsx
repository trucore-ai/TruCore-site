export function SkipLink() {
  return (
    <a
      href="#main"
      className="absolute left-4 top-4 z-50 -translate-y-16 rounded-md border border-primary-300/60 bg-neutral-950 px-4 py-2 text-sm font-semibold text-primary-50 opacity-0 transition focus:translate-y-0 focus:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
    >
      Skip to content
    </a>
  );
}