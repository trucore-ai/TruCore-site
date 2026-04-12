import type { Metadata } from "next";
import Link from "next/link";
import { HeadingAnchor } from "@/components/heading-anchor";
import { CopyBlock } from "@/components/copy-block";

export const metadata: Metadata = {
  title: "Webhook Setup & Debugging — Customer Guide",
  description:
    "Configure webhook endpoints, verify HMAC signatures, understand delivery semantics, and troubleshoot failures.",
  robots: { index: false, follow: false },
};

/* ── Constants (grounded in current product behavior) ── */

/* ── Webhook event types ── */

const EVENT_TYPES = [
  {
    event: "firewall.approve",
    category: "Firewall",
    description: "Transaction intent approved by the policy engine.",
    defaultOn: true,
    notes: "Carries intent_id, permit_id, permit_expiry, evaluation_ms.",
  },
  {
    event: "firewall.deny",
    category: "Firewall",
    description: "Transaction intent denied by the policy engine.",
    defaultOn: true,
    notes:
      "Carries intent_id, deny_reason (e.g. TOKEN_NOT_ALLOWED, SLIPPAGE_EXCEEDED), deny_message.",
  },
  {
    event: "signer.sign.succeeded",
    category: "Signer",
    description: "Transaction successfully signed by a session key.",
    defaultOn: false,
    notes: "Carries sign_request_id, session_id, tx_signature, tx_hash.",
  },
  {
    event: "signer.sign.failed",
    category: "Signer",
    description: "Signing request failed.",
    defaultOn: false,
    notes:
      "Carries error_code (INVALID_PERMIT, PERMIT_EXPIRED, SESSION_EXPIRED, etc.) and error_message.",
  },
  {
    event: "billing.status_changed",
    category: "Billing",
    description: "Billing or subscription status changed.",
    defaultOn: false,
    notes:
      "Carries previous_status, new_status, plan_id, reason. Statuses: active, past_due, suspended, cancelled, trial.",
  },
  {
    event: "usage.threshold",
    category: "Usage",
    description:
      "Usage reached a configured threshold (50%, 80%, 90%, or 100%).",
    defaultOn: false,
    notes:
      "Carries metric (api_calls, intents_evaluated, etc.), threshold_percent, current_value, limit_value.",
  },
  {
    event: "agent.expiry_warning",
    category: "Lifecycle",
    description:
      "Service token approaching expiry (default: 6 hours before).",
    defaultOn: false,
    notes:
      "Carries token_id, label, expires_at, expires_in_seconds. Emitted once per token.",
  },
  {
    event: "agent.reconcile.repaired",
    category: "Lifecycle",
    description: "Reconciliation cycle repaired at least one issue.",
    defaultOn: false,
    notes: "Carries reconcile_status, actions_taken, warnings, next_steps.",
  },
  {
    event: "agent.reconcile.failed",
    category: "Lifecycle",
    description:
      "Reconciliation cycle could not restore health — requires attention.",
    defaultOn: false,
    notes: "Carries reconcile_status, actions_taken, warnings, next_steps.",
  },
  {
    event: "agent.reconcile.healthy",
    category: "Lifecycle",
    description: "Reconciliation passed with no issues.",
    defaultOn: false,
    notes:
      "Opt-in only — not delivered by default. Subscribe explicitly to receive this high-frequency heartbeat.",
  },
] as const;

/* ── Webhook headers ── */

const WEBHOOK_HEADERS = [
  {
    header: "X-FW-Event-Id",
    type: "UUID",
    description:
      "Unique identifier for this event. Use for deduplication on your side.",
  },
  {
    header: "X-FW-Timestamp",
    type: "Unix epoch (seconds)",
    description:
      "When the event was generated. Reject deliveries older than 5 minutes to prevent replay.",
  },
  {
    header: "X-FW-Signature",
    type: "String (v1={hex})",
    description:
      "HMAC-SHA256 signature for payload verification. Always verify before processing.",
  },
  {
    header: "X-FW-Event-Type",
    type: "String",
    description:
      "Event type identifier (e.g. firewall.approve). Also present in the JSON body.",
  },
  {
    header: "X-ATF-Delivery-ID",
    type: "UUID",
    description:
      "Unique identifier for this delivery attempt. Useful when contacting support about a specific delivery.",
  },
] as const;

/* ── Delivery statuses ── */

