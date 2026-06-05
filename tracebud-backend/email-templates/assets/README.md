# Email template assets

## `tracebud-logo-email.png` (source of truth)

Lives in `apps/marketing/public/images/tracebud-logo-email.png` (200px wide, ~16 KB).

The Supabase confirm template embeds this logo as a **data URI** so the Supabase Dashboard preview renders it (external URLs are often blocked or time out on the 879 KB marketing logo).

Regenerate the inline logo after changing the PNG:

```bash
node tracebud-backend/email-templates/scripts/embed-supabase-logo.mjs
```

Then re-paste `html/supabase-confirm-email.html` into Supabase → Authentication → Email Templates → Confirm signup.

## Hero image

Supabase template uses jsDelivr from `main` until `www.tracebud.com` production deploy is current. After Vercel deploy, you may switch the hero `src` back to `https://www.tracebud.com/images/farmer-hero.jpg`.
