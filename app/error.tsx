"use client";

/**
 * Global error boundary for the site.
 *
 * Catches unexpected runtime errors and shows a friendly UI
 * instead of a blank page. Must be a client component.
 */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center bg-neutral-950 text-slate-100 font-sans">
        <div className="max-w-md text-center px-6">
          <h1 className="text-2xl font-bold tracking-tight mb-4">
            Something went wrong
          </h1>
          <p className="text-slate-400 mb-6">
            Try refreshing the page. If the problem continues, contact{" "}
            <a
              href="mailto:info@trucore.xyz"
              className="text-primary-400 underline hover:text-primary-300 transition"
            >
              info@trucore.xyz
            </a>
          </p>
          <button
            onClick={() => reset()}
            className="rounded-lg bg-primary-600 hover:bg-primary-500 px-5 py-2.5 text-sm font-medium text-white transition"
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
