# Device smoke checklist (manual)

Run after `npm run qa:full` passes. Use a **physical device** for GPS, camera, and push; simulator is OK for UI-only paths.

**Print this checklist:** `npm run qa:device`

## Preconditions

- [ ] `npm run qa:full` green on the release commit
- [ ] Preview or production API reachable (`EXPO_PUBLIC_API_URL` in `.env.local` for dev client)
- [ ] Test farmer account (email/password) or Google/Apple test identity
- [ ] Optional: second Tracebud account to spot-check account switching

## 1. Onboarding & profile

- [ ] Fresh install → Home shows Walk my plot + Log harvest only (no plots)
- [ ] Create farmer profile (name) on Home
- [ ] Settings → Edit profile (name + photo) saves locally
- [ ] Camera / photo library deny → `perm_*` alert; allow → photo saves

## 2. Plot capture

- [ ] Walk my plot → name + size → Start walking → Stop & save → plot appears on My Plots
- [ ] Walk plot: instructions visible **above** map while recording (not only below scroll)
- [ ] Location deny on Start → `perm_location_*` alert + inline `walk_location_denied`
- [ ] **Mark corners:** instructions visible; stand at corner → hold timer → Save corner → count increases; map shows markers
- [ ] **Draw on map:** pan/zoom works before first corner; Start tracing → taps add corners; undo/clear work; save creates polygon
- [ ] Draw on map: tap adds vertices; undo/clear work; save creates polygon
- [ ] Each plot list square shows Esri satellite map with boundary overlay (88×88 thumbnail)
- [ ] Plot detail shows full-width map hero with polygon (tap opens boundary editor)

## 3. Backup & sign-in (email)

- [ ] Settings → Sign in (email/password) → session shows signed-in email
- [ ] Unsynced plots → backup consent modal on sign-in (confirm uploads)
- [ ] Confirm upload → plots sync; My Plots pending badge clears
- [ ] Home sync card shows pending count (queue + unsynced plots); tap → Settings backup (`?focus=backup`)

## 4. OAuth sign-in

- [ ] Sign out → local plots remain on device
- [ ] **Android:** Google Cloud → Android OAuth client has package `com.tracebud.app` + EAS upload **SHA-1** (expo.dev → Credentials → Android)
- [ ] **Android:** Same OAuth client → **Advanced settings** → **Enable custom URI scheme** (fixes Error 400 “Custom URI scheme is not enabled”). Wait ~5 min; no rebuild needed for this toggle alone.
- [ ] **Android smoke (required before pilot APK):** On a physical device with the preview APK, tap Google sign-in once — account picker must appear (not “Access blocked”). CI `oauth:verify:android` does not cover this.
- [ ] **iOS smoke (required before preview OTA):** On a physical iPhone with the preview build, tap Google sign-in once — account picker → return to app → signed in (not “Could not sign in with Google or Apple”). CI `oauth:verify:ios` does not cover this.
- [ ] Google sign-in → backup offer when unsynced plots exist; upload succeeds
- [ ] iOS: Apple sign-in completes (or skip on Android)
- [ ] New OAuth account without display name → name step in create-account wizard → save → Home
- [ ] Engineering: `npm run oauth:verify:android` passes before Android preview build; `npm run oauth:verify:ios` before iOS preview OTA; `npm run release:preflight:production:online` before store submit

## 5. Harvest (online + offline queue)

- [ ] Harvests → select plot → record weight → receipt created when online
- [ ] Deliver to **known buyer tenant** (consent picker) → receipt syncs; no buyer invite alert
- [ ] Deliver to **unknown buyer email** → receipt created + buyer invite alert (saved or emailed copy); QR on receipt remains backup
- [ ] Airplane mode → record harvest → **queued** message (not fake success)
- [ ] Back online → Settings → Sync now → harvest appears; queue count clears

### 5a. Delivery routing (buyer email / invite)

Use a **second email** not yet on Tracebud dashboard (e.g. `buyer-smoke+DATE@yourdomain.com`).

**Field app (producer device)**

