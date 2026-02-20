export interface ChangelogEntry {
  date: string;
  title: string;
  changes: string[];
}

const changelog: ChangelogEntry[] = [
  {
    date: "2026-02-20",
    title: "Design Partner Funnel Upgrade",
    changes: [
      "Added dedicated /atf/apply page with focused design partner application form.",
      "Added who-this-is-for, what-you-get, and what-happens-next sections to the apply page.",
      "Updated all design partner CTAs to route to /atf/apply.",
      "Homepage waitlist now serves general signups only.",
    ],
  },
  {
    date: "2026-02-20",
    title: "Design Partner Scheduling and Intake",
    changes: [
      "Added scheduling link (Calendly/Google Calendar) to post-submit success state.",
      "Design partner confirmation email now includes scheduling CTA and intake questionnaire.",
      "Admin notification includes suggested first reply block with scheduling link.",
      "Scheduling button hidden gracefully when env var is not configured.",
    ],
  },
  {
    date: "2026-02-19",
    title: "Production Credibility Pack",
    changes: [
      "Added public status page with system health overview.",
      "Added changelog page with historical release notes.",
      "Added contact page with clear email routes and social links.",
      "Updated footer with links to Status, Changelog, and Contact.",
    ],
  },
  {
    date: "2026-02-18",
    title: "CSP Reporting, Health Endpoint, and Error Boundaries",
    changes: [
      "Added Content-Security-Policy-Report-Only header with /api/csp-report endpoint.",
      "Added /api/health endpoint for external uptime monitors.",
      "Added global and admin-scoped error boundaries.",
      "Added /admin/csp viewer for CSP violation reports.",
    ],
  },
  {
    date: "2026-02-17",
    title: "Security Headers and Audit Log",
    changes: [
      "Enforced strict security headers (HSTS, CSP, X-Frame-Options) on all responses.",
      "Added admin audit log recording login, logout, status changes, note edits, and CSV exports.",
      "Added /admin/audit page for reviewing audit entries.",
    ],
  },
  {
    date: "2026-02-16",
    title: "Admin Notes and Design Partner Dedupe",
    changes: [
      "Added inline admin notes per signup with 2,000-character limit.",
      "Design partner re-submissions now update existing rows instead of being ignored.",
      "Added rate limiting (30 mutations/min) for admin actions.",
    ],
  },
  {
    date: "2026-02-15",
    title: "Admin Dashboard Enhancements",
    changes: [
      "Added pipeline status tracking (new, contacted, qualified, closed).",
      "Added outreach email copy-to-clipboard for design partner rows.",
      "Added CSV export for design partner data.",
    ],
  },
  {
    date: "2026-02-14",
    title: "Admin Triage Dashboard",
    changes: [
      "Built server-rendered admin dashboard at /admin/waitlist.",
      "Secured with HttpOnly cookie session and ADMIN_DASHBOARD_KEY.",
      "Added filtering by intent (all, standard, design_partner) and configurable limits.",
    ],
  },
  {
    date: "2026-02-12",
    title: "Design Partner Application Flow",
    changes: [
      "Added design partner intake fields (project name, integrations, tx volume, build stage).",
      "Dual-mode waitlist form: standard signup and design partner application.",
      "Separate admin notification emails for design partner submissions.",
    ],
  },
  {
    date: "2026-02-10",
    title: "ATF Product Pages",
    changes: [
      "Launched /atf with threat model, architecture overview, and permit example.",
      "Added /atf/how-it-works with lifecycle diagram and enforcement detail.",
      "Added V1 scope, roadmap, and design partner CTA sections.",
    ],
  },
  {
    date: "2026-02-08",
    title: "Waitlist, Email Notifications, and Analytics",
    changes: [
      "Launched waitlist signup with Vercel Postgres backend.",
      "Added Resend-powered confirmation and admin notification emails.",
      "Integrated Vercel Web Analytics with custom event tracking.",
    ],
  },
  {
    date: "2026-02-05",
    title: "Security, Privacy, and Terms Pages",
    changes: [
      "Published /security with responsible disclosure policy and safe harbor.",
      "Published /privacy with data handling and analytics transparency.",
      "Published /terms with informational-use disclaimer.",
    ],
  },
  {
    date: "2026-02-02",
    title: "Launch Site Foundation",
    changes: [
      "Deployed initial TruCore marketing site with animated hero background.",
      "Added Why TruCore, Trust and Integrity, and Integrations sections.",
      "Configured Vercel deployment with custom domain and social previews.",
    ],
  },
];

export default changelog;
