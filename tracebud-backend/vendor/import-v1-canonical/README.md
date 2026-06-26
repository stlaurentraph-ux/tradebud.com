Docker/Railway vendor copy of `packages/tracebud-import-v1-canonical`.

Railway Root Directory stays `tracebud-backend`; the Dockerfile installs this copy via
`file:./vendor/import-v1-canonical` because the workspace package is not on npm.

Keep in sync with the canonical package — `npm run qa:structural` runs parity guard.
