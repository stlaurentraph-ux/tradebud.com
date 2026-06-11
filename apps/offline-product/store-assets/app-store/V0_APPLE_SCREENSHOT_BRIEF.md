# Tracebud — v0 brief for Apple App Store screenshots

**Can v0 extract screens from the existing app?** No. v0 only generates UI from a prompt. For pixel-perfect store assets, capture from the real app — see **`CAPTURE_FROM_APP.md`**.

Use this v0 brief only if you want **designed/marketing mockups** instead of live captures.

Copy everything inside the **v0 prompt** block below into [v0.dev](https://v0.dev).  
Ask v0 to export **PNG at exact pixel dimensions** (no device bezels unless noted).

---

## What Apple needs (from App Store Connect)

| Device | Portrait size (use this) | Landscape (skip — app is portrait-only) | Max assets |
|--------|--------------------------|----------------------------------------|------------|
| **iPhone** | **1284 × 2778 px** | 2778 × 1284 | 10 screenshots + 3 app previews |
| **iPad 12.9" / 13"** | **2048 × 2732 px** | 2732 × 2048 | 10 screenshots + 3 app previews |

Alternate iPhone sizes Apple also accepts: 1242×2688, 2688×1242.  
Alternate iPad sizes: 2064×2752, 2752×2064.

**App previews (the 3 videos):** v0 cannot export video. Record those separately in the iOS Simulator or on a device (15–30 s each). This brief covers **static screenshots only**.

**Important:** Screenshots must show the **real app UI** (not generic stock app templates). No fake features. Portrait only.

---

## Brand & UI tokens (match production app)

- **Product:** Tracebud — offline-first mobile app for **farmers** (coffee/cocoa) to map plot boundaries with GPS, store data on-device, and back up to Tracebud when online.
- **Audience:** Smallholder farmers, low literacy tolerance — large text, clear icons, minimal jargon.
- **Logo:** Green leaf + map-pin mark (Tracebud icon). Use attached/reference: green pin on `#0A7F59` background.
- **Header gradient:** `#0A7F59` → `#0B6F50` (top bar on every screen).
- **Primary green (buttons, success):** `#10B981` / header `#0A7F59`.
- **Page background:** `#F8F8F8` or `#F9FAFB`.
- **Cards:** white `#FFFFFF`, 1px border `#ECECEC` / `#E5E7EB`, radius ~16–24px.
- **Text:** primary `#111111` / `#1F2937`, muted `#666666` / `#6B7280`.
- **Warning:** `#DD6B20` · **Success:** `#38A169`.
- **Typography:** clean sans-serif (Inter or Geist). Large touch targets (min 48px).
- **Header layout:** Green gradient bar · left: small logo + “Tracebud” **or** “‹ Back” + centered title · right: language pill **“EN”** only (no dot, no Online/Offline badge unless sync pending).
- **Bottom tabs:** Home · My Plots · Settings (icons + labels).
- **Sample user:** Maria Santos · **Plots:** Finca Norte (0.42 ha, Coffee), El Roble (1.15 ha, Cocoa).

---

## Deliverables (two artboards)

### A) iPhone — 10 PNGs @ **1284 × 2778 px**

Full-bleed **app UI only** (edge-to-edge screenshot style). **Do not** add iPhone hardware frame, marketing headlines outside the app, or App Store badges.

| # | Screen | What to show |
|---|--------|----------------|
| 1 | **Home** | Welcome card (“Welcome back, Maria Santos”), stats row (3 Plots · 2 Compliant · 0 Pending), 2×2 action tiles: Register Plot, Log Harvest, Documents, My Vouchers; sync card “Backed up”. |
| 2 | **Register plot — map** | Full-screen map (satellite-style greens), GPS polygon being walked, plot name “Finca Norte”, area “0.42 ha”, primary button “Continue”. Header: ‹ Back · Register plot · EN. |
| 3 | **Register plot — summary** | Plot boundary on map, captured area, checklist hint “Photos & evidence”, CTA toward declarations. |
| 4 | **My Plots** | List of 3 plot cards with mini map thumbnail, name, ha, crop, status pill (Ready / action needed). Header: My Plots. |
| 5 | **Plot detail** | Plot name, area, compliance/readiness checklist (photos, sync status), buttons for Photos / Documents / Harvest. |
| 6 | **Photo capture** | Ground-truth photo grid or camera UI for plot evidence (farmer-friendly, not technical). |
| 7 | **Log harvest** | Select plot → record weight (kg) → simple success / voucher hint. |
| 8 | **Offline-first** | Home or map screen with subtle “no signal” context; copy feel: works without internet, syncs later. **Do not** show permanent “Offline” in header. |
| 9 | **Sign in / backup** | Settings backup section or sign-in sheet: “Sign in to back up”, email/password or Continue with Google/Apple. |
| 10 | **Settings** | Backup card, storage footprint bar, language row. Clean and trustworthy. |

Export: `iphone-01-home.png` … `iphone-10-settings.png`.

### B) iPad 12.9" / 13" — 10 PNGs @ **2048 × 2732 px**

Same **10 scenes** as iPhone, adapted for tablet:

- Use **more horizontal space** (two-column layout where sensible: e.g. plot list + map side-by-side on My Plots).
- Keep the same green header + bottom navigation (can be wider tab bar or sidebar — prefer **familiar mobile chrome scaled up**, not a different product).
- Content and copy **identical** to iPhone set (English).
- Still full-bleed app UI, no device frame.

Export: `ipad-01-home.png` … `ipad-10-settings.png`.

---

## v0 prompt (copy from here ↓)

```
Design App Store screenshots for "Tracebud" — an offline-first farmer mobile app (React Native / iOS aesthetic).

OUTPUT: Two sets of static PNG mockups at EXACT pixel dimensions:
1) iPhone portrait: 1284 × 2778 px — 10 screens
2) iPad 12.9" portrait: 2048 × 2732 px — 10 screens (same scenes, tablet-adapted layout)

RULES:
- Full-bleed app UI screenshots only. NO phone/iPad hardware frames. NO marketing text outside the app UI. NO App Store badges.
- Portrait only. App is locked to portrait.
- Farmer-friendly: large text, simple icons, high contrast for outdoor use.
- Header on every screen: green gradient #0A7F59 to #0B6F50. Logo + "Tracebud" on Home; "‹ Back" + centered title on inner screens. Top-right: language pill "EN" only (no status dot, no Online/Offline label).
- Bottom tab bar: Home | My Plots | Settings.
- Cards: white, subtle border #ECECEC, rounded corners.
- Sample data: farmer "Maria Santos"; plots "Finca Norte" (0.42 ha, Coffee), "El Roble" (1.15 ha, Cocoa).

SCREENS (design all 10 for iPhone, then adapt all 10 for iPad):

1. HOME — Welcome card on green gradient ("Welcome back, Maria Santos"), stats: 3 Plots, 2 Compliant, 0 Pending. Four tiles: Register Plot / Log Harvest / Documents / My Vouchers. Sync card: "Backed up".

2. REGISTER PLOT MAP — Satellite-style map, green GPS polygon, "Finca Norte", "0.42 ha", Continue button.

3. PLOT SUMMARY — Boundary complete, area, next steps for photos/evidence.

4. MY PLOTS — List of plot cards with thumbnails and status pills.

5. PLOT DETAIL — Checklist, photos, documents, harvest entry points.

6. PHOTOS — Ground-truth photo capture UI for the plot.

7. LOG HARVEST — Record delivery weight, simple compliance receipt flow.

8. OFFLINE — Emphasize field use without mobile data (UI still normal; no loud "offline" banner in header).

9. SIGN IN — Backup / account sheet: Sign in to back up plots; Google, Apple, email options.

10. SETTINGS — Back up to Tracebud, storage on device (~24 MB), language.

iPad versions: same content, wider layout (e.g. split view on My Plots and Plot detail). Keep Tracebud branding consistent.

Use shadcn-style components, Inter or Geist font, colors #0A7F59 header, #10B981 actions, #F9FAFB background.

Provide downloadable PNG exports at the exact dimensions above, one file per screen.
```

---

## After v0 — upload checklist

### iPhone (App Store Connect)
1. App → **App Store** → your version → **iPhone** screenshots.
2. Select **6.5"** or **6.7"** slot (Apple scales from 1284×2778 or 1242×2688).
3. Drag **up to 10** PNGs in narrative order (01 → 10).

### iPad
1. Same version → **iPad** screenshots → **12.9"** or **13"** display.
2. Drag **up to 10** PNGs (2048×2732 or 2064×2752).

### App previews (videos — not v0)
Record in Simulator (**iPhone 15 Pro Max** / **iPad Pro 12.9"**) or on device:
1. Walk plot boundary on map (~20 s).
2. My Plots → open plot → photos (~20 s).
3. Settings → sign in → back up (~20 s).

Export with QuickTime or `xcrun simctl io booted recordVideo preview.mov`.

---

## Reference assets in this repo

- Logo: `apps/offline-product/assets/images/tracebud-logo.png`
- App icon: `apps/offline-product/assets/images/icon.png`
- UI prototype (structure only): `apps/offline-product/design/v0-prototype/apps/marketing/app/prototype/page.tsx`
- English copy: `apps/offline-product/scripts/canonical-en-overrides.json`
- Header colors: `apps/offline-product/constants/compactTabHeader.ts`

---

## Google Play (later)

Play Console accepts flexible phone screenshots (min 320px short side, 16:9 or 9:16). Reuse the **iPhone 1284×2778** set first; add 7" tablet if you support Android tablets.
