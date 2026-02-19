const RESEND_API_URL = "https://api.resend.com/emails";

interface SendEmailParams {
  to: string;
  from: string;
  subject: string;
  html: string;
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
  const to = process.env.WAITLIST_NOTIFY_TO ?? "info@trucore.xyz";
  const from = process.env.WAITLIST_FROM ?? "TruCore <info@trucore.xyz>";

  const isDesignPartner = params.intent === "design_partner";

  const roleLine = params.role ? `<p><strong>Role:</strong> ${escapeHtml(params.role)}</p>` : "";
  const useCaseLine = params.useCase
    ? `<p><strong>Use case:</strong> ${escapeHtml(params.useCase)}</p>`
    : "";
  const intentLine = params.intent
    ? `<p><strong>Intent:</strong> ${escapeHtml(params.intent)}</p>`
    : "";
  const projectLine = params.projectName
    ? `<p><strong>Project/Company:</strong> ${escapeHtml(params.projectName)}</p>`
    : "";
  const integrationsLine =
    params.integrationsInterest && params.integrationsInterest.length > 0
      ? `<p><strong>Integrations:</strong> ${escapeHtml(params.integrationsInterest.join(", "))}</p>`
      : "";
  const txLine = params.txVolumeBucket
    ? `<p><strong>Tx Volume:</strong> ${escapeHtml(params.txVolumeBucket)}</p>`
    : "";
  const stageLine = params.buildStage
    ? `<p><strong>Build Stage:</strong> ${escapeHtml(params.buildStage)}</p>`
    : "";

  const subject = isDesignPartner
    ? "New TruCore design partner application"
    : "New TruCore waitlist signup";

  const heading = isDesignPartner
    ? "New Design Partner Application"
    : "New Waitlist Signup";

  return sendEmail({
    to,
    from,
    subject,
    html: `
      <div style="font-family: system-ui, sans-serif; color: #1a1a2e;">
        <h2 style="color: #d86c08;">${heading}</h2>
        ${intentLine}
        <p><strong>Email:</strong> ${escapeHtml(params.email)}</p>
        ${projectLine}
        ${roleLine}
        ${useCaseLine}
        ${integrationsLine}
        ${txLine}
        ${stageLine}
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
    ? "Your TruCore design partner application"
    : "You're on the TruCore waitlist";

  const heading = isDesignPartner
    ? "Application received."
    : "You're on the list.";

  const body = isDesignPartner
    ? `<p>
          Thanks for applying as a design partner. We review every application
          personally and will follow up with next steps shortly.
        </p>
        <p>In the meantime, no action is needed on your end.</p>`
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
          <a href="mailto:hello@trucore.xyz" style="color: #349de8;">hello@trucore.xyz</a>.
        </p>
      </div>
    `,
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
