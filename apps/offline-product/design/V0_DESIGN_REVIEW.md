# Tracebud offline app — v0 design review

**Branch:** `cursor/v0-design-review-a74f`  
**App:** `apps/offline-product` (Expo / React Native, offline-first)  
**Audience:** Smallholder coffee/cocoa farmers — low literacy tolerance, outdoor use, often no mobile data  
**Goal:** Make every screen **simple, visual, and action-first** — especially **walk my plot** (Register plot / Walk perimeter)

---

## Executive summary

The app works end-to-end but the **walk plot flow is too long and too technical** for field users. A 3,200-line monolith (`WalkPerimeterScreen.tsx`) stacks **7+ wizard steps** before the farmer feels done. Many labels are hardcoded English despite 673 i18n keys. GPS jargon (HDOP, L1/L5, waypoints) adds cognitive load.

**v0 should optimize for:**

1. **Map-first walk capture** — full screen map, one big Start button, 3 simple stats (time, area, GPS strength).
2. **Fewer steps before “saved”** — boundary saved locally immediately; declarations and photos become follow-ups in My Plots.
3. **Visual over textual** — icons, progress rings, color-coded GPS, illustrated instructions instead of paragraphs.
4. **Consistent chrome** — same green header + language pill as Home; no technical badges in the status bar.

---

## Design principles (non-negotiable)

| Principle | Why | v0 application |
|-----------|-----|----------------|
| **One primary action per screen** | Farmers are walking, one hand on phone | Single green CTA; secondary actions as text links |
| **Show, don’t tell** | Low literacy | Map + polygon preview > compliance paragraphs |
| **Big touch targets (≥48px)** | Gloves, sun glare | Full-width buttons, large method cards |
| **No jargon** | HDOP confuses users | “GPS: Strong / Fair / Weak” only |
| **Offline is normal** | No signal in fields | No permanent “Offline” banner in header |
| **Progress feels short** | Abandonment risk | Max 3 steps visible: Name → Walk → Done |

---

## Screen-by-screen review

### 1. Home (`app/(tabs)/index.tsx`) — **Good foundation, minor polish**

**What works**
- Green gradient welcome card with name + 3 stats (Plots / Compliant / Pending)
- 2×2 action tiles with tinted icon pills — clear visual hierarchy
- Onboarding card when no plots: “Walk around your field with GPS…”

**Issues**
- Tile subtitles use compliance jargon (`walk_perimeter_sub`, `compliance_qr_sub`)
- Stats row (Compliant / Pending) may confuse farmers who don’t know EUDR
- Sync/backup card competes with primary “Register plot” when user has zero plots

**v0 recommendations**
- Rename first tile to **“Walk my plot”** with subtitle **“Map your field with GPS”**
- For new users: hide stats row until first plot saved; show only onboarding + Register tile
- Use illustration on onboarding card (person walking field edge with phone)

**Priority:** Medium

---

### 2. Walk my plot — Landing (`WalkPerimeterScreen`, `!showDetailedForm`) — **Needs simplification**

**Current flow**
1. Info card: “Plot Registration” + EUDR/market access copy
2. Plot name input
3. Estimated size grid (`<4 ha` vs `>=4 ha`)
4. Contiguity rule info card (roads/rivers/GeoIDs)
5. Continue → capture method picker

**Issues**
- **Too much compliance copy before any action** — farmer hasn’t seen a map yet
- “Contiguity Rule” and “GeoIDs” are auditor language, not farmer language
- Size grid is necessary but visually heavy (two cards + info card)
- Hardcoded English: “Plot Registration”, “Plot Name”, “Estimated Plot Size”, “Contiguity Rule”

**v0 recommendations**

**Option A — Minimal landing (preferred)**
```
┌─────────────────────────────┐
│  ‹ Back    Register plot  EN│
├─────────────────────────────┤
│  [illustration: walk field] │
│  Walk around your field     │
│  to map the boundary        │
│                             │
│  Plot name: [___________]   │
│                             │
│  How big is your field?     │
│  ( ) Small — under 4 ha     │
│  ( ) Large — 4 ha or more   │
│                             │
│  [  Start mapping  →  ]     │
└─────────────────────────────┘
```
- Move contiguity rule to **help sheet** (?) — not on main path
- Skip separate “capture method” step: default to Walk; offer Draw/Centroid via “Other ways to map” link

