const RESEND_API_URL = "https://api.resend.com/emails";

interface SendEmailParams {
  to: string;
  from: string;
  subject: string;
  html: string;
  replyTo?: string;
}

/**
 * Send an email via Resend HTTP API.
 * Returns true on success, false on failure (never throws to caller).
 */
async function sendEmail(params: SendEmailParams): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[email] RESEND_API_KEY is not configured");
    return false;
  }

  try {
    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: params.from,
        to: [params.to],
        subject: params.subject,
        html: params.html,
        ...(params.replyTo ? { reply_to: params.replyTo } : {}),
      }),
    });

    if (!res.ok) {
      console.error(`[email] Resend API returned ${res.status}`);
      return false;
    }

    return true;
  } catch {
    console.error("[email] Failed to send email");
    return false;
  }
}

/**
 * Send the admin notification about a new waitlist signup.
 * No PII is logged. Only email is included in the email body itself.
 */
export async function sendAdminNotification(params: {
  email: string;
  role: string | null;
  useCase: string | null;
  intent?: string | null;
  projectName?: string | null;
  integrationsInterest?: string[] | null;
  txVolumeBucket?: string | null;
  buildStage?: string | null;
}): Promise<boolean> {
  // Always send admin notifications to info@trucore.xyz regardless of env config
  const to = "info@trucore.xyz";
  const from = process.env.WAITLIST_FROM ?? "TruCore <info@trucore.xyz>";

  const isDesignPartner = params.intent === "design_partner";
  const integrations = params.integrationsInterest?.join(", ") ?? "";

  /* ---- triage-friendly subject lines ---- */
  const subject = isDesignPartner
    ? `[TruCore][ATF][Design Partner] ${params.projectName ?? params.email} — ${integrations || "none"} — ${params.txVolumeBucket ?? "unknown"}`
    : `[TruCore][Waitlist] ${params.email} — ${params.role ?? "no role"}`;

  /* ---- scannable key/value body ---- */
  const row = (label: string, value: string | null | undefined) =>
    value ? `<tr><td style="padding:4px 12px 4px 0;color:#888;white-space:nowrap;">${label}</td><td style="padding:4px 0;">${escapeHtml(value)}</td></tr>` : "";

  const heading = isDesignPartner
    ? "New Design Partner Application"
    : "New Waitlist Signup";

  /* ---- suggested first reply block (design partners only) ---- */
  const schedulingUrl = process.env.DESIGN_PARTNER_SCHEDULING_URL ?? "";
  const suggestedReplyBlock = isDesignPartner
    ? `
      <div style="margin-top:24px;padding:16px;background:#f8f4ef;border-left:4px solid #d86c08;border-radius:4px;">
        <p style="margin:0 0 8px;font-weight:600;color:#d86c08;">Suggested first reply</p>
        <div style="font-size:13px;color:#333;white-space:pre-line;line-height:1.6;">Hi ${escapeHtml(params.projectName ?? "there")},

Thanks for applying to the TruCore ATF design partner program. I'd love to learn more about what you're building.

Can you share a bit about:
1. Your agent framework and signer setup
2. Primary actions you're targeting (Jupiter, Solend, etc.)
3. Key risk concerns (slippage, limits, allowlists, receipts)
4. Target volume and automation cadence

${schedulingUrl ? `Book a 15-min fit check here: ${schedulingUrl}` : ""}
Looking forward to connecting.

Best,
TruCore Team</div>
      </div>`
    : "";

  return sendEmail({
    to,
    from,
    subject,
    html: `
      <div style="font-family: system-ui, sans-serif; color: #1a1a2e;">
        <h2 style="color: #d86c08;">${heading}</h2>
        <table style="border-collapse:collapse;font-size:14px;">
          ${row("Intent", params.intent)}
          ${row("Email", params.email)}
          ${row("Project", params.projectName)}
          ${row("Integrations", integrations || null)}
          ${row("Tx Volume", params.txVolumeBucket)}
          ${row("Build Stage", params.buildStage)}
          ${row("Role", params.role)}
        </table>
        ${params.useCase ? `<p style="margin-top:16px;"><strong>Use case:</strong><br/>${escapeHtml(params.useCase)}</p>` : ""}
        ${suggestedReplyBlock}
        <hr style="border: none; border-top: 1px solid #ddd; margin: 24px 0;" />
        <p style="color: #666; font-size: 13px;">Sent from the TruCore waitlist system.</p>
      </div>
    `,
  });
}

/**
 * Send a confirmation email to the user who signed up.
 * Minimal, trust-aligned. No marketing fluff.
 */
export async function sendUserConfirmation(email: string, intent?: string): Promise<boolean> {
  const from = process.env.WAITLIST_FROM ?? "TruCore <hello@trucore.xyz>";

  const isDesignPartner = intent === "design_partner";

  const subject = isDesignPartner
    ? "TruCore ATF \u2014 next steps"
    : "You're on the TruCore waitlist";

  const heading = isDesignPartner
    ? "Application received."
    : "You're on the list.";

  const schedulingUrl = process.env.DESIGN_PARTNER_SCHEDULING_URL ?? "";
  const schedulingBlock = schedulingUrl
    ? `<p style="margin-top:16px;">
          <a href="${escapeHtml(schedulingUrl)}" style="display:inline-block;padding:12px 24px;background:#d86c08;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">
            Book a 15-min fit check
          </a>
        </p>`
    : "";

  const body = isDesignPartner
    ? `<p>
          Thanks for applying as a design partner. We review every application
          personally and will follow up with next steps shortly.
        </p>
        ${schedulingBlock}
        <p style="margin-top:20px;"><strong>Quick intake questions</strong> (reply to this email):</p>
        <ol style="margin-top:8px;padding-left:20px;line-height:1.8;color:#333;">
          <li>What agent framework and signer are you using?</li>
          <li>What are your primary actions? (e.g. Jupiter swaps, Solend lending)</li>
          <li>What risk concerns matter most? (slippage, limits, allowlists, receipts)</li>
          <li>What is your target volume and automation cadence?</li>
        </ol>
        <p style="margin-top:16px;">
          Just hit reply, we read every response.
        </p>`
    : `<p>
          Thanks for your interest in TruCore. We're building trust-first infrastructure
          for autonomous finance, and you'll be among the first to get access.
        </p>
        <p>We'll reach out when early access is available. No spam, ever.</p>`;

  return sendEmail({
    to: email,
    from,
    subject,
    html: `
      <div style="font-family: system-ui, sans-serif; color: #1a1a2e; max-width: 480px;">
        <h2 style="color: #d86c08;">${heading}</h2>
        ${body}
        <hr style="border: none; border-top: 1px solid #ddd; margin: 24px 0;" />
        <p style="color: #666; font-size: 13px;">
          If you didn't sign up for this, you can safely ignore this email or contact
          <a href="mailto:info@trucore.xyz" style="color: #349de8;">info@trucore.xyz</a>.
        </p>
      </div>
    `,
    replyTo: isDesignPartner ? "info@trucore.xyz" : undefined,
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
