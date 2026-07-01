# Layout components

## `CompactTabHeader` + `compactTabHeaderStyles`

Green gradient headers on **Home**, **Settings**, and **My Plots (compact list)** share one implementation so connection badge, row height, and language pill stay aligned.

- Component: `CompactTabHeader.tsx`
- Tokens: `constants/compactTabHeader.ts` (`HOME_HEADER_LOGO_PX`). Home uses one row so badge + brand tops align.

To change header spacing or the language control, edit **`constants/compactTabHeader.ts`** only — do not copy styles into tab screens.

Home-specific branding: **`HomeHeaderBrandLeft`** (logo + title + subtitle, left side).

## `StackGradientHeader`

Stack screens (plot detail, documents, receipt, offline maps, document preview, **Why Tracebud**) use **`StackGradientHeader.tsx`** with frozen `HEADER_GRADIENT_COLORS` — never theme `link` tokens (those shift in dark mode).

## Native splash + `SplashGate`

Cold start uses **`expo-splash-screen`** with neutral `SPLASH_BACKGROUND_LIGHT` / `SPLASH_BACKGROUND_DARK` and `assets/images/splash-icon.png` (logo only). Regenerate via `python3 scripts/generate-app-icons.py`.

**`SplashGate.tsx`** hides the native splash only after `AppStateProvider` sets `isAppReady` (SQLite + auth hydrate + disk load).
