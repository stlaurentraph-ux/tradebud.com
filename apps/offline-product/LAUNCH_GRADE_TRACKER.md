# Launch grade tracker (field app)

Grades before field testing. **A** = production-ready for that dimension; **B** = shippable with known gaps; **C** = deferred or backend-only.

| Dimension | Grade | Evidence | To reach A |
|-----------|-------|----------|------------|
| **Release automation** | A | `qa:full`, `typecheck`, `security:preflight`, `store:preflight`, `release:*:safe` | Pass `release:preflight:production:online` with prod env |
| **Offline sync (code)** | A | Harvest queue, `clientPlotId`, HLC, mutex, auto-backup | Field soak §4–5, §11 in device checklist |
| **Auth (OAuth + email)** | A | Unified `syncAuthSession`; `postPlot` delegates token | OAuth on device; `oauth:verify` online |
| **Permissions UX** | A | Location + push helpers, Settings enable | Deny/allow paths on physical device |
| **Observability** | B+ | Sentry bridge + PII redaction | Set `EXPO_PUBLIC_SENTRY_DSN`; monitor preview 48h |
| **Security (mobile)** | B+ | SecureStore, redacted logs, GDPR erasure UI | Validate erasure E2E; account deletion policy sign-off |
| **Store ops** | A | iOS 6.7" + Play assets on disk; `store:preflight --strict` passes | ASC/Play forms + legal URLs in console |
| **Test depth** | B+ | 25 unit tests; static prefights + auth session tests | Optional Detox later; not blocking MVP |
| **Tenant isolation** | B | Device checklist §10; API uses bearer token | Two-account soak + backend audit |
| **Enterprise spec** | C+ | Mobile defers spatial/TRACES/GDPR shredding to backend | Out of field-app scope for MVP launch |
| **i18n** | C (waived) | English complete; others deferred | Explicit English-only launch sign-off |
| **SLO / crash budget** | B | `release:slo:gate` + example report | Preview metrics → `release-health-report.json` |

## Automated gates (run now)

```bash
npm run qa:full
npm run security:preflight
npm run store:assets:sync && npm run store:preflight -- --strict
# Production env required:
npm run release:preflight:production:online
```

## Field testing unlocks

Completing `DEVICE_SMOKE_CHECKLIST.md` sign-off moves **Offline sync**, **Auth**, **Permissions**, and **Tenant** from B→A for launch purposes.

## Explicit waivers (MVP)

- Non-English locales: ship English-only with product sign-off.
- Backend spatial/TRACES/GDPR shredding: validated in `tracebud-backend`, not duplicated in mobile soak.
