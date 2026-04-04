import { getAtfCliVersion } from "@/lib/version";

/**
 * Inline callout shown wherever the site publishes npx @trucore/atf commands.
 * Warns Windows users that npx dispatch is broken and directs them to the
 * verified global-install path.
 *
 * Verified 2026-04-04:
 *   - npx with scoped package fails on Windows (npm 11, Node 22)
 *   - npm install -g + atf <cmd> works correctly on Windows
 */
export function WindowsCliNote() {
  const cliVersion = getAtfCliVersion();

  return (
    <div
      className="my-3 rounded-lg border border-yellow-600/30 bg-yellow-950/30 px-4 py-3 text-sm text-yellow-200"
      data-testid="windows-cli-note"
    >
      <p className="font-semibold">Windows note</p>
      <p className="mt-1 leading-relaxed text-yellow-200/90">
        <code className="font-mono text-yellow-100">npx @trucore/atf@{cliVersion}</code>{" "}
        does not work on Windows due to a known npm issue with scoped packages.
        Install globally first, then use the short command form:
      </p>
      <pre className="mt-2 overflow-x-auto rounded-md bg-neutral-950/60 px-3 py-2 font-mono text-xs text-slate-200">
{`npm install -g @trucore/atf@${cliVersion}
atf <command>`}
      </pre>
      <p className="mt-2 text-xs text-yellow-200/70">
        macOS and Linux users can continue using <code className="font-mono">npx</code> as shown.
      </p>
    </div>
  );
}
