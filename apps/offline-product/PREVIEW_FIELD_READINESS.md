# Preview build vs field-ready

An **EAS preview build** (green CI + successful `release:preview:safe`) means the app **compiles, installs, and passes automated guards**. It does **not** mean every farmer journey is verified on a physical device.

## Preview build validates

- Lint, typecheck, unit tests, structural guards
- OAuth provider wiring (`oauth:verify`, Android preflight where used)
- Maestro flow **manifest + testID wiring** (Linux CI)
- Native config (URL schemes, Metro bundle, signing)

## Field-ready still requires

Run **`npm run qa:device`** and complete **`DEVICE_SMOKE_CHECKLIST.md`** sections **§3 Backup & sign-in**, **§4 OAuth**, and **§10 Tenant & session** on a **physical device** with the preview IPA/APK.

Minimum automated subset before pilot (simulator or device):

```bash
cd apps/offline-product
npm run qa:field-readiness:assert   # persisted plot links + auth guards
npm run test:maestro:seed           # after one app launch on simulator
maestro test .maestro/flows/signed-out-backup-status-smoke.yaml
```

Or run the full nightly Maestro bundle (includes this flow):

```bash
npm run qa:maestro:nightly
```

## What the new guards catch

| Issue class | Guard |
|-------------|--------|
| Signed-out home shows “sign in to upload” after successful backup | `signed-out-backup-status-smoke.yaml` + `hasLocalSyncWork.test.ts` |
| Auto-backup retries plot upload without session | `field-auth-backup-guard.mjs` → `runAutoBackup` / `plotServerSync` |
| Device forgets uploaded plots when server list unavailable | `plotServerLink.test.ts`, `plotSyncPending.test.ts` |
| OAuth wizard / sign-out races | Covered by unit tests in `syncAuthSession.test.ts`; full path still manual §4 |

## Release commands

| Command | Use |
|---------|-----|
| `npm run release:preview:safe` | CI gates + preview field-readiness assert + EAS iOS preview build |
| `npm run release:preview:android:safe` | Same + Android OAuth verify + EAS Android preview |
| `npm run qa:device:signoff` | Human attestation after checklist (required before production OTA gate) |

**Rule of thumb:** preview build = shippable artifact; **field-ready** = checklist + Maestro signed-out backup smoke + your device OAuth soak.
