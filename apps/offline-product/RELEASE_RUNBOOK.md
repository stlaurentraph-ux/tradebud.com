# Offline Product Release Runbook

Single runbook for shipping safely while improving continuously.

## Tracks and intent

- `development`: engineer/internal debug builds only
- `preview`: QA + pilot-country testers
- `production`: official app for farmers

Use one codebase and promote proven changes from `preview` to `production`.

## Branch and promotion flow

1. Develop on feature branches.
2. Merge to `develop`.
3. Build and test `preview`.
4. Validate acceptance and stability gates.
5. Promote same commit to `main`.
6. Build/submit `production`.
7. Roll out gradually in stores.

## Release commands

From `apps/offline-product`:

```bash
npm run lint
npm run release:preflight:preview
npm run release:preview
npm run release:slo:gate -- --report=release-health-report.json
npm run release:preflight:production
npm run release:production
npm run submit:production
```

For production, prefer:

```bash
npm run release:production:safe
```

OTA (only after validation):

```bash
npm run update:preview
npm run update:production
```

## Pre-release gates (must pass)

See also **[BETA_STORE_TESTING.md](./BETA_STORE_TESTING.md)** for TestFlight / Play internal testing and crash troubleshooting.

- Permissions: role + tenant behavior validated.
- State transitions: canonical sync/assignment transitions preserved.
- Exceptions/recovery: offline queue retries and failure messaging validated.
- Analytics events: key onboarding/sync/error events visible.
- Acceptance criteria: FEAT-002 and quality evidence checklist complete.
- Spatial/HLC/lineage/TRACES/GDPR constraints: unchanged or verified in impacted paths.

## Production env safety

- `EXPO_PUBLIC_API_URL` must be reachable and HTTPS in preview/production.
- Keep `EXPO_PUBLIC_ALLOW_TEST_AUTH` unset in production.
- Keep `EXPO_PUBLIC_ALLOW_LOCALHOST_API` unset in production.
- Keep `EXPO_PUBLIC_ALLOW_INSECURE_API` unset in production.

## Rollout strategy

1. Internal + pilot validation (`preview`).
2. Store staged rollout: `5% -> 20% -> 50% -> 100%`.
3. Monitor crash rate, sync queue failure rate, auth errors, API timeouts.
4. Pause or roll back rollout on regression.

### SLO gate thresholds (default)

- `sessions >= 100`
- `crashFreeRatePct >= 99.0`
- `syncSuccessRatePct >= 98.0`
- `authErrorRatePct <= 2.0`
- `apiTimeoutRatePct <= 2.0`

Override via env when needed:

- `RELEASE_SLO_MIN_SESSIONS`
- `RELEASE_SLO_MIN_CRASH_FREE_PCT`
- `RELEASE_SLO_MIN_SYNC_SUCCESS_PCT`
- `RELEASE_SLO_MAX_AUTH_ERROR_PCT`
- `RELEASE_SLO_MAX_API_TIMEOUT_PCT`

## Hotfix protocol

1. Fix on hotfix branch from `main`.
2. Validate in `preview` quickly.
3. Ship production patch build.
4. If urgent and safe, send OTA to `production` after preview validation.
5. Back-merge hotfix into `develop`.

## Evidence to capture each release

- Build IDs (preview + production)
- Store rollout percentages/timestamps
- QA sign-off note
- Known-risk note and mitigation
- Post-release health snapshot (24h and 7d)
