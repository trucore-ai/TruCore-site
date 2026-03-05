export const DEFAULT_ATF_CLI_VERSION = "0.1.0";

function normalizeCliVersion(version: string): string {
  const trimmed = version.trim();
  return trimmed.length > 0 ? trimmed.replace(/^v/, "") : DEFAULT_ATF_CLI_VERSION;
}

export function getAtfCliVersion(): string {
  const raw = process.env.NEXT_PUBLIC_ATF_CLI_VERSION;
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction) {
    if (raw === undefined || raw.trim().length === 0) {
      throw new Error(
        "NEXT_PUBLIC_ATF_CLI_VERSION must be set (e.g., 1.4.0) in Vercel env vars. " +
          "Never use @latest. Pin an explicit version for production builds. " +
          "See docs/DEPLOY_VERCEL.md for setup instructions."
      );
    }
    if (raw.trim().toLowerCase() === "latest") {
      throw new Error(
        "NEXT_PUBLIC_ATF_CLI_VERSION must be set (e.g., 1.4.0) in Vercel env vars. " +
          "Never use @latest. Pin an explicit version for production builds. " +
          "See docs/DEPLOY_VERCEL.md for setup instructions."
      );
    }
  }

  return normalizeCliVersion(raw ?? DEFAULT_ATF_CLI_VERSION);
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
