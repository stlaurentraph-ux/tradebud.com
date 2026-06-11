# Capture App Store screenshots from the real Tracebud app

**v0 cannot extract screens from your Expo app.** v0 only generates new UI from a text prompt.

For App Store Connect, **screenshots from the real app are better** (and what Apple expects). Use the iOS Simulator or a physical device.

---

## 1. Install the app (not Expo Go)

Expo Go shows the Expo icon and a different shell. For **pixel-perfect** Simulator screenshots use the **native Tracebud .app**:

```bash
cd apps/offline-product
npm run build:simulator    # once: EAS cloud build for Simulator (~10 min)
npm run run:simulator      # installs on iPhone 17 Pro Max simulator
```

Requires Xcode + Simulator only (no CocoaPods on your Mac). The `simulator` profile bundles `EXPO_PUBLIC_STORE_DEMO=1` so Maria Santos demo data loads on launch.

Alternatives:

- **TestFlight on a physical device** (same UI as production).
- **Local build** (needs `brew install cocoapods`): `npm run ios:simulator`.

---

## 2. Pick simulators that match Apple’s sizes

| App Store slot | Simulator device | Screenshot size (portrait) |
|----------------|------------------|----------------------------|
| iPhone 6.5" / 6.7" | **iPhone 15 Plus** or **iPhone 14 Plus** | 1290×2796 or **1284×2778** |
| iPad 12.9" / 13" | **iPad Pro 12.9-inch (6th gen)** or **iPad Pro 13-inch** | **2048×2732** or 2064×2752 |

In Xcode: **Window → Devices and Simulators → Simulators → +** if needed.

Boot the simulator:

```bash
open -a Simulator
xcrun simctl boot "iPhone 15 Plus"   # or exact name from: xcrun simctl list devices available
```

Install and open Tracebud on that simulator.

---

## 3. Load demo data (one tap)

In the app: **Settings → App Store screenshots → Load demo data**.

This seeds **Maria Santos**, plots **Finca Norte** (10.88 ha), **El Roble** (5.26 ha), **La Colina** (1.12 ha), sample photos, and **0 pending** sync.

Visible when `EXPO_PUBLIC_STORE_DEMO=1` (preview builds) or in local dev. Rebuild preview after pulling this change:

```bash
npm run release:preview
```

Or run locally: `npx expo run:ios` (dev build shows the button via `__DEV__`).

---

## 4. Capture each screen

### Manual (simplest)

1. Navigate to the screen in the app.
2. **File → Save Screen** (or **⌘S**) in Simulator.
3. Screenshots land on Desktop (PNG at native resolution).

### CLI (repeatable)

With the simulator in focus and Tracebud on the screen you want:

```bash
cd apps/offline-product
npm run capture:screenshot -- iphone-01-home.png
```

Script saves to `store-assets/app-store/captured/ios/`.

---

## 5. Recommended 10 screens (same storyboard as v0 brief)

| File | Navigate to |
|------|-------------|
| `iphone-01-home.png` | Home tab |
| `iphone-02-map-plot.png` | Register plot → map / walk perimeter |
| `iphone-03-plot-summary.png` | After capture → summary |
| `iphone-04-my-plots.png` | My Plots tab |
| `iphone-05-plot-detail.png` | Tap a plot → detail |
| `iphone-06-photos.png` | Plot → photos / evidence |
| `iphone-07-harvest.png` | Log Harvest flow |
| `iphone-08-offline.png` | Home or map (optional: enable airplane mode on sim) |
| `iphone-09-sign-in.png` | Settings → sign in sheet |
| `iphone-10-settings.png` | Settings tab |

Repeat on **iPad Pro 12.9"** simulator → `store-assets/app-store/captured/ipad/`.

---

## 6. Upload to App Store Connect

Drag PNGs into the **iPhone** and **iPad** screenshot slots (portrait).  
Apple accepts 1284×2778 and 2048×2732; minor ±few px from Simulator is usually fine.

---

## 7. App previews (3 videos)

v0 and static capture don’t cover these. Record in Simulator:

```bash
xcrun simctl io booted recordVideo ~/Desktop/tracebud-preview-01.mov
# use the app for ~20s, then Ctrl+C
```

Suggested clips: (1) walk plot on map, (2) My Plots → open plot, (3) Settings → back up.

---

## Optional: automate later

Tools that drive the app and snap all screens (more setup):

- [Maestro](https://maestro.mobile.dev/) — YAML flows + `takeScreenshot`
- [fastlane snapshot](https://docs.fastlane.tools/actions/snapshot/) — UI tests + screenshots

Not required for v1; manual Simulator capture is enough.