- [ ] Harvests → Deliver to → enter unknown buyer email → submit → **invite success** alert (not hard error)
- [ ] Receipt shows directed email; voucher syncs when online
- [ ] Optional: legacy API “unknown org” path → Alert offers **Continue with QR only**

**Backend / Resend (engineering)**

- [ ] `npm run check:resend` OK on deployed backend
- [ ] `npm run db:verify:voucher-buyer-invites` OK on production DB
- [ ] Resend dashboard shows `delivery-buyer-invite` email to test address

**Dashboard (buyer signup claim)**

- [ ] Open invite link or sign up with **same email** → complete workspace setup
- [ ] Buyer dashboard → harvest vouchers → delivery from producer appears (no QR scan)
- [ ] `voucher_buyer_invites.status` = `claimed` for that voucher (Supabase / SQL check)

**Known buyer (regression)**

- [ ] Deliver to email already linked to a Tracebud workspace → buyer sees voucher without invite flow

## 6. Plot setup & detail

- [ ] My Plots + plot detail both show **Finish setup** (not duplicate badges)
- [ ] Plot detail “Next step” banner opens photos/documents/walk as expected
- [ ] `?sub=photos` / `?focus=photos` deep-link scrolls to photo section
- [ ] Plot attestations (land tenure + no deforestation) save and persist after app restart

## 7. Evidence & documents

- [ ] Plot detail → add ground-truth photo (camera) — single **Use photo**; no stuck "Opening camera…"
- [ ] Evidence / documents flow: camera deny → `evidence_perm_*` alert
- [ ] **Land documents:** add land title photo → **thumbnail appears** and count updates
- [ ] **Land documents auto-upload:** signed in + online → status shows uploaded (or queued if plot not on server) **without** tapping a separate Upload button
- [ ] FPIC / tenure / permit sections: add document → thumbnail or row appears; auto-upload status message
- [ ] Title photo or tenure evidence attaches locally

### 7b. Sync now — land docs upload before declarations

Use a plot with **land title photos or tenure documents** queued locally, plus **producer/plot declarations** pending (`audit_sync` rows). Point at production API (`https://api.tracebud.com/api`).

- [ ] Settings → Technical details: after Sync now, **Failed step** is **not** `Photo file upload` / `Document upload` when land docs were pending
- [ ] Land title / evidence rows drain **before** declaration audit (`photos_sync` / `evidence_sync` upload before `audit_sync`)
- [ ] If declaration audit hits **audit_sync rate limit**, yellow banner says declaration failed — **not** generic “Tracebud is busy”
- [ ] With media still in the upload queue, brown hint says **waiting to upload** — not “not on this device”
- [ ] Wait 60s → Sync now again → declaration audit completes (or pending count drops)
- [ ] **Second Sync now** (queue only, plots already linked, no parity restore): Technical details shows **upload queue only (skipped cloud restore)** — not a full pull from cloud

## 8. Settings — backup, notifications, advanced

- [ ] Backup & sync: sign-in, **Sync now**, queue diagnostics when pending
- [ ] Notifications: badge **Not set** → **Enable notifications** (signed in) → allow → badge **On**
- [ ] Notifications deny → `perm_push_*` alert with **Open Settings**
- [ ] Advanced: Declaration GPS (not under profile edit); capture + clear GPS
- [ ] Advanced: vertex averaging, storage footprint, declaration export JSON
- [ ] **Need help?** shows `help_farmer_body` troubleshooting copy

## 9. Permissions summary

| Permission | Trigger | Expected on deny |
|------------|---------|------------------|
| Location | Walk plot / Declaration GPS | Alert + Settings shortcut |
| Camera | Profile photo / evidence | `perm_camera_*` or `evidence_perm_*` |
| Push | Settings → Enable notifications | `perm_push_*` + `push_permission_denied` event |

## 10. Tenant & session (field-app scope)

