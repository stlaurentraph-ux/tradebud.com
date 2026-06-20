# Tracebud offline app — v0 design workspace

This folder is the **starting point for v0 by Vercel** design work on the farmer field app (`apps/offline-product`).

## Quick start with v0

1. Point v0 at branch **`cursor/v0-design-review-a74f`** (or `main` after merge).
2. Open **`V0_WALK_PLOT_PROMPT.md`** — copy the master prompt into [v0.dev](https://v0.dev).
3. For full-app context, read **`V0_DESIGN_REVIEW.md`** first.
4. For App Store screenshot mockups only, use **`../store-assets/app-store/V0_APPLE_SCREENSHOT_BRIEF.md`**.

## What v0 can and cannot do

| v0 can | v0 cannot |
|--------|-----------|
| Generate React/Tailwind UI mockups and variants | Read or export screens from the live Expo app |
| Iterate on layout, copy hierarchy, and visual simplicity | Wire GPS, SQLite, or offline sync |
| Produce web prototypes you adapt back to React Native | Replace `WalkPerimeterScreen.tsx` logic without manual porting |

**Production app:** Expo Router + React Native (`StyleSheet`, `constants/theme.ts`).  
**v0 output:** typically Next.js + Tailwind — treat as **visual spec**, then port tokens and layout to RN.

## Files in this folder

| File | Purpose |
|------|---------|
| `V0_DESIGN_REVIEW.md` | Full UX/design audit — walk plot + all main screens |
| `V0_WALK_PLOT_PROMPT.md` | Copy-paste v0 prompts (walk plot + whole app) |
| `v0-prototype/` | Frozen v0 web prototype — see [`v0-prototype/ARCHIVE.md`](v0-prototype/ARCHIVE.md) |

## Design tokens (match production)

```
Header gradient:  #0A7F59 → #0B6F50
Primary action:   #10B981
Page background:  #F9FAFB
Card:             #FFFFFF, border #E5E7EB, radius 16–24px
Text primary:     #1F2937
Text muted:       #6B7280
Touch target:     min 48px (field use)
```

## Implementation path after v0

1. v0 produces simplified step layouts (especially walk capture).
2. Port visual structure into `WalkPerimeterScreen.tsx` step components.
3. Wire existing i18n keys from `features/i18n/messages/en.json` (`walk_*` prefix).
4. Keep `useWalkPerimeter.ts` and geometry validation unchanged.
5. Capture final screens from iOS Simulator per `store-assets/app-store/CAPTURE_FROM_APP.md`.

## Sample farmer data (for mockups)

- Farmer: **Maria Santos**
- Plots: **Finca Norte** (0.42 ha, Coffee), **El Roble** (1.15 ha, Cocoa)
