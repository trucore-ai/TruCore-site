# Copilot Instructions - TruCore Site

## Summary Requirement

After completing any task (stage implementation, bug fix, refactor, etc.), **always** provide a summary in a fenced code block so the user can copy it easily. The summary should include:

- **Title** - commit-ready message
- **Files changed** - list of added/modified files with a one-line description each
- **What changed** - brief narrative of the work
- **Lint / Build** - confirmation that `npm run lint` and `npm run build` pass (include error/warning counts)
- **Visible differences** - note any UI changes or "None" if purely internal
- **Deploy checklist** - any post-deploy verification steps (if applicable)

## Copy & Tone Guidelines

- All copy must be **professional** and **human-relatable**. Write like a real person talking to another real person.
- **No em dashes** (`—` or `–`). Use commas, periods, or conjunctions instead.
- Keep the tone **upbeat and positive**. Focus on what things enable, not what they prevent.
