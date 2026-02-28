export const DEFAULT_ATF_CLI_VERSION = "0.1.0";

function normalizeCliVersion(version: string): string {
  const trimmed = version.trim();
  return trimmed.length > 0 ? trimmed.replace(/^v/, "") : DEFAULT_ATF_CLI_VERSION;
}

export function getAtfCliVersion(): string {
  return normalizeCliVersion(process.env.NEXT_PUBLIC_ATF_CLI_VERSION ?? DEFAULT_ATF_CLI_VERSION);
}

export function getAtfCliTag(): string {
  return `v${getAtfCliVersion()}`;
}

export function getSiteCommitShaShort(): string | null {
  const commitSha = process.env.VERCEL_GIT_COMMIT_SHA?.trim();
  if (!commitSha) {
    return null;
  }

  return commitSha.slice(0, 7);
}

export function getSiteEnvironment(): string {
  return process.env.VERCEL_ENV?.trim() || "unknown";
}

export function getReleaseMetadata() {
  return {
    siteCommit: getSiteCommitShaShort(),
    environment: getSiteEnvironment(),
    cliPinnedVersion: getAtfCliVersion(),
    cliPinnedTag: getAtfCliTag(),
  };
}
