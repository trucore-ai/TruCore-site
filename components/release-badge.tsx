import { getReleaseMetadata } from "@/lib/version";

/**
 * Tiny footer marker showing the current deploy environment, commit SHA,
 * and pinned CLI version. Renders on every page via the root layout so
 * engineers can instantly verify which build is live.
 *
 * Only safe, non-secret values are displayed.
 */
export function ReleaseBadge() {
  const { environment, siteCommit, cliPinnedVersion } = getReleaseMetadata();

  const parts: string[] = [];
  if (environment && environment !== "unknown") parts.push(environment);
  if (siteCommit) parts.push(siteCommit);
  parts.push(`cli ${cliPinnedVersion}`);

  return (
    <p
      data-testid="release-badge"
      className="mt-3 text-center text-[10px] tracking-wide text-slate-600 select-none"
    >
      {parts.join(" · ")}
    </p>
  );
}
