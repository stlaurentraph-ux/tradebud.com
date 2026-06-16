# App Store screenshots

See also **`STORE_OPS_CHECKLIST.md`** (metadata, privacy labels, submit steps).

## iPhone 6.7" (required)

Path: `ios/6.7-inch/` — **1290 × 2796 px** PNGs.

Regenerate:

```bash
npm run generate:store-screenshots
npm run store:preflight
```

## Upload in App Store Connect

1. Open your app → **App Store** tab → version **1.0.0**.
2. Under **Screenshots**, select **iPhone 6.7" Display**.
3. Drag the five PNGs in order (`01-home` … `05-backup-settings`).
4. Save.

Apple may also accept the same set for **6.5"** (upload separately if prompted).

## Optional: real device captures

For pixel-perfect UI, replace these with Simulator screenshots:

```bash
# iPhone 15 Pro Max simulator → 1290×2796
xcrun simctl io booted screenshot screenshot.png
```

Use **File → New Screen Shot** in Simulator (⌘S) while the app is open.
