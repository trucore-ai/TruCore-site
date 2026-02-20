"use client";

/**
 * Scoped error boundary for admin pages.
 *
 * Catches runtime errors within /admin/* routes and shows
 * an admin-specific recovery UI.
 */
export default function AdminError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-slate-100 font-sans">
      <div className="max-w-md text-center px-6">
        <h1 className="text-2xl font-bold tracking-tight mb-4">
          Admin Error
        </h1>
        <p className="text-slate-400 mb-6">
          Something went wrong loading this admin page. Try refreshing or{" "}
          <a
            href="/admin/login"
            className="text-primary-400 underline hover:text-primary-300 transition"
          >
            sign in again
          </a>.
          If the issue continues, contact{" "}
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
          Retry
        </button>
      </div>
    </div>
  );
}
