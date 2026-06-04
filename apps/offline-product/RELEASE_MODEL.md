# Offline Product Release Model

This model keeps one codebase while separating safe testing from the official app used by farmers.

## Tracks

- `development`: internal engineering builds.
- `preview`: QA and pilot testers (pre-release).
- `production`: official public release for farmers.

Each track maps to a dedicated EAS channel and update branch.

## Build and update mapping

- Build profile `development` -> EAS channel `development`
- Build profile `preview` -> EAS channel `preview`
- Build profile `production` -> EAS channel `production`

- OTA branch `preview` is for tester updates.
- OTA branch `production` is for official user updates.

## Recommended branch workflow

1. Feature branches -> merge into `develop`.
2. `develop` creates preview builds (`npm run release:preview`).
3. QA and pilot users validate on real devices and weak networks.
4. Promote tested commits to `main`.
5. Create production build from `main` (`npm run release:production`).
6. Submit to stores (`npm run submit:production`).
7. Use staged rollout in stores (5% -> 20% -> 50% -> 100%).

## OTA update policy

- Never send untested OTA updates to `production`.
- Send OTA updates to testers first:
  - `npm run update:preview`
- Promote the same fix to production only after validation:
  - `npm run update:production`

## Best practices

- Keep one app listing per platform for official users.
- Use TestFlight and Google Play Internal/Closed tracks for testers.
- Keep production feature flags default-off for risky changes.
- Enforce release checks before production:
  - lint + type-check + tests
  - offline sync recovery tests
  - auth/tenant isolation checks
  - crash-free and sync-success SLO checks

## Notes for Tracebud global rollout

- Official store app should stay stable and predictable.
- Pilot-country experiments should stay in `preview` until proven.
- Keep rollback ready via store staged rollout controls and rapid hotfix OTA.