**Option B — Skip landing entirely for returning users**
- If farmer has walked before → go straight to map with last plot name pattern

**Priority:** **Critical** (highest impact)

---

### 3. Walk my plot — Capture method (`selectedMethodPage === null`) — **Merge or hide**

**Current:** Three large cards — Walk (recommended), Draw on map, Centroid (<4 ha only)

**What works**
- Visual method cards with icon pills and “Recommended” badge
- i18n wired for method titles/bodies

**Issues**
- Extra step between name and map
- “Fallback” label on Draw feels negative
- Centroid option adds decision fatigue for small plots

**v0 recommendations**
- **Default to Walk** — land directly on map with “Start recording”
- Collapse Draw + Centroid into **“Can’t walk the edge?”** expandable section at bottom
- Use single illustration per method (walking person, finger on map, pin drop)

**Priority:** High

---

### 4. Walk my plot — Map capture (`isWalkLandingState` + recording) — **Core experience, needs visual focus**

**Current**
- GPS Signal card: HDOP, Satellites, Mode L1/L5
- Map panel (good)
- Stats row: Duration, Waypoints, Est. Ha
- Waypoint averaging progress card while recording
- Many secondary buttons below fold

**What works**
- Map-first landing (`isWalkLandingState`) — scroll disabled, map prominent
- Live polygon on map during walk
- GPS strength badge (Strong/Fair/Weak)
- “See instructions” link with step list

**Issues**
- **GPS card is too technical** — HDOP, L1/L5 meaningless to farmers
- **“Waypoints”** → should be **“Points recorded”** or hidden; show only time + area
- Instructions hidden behind Alert dialog — should be **on-screen pictogram strip**
- Recording state: too many cards stacked above map; map should stay **≥60% of viewport**
- Hardcoded: “GPS Signal”, “Duration”, “Waypoints”, “Est. Ha”, “Waypoint Averaging”

**v0 target layout**

```
┌─────────────────────────────┐
│  ‹ Back    Walk my plot   EN│
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │                         │ │
│ │      [  FULL MAP  ]     │ │
│ │    green polygon live   │ │
│ │                         │ │
│ └─────────────────────────┘ │
│  GPS ●●●○ Strong            │
│  ┌──────┐ ┌──────┐ ┌──────┐ │
│  │ 2:34 │ │0.4 ha│ │ walk │ │
│  │ time │ │ area │ │ tip  │ │
│  └──────┘ └──────┘ └──────┘ │
│                             │
│  [  ▶ Start walking  ]      │  ← idle
│  [  ■ Stop & save    ]      │  ← recording
└─────────────────────────────┘
```

**Recording UX**
- Pulsing green dot on map while recording
- Simple animated footprint path along polygon
- One-line tip rotating: “Keep phone toward the sky” / “Walk the full edge” / “Return to start”
- Hide averaging jargon; show subtle progress ring only if GPS is weak

**Priority:** **Critical**

---

### 5. Walk my plot — Post-capture funnel — **Too long; defer non-essential steps**

**Current order after capture**
1. Registration summary
2. Producer profile (name, postal, commodity)
3. Declarations (land tenure, no deforestation, FPIC, labor, production system)
4. **Save to device** (happens here)
5. Ground-truth photos (N/E/S/W)
6. Completion screen

**Issues**
- Farmer thinks they’re done at capture but faces **4 more screens**
- Declarations use legal language mid-flow
- Photos requirement not obvious until late

**v0 recommendations**

**Short path (recommended)**
```
Capture complete → “Plot saved on this phone!” → My Plots
                    ↓
        Optional cards in My Plots: “Add photos”, “Complete declarations”
```

**If declarations must stay in-flow**
- One screen max: 3 large toggle cards with icons (land, trees, community)
- Progress dots: ● ● ○ ○ (2 of 4)

**Priority:** **Critical**

---

### 6. My Plots (`app/(tabs)/explore.tsx`) — **Dense but functional**

