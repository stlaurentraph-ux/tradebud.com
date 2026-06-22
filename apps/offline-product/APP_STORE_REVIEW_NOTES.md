# App Store Review notes (iOS 1.0 — build 7+)

Paste into **App Review Information → Notes** when submitting.

---

## Free app — no in-app purchases

Tracebud Field is **free for farmers**. There are **no subscriptions, no IAP, and no StoreKit products** in this binary.

Organization subscriptions (exporters, cooperatives, importers) are purchased on the **web dashboard** at `https://dashboard.tracebud.com` — not in the mobile app.

## Test account (farmer — use for review)

Provide a dedicated farmer test account in App Store Connect **Sign-In Information** (not a dashboard/org account).

- Use **email + password** sign-in, or Google with a **farmer** account.
- **Do not** use a dashboard workspace Google account — OAuth may show a message directing those users to the web dashboard.

## iPad testing (Guideline 2.1)

Review was on **iPad Air (5th generation), iPadOS 26.x**. Fixes in this build:

1. **My Plots** — plot list uses lightweight map thumbnails (no multiple MapKit views in the list).
2. **Sign In** — welcome → Sign In modal sequence fixed for iPad (`presentationStyle`, backdrop touch).
3. **Support URL** — live at `https://tracebud.com/support` (redirects to `/en/support`).

## Support URL (Guideline 1.5)

`https://tracebud.com/support`

## Icons (Guideline 2.3.8)

App icon updated from finalized marketing assets (no placeholder).

## What the app does

Offline-first field app for coffee/cocoa farmers: walk plot boundaries, store data on device, optional cloud backup when signed in. EUDR compliance evidence — not a consumer subscription product.

---

## Suggested Sign-In Information field

```
Farmer test account — email/password sign-in on the Sign In sheet.
App is free; no IAP. Org billing is web-only at dashboard.tracebud.com.
Support: https://tracebud.com/support
```
