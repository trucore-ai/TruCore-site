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
}): Promise<boolean> {
  const to = process.env.WAITLIST_NOTIFY_TO ?? "hello@trucore.xyz";
  const from = process.env.WAITLIST_FROM ?? "TruCore <hello@trucore.xyz>";

  const roleLine = params.role ? `<p><strong>Role:</strong> ${escapeHtml(params.role)}</p>` : "";
  const useCaseLine = params.useCase
    ? `<p><strong>Use case:</strong> ${escapeHtml(params.useCase)}</p>`
    : "";

  return sendEmail({
    to,
    from,
    subject: "New TruCore waitlist signup",
    html: `
      <div style="font-family: system-ui, sans-serif; color: #1a1a2e;">
        <h2 style="color: #d86c08;">New Waitlist Signup</h2>
        <p><strong>Email:</strong> ${escapeHtml(params.email)}</p>
        ${roleLine}
        ${useCaseLine}
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
export async function sendUserConfirmation(email: string): Promise<boolean> {
  const from = process.env.WAITLIST_FROM ?? "TruCore <hello@trucore.xyz>";

  return sendEmail({
    to: email,
    from,
    subject: "You're on the TruCore waitlist",
    html: `
      <div style="font-family: system-ui, sans-serif; color: #1a1a2e; max-width: 480px;">
        <h2 style="color: #d86c08;">You're on the list.</h2>
        <p>
          Thanks for your interest in TruCore. We're building trust-first infrastructure
          for autonomous finance, and you'll be among the first to get access.
        </p>
        <p>We'll reach out when early access is available. No spam, ever.</p>
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
