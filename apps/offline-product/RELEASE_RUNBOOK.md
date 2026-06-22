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

For production, prefer (runs lint, typecheck, tests, store assets, then env preflight, then EAS build):

```bash
npm run release:production:safe
```

Preview builds:

```bash
npm run release:preview:safe
```

Before the first production submit, also verify Supabase OAuth providers (network):

```bash
npm run release:preflight:production:online
```

OTA (only after validation):

```bash
npm run qa:device
# Complete §2 + §7 on a physical device, then:
npm run qa:device:signoff -- --tester "You" --device "Phone" --os "iOS 18" --build preview
npm run update:preview:safe
npm run update:production:safe
npm run update:production
```

`update:preview:safe` runs unit tests, field regression guard, and **device sign-off assert** (requires `DEVICE_SMOKE_SIGNOFF.json` at current `git HEAD`). Emergency skip: `DEVICE_SMOKE_SIGNOFF_SKIP=1` (log in `daily-log.md`).

## Pre-release gates (must pass)

- Permissions: role + tenant behavior validated.
- State transitions: canonical sync/assignment transitions preserved.
- Exceptions/recovery: offline queue retries and failure messaging validated.
- Analytics events: key onboarding/sync/error events visible.
- Acceptance criteria: FEAT-002 and quality evidence checklist complete.
- Spatial/HLC/lineage/TRACES/GDPR constraints: unchanged or verified in impacted paths.

## When things go wrong

See `INCIDENT_RUNBOOK.md` for farmer support triage and engineering escalation (auth, sync queue, Sentry).

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

Collect live metrics: `npm run mobile:slo:collect -- --report=mobile-rollout-slo-report.json`  
Evaluate: `npm run mobile:slo:gate -- --report=mobile-rollout-slo-report.json`

### Production OTA gate (5.10)

Before shipping JS to the production channel:

```bash
npm run ota:production:preflight          # local — requires DEVICE_SMOKE_SIGNOFF.json at HEAD
npm run update:production:safe            # preflight + eas update production
```

Or run GitHub Actions → **Offline OTA production gate** (skew guards on Linux + Maestro on macOS).

Skew guard alone: `npm run ota:skew:assert` (runtimeVersion + channel wiring + native fingerprint).

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
