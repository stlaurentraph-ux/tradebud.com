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
- [ ] Plot card shows Esri satellite thumbnail with boundary
- [ ] Plot detail shows full-width map hero with polygon (tap opens boundary editor)

## 3. Backup & sign-in (email)

- [ ] Settings → Sign in (email/password) → session shows signed-in email
- [ ] Unsynced plots → backup consent modal on sign-in (confirm uploads)
- [ ] Confirm upload → plots sync; My Plots pending badge clears
- [ ] Home sync card shows pending count (queue + unsynced plots); tap → Settings backup (`?focus=backup`)

## 4. OAuth sign-in

- [ ] Sign out → local plots remain on device
- [ ] Google sign-in → backup offer when unsynced plots exist; upload succeeds
- [ ] iOS: Apple sign-in completes (or skip on Android)
- [ ] New OAuth account without display name → name step in create-account wizard → save → Home
- [ ] `npm run release:preflight:production:online` passes before store submit (engineering)

## 5. Harvest (online + offline queue)

- [ ] Harvests → select plot → record weight → receipt created when online
- [ ] Airplane mode → record harvest → **queued** message (not fake success)
- [ ] Back online → Settings → Sync now → harvest appears; queue count clears

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
- [ ] Sign out → local SQLite plots/harvests remain; server session cleared
- [ ] Sign in as different user → backup consent only offers **local** unsynced plots for upload
- [ ] OAuth user: Settings unsynced plot count matches My Plots (not stuck at 0)

## 11. Flaky network & recovery

- [ ] Start **Sync now** → toggle airplane mode mid-sync → recovery message; retry succeeds online
- [ ] Force-quit during walk capture → reopen app → plot data not corrupted (or clear recovery path)
- [ ] Stuck sync: Settings queue shows last error; `INCIDENT_RUNBOOK.md` steps resolve or escalate

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
