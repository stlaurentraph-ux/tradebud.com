# v0 prompts — Walk my plot & full app redesign

Copy a prompt block below into [v0.dev](https://v0.dev).  
Connect this repo branch: **`cursor/v0-design-review-a74f`**.

For full context, read `V0_DESIGN_REVIEW.md` first.

---

## Prompt 1 — Walk my plot (map capture) **START HERE**

```
Design a mobile farmer app screen: "Walk my plot" — GPS boundary capture.

PRODUCT: Tracebud — offline-first app for smallholder coffee/cocoa farmers in rural areas.
USERS: Low literacy tolerance, outdoor sunlight, often no mobile data. Must be extremely simple and visual.

OUTPUT: React + Tailwind mobile UI (390×844 phone frame). Portrait only. Export as component(s).

BRAND:
- Header gradient: #0A7F59 → #0B6F50
- Primary button: #10B981, text white, min height 56px, full width
- Background: #F9FAFB
- Cards: white, border #E5E7EB, radius 16px
- Text: #1F2937 primary, #6B7280 muted
- Font: Inter or Geist, body 18px minimum

HEADER: ‹ Back | centered "Walk my plot" | language pill "EN" (no online/offline badge)

LAYOUT — MAP FIRST (60%+ of screen):
- Large satellite-style map with green polygon being drawn along a field edge
- Farmer location dot pulsing green
- Coordinate chip bottom-left of map (optional, small)

BELOW MAP — MINIMAL STATS (3 chips only):
1. Time: "02:34" with clock icon — label "Time"
2. Area: "0.4 ha" with leaf icon — label "Area"  
3. GPS: colored dot + "Strong" — label "GPS"
NO technical terms: no HDOP, no satellites count, no L1/L5, no "waypoints"

GPS STRIP: Simple horizontal bar — green/yellow/red dot + "GPS signal: Strong"

TWO STATES (show both as variants or tabs):

STATE A — IDLE (before recording):
- One-line tip with walk icon: "Walk around the full edge of your field"
- Pictogram strip (4 small icons): 1.Wait for GPS  2.Tap Start  3.Walk edge  4.Return to start
- Primary CTA: "▶ Start walking" (large green button)

STATE B — RECORDING:
- Map shows live green trail + closing polygon
- Subtle pulsing ring on record button area
- Rotating tips (one line): "Keep phone toward the sky" / "Walk the full boundary" / "Return to where you started"
- Primary CTA: "■ Stop and save" (green, slightly darker)
- Small secondary text button: "Cancel"

RULES:
- No compliance jargon (EUDR, GeoID, declarations) on this screen
- No permanent "Offline" banner
- Touch targets minimum 48px
- High contrast for outdoor use
- Farmer-friendly icons only (walk, map pin, leaf, sun)

SAMPLE DATA: Plot name "Finca Norte", area 0.42 ha, farmer Maria Santos (name not required on this screen)

Provide two screen variants: idle and recording.
```

---

## Prompt 2 — Walk my plot (landing — simplified)

```
Design a mobile farmer app screen: "Register plot" landing — before GPS walk.

Same Tracebud brand tokens as walk capture screen (green header #0A7F59, #F9FAFB bg, 48px+ buttons).

GOAL: Minimum fields before the map. Visual, not legal.

HEADER: ‹ Back | "Register plot" | EN

CONTENT:
1. Hero illustration (flat, friendly): farmer walking phone along field boundary — not photorealistic
2. Headline: "Walk around your field"
3. Subhead: "We use GPS to draw your plot on the map. Works without internet."

4. Single input card:
   - Label: "Plot name"
   - Placeholder: "e.g. Finca Norte"
   - Pre-filled: "Plot 1"

5. Size picker — two large tap cards side by side (not dropdown):
   LEFT (selected): "< 4 hectares" + subtitle "Small field"
   RIGHT: "4 hectares or more" + subtitle "Large field"
   Selected card: green border #10B981, light green fill

6. Primary CTA: "Start mapping →" (full width green)

7. Footer link only (small, muted): "Other ways to map" with chevron — for draw-on-map / pin drop (don't show those UIs here)

DO NOT SHOW on this screen:
- EUDR, compliance, market access paragraphs
- Contiguity rules, GeoIDs, roads/rivers text
- Capture method picker (walk is assumed default)

Optional: small (?) help icon that would open contiguity info — not visible content by default.

Portrait 390×844. Large text. One primary action.
```

---

## Prompt 3 — Plot saved (short success path)

```
Design a mobile farmer success screen after GPS plot capture.

Tracebud farmer app. Brand: green header gradient #0A7F59, white cards, #F9FAFB background.

HEADER: no back button | "Done" | EN

CENTER:
- Large green checkmark in circle (animated feel)
- Title: "Plot saved!"
- Subtitle: "Finca Norte — 0.42 ha is on this phone."
- Small map thumbnail showing captured polygon

INFO CARD (soft, not alarming):
- Icon: phone storage
- "Your plot is safe on this device."
- "When you have internet, tap Backup in Settings."

TWO BUTTONS:
1. Primary: "View my plots"
2. Secondary outline: "Walk another plot"

OPTIONAL LATER section (muted, below fold):
- "Finish later:" with 2 small chips: "Add photos" "Sign declarations"
- These are NOT required to proceed

No EUDR text. Celebratory but calm. Farmer Maria Santos context.
Portrait mobile 390×844.
```

---

## Prompt 4 — Full app review (all main screens)

```
Design a complete mobile farmer app UI system for "Tracebud" — offline-first plot mapping for coffee/cocoa smallholders.

Deliver a navigable prototype with 6 screens + bottom tab bar. Portrait 390×844. React + Tailwind.

DESIGN SYSTEM:
- Header: gradient #0A7F59 → #0B6F50, white text
- Tabs: Home | My Plots | Settings (icons + labels)
- Background #F9FAFB, cards white radius 16px
- Primary #10B981, text #1F2937, muted #6B7280
- Min touch 48px, body text 18px+, Inter/Geist
- NO "Offline" in header; NO HDOP/GPS jargon on farmer screens

SAMPLE USER: Maria Santos, plots Finca Norte (0.42 ha Coffee), El Roble (1.15 ha Cocoa)

SCREENS:

1. HOME
- Welcome card on green: "Welcome back, Maria Santos"
- Stats: 2 Plots | 1 Ready | 1 To finish (farmer words, not "Compliant/Pending")
- 2×2 tiles with tinted icon circles:
  • "Walk my plot" / "Map your field with GPS" (green)
  • "Log harvest" / "Record delivery" (amber)
  • "Documents" / "Land papers" (blue)
  • "My voucher" / "Show buyers" (purple)
- Sync card: "Backed up" with checkmark (subtle)

2. WALK MY PLOT (recording state)
- 65% map with green polygon, GPS Strong, time + area chips, "Stop and save" button
- (Use Prompt 1 rules)

3. MY PLOTS
- List: each row = map thumbnail + name + ha + crop + status dot (green=ready, amber=needs photos)
- Finca Norte: ready; El Roble: "Add photos" chip

4. PLOT DETAIL
- Name, area, crop at top
- Progress ring "3 of 5 complete"
- Checklist rows with icons: Boundary ✓, Photos ○, Backup ✓, Declarations ○
- Big buttons: Photos | Documents | Harvest

5. LOG HARVEST
- Select plot card with thumbnail
- Large kg input with numeric keypad style
- "Save harvest" green button

6. SETTINGS
- "Back up to Tracebud" card with cloud icon
- Storage bar: "24 MB on this phone"
- Language row: English

NAV: Bottom tabs work between Home, My Plots, Settings. Inner screens have ‹ Back.

Keep every screen visually scannable in 3 seconds. Prefer icons + numbers over paragraphs.
```

---

## Prompt 5 — App Store screenshot set (optional)

For static PNG exports at exact dimensions, use the full prompt in:

`apps/offline-product/store-assets/app-store/V0_APPLE_SCREENSHOT_BRIEF.md`

---

## After v0 generates designs

1. Compare against checklist in `V0_DESIGN_REVIEW.md` (acceptance criteria).
2. Port layout to React Native `StyleSheet` — keep `useWalkPerimeter.ts` logic.
3. Wire `walk_*` i18n keys from `features/i18n/messages/en.json`.
4. Capture production screenshots from simulator per `CAPTURE_FROM_APP.md`.