const DELIVERY_STATUSES = [
  {
    status: "queued",
    meaning: "Waiting to be delivered.",
    terminal: false,
  },
  {
    status: "delivering",
    meaning: "Currently attempting HTTP delivery to your endpoint.",
    terminal: false,
  },
  {
    status: "sent",
    meaning: "Your endpoint returned 2xx. Delivery succeeded.",
    terminal: true,
  },
  {
    status: "failed",
    meaning:
      "Delivery attempt failed (5xx, 429, timeout). Will retry with exponential backoff.",
    terminal: false,
  },
  {
    status: "deadletter",
    meaning:
      "All retry attempts exhausted. Event moved to dead-letter queue for manual inspection.",
    terminal: true,
  },
] as const;

/* ── Troubleshooting rows ── */

const TROUBLESHOOTING = [
  {
    symptom: "Webhook created but no deliveries arrive",
    cause: "Endpoint URL not reachable from ATF servers, or firewall blocking.",
    fix: "Verify the URL is publicly accessible over HTTPS. Check your firewall/WAF allows POST from ATF IPs.",
  },
  {
    symptom: "Signature verification fails on every delivery",
    cause: "Wrong secret, or verifying parsed JSON instead of raw body bytes.",
    fix: "Use the secret returned at creation (or after rotation). Verify against raw request body, not parsed JSON.",
  },
  {
    symptom: "Deliveries stuck in 'failed' with 4xx errors",
    cause: "Your endpoint returns a non-429 4xx (e.g. 401, 403, 404).",
    fix: "4xx (except 429) are not retried. Fix the endpoint error and use the retry button or wait for the next event.",
  },
  {
    symptom: "Events appear in deadletter queue",
    cause: "8 consecutive delivery attempts failed.",
    fix: "Fix the endpoint issue first, then retry deadlettered deliveries via the API.",
  },
  {
    symptom: "Webhook status changed to 'failing'",
    cause: "25+ consecutive delivery failures triggered auto-disable.",
    fix: "Fix the endpoint. The next successful delivery re-enables the webhook and resets the failure counter.",
  },
  {
    symptom: "Receiving duplicate events",
    cause: "At-least-once delivery — network issues can cause re-delivery.",
    fix: "Deduplicate using the X-FW-Event-Id header. Store processed event IDs and skip duplicates.",
  },
  {
    symptom: "No webhook for dry-run simulations",
    cause: "Dry-run evaluations do not emit lifecycle webhooks.",
    fix: "This is expected. Only real execution calls trigger webhook delivery. Test events use the test endpoint.",
  },
  {
    symptom: "Not receiving agent.reconcile.healthy events",
    cause: "Healthy reconcile events are opt-in and not subscribed by default.",
    fix: "Update your webhook to include agent.reconcile.healthy in event_types.",
  },
] as const;

/* ── Page ── */

