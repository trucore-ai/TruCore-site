import type { Metadata } from "next";
import Link from "next/link";
import { HeadingAnchor } from "@/components/heading-anchor";
import { CopyBlock } from "@/components/copy-block";

export const metadata: Metadata = {
  title: "Auth & API Key Management | TruCore ATF",
  description:
    "Signup, login, email verification, API key creation/rotation/revocation, and account recovery for ATF.",
  keywords: [
    "ATF authentication",
    "API key management",
    "signup",
    "login",
    "key rotation",
    "key revocation",
    "TruCore ATF",
  ],
  openGraph: {
    title: "Auth & API Key Management | TruCore ATF",
    description:
      "Signup, login, email verification, API key creation/rotation/revocation, and account recovery for ATF.",
    url: "https://trucore.xyz/docs/auth",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Auth & API Key Management | TruCore ATF",
    description:
      "Signup, login, API key management, and account recovery for ATF.",
    images: ["/opengraph-image"],
  },
  alternates: { canonical: "https://trucore.xyz/docs/auth" },
};

const SIGNUP_CURL = `curl -sS https://api.trucore.xyz/auth/signup \\
  -H "Content-Type: application/json" \\
  -d '{"email": "you@example.com", "password": "your-secure-password"}'`;

const SIGNUP_RESPONSE = `{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "tenant_id": "cust_a1b2c3d4e5f6",
  "api_key": "atf_live_...",
  "email_verified": false
}`;

const LOGIN_CURL = `curl -sS https://api.trucore.xyz/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email": "you@example.com", "password": "your-password"}'`;

const CREATE_KEY_CURL = `curl -sS https://api.trucore.xyz/customer/keys \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -d '{"label": "production-bot-v2"}'`;

const CREATE_KEY_RESPONSE = `{
  "key_id": "key_a1b2c3d4",
  "tenant_id": "cust_a1b2c3d4e5f6",
  "label": "production-bot-v2",
  "status": "active",
  "secret": "atf_live_...",
  "created_at": "2026-03-21T00:00:00Z"
}`;

const ROTATE_KEY_CURL = `curl -sS -X POST https://api.trucore.xyz/customer/keys/key_a1b2c3d4/rotate \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`;

const REVOKE_KEY_CURL = `curl -sS -X POST https://api.trucore.xyz/customer/keys/key_a1b2c3d4/revoke \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`;

