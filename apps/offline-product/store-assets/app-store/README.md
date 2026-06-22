# App Store screenshots

See also **`STORE_OPS_CHECKLIST.md`** (metadata, privacy labels, submit steps).

## iPhone 6.7" (required)

Path: `ios/6.7-inch/` — **1290 × 2796 px** PNGs.

Regenerate marketing frames (v0-style placeholders):

```bash
npm run generate:store-screenshots
npm run store:preflight
```

Replace with real Simulator captures when ready (`npm run capture:screenshot -- iphone-01-home.png`).

## iPad 13" (required for native iPad support)

Path: `ios/13-inch/` — **2064 × 2752 px** PNGs (iPad Pro 13-inch simulator).

Capture from the real app (not generated mockups):

```bash
# One-time: install dev build on iPad Pro 13-inch (M5) simulator
npx expo run:ios --device "iPad Pro 13-inch (M5)"

npm run capture:ipad-screenshots
```

Files: `01-home` … `05-backup-settings` (same story as iPhone set).

## Upload in App Store Connect

1. Open your app → **App Store** tab → version **1.0.0**.
2. **iPhone 6.7" Display** — drag `ios/6.7-inch/01` … `05`.
3. **iPad 13" Display** — drag `ios/13-inch/01` … `05`.
4. Save.

Apple may also accept the same iPhone set for **6.5"** (upload separately if prompted).

## Optional: real device captures

For pixel-perfect UI, replace placeholders with Simulator screenshots:

```bash
# iPhone 15 Pro Max simulator → 1290×2796
xcrun simctl io booted screenshot screenshot.png
```

Use **File → New Screen Shot** in Simulator (⌘S) while the app is open.
