# Layout components

## `CompactTabHeader` + `compactTabHeaderStyles`

Green gradient headers on **Home**, **Settings**, and **My Plots (compact list)** share one implementation so connection badge, row height, and language pill stay aligned.

- Component: `CompactTabHeader.tsx`
- Tokens: `constants/compactTabHeader.ts` (`HOME_HEADER_LOGO_PX`). Home uses one row so badge + brand tops align.

To change header spacing or the language control, edit **`constants/compactTabHeader.ts`** only — do not copy styles into tab screens.

Home-specific branding: **`HomeHeaderBrandLeft`** (logo + title + subtitle, left side).