export default function AuthPage() {
  return (
    <article className="space-y-10">
      <header className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
          Authentication
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-accent-200 sm:text-5xl">
          Auth &amp; API Key Management
        </h1>
        <p className="max-w-3xl text-lg leading-relaxed text-slate-300">
          Create an account, verify your email, manage API keys, and recover access.
        </p>
      </header>

      {/* ── Signup ── */}
      <section className="space-y-4">
        <HeadingAnchor id="signup">Signup</HeadingAnchor>
        <p className="text-slate-300">
          Create an account at{" "}
          <Link href="/signup" className="font-semibold text-primary-200 hover:text-primary-100">
            trucore.xyz/signup
          </Link>{" "}
          or use the API:
        </p>
        <CopyBlock label="bash" value={SIGNUP_CURL} />
        <CopyBlock label="json" value={SIGNUP_RESPONSE} />
        <p className="text-slate-400">
          Signup creates a tenant, generates your first API key, and returns a JWT for
          authenticated requests. The API key secret is displayed only once - save it immediately.
        </p>
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4 space-y-2">
          <h4 className="text-sm font-bold text-slate-200">Requirements</h4>
          <ul className="text-sm text-slate-400 space-y-1">
            <li>Valid email address (disposable email domains are rejected)</li>
            <li>Password: minimum 8 characters</li>
          </ul>
        </div>
      </section>

      {/* ── Login ── */}
      <section className="space-y-4">
        <HeadingAnchor id="login">Login</HeadingAnchor>
        <p className="text-slate-300">
          Sign in via the{" "}
          <Link href="/login" className="font-semibold text-primary-200 hover:text-primary-100">
            web portal
          </Link>{" "}
          or the API:
        </p>
        <CopyBlock label="bash" value={LOGIN_CURL} />
        <p className="text-slate-400">
          Returns a JWT token valid for 24 hours. Use the token in the{" "}
          <code className="font-mono text-slate-300">Authorization: Bearer</code> header
          for customer API calls (key management, receipts, dashboard).
        </p>
      </section>

      {/* ── Email Verification ── */}
      <section className="space-y-4">
        <HeadingAnchor id="email-verification">Email Verification</HeadingAnchor>
        <p className="text-slate-300">
          After signup, a verification email is sent automatically.
          Click the link in the email or confirm via API:
        </p>
        <CopyBlock
          label="bash"
          value={`curl -sS https://api.trucore.xyz/auth/verify-email/confirm \\
  -H "Content-Type: application/json" \\
  -d '{"token": "TOKEN_FROM_EMAIL"}'`}
        />

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left">
                <th className="pb-2 pr-4 font-semibold text-slate-300">Endpoint</th>
                <th className="pb-2 font-semibold text-slate-300">Description</th>
              </tr>
            </thead>
            <tbody className="text-slate-400">
              <tr className="border-b border-white/5">
                <td className="py-2 pr-4 font-mono text-xs text-slate-200">POST /auth/verify-email/request</td>
                <td className="py-2">Resend verification email (requires JWT)</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-2 pr-4 font-mono text-xs text-slate-200">POST /auth/verify-email/confirm</td>
                <td className="py-2">Confirm email with token from inbox</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-2 pr-4 font-mono text-xs text-slate-200">GET /auth/verify-email/status</td>
                <td className="py-2">Check current verification state (requires JWT)</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
          <p className="text-sm text-amber-200">
            Verification tokens expire after <strong>24 hours</strong>.
            If your token has expired, request a new one from the portal or API.
          </p>
        </div>
      </section>

      {/* ── API Key Management ── */}
      <section className="space-y-4">
        <HeadingAnchor id="api-keys">API Key Management</HeadingAnchor>
        <p className="text-slate-300">
          API keys authenticate your bot or agent to the ATF protect and execute endpoints.
          Use your JWT to manage keys.
        </p>

        <h3 className="text-xl font-bold text-accent-300">Create a Key</h3>
        <CopyBlock label="bash" value={CREATE_KEY_CURL} />
        <CopyBlock label="json" value={CREATE_KEY_RESPONSE} />
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
          <p className="text-sm text-amber-200">
            The <code className="font-mono">secret</code> field is shown <strong>only once</strong>.
            Store it securely. If lost, revoke the key and create a new one.
          </p>
        </div>

        <h3 className="text-xl font-bold text-accent-300">List Keys</h3>
        <div className="rounded-lg border border-white/5 bg-neutral-950/50 p-4 font-mono text-sm text-slate-200">
          GET /customer/keys &nbsp; (requires JWT)
        </div>
        <p className="text-sm text-slate-400">
          Returns all keys for your tenant. The secret hash is never exposed in list responses.
        </p>

        <h3 className="text-xl font-bold text-accent-300">Rotate a Key</h3>
        <CopyBlock label="bash" value={ROTATE_KEY_CURL} />
        <p className="text-sm text-slate-400">
          Rotation revokes the old key and issues a new one in a single operation.
          The new secret is returned once - update your bot configuration immediately.
        </p>

        <h3 className="text-xl font-bold text-accent-300">Revoke a Key</h3>
        <CopyBlock label="bash" value={REVOKE_KEY_CURL} />
        <p className="text-sm text-slate-400">
          Revocation is immediate. Any requests using the revoked key will be rejected.
        </p>
      </section>

      {/* ── Using API Keys ── */}
      <section className="space-y-4">
        <HeadingAnchor id="using-api-keys">Using API Keys</HeadingAnchor>
        <p className="text-slate-300">
          Include your API key in the <code className="font-mono text-slate-200">X-API-Key</code> header
          for protect and execution endpoints:
        </p>
        <div className="rounded-lg border border-white/5 bg-neutral-950/50 p-4 font-mono text-sm text-slate-200">
          X-API-Key: atf_live_YOUR_SECRET_KEY
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left">
                <th className="pb-2 pr-4 font-semibold text-slate-300">Auth Method</th>
                <th className="pb-2 pr-4 font-semibold text-slate-300">Header</th>
                <th className="pb-2 font-semibold text-slate-300">Used For</th>
              </tr>
            </thead>
            <tbody className="text-slate-400">
              <tr className="border-b border-white/5">
                <td className="py-2 pr-4 text-slate-200">API Key</td>
                <td className="py-2 pr-4 font-mono text-xs text-slate-200">X-API-Key</td>
                <td className="py-2">Protect, execute, verify (bot/agent requests)</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-2 pr-4 text-slate-200">JWT Token</td>
                <td className="py-2 pr-4 font-mono text-xs text-slate-200">Authorization: Bearer</td>
                <td className="py-2">Key management, receipts, dashboard, account settings</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Password Reset ── */}
      <section className="space-y-4">
        <HeadingAnchor id="password-reset">Account Recovery</HeadingAnchor>
        <p className="text-slate-300">
          If you forget your password, request a reset from the{" "}
          <Link href="/forgot-password" className="font-semibold text-primary-200 hover:text-primary-100">
            forgot password page
          </Link>{" "}
          or the API:
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left">
                <th className="pb-2 pr-4 font-semibold text-slate-300">Endpoint</th>
                <th className="pb-2 font-semibold text-slate-300">Description</th>
              </tr>
            </thead>
            <tbody className="text-slate-400">
              <tr className="border-b border-white/5">
                <td className="py-2 pr-4 font-mono text-xs text-slate-200">POST /auth/reset-password/request</td>
                <td className="py-2">Send reset email to registered address</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-2 pr-4 font-mono text-xs text-slate-200">POST /auth/reset-password/confirm</td>
                <td className="py-2">Set new password using reset token</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-2 pr-4 font-mono text-xs text-slate-200">POST /auth/reset-password/validate</td>
                <td className="py-2">Check if a reset token is still valid</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="text-slate-400">
          Reset tokens expire after 24 hours. New passwords must be at least 8 characters.
        </p>
      </section>

      {/* ── Security Notes ── */}
      <section className="space-y-4">
        <HeadingAnchor id="security">Security Notes</HeadingAnchor>
        <ul className="space-y-2 text-slate-300">
          <li><strong className="text-slate-100">Passwords</strong> are hashed with bcrypt - plaintext is never stored</li>
          <li><strong className="text-slate-100">Tokens</strong> (verification, reset) are stored as SHA-256 hashes</li>
          <li><strong className="text-slate-100">API key secrets</strong> are hashed after first display - store securely</li>
          <li><strong className="text-slate-100">JWT tokens</strong> expire after 24 hours</li>
          <li><strong className="text-slate-100">Rate limiting</strong> protects all auth endpoints from brute-force attempts</li>
        </ul>
      </section>

      {/* ── Next Steps ── */}
      <section className="space-y-4">
        <HeadingAnchor id="next-steps">Next Steps</HeadingAnchor>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/docs/getting-started"
            className="group rounded-lg border border-white/10 p-5 transition-colors hover:border-white/20"
          >
            <h3 className="font-bold text-accent-300 group-hover:text-accent-200">Getting Started &rarr;</h3>
            <p className="mt-1 text-sm text-slate-400">Full walkthrough from signup to first verified receipt.</p>
          </Link>
          <Link
            href="/docs/first-protected-trade"
            className="group rounded-lg border border-white/10 p-5 transition-colors hover:border-white/20"
          >
            <h3 className="font-bold text-accent-300 group-hover:text-accent-200">First Protected Trade &rarr;</h3>
            <p className="mt-1 text-sm text-slate-400">Protect a swap and verify the receipt in minutes.</p>
          </Link>
        </div>
      </section>
    </article>
  );
}
