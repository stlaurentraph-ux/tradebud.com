# Offline Demo App

Public demo-track **web build** of the Expo offline farmer app (same UX as mobile; persistence on web uses `localStorage`, not SQLite).

- Audience: visitors and sales demos
- Domain target: `https://offline-demo.tracebud.com`
- Vercel root directory: `apps/demos/offline`
- Vercel: use **Other** (static) or leave framework unset — **not** Next.js. `vercel.json` sets `buildCommand` to `npm run build` (`expo export --platform web`) and `outputDirectory` to `dist`. Leave **Output Directory** empty in the UI if `vercel.json` supplies it (or set `dist` to match).

Native iOS/Android still use `expo start` / EAS; this deploy path is **web export only**.

The previous v0 preview URL is superseded by `offline-demo.tracebud.com` once this project is connected in Vercel.
