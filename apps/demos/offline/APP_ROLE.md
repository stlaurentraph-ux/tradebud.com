# Offline Demo App

Public demo-track **web build** of the Expo offline farmer app (same UX as mobile; persistence on web uses `localStorage`, not SQLite).

- Audience: visitors and sales demos
- Domain target: `https://offline-demo.tracebud.com`
- Vercel root directory: `apps/demos/offline`
- Vercel: **not** Next.js. `vercel.json` sets `"framework": null` (same as dashboard preset **Other**) so Vercel does not look for `next` in `package.json`. It also sets `buildCommand` (`expo export --platform web`) and `outputDirectory` `dist`. If the UI still shows Next.js, clear the Framework preset or redeploy after pulling this `vercel.json`.

Native iOS/Android still use `expo start` / EAS; this deploy path is **web export only**.

The previous v0 preview URL is superseded by `offline-demo.tracebud.com` once this project is connected in Vercel.
