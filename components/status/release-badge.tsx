import { getReleaseMetadata } from "@/lib/version";

/**
 * Tiny footer marker showing the current deploy environment, commit SHA,
 * and pinned CLI version. Renders on every page via the root layout so
 * engineers can instantly verify which build is live.
 *
 * Example output: "prod · 68845a6 · cli v1.5.0"
 *
 * Only safe, non-secret values are displayed. Falls back gracefully when
 * env vars are missing (shows "\u2014" for commit, "unknown" for env).
 */
export function ReleaseBadge() {
  const { environment, siteCommit, cliPinnedTag } = getReleaseMetadata();

  const env = environment === "production" ? "prod" : environment;
  const commit = siteCommit ?? "\u2014";

  return (
    <p
      data-testid="release-badge"
      className="mt-3 text-center text-[10px] tracking-wide text-slate-600 select-none"
    >
      {env} · {commit} · cli {cliPinnedTag}
    </p>
  );
}
