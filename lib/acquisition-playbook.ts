/* ────────────────────────────────────────────────────────────────
 *  Operator Follow-Up Playbook — deterministic link mapping
 *
 *  Maps each FollowUpAction to the canonical TruCore resources
 *  the operator should reference when following up with a lead.
 *  Internal-only. No automation — just recommended links for
 *  copy-paste outreach.
 *
 *  To update: edit PLAYBOOK_MAP entries below. Each action maps
 *  to a primary link (always present) and optional secondary link.
 * ──────────────────────────────────────────────────────────── */

import type { FollowUpAction } from "@/lib/acquisition-followup";

/* ── Types ────────────────────────────────────────────────── */

export type PlaybookLink = {
  /** Short label shown in the UI */
  label: string;
  /** Site-relative path (e.g. "/builders") */
  href: string;
};

export type PlaybookEntry = {
  /** What this action means in plain operator language */
  description: string;
  /** Primary recommended link to send / reference */
  primary: PlaybookLink | null;
  /** Optional secondary link for deeper context */
  secondary: PlaybookLink | null;
  /** Short operator note (e.g. "no outreach needed") */
  note: string | null;
};

/* ── Canonical playbook mapping ───────────────────────────── */

export const PLAYBOOK_MAP: Record<FollowUpAction, PlaybookEntry> = {
  send_builder_docs: {
    description:
      "Early-stage lead needs awareness of what ATF offers. Send the builders landing page.",
    primary: { label: "Builders", href: "/builders" },
    secondary: { label: "Docs", href: "/docs" },
    note: null,
  },
  send_docs_and_key_help: {
    description:
      "Prototype-stage builder needs docs and help getting an API key.",
    primary: { label: "Builders", href: "/builders" },
    secondary: {
      label: "First Protected Trade",
      href: "/docs/first-protected-trade",
    },
    note: null,
  },
  send_api_key_help: {
    description:
      "Builder is ready for an API key. Point them to the apply flow and quickstart.",
    primary: { label: "Apply / Get Key", href: "/atf/apply" },
    secondary: { label: "Quickstart", href: "/docs/quickstart" },
    note: null,
  },
  send_portal_help: {
    description:
      "Has an API key but no portal access. Help them activate the portal.",
    primary: { label: "Portal", href: "/portal" },
    secondary: { label: "Verify", href: "/verify" },
    note: null,
  },
  prompt_first_trade: {
    description:
      "Fully provisioned but hasn't traded yet. Nudge toward first protected trade.",
    primary: {
      label: "First Protected Trade",
      href: "/docs/first-protected-trade",
    },
    secondary: { label: "Verify", href: "/verify" },
    note: null,
  },
  offer_integration_support: {
    description:
      "High-value in-production design partner without a key. Offer direct support.",
    primary: { label: "Builders", href: "/builders" },
    secondary: {
      label: "First Protected Trade",
      href: "/docs/first-protected-trade",
    },
    note: "Consider direct outreach — high-value lead",
  },
  monitor: {
    description:
      "Already activated with API key and portal. No outreach needed.",
    primary: null,
    secondary: null,
    note: "No outreach needed — progressing normally",
  },
  no_action_closed: {
    description: "Pipeline closed. No follow-up required.",
    primary: null,
    secondary: null,
    note: "Closed — no action",
  },
};

/* ── Helpers ──────────────────────────────────────────────── */

/** Get playbook entry for a given action */
export function getPlaybook(action: FollowUpAction): PlaybookEntry {
  return PLAYBOOK_MAP[action];
}

/** Check whether an action has any recommended links */
export function hasPlaybookLinks(action: FollowUpAction): boolean {
  const entry = PLAYBOOK_MAP[action];
  return entry.primary !== null || entry.secondary !== null;
}