- [ ] Signed-in upload only affects the authenticated farmer’s server plots (no cross-account bleed on one device)
- [ ] Sign out → local SQLite plots/harvests remain; server session cleared; Settings email clears immediately (no ~30s spinner)
- [ ] After sign-out with plots already uploaded → Home sync card shows **Backed up** (not “sign in to upload”); no spurious auto-backup retries while signed out
- [ ] Sign in as different user → backup consent only offers **local** unsynced plots for upload
- [ ] OAuth user: Settings unsynced plot count matches My Plots (not stuck at 0)
- [ ] **Simulator (Maestro):** `MAESTRO_SEED_PROFILE=backed_up_offline npm run test:maestro:seed` then `npm run test:maestro:signed-out-backup` — asserts `signed-out-backup-status-smoke.yaml`
- [ ] **Sign-out persistence (Maestro):** `maestro test .maestro/flows/sign-out-persistence-smoke.yaml`
- [ ] **Sign-out soak (device):** sign out 3× with pending queue; tab away — UI stays signed out

## 11. Flaky network & recovery

- [ ] Start **Sync now** → toggle airplane mode mid-sync → recovery message; retry succeeds online
- [ ] Force-quit during walk capture → reopen app → plot data not corrupted (or clear recovery path)
- [ ] Stuck sync: Settings queue shows last error; `INCIDENT_RUNBOOK.md` steps resolve or escalate

### 11b. Field-sync-delta (cursor skip + incremental restore)

Point at production API after at least one successful **Sync now** (establishes `field_sync_cursor_v1`).

- [ ] **Second Sync now** with no cloud changes: Technical details shows **upload queue only (skipped cloud restore)** — not a full pull from cloud (same as §7b)
- [ ] Tab away and return (focus restore): no full cloud pull when delta reports unchanged inbound (`field_sync_delta_skipped` in analytics if instrumented)
- [ ] Device A adds delivery only → Device B focus or **Sync now**: receipts update without full plot/media re-download (**incremental restore**)
- [ ] Mid-sync airplane mode: queue retains pending work; online retry completes without duplicate harvest rows
- [ ] **Simulator (Maestro):** `MAESTRO_SEED_PROFILE=delta_sync_idle npm run test:maestro:seed` then `npm run test:maestro:field-sync-delta` — asserts `field-sync-delta-smoke.yaml` entry points

## 12. Cross-device restore (second device)

Use the same farmer account on a **second phone or tablet** after the first device has synced.

- [ ] Device A: Sign in → Sync now → plots, harvests, land documents, and field photos upload
- [ ] Device B: Fresh install or cleared app → Sign in with same account → accept backup/sync offer
- [ ] Device B: My Plots shows the same plot count as Device A
- [ ] Device B: Deliveries shows the same receipt count and **delivery dates** (not upload day)
- [ ] Device B: Plot detail → Documents shows land title / tenure files from Device A
- [ ] Device B: Plot detail → Field photos section shows ground-truth photos from Device A
- [ ] Device B: Producer declarations and plot attestations match Device A
- [ ] Device B: Settings → Declaration GPS matches Device A (Advanced)
- [ ] Device B: Settings → profile photo matches Device A
- [ ] Device B: Walk my plot offers to continue in-progress boundary from Device A
- [ ] Device B: Offline map pack preference restored (tiles re-download in background)
- [ ] Device B: Settings → Sync now → "Backup complete" with no pending queue
- [ ] Device B: second **Sync now** with no new cloud changes → Technical details **upload queue only (skipped cloud restore)** when cursor matches server (`field-sync-delta`)

## Sign-off

Complete §2 and §7 on a **physical device**, then record sign-off:

```bash
npm run qa:device:signoff -- --tester "Your name" --device "iPhone 15" --os "iOS 18.2" --build preview
```

This writes `DEVICE_SMOKE_SIGNOFF.json` (must match `git HEAD` for `npm run update:preview:safe`).

| Tester | Device | OS | Build (preview/prod) | Date | Pass |
|--------|--------|-----|----------------------|------|------|
| | | | | | |

**Engineering follow-up:** file issues for any failed row; attach Sentry event or Settings error text.

**Automated subset (nightly Maestro):** `cross-device-restore-smoke.yaml` with `MAESTRO_SEED_PROFILE=cross_device_b` validates restore UX entry points on simulator (full two-device check remains manual). `field-sync-delta-smoke.yaml` with `delta_sync_idle` seed exercises §11b UI entry points (airplane / push_only caption remain manual on device).
