# Field app regression ledger

Living list of **bug classes that have reached preview/production more than once**. Each row must have an automated or mandatory manual guard before the next OTA.

## How to use

1. **New field bug fixed?** Add a row here before merging.
2. **Ship preview OTA?** Run `npm run qa:regression` + complete `DEVICE_SMOKE_CHECKLIST.md` on a physical device.
3. **Agent / PR work on offline-product?** Read this file + checklist sections tied to touched flows.

## Regression catalog

| ID | Symptom (farmer sees) | Root cause class | Guard | Smoke checklist |
|----|------------------------|------------------|-------|-----------------|
| FR-001 | Photo/document added but no thumbnail / count stays 0 | `persist*` called without `await` before `load*` | `persistence.sqlite.test.ts` + `unawaited-persist` guard | §7 Land documents |
| FR-002 | Document visible locally but never on server | Manual upload step required; no auto-sync | `autoUploadPlotDocuments` + smoke | §7 auto-upload |
| FR-003 | "Opening camera…" stuck after photo | Camera busy state not reset on `AppState` | Manual | §7 ground-truth photo |
| FR-004 | Mark corners: no instructions / can't save | Mode-specific UI gated wrong; hold timer UX | Manual | §2 Mark corners |
| FR-005 | Draw on map: first tap places point before pan | `drawTracingActive` gate missing | Manual | §2 Draw on map |
| FR-006 | Walk plot: instructions below fold | Layout order | Manual | §2 Walk plot |
| FR-007 | Upload button disabled despite reason filled | Validation order / empty state from FR-001 | FR-001 + smoke | §7 |
| FR-008 | Waypoint vs corner confusion | Shared copy for different capture modes | Mode-specific stat keys + en copy pass | §2 terminology |
| FR-009 | Device B missing docs/photos after sync | Restore path missing for audit/storage source | `sync-parity-guard.mjs` + registry | §12 cross-device |
| FR-010 | Restore succeeded but UI empty | Screen did not reload SQLite after sync | UI subscription guard in sync-parity | §12 plot detail |
| FR-011 | iPad missing land docs/photos | Plot count parity OK but media not compared | `measureCloudParitySummary` media + `ui-reload-guard` | §12 documents + field photos |
| FR-012 | Unknown buyer email blocks harvest | Pre-invite API returned 400 | `deliveryBuyerInviteMessages.test.ts` + `network-routing-delivery.int.spec.ts` | §5 buyer invite |
| FR-013 | Sync now floods audit 401/429 / duplicate audit_sync rows | Immediate POST + re-enqueue during sync prep | `cloud-audit-sync-guard.mjs` + `queueFieldCloudAuditSync.test.ts` | §8 Sync now |
| FR-014 | Google wizard completes → “Could not sign in with Google or Apple” on iOS | Native Google fails with no browser fallback; stale native URL scheme; SSO NULL token columns | `ios-oauth-guard.mjs` + `oauth:verify:ios` + `oauth-sso-health-check.mjs` + `oauth-orchestrator-guard.mjs` + Maestro `oauth-*-smoke.yaml` | §4 OAuth sign-in |

## Release gate (preview OTA)

```bash
cd apps/offline-product
npm run qa:regression
npm run qa:device              # print checklist — run §2 + §7 on device
npm run qa:device:signoff -- --tester "You" --device "Phone" --os "iOS 18" --build preview
npm run test:maestro           # optional; Maestro CLI + preview build
npm run update:preview:safe    # tests + guards + sign-off assert + OTA
```

**Do not** run bare `npm run update:preview` without tests + device smoke unless hotfixing production down — document exception in `product-os/06-status/daily-log.md`.

## CI

- GitHub `app` job runs lint, typecheck, unit tests, then `field-regression-guard.mjs`.

## Adding a guard

Prefer in order:

1. **Static script** (cheap, catches whole classes — see `scripts/field-regression-guard.mjs`)
2. **SQLite integration test** (`features/state/persistence.sqlite.test.ts` with `expoSqliteMemoryMock`)
3. **Maestro flow** (`.maestro/flows/` — golden paths with `testID`s)
4. **Smoke checklist + sign-off JSON** (`qa:device:signoff` → blocks `update:preview:safe`)
5. **Maestro / Detox** (expand flows when test IDs stabilize)