**What works**
- Plot cards with mini map, area, crop, status pills
- Upload/sync actions

**Issues**
- Very long file (~2.2k lines) — list UI mixed with sync logic
- Status pills (“Ready”, compliance states) need farmer-friendly labels
- Too much text per card for quick scanning

**v0 recommendations**
- **Visual list:** thumbnail map (left 30%) + name + ha + one status color dot
- Swipe or single “Finish setup” chip for incomplete plots
- Empty state: same walk illustration as Home onboarding

**Priority:** Medium

---

### 7. Plot detail (`app/plot/[id].tsx`) — **Checklist-heavy**

**v0 recommendations**
- Progress ring: “3 of 5 done” at top
- Large photo grid preview
- One CTA per missing item (“Add north photo”)

**Priority:** Medium

---

### 8. Log harvest (`app/(tabs)/harvests.tsx`) — **Keep simple**

**v0 recommendations**
- Plot picker with photos
- Big numeric keypad for kg
- Success screen with simple checkmark animation

**Priority:** Low (already relatively simple)

---

### 9. Settings (`app/(tabs)/settings.tsx`) — **Trustworthy, not scary**

**What works**
- Backup card, storage bar, language

**v0 recommendations**
- “Your data is on this phone” illustration
- Backup CTA: “Save to cloud when online” (not “Sign in to back up plots” as primary fear)

**Priority:** Low

---

## Visual system alignment

| Token | Production | v0 prototype gap |
|-------|------------|------------------|
| Header | `#0A7F59 → #0B6F50` | Prototype uses `#emerald-700`, shows “Offline” in status bar — **remove** |
| Primary CTA | `#0A7F59` / `#10B981` | Align buttons to single green family |
| Icons | Ionicons | v0 uses Lucide — map icon names when porting |
| Typography | System sans, 16px base | Keep 18–20px for body in walk flow |
| Cards | White, 16px radius | Match; avoid heavy shadows outdoors |

Reference: `constants/theme.ts`, `constants/compactTabHeader.ts`

---

## i18n gap (implementation note for after v0)

`en.json` has **80+ `walk_*` keys** but `WalkPerimeterScreen.tsx` uses `t('walk_*')` in only ~13 places. Hardcoded strings block hi/ar/rw/lg/sw farmers.

**v0:** Use English in mockups but label strings with key names in comments for porting, e.g. `{t('walk_gps_signal')}`.

---

## Recommended v0 work order

1. **Walk map capture** (idle + recording) — highest user value
2. **Simplified landing** (name + size → map)
3. **Capture-complete success** (short path)
4. **Home** onboarding + “Walk my plot” tile
5. **My Plots** list cards
6. Declarations / photos as **secondary** screens

---

## Acceptance criteria (design slice)

- [ ] Farmer can understand next action without reading more than one sentence
- [ ] Walk screen map occupies ≥60% of viewport on phone mockup
- [ ] No HDOP, L1/L5, GeoID, or EUDR acronyms on primary path
- [ ] GPS shown as Strong/Fair/Weak with color only
- [ ] Max 3 wizard steps from Home tap to “plot saved” in proposed short path
- [ ] All screens use consistent header (back + title + EN pill)
- [ ] Touch targets ≥48px on primary CTAs
- [ ] Works for portrait iPhone 390×844 and scales to App Store 1284×2778

---

## Code references (production)

| Area | File |
|------|------|
| Walk flow | `features/mapping/WalkPerimeterScreen.tsx` |
| GPS logic | `features/mapping/useWalkPerimeter.ts` |
| Home | `app/(tabs)/index.tsx` |
| Theme | `constants/theme.ts` |
| i18n keys | `features/i18n/messages/en.json` |
| v0 prototype | `design/v0-prototype/app/page.tsx` |

---

## Related docs

- `V0_WALK_PLOT_PROMPT.md` — ready prompts for v0.dev
- `store-assets/app-store/V0_APPLE_SCREENSHOT_BRIEF.md` — App Store PNG spec
- `store-assets/app-store/CAPTURE_FROM_APP.md` — real simulator captures
- `product-os/02-features/FEAT-002-mobile-field-capture.md` — feature spec
