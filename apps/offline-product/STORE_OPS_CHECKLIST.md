# Store ops checklist (manual)

Run automated asset gate first:

```bash
npm run store:preflight
npm run store:preflight -- --strict   # before Play submit if Android assets are ready
```

Pair with `npm run release:preflight:production:online` and `DEVICE_SMOKE_CHECKLIST.md` sign-off.

## iOS — App Store Connect

### Metadata (version 1.0.0)

- [ ] App name: **Tracebud** (or approved marketing name)
- [ ] Subtitle: offline field mapping + EUDR plot backup (≤ 30 chars)
- [ ] Primary category: **Productivity** or **Business**
- [ ] Support URL: `https://tracebud.com/support` (or live help page)
- [ ] Privacy policy URL: `https://tracebud.com/privacy`
- [ ] Copyright, age rating questionnaire completed
- [ ] `ITSAppUsesNonExemptEncryption` = **No** (already in `app.json`)

### Screenshots

- [ ] iPhone **6.7"** — upload `store-assets/app-store/ios/6.7-inch/01` … `05` (1290×2796)
- [ ] iPad **13"** (optional) — `store-assets/app-store/ios/13-inch/` if tablet marketing required
- [ ] Regenerate frames: `npm run generate:store-screenshots`
- [ ] Real UI captures: `npm run store:screenshots:capture`

### App Privacy (nutrition labels)

Declare data linked to the user (farmer account):

| Data type | Collected | Purpose | Notes |
|-----------|-----------|---------|-------|
| Email address | Yes | Account / sync | Supabase auth |
| Name | Yes | Account | Farmer profile |
| Precise location | Yes | App functionality | Walk plot, declaration GPS — **when in use** |
| Photos | Yes | App functionality | Profile + plot evidence |
| User ID | Yes | App functionality | Farmer / plot IDs |
| Crash data | Yes | Analytics | Sentry when `EXPO_PUBLIC_SENTRY_DSN` set |

- [ ] Data **not** used for tracking (no ad SDKs)
- [ ] Data encrypted in transit (HTTPS API)
- [ ] Users can request deletion (support process documented)

### Submit

- [ ] Production build via `npm run release:production:safe`
- [ ] `eas submit --platform ios --profile production`
- [ ] ASC app id in `eas.json` matches App Store Connect (`6778796166`)
- [ ] Phased release enabled after approval

## Google Play — Play Console

### Main store listing

- [ ] App icon `store-assets/google-play/app-icon-512.png`
- [ ] Feature graphic `feature-graphic-1024x500.png`
- [ ] Phone screenshots (4–8) in `google-play/phone/`
- [ ] Short + full description (farmer-focused, EUDR offline mapping)
- [ ] Contact email + privacy policy URL

### Data safety form

Align with iOS privacy table:

- [ ] Location — approximate/precise, optional, on-device plot capture
- [ ] Photos — optional, evidence / profile
- [ ] Personal info — name, email (account)
- [ ] App activity — crash logs (Sentry) if enabled in production
- [ ] Data encrypted in transit; users can request deletion
- [ ] No data sold to third parties

### Release

- [ ] Content rating completed
- [ ] `npm run release:production:safe` → `eas submit --platform android --profile production`
- [ ] Staged rollout on **production** track (`eas.json` → `track: production`)
- [ ] Test on low-end Android device before 100% rollout

## Cross-platform identifiers

| Field | Value | Source |
|-------|-------|--------|
| iOS bundle ID | `com.tracebud.app` | `app.json` |
| Android package | `com.tracebud.app` | `app.json` |
| EAS project ID | `f7e2b0c7-bb72-4d87-b6d4-3fceeaebd969` | `app.json` / push tokens |
| OAuth redirect | `tracebudoffline://auth/callback` | Supabase allow-list |

## Sign-off

| Role | iOS ready | Android ready | Date |
|------|-----------|---------------|------|
| Product | | | |
| Engineering | | | |
| Legal / privacy | | | |
