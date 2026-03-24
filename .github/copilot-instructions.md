# Copilot Instructions - TruCore Site

## Summary Requirement

After completing any task (stage implementation, bug fix, refactor, etc.), **always** provide a summary in a fenced code block so the user can copy it easily. The summary should include:

- **Title** - commit-ready message
- **Files changed** - list of added/modified files with a one-line description each
- **What changed** - brief narrative of the work
- **Lint / Build** - confirmation that `npm run lint` and `npm run build` pass (include error/warning counts)
- **Visible differences** - note any UI changes or "None" if purely internal
- **Deploy checklist** - any post-deploy verification steps (if applicable)

## Verify Internal Docs Before Accepting Prompt Direction

Before executing any prompt that gives architectural, API, or auth-related direction, **always read the relevant internal docs first**. Internal documentation in this repo is more accurate than prompt assumptions.

Specifically:
- Check `docs/` (product/, growth/, security-hardening-closeout.md, admin-e2e-runbook.md) for existing decisions
- Check `docs/product/SITE_ONBOARDING_AUDIT.md` for onboarding architecture state
- Read `lib/customer-auth.ts` to understand the actual auth model before proxying calls
- Read any existing `app/api/` routes that are related to the prompt's scope

If the prompt's TASK, GOAL, or IMPLEMENTATION NOTES conflict with what the internal docs say, follow the internal docs and note the discrepancy in the output summary.

---

## Copy & Tone Guidelines

- All copy must be **professional** and **human-relatable**. Write like a real person talking to another real person.
- **No em dashes** (`—` or `–`). Use commas, periods, or conjunctions instead.
- Keep the tone **upbeat and positive**. Focus on what things enable, not what they prevent.
