# Release Process

This project uses lightweight, semantic-ish version tags for production releases.

## Versioning Convention

- Format: `v0.x.y`
- `x` increments for feature bundles and planned release slices
- `y` increments for hotfixes and patch-only follow-ups

Examples:

- `v0.1.0` first public production baseline
- `v0.1.1` patch release for a targeted fix
- `v0.2.0` next feature bundle release

## Release Steps

1. Ensure `main` is green in CI (`lint`, `unit`, `e2e`).
2. Run local parity checks:

   ```bash
   npm run ci
   ```

3. Verify Vercel Preview deployment for the release candidate commit.
4. Verify Production deployment after merge to `main`.
5. Create and push a Git tag, then publish GitHub release notes.

## Tagging Commands

```bash
git checkout main
git pull origin main
git tag -a v0.1.0 -m "Release v0.1.0"
git push origin v0.1.0
```

## Minimal Release Note Template

```md
## Highlights
- ...

## Security
- ...

## Operational changes
- ...

## Migration notes (DB columns)
- Added: ...
- Updated: ...
- Backfill required: yes/no
```

## Commit to Tag Mapping

Vercel exposes commit metadata (for example `VERCEL_GIT_COMMIT_SHA`) but usually does not expose Git tags directly. Use the commit SHA shown on `/status` to find the matching tag in GitHub.
