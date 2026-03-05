export const DEFAULT_ATF_CLI_VERSION = "0.1.0";

function normalizeCliVersion(version: string): string {
  const trimmed = version.trim();
  return trimmed.length > 0 ? trimmed.replace(/^v/, "") : DEFAULT_ATF_CLI_VERSION;
}

function isVercelProduction(): boolean {
  // Vercel-specific: only treat *production* deployments as strict.
  // Preview deployments also build with NODE_ENV="production", so
  // checking NODE_ENV alone blocks preview deploys on a fresh project
  // that has no env vars configured yet.
  return process.env.VERCEL_ENV?.trim() === "production";
}

export function getAtfCliVersion(): string {
  const raw = process.env.NEXT_PUBLIC_ATF_CLI_VERSION;

  if (isVercelProduction()) {
    // Real production: require an explicit pinned version.
    if (
      raw === undefined ||
      raw.trim().length === 0 ||
      raw.trim().toLowerCase() === "latest"
    ) {
      throw new Error(
        "NEXT_PUBLIC_ATF_CLI_VERSION must be set (e.g., 1.4.0) in Vercel env vars for PRODUCTION. " +
          "Never use @latest. Pin an explicit version. See docs/DEPLOY_VERCEL.md."
      );
    }
  } else {
    // Preview/dev/local: still forbid @latest, but allow the safe default.
    if (raw?.trim().toLowerCase() === "latest") {
      throw new Error(
        "NEXT_PUBLIC_ATF_CLI_VERSION cannot be 'latest'. " +
          "Pin an explicit version (e.g., 1.4.0). See docs/DEPLOY_VERCEL.md."
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