export default function WebhooksGuide() {
  return (
    <article className="space-y-10">
      {/* ── Header ── */}
      <header className="space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
          Customer Guide
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-accent-200 sm:text-5xl">
          Webhook Setup &amp; Debugging
        </h1>
        <p className="max-w-3xl text-lg leading-relaxed text-slate-300">
          Configure webhook endpoints to receive real-time event notifications,
          verify HMAC signatures, understand delivery and retry semantics, and
          troubleshoot common failures. This guide covers the full lifecycle
          from registration through production debugging.
        </p>
        <div className="gradient-divider mt-2" aria-hidden="true" />
      </header>

      {/* ── 1. What this guide covers ── */}
      <section className="space-y-4">
        <HeadingAnchor id="overview">What this guide covers</HeadingAnchor>
        <p className="text-slate-300">
          ATF delivers webhooks — HTTP POST requests to your endpoint — when
          meaningful events occur in your account. Webhooks let your systems
          react in real time to policy decisions, signing outcomes, billing
          changes, and lifecycle events without polling the API.
        </p>
        <p className="text-slate-300">This guide covers:</p>
        <ul className="ml-5 list-disc space-y-2 text-slate-300">
          <li>
            <strong className="text-slate-200">Event types</strong> — which
            actions emit webhooks and which do not.
          </li>
          <li>
            <strong className="text-slate-200">Endpoint registration</strong>{" "}
            — how to create a webhook and store your signing secret.
          </li>
          <li>
            <strong className="text-slate-200">Signature verification</strong>{" "}
            — verifying HMAC-SHA256 signatures to ensure authenticity.
          </li>
          <li>
            <strong className="text-slate-200">
              Delivery states and retries
            </strong>{" "}
            — what each delivery status means and how retry/backoff works.
          </li>
          <li>
            <strong className="text-slate-200">
              Debugging and troubleshooting
            </strong>{" "}
            — diagnosing missing or failed deliveries.
          </li>
          <li>
            <strong className="text-slate-200">
              Dry-run behavior and opt-in events
            </strong>{" "}
            — understanding which events fire and when.
          </li>
        </ul>
      </section>

      {/* ── 2. How webhooks fit into ATF ── */}
      <section className="space-y-4">
        <HeadingAnchor id="how-webhooks-work">
          How webhooks fit into ATF
        </HeadingAnchor>
        <p className="text-slate-300">
          When your bot submits a transaction intent, the ATF policy engine
          evaluates it and returns a synchronous response (approve or deny).
          Webhooks fire <em>after</em> the synchronous response — they are
          asynchronous notifications that let downstream systems (dashboards,
          alerting, audit logs) react to what happened without polling.
        </p>
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-5 text-sm text-slate-300">
          <p className="font-semibold text-slate-200">Quick mental model</p>
          <ul className="ml-5 mt-2 list-disc space-y-1">
            <li>
              <strong className="text-slate-200">Synchronous API</strong> =
              your bot needs the answer now (approve/deny).
            </li>
            <li>
              <strong className="text-slate-200">Webhooks</strong> = your
              backend systems need to know what happened (logging, alerting,
              reconciliation).
            </li>
          </ul>
        </div>
        <p className="text-slate-300">
          Webhooks are signed with HMAC-SHA256 and delivered with at-least-once
          semantics. Your endpoint may receive the same event more than once,
          so always deduplicate using the event ID.
        </p>
      </section>

      {/* ── 3. Event types ── */}
      <section className="space-y-4">
        <HeadingAnchor id="event-types">Webhook event types</HeadingAnchor>
        <p className="text-slate-300">
          The following events can be delivered to your webhook endpoints.
          When creating a webhook, you choose which event types to subscribe
          to. You can update your subscription at any time.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-slate-400">
                <th className="pb-2 pr-4 font-medium">Event type</th>
                <th className="pb-2 pr-4 font-medium">Category</th>
                <th className="pb-2 pr-4 font-medium">Description</th>
                <th className="pb-2 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {EVENT_TYPES.map((row) => (
                <tr key={row.event} className="border-b border-white/[0.04]">
                  <td className="py-2.5 pr-4 font-mono text-xs text-slate-200">
                    {row.event}
                  </td>
                  <td className="py-2.5 pr-4">{row.category}</td>
                  <td className="py-2.5 pr-4">{row.description}</td>
                  <td className="py-2.5 text-slate-400">{row.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.04] p-4 text-sm text-slate-300">
          <p className="font-semibold text-amber-300">
            Opt-in event: agent.reconcile.healthy
          </p>
          <p className="mt-1">
            The{" "}
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
              agent.reconcile.healthy
            </code>{" "}
            event is a high-frequency heartbeat that fires on every successful
            reconciliation cycle. It is <strong>not delivered by default</strong>{" "}
            — you must explicitly include it in your webhook&apos;s{" "}
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
              event_types
            </code>{" "}
            array. This prevents noise for most integrations while allowing
            health-monitoring systems to opt in.
          </p>
        </div>
      </section>

      {/* ── 4. Actions that do NOT emit webhooks ── */}
      <section className="space-y-4">
        <HeadingAnchor id="no-webhook">
          Actions that do not emit webhooks
        </HeadingAnchor>
        <ul className="ml-5 list-disc space-y-2 text-slate-300">
          <li>
            <strong className="text-slate-200">Dry-run simulations</strong> —
            evaluations run with the dry-run flag do not emit lifecycle
            webhooks. They produce synchronous responses only.
          </li>
          <li>
            <strong className="text-slate-200">API key management</strong> —
            creating, rotating, or revoking API keys does not trigger webhook
            events. Key operations are tracked in your account audit log.
          </li>
          <li>
            <strong className="text-slate-200">
              Reading operations (GET requests)
            </strong>{" "}
            — listing receipts, checking status, or fetching configuration does
            not emit events.
          </li>
        </ul>
      </section>

      {/* ── 5. Setting up a webhook endpoint ── */}
      <section className="space-y-4">
        <HeadingAnchor id="setup">
          Setting up a webhook endpoint
        </HeadingAnchor>
        <p className="text-slate-300">
          Register a webhook by calling the create endpoint with your target
          URL and the event types you want to receive:
        </p>
        <CopyBlock
          label="Create a webhook"
          value={`curl -X POST https://api.trucore.xyz/v1/webhooks \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Production Alerts",
    "url": "https://your-server.com/webhooks/atf",
    "event_types": ["firewall.approve", "firewall.deny"]
  }'`}
        />
        <p className="text-slate-300">The response includes your webhook and signing secret:</p>
        <CopyBlock
          label="Create response"
          value={`{
  "webhook": {
    "id": "wh_abc123",
    "name": "Production Alerts",
    "url": "https://your-server.com/webhooks/atf",
    "status": "enabled",
    "event_types": ["firewall.approve", "firewall.deny"],
    "created_at": "2026-04-12T10:00:00Z"
  },
  "secret": "whsec_aBcDeFgHiJkLmNoPqRsTuVwXyZ0123456789_-ab"
}`}
        />
        <div className="rounded-lg border border-red-500/20 bg-red-500/[0.04] p-4 text-sm text-slate-300">
          <p className="font-semibold text-red-300">
            Save your secret immediately
          </p>
          <p className="mt-1">
            The{" "}
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
              secret
            </code>{" "}
            field is returned <strong>only once</strong> at creation time. Store
            it in a secrets manager or environment variable — never commit it to
            version control. If you lose the secret, rotate it with{" "}
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
              POST /v1/webhooks/&#123;id&#125;/rotate-secret
            </code>{" "}
            to receive a new one.
          </p>
        </div>
      </section>

      {/* ── 6. Updating subscriptions ── */}
      <section className="space-y-4">
        <HeadingAnchor id="update-subscriptions">
          Updating event subscriptions
        </HeadingAnchor>
        <p className="text-slate-300">
          Add or remove event types from an existing webhook without
          re-creating it:
        </p>
        <CopyBlock
          label="Update event subscriptions"
          value={`curl -X PATCH https://api.trucore.xyz/v1/webhooks/wh_abc123 \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "event_types": [
      "firewall.approve",
      "firewall.deny",
      "agent.expiry_warning",
      "agent.reconcile.repaired",
      "agent.reconcile.failed"
    ]
  }'`}
        />
        <p className="text-sm text-slate-400">
          The event_types array is replaced entirely — include all event types
          you want to keep receiving.
        </p>
      </section>

      {/* ── 7. Webhook headers ── */}
      <section className="space-y-4">
        <HeadingAnchor id="headers">Webhook delivery headers</HeadingAnchor>
        <p className="text-slate-300">
          Every webhook delivery includes the following headers. Parse these
          before processing the JSON body.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-slate-400">
                <th className="pb-2 pr-4 font-medium">Header</th>
                <th className="pb-2 pr-4 font-medium">Type</th>
                <th className="pb-2 font-medium">Description</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {WEBHOOK_HEADERS.map((row) => (
                <tr key={row.header} className="border-b border-white/[0.04]">
                  <td className="py-2.5 pr-4 font-mono text-xs text-slate-200">
                    {row.header}
                  </td>
                  <td className="py-2.5 pr-4 whitespace-nowrap">
                    {row.type}
                  </td>
                  <td className="py-2.5 text-slate-400">{row.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-slate-400">
          Additional headers:{" "}
          <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
            Content-Type: application/json
          </code>{" "}
          and{" "}
          <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
            User-Agent: AgentFirewall-Webhook/1.0
          </code>{" "}
          are always present.
        </p>
      </section>

      {/* ── 8. Verifying signatures ── */}
      <section className="space-y-4">
        <HeadingAnchor id="verify-signatures">
          Verifying webhook signatures (HMAC-SHA256)
        </HeadingAnchor>
        <p className="text-slate-300">
          Every delivery is signed with your webhook secret using HMAC-SHA256.
          Always verify the signature before processing any event. The
          verification process:
        </p>
        <ol className="ml-5 list-decimal space-y-2 text-slate-300">
          <li>
            Extract{" "}
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
              X-FW-Event-Id
            </code>
            ,{" "}
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
              X-FW-Timestamp
            </code>
            , and{" "}
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
              X-FW-Signature
            </code>{" "}
            from the request headers.
          </li>
          <li>
            <strong className="text-slate-200">Validate timestamp freshness</strong> — reject
            deliveries where{" "}
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
              X-FW-Timestamp
            </code>{" "}
            is more than <strong>5 minutes</strong> old. This prevents replay
            attacks.
          </li>
          <li>
            Compute SHA-256 of the <strong>raw request body bytes</strong> (not
            parsed JSON — JSON parsing changes whitespace and key ordering).
          </li>
          <li>
            Build the signature base string:{" "}
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
              v1:&#123;timestamp&#125;:&#123;event_id&#125;:&#123;payload_hash&#125;
            </code>
          </li>
          <li>
            Compute{" "}
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
              HMAC-SHA256(secret, base_string)
            </code>{" "}
            and format as{" "}
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
              v1=&#123;hex&#125;
            </code>
            .
          </li>
          <li>
            <strong className="text-slate-200">Constant-time compare</strong>{" "}
            your computed signature with the received{" "}
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
              X-FW-Signature
            </code>
            . Never use{" "}
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
              ===
            </code>{" "}
            — use{" "}
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
              crypto.timingSafeEqual
            </code>{" "}
            (Node.js) or{" "}
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
              hmac.compare_digest
            </code>{" "}
            (Python).
          </li>
        </ol>
        <CopyBlock
          label="TypeScript: verify webhook signature (Express/Node.js)"
          value={`import crypto from "crypto";

function verifyWebhookSignature(
  rawBody: Buffer,
  secret: string,
  headers: Record<string, string>,
): boolean {
  const eventId = headers["x-fw-event-id"];
  const timestamp = headers["x-fw-timestamp"];
  const signature = headers["x-fw-signature"];

  if (!eventId || !timestamp || !signature) return false;

  // Reject stale deliveries (5-minute tolerance)
  const age = Math.floor(Date.now() / 1000) - Number(timestamp);
  if (age > 300 || age < 0) return false;

  // Compute payload hash from raw bytes
  const payloadHash = crypto
    .createHash("sha256")
    .update(rawBody)
    .digest("hex");

  // Build signature base string
  const baseString = \`v1:\${timestamp}:\${eventId}:\${payloadHash}\`;

  // Compute expected signature
  const expected = "v1=" + crypto
    .createHmac("sha256", secret)
    .update(baseString)
    .digest("hex");

  // Constant-time comparison
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected),
  );
}`}
        />
        <CopyBlock
          label="Python: verify webhook signature (FastAPI)"
          value={`import hashlib
import hmac
import time

def verify_webhook_signature(
    raw_body: bytes,
    secret: str,
    event_id: str,
    timestamp: str,
    signature: str,
) -> bool:
    # Reject stale deliveries (5-minute tolerance)
    age = int(time.time()) - int(timestamp)
    if age > 300 or age < 0:
        return False

    # Compute payload hash from raw bytes
    payload_hash = hashlib.sha256(raw_body).hexdigest()

    # Build signature base string
    base_string = f"v1:{timestamp}:{event_id}:{payload_hash}"

    # Compute expected signature
    expected = "v1=" + hmac.new(
        secret.encode(), base_string.encode(), hashlib.sha256
    ).hexdigest()

    # Constant-time comparison
    return hmac.compare_digest(signature, expected)`}
        />
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 text-sm text-slate-300">
          <p className="font-semibold text-slate-200">Security reminders</p>
          <ul className="ml-5 mt-2 list-disc space-y-1">
            <li>
              Always verify against <strong>raw body bytes</strong>, not parsed
              JSON. Parsing changes whitespace and key ordering, which breaks
              the signature.
            </li>
            <li>
              Use <strong>constant-time comparison</strong> to prevent timing
              attacks.
            </li>
            <li>
              Never log your webhook secret. Store it in environment variables
              or a secrets manager.
            </li>
            <li>
              If verification fails consistently, your secret may be out of
              sync — rotate it with{" "}
              <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
                POST /v1/webhooks/&#123;id&#125;/rotate-secret
              </code>
              .
            </li>
          </ul>
        </div>
      </section>

      {/* ── 9. Secret rotation ── */}
      <section className="space-y-4">
        <HeadingAnchor id="secret-rotation">
          Rotating your webhook secret
        </HeadingAnchor>
        <p className="text-slate-300">
          If your secret is compromised or you need to rotate as part of
          security hygiene, call the rotate endpoint:
        </p>
        <CopyBlock
          label="Rotate webhook secret"
          value={`curl -X POST https://api.trucore.xyz/v1/webhooks/wh_abc123/rotate-secret \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
        />
        <p className="text-slate-300">
          The response returns a new secret. The old secret is invalidated
          immediately — update your verification code before the next delivery
          arrives. The new secret is returned only once, just like at creation.
        </p>
        <p className="text-sm text-slate-400">
          Legacy webhooks created before HMAC signing was introduced have a{" "}
          <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
            signing_status
          </code>{" "}
          of{" "}
          <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
            legacy_unverifiable
          </code>
          . Rotating the secret on these webhooks upgrades them to{" "}
          <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
            verifiable
          </code>{" "}
          status, enabling HMAC signature verification going forward.
        </p>
      </section>

      {/* ── 10. Delivery states ── */}
      <section className="space-y-4">
        <HeadingAnchor id="delivery-states">
          Delivery states and what they mean
        </HeadingAnchor>
        <p className="text-slate-300">
          Each webhook delivery passes through a state machine. Understanding
          these states helps you diagnose delivery issues:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-slate-400">
                <th className="pb-2 pr-4 font-medium">Status</th>
                <th className="pb-2 pr-4 font-medium">Meaning</th>
                <th className="pb-2 font-medium">Terminal?</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {DELIVERY_STATUSES.map((row) => (
                <tr key={row.status} className="border-b border-white/[0.04]">
                  <td className="py-2.5 pr-4 font-mono text-xs text-slate-200">
                    {row.status}
                  </td>
                  <td className="py-2.5 pr-4">{row.meaning}</td>
                  <td className="py-2.5">
                    {row.terminal ? (
                      <span className="text-slate-400">Yes</span>
                    ) : (
                      <span className="text-slate-400">No</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-5 text-sm text-slate-300">
          <p className="font-semibold text-slate-200">
            State flow
          </p>
          <p className="mt-2 font-mono text-xs text-slate-400">
            queued → delivering → sent (success)
            <br />
            queued → delivering → failed → ... → failed → deadletter (max
            retries)
          </p>
        </div>
      </section>

      {/* ── 11. Retry semantics ── */}
      <section className="space-y-4">
        <HeadingAnchor id="retries">
          Retry and backoff semantics
        </HeadingAnchor>
        <p className="text-slate-300">
          ATF uses at-least-once delivery with exponential backoff and jitter.
          If your endpoint fails to return a 2xx response, ATF will retry up
          to <strong className="text-slate-200">8 attempts</strong> with
          increasing delays:
        </p>
        <ul className="ml-5 list-disc space-y-2 text-slate-300">
          <li>
            <strong className="text-slate-200">Retriable errors</strong> — 5xx
            responses, 429 (rate limited), timeouts (&gt;30s), and connection
            errors trigger automatic retries.
          </li>
          <li>
            <strong className="text-slate-200">Non-retriable errors</strong> —
            4xx responses (except 429) are <em>not</em> retried. A 401 or 404
            from your endpoint stops delivery immediately and marks it as
            failed.
          </li>
          <li>
            <strong className="text-slate-200">Backoff schedule</strong> —
            exponential backoff starting from ~2 seconds, doubling with each
            attempt, capped at 10 minutes. Each delay includes ±20% random
            jitter.
          </li>
          <li>
            <strong className="text-slate-200">Dead-letter</strong> — after 8
            failed attempts, the delivery moves to the dead-letter queue.
          </li>
        </ul>
        <p className="text-slate-300">
          When you receive a webhook, return a 2xx response (200, 201, or 204
          are all valid) as quickly as possible. Process the event
          asynchronously — a slow handler that exceeds the 30-second timeout
          will be treated as a failure and retried.
        </p>
      </section>

      {/* ── 12. Auto-disable on repeated failures ── */}
      <section className="space-y-4">
        <HeadingAnchor id="auto-disable">
          Auto-disable on repeated failures
        </HeadingAnchor>
        <p className="text-slate-300">
          If a webhook accumulates{" "}
          <strong className="text-slate-200">
            25 consecutive delivery failures
          </strong>
          , ATF automatically changes its status to{" "}
          <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-sm text-slate-200">
            failing
          </code>
          . While in this state, new events are not enqueued for delivery to
          this webhook.
        </p>
        <p className="text-slate-300">
          To recover: fix the underlying endpoint issue. The next successful
          delivery (from a manual retry or a new event once re-enabled)
          automatically resets the failure counter and re-enables the webhook.
          You do not need to manually re-enable it.
        </p>
      </section>

      {/* ── 13. Idempotency and deduplication ── */}
      <section className="space-y-4">
        <HeadingAnchor id="idempotency">
          Idempotency and deduplication
        </HeadingAnchor>
        <p className="text-slate-300">
          ATF guarantees <strong className="text-slate-200">at-least-once</strong>{" "}
          delivery — the same event may be delivered more than once due to
          network issues or retry logic. Your endpoint must handle duplicates
          gracefully.
        </p>
        <p className="text-slate-300">
          Use the{" "}
          <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-sm text-slate-200">
            X-FW-Event-Id
          </code>{" "}
          header as a deduplication key. Store processed event IDs (in a
          database, Redis, or even an in-memory set for development) and skip
          any event you have already handled.
        </p>
        <CopyBlock
          label="TypeScript: simple deduplication"
          value={`const processedEvents = new Set<string>();

function handleWebhook(eventId: string, body: unknown): void {
  if (processedEvents.has(eventId)) {
    console.log(\`Duplicate event \${eventId}, skipping.\`);
    return;
  }
  processedEvents.add(eventId);

  // Process the event...
  // In production, use a persistent store (database, Redis)
  // instead of an in-memory Set.
}`}
        />
      </section>

      {/* ── 14. Inspecting deliveries ── */}
      <section className="space-y-4">
        <HeadingAnchor id="inspect-deliveries">
          Inspecting delivery history
        </HeadingAnchor>
        <p className="text-slate-300">
          List recent deliveries for a webhook to see what was sent,
          what failed, and what is in the dead-letter queue:
        </p>
        <CopyBlock
          label="List deliveries"
          value={`curl https://api.trucore.xyz/v1/webhooks/wh_abc123/deliveries \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
        />
        <p className="text-slate-300">
          Each delivery record includes the delivery status, HTTP response
          code, attempt count, and timestamps. Filter by status to find
          failures:
        </p>
        <CopyBlock
          label="List failed deliveries"
          value={`curl "https://api.trucore.xyz/v1/webhooks/wh_abc123/deliveries?status=failed" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
        />
        <p className="text-slate-300">
          To retry a specific failed or deadlettered delivery manually:
        </p>
        <CopyBlock
          label="Retry a delivery"
          value={`curl -X POST https://api.trucore.xyz/v1/webhooks/wh_abc123/deliveries/del_xyz789/retry \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
        />
      </section>

      {/* ── 15. Testing webhooks ── */}
      <section className="space-y-4">
        <HeadingAnchor id="testing">Testing webhooks</HeadingAnchor>
        <p className="text-slate-300">
          Send a test event to verify your endpoint is reachable and your
          signature verification works correctly:
        </p>
        <CopyBlock
          label="Send a test event"
          value={`curl -X POST https://api.trucore.xyz/v1/webhooks/wh_abc123/test \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{ "event_type": "firewall.approve" }'`}
        />
        <p className="text-slate-300">
          Test events are real signed deliveries to your endpoint but include
          a{" "}
          <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-sm text-slate-200">
            metadata.test: true
          </code>{" "}
          field in the payload. Your handler should check this field and skip
          any real processing for test events while still returning a 2xx
          response to confirm delivery works.
        </p>
      </section>

      {/* ── 16. Dry-run vs real execution ── */}
      <section className="space-y-4">
        <HeadingAnchor id="dry-run">
          Dry-run vs real execution
        </HeadingAnchor>
        <p className="text-slate-300">
          Dry-run evaluations (used in the simulator and during development)
          do <strong className="text-slate-200">not</strong> emit lifecycle
          webhooks. Only real execution calls — where the policy engine
          evaluates a live transaction intent — trigger webhook delivery.
        </p>
        <p className="text-slate-300">
          To test webhook delivery during development, use the{" "}
          <Link
            href="#testing"
            className="font-semibold text-primary-200 hover:text-primary-100"
          >
            test endpoint
          </Link>{" "}
          described above. Test events are signed and delivered normally,
          with{" "}
          <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-sm text-slate-200">
            metadata.test: true
          </code>{" "}
          to distinguish them from production events.
        </p>
      </section>

      {/* ── 17. Example payload ── */}
      <section className="space-y-4">
        <HeadingAnchor id="payload-example">
          Example webhook payload
        </HeadingAnchor>
        <p className="text-slate-300">
          A{" "}
          <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-sm text-slate-200">
            firewall.deny
          </code>{" "}
          event delivered to your endpoint:
        </p>
        <CopyBlock
          label="Example firewall.deny payload"
          value={`{
  "event_id": "550e8400-e29b-41d4-a716-446655440000",
  "event_type": "firewall.deny",
  "created_at": "2026-04-12T14:30:00Z",
  "customer_id": "cust_abc123",
  "data": {
    "intent_id": "int_def456",
    "agent_id": "agent_ghi789",
    "action": "swap",
    "tokens": ["SOL", "USDC"],
    "amounts": ["1.5", "0"],
    "slippage_bps": 100,
    "deny_reason": "SLIPPAGE_EXCEEDED",
    "deny_message": "Slippage 100 bps exceeds policy maximum of 50 bps.",
    "policy_rule": "max_slippage_bps",
    "policy_version": "v2.1",
    "evaluation_ms": 12
  },
  "metadata": {
    "api_version": "2026-04-01",
    "schema_version": "1.0",
    "test": false
  }
}`}
        />
      </section>

      {/* ── 18. Troubleshooting ── */}
      <section className="space-y-4">
        <HeadingAnchor id="troubleshooting">Troubleshooting</HeadingAnchor>
        <p className="text-slate-300">
          Use the table below to diagnose common webhook issues.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-slate-400">
                <th className="pb-2 pr-4 font-medium">Symptom</th>
                <th className="pb-2 pr-4 font-medium">Likely cause</th>
                <th className="pb-2 font-medium">Fix</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {TROUBLESHOOTING.map((row, i) => (
                <tr key={i} className="border-b border-white/[0.04]">
                  <td className="py-2.5 pr-4 text-slate-200">
                    {row.symptom}
                  </td>
                  <td className="py-2.5 pr-4">{row.cause}</td>
                  <td className="py-2.5 text-slate-400">{row.fix}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── 19. Production checklist ── */}
      <section className="space-y-4">
        <HeadingAnchor id="checklist">
          Webhook production checklist
        </HeadingAnchor>
        <ul className="ml-5 list-disc space-y-2 text-slate-300">
          <li>
            <strong className="text-slate-200">
              Verify every delivery
            </strong>{" "}
            — always validate the HMAC signature before processing. Reject
            unsigned or stale deliveries.
          </li>
          <li>
            <strong className="text-slate-200">
              Deduplicate with X-FW-Event-Id
            </strong>{" "}
            — at-least-once delivery means duplicates will happen. Store and
            check event IDs.
          </li>
          <li>
            <strong className="text-slate-200">
              Return 2xx quickly
            </strong>{" "}
            — process events asynchronously. A handler that exceeds 30 seconds
            causes a timeout and retry.
          </li>
          <li>
            <strong className="text-slate-200">
              Monitor delivery health
            </strong>{" "}
            — check delivery history periodically. Investigate any spike in
            failed or deadlettered deliveries.
          </li>
          <li>
            <strong className="text-slate-200">
              Store your secret securely
            </strong>{" "}
            — use environment variables or a secrets manager. Rotate
            immediately if compromised.
          </li>
          <li>
            <strong className="text-slate-200">
              Subscribe only to events you need
            </strong>{" "}
            — avoid subscribing to high-frequency events (like{" "}
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
              agent.reconcile.healthy
            </code>
            ) unless your system specifically needs them.
          </li>
          <li>
            <strong className="text-slate-200">
              Handle test events
            </strong>{" "}
            — check the{" "}
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-200">
              metadata.test
            </code>{" "}
            field and skip real processing for test deliveries.
          </li>
          <li>
            <strong className="text-slate-200">
              Use HTTPS only
            </strong>{" "}
            — webhook URLs must use HTTPS with a valid TLS certificate. HTTP
            endpoints are rejected at registration.
          </li>
        </ul>
      </section>

      {/* ── 20. Next steps ── */}
      <section className="space-y-4">
        <HeadingAnchor id="next-steps">Next steps</HeadingAnchor>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/docs/guide/key-lifecycle"
            className="group rounded-lg border border-white/10 p-5 transition-colors hover:border-white/20"
          >
            <h3 className="font-bold text-accent-300 group-hover:text-accent-200">
              API Key Lifecycle &rarr;
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              Create, scope, rotate, and revoke the API keys used to
              authenticate webhook management calls.
            </p>
          </Link>
          <Link
            href="/docs/guide/rate-limits"
            className="group rounded-lg border border-white/10 p-5 transition-colors hover:border-white/20"
          >
            <h3 className="font-bold text-accent-300 group-hover:text-accent-200">
              Rate Limits &amp; Recovery &rarr;
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              Understand rate-limit headers and backoff patterns for your API
              calls — the same principles apply when your webhook endpoint
              returns 429.
            </p>
          </Link>
          <Link
            href="/customer/dashboard"
            className="group rounded-lg border border-white/10 p-5 transition-colors hover:border-white/20"
          >
            <h3 className="font-bold text-accent-300 group-hover:text-accent-200">
              Customer Dashboard &rarr;
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              Live usage meters, plan info, and account status.
            </p>
          </Link>
          <Link
            href="/docs/guide"
            className="group rounded-lg border border-white/10 p-5 transition-colors hover:border-white/20"
          >
            <h3 className="font-bold text-accent-300 group-hover:text-accent-200">
              All Customer Guides &rarr;
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              Browse all operational guides for TruCore ATF.
            </p>
          </Link>
        </div>
      </section>
    </article>
  );
}
