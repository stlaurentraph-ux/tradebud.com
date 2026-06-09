# v0-tracebud-homepage-design

This is a [Next.js](https://nextjs.org) project bootstrapped with [v0](https://v0.app).

## Site architecture (planning)

Navigation, Insights (blog), platform/compliance hubs, and phased rollout: [SITE_ARCHITECTURE.md](./SITE_ARCHITECTURE.md).

**v0 handoff:** [V0_HANDOFF.md](./V0_HANDOFF.md) — full site map, page status, and styling boundaries.

### Stealth preview (Stage A)

Draft routes return **404 in production** until publication flags flip in Stage B. Locally (`npm run dev`), all draft routes are visible.

Optional deployed preview: set `MARKETING_PREVIEW_SECRET` in env, then visit any URL with `?marketing_preview=<secret>` to set a 7-day cookie.

Site map for v0: **http://localhost:3000/en/draft** (live + draft pages indexed by section).

| Section | Live (styled) | Draft (needs v0) |
| --- | --- | --- |
| Solutions | farmers, exporters, importers, countries | cooperatives, sponsors, why-tracebud |
| Convert | pricing, get-started, pilot, demo | — |
| Platform / Compliance / Insights | — | all routes |
| Home | `/` | `/preview` |

Content lives in `content/insights/*.md` and `lib/marketing-draft-content.ts`. **Style in v0** — pages use minimal layout shells (`DraftContentPage`, `DraftHubPage`).

## Built with v0

This repository is linked to a [v0](https://v0.app) project. You can continue developing by visiting the link below -- start new chats to make changes, and v0 will push commits directly to this repo. Every merge to `main` will automatically deploy.

[Continue working on v0 →](https://v0.app/chat/projects/prj_Z9UzHmT5WR883MyZOhF0x9fBpKH4)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Supabase Lead Forms Setup

The forms on `/pilot`, `/farmers`, `/exporters`, `/importers`, and `/countries` post to `POST /api/leads`, which inserts into dedicated Supabase tables:

- `pilot_leads` (MVP pilot program; see `supabase/pilot_leads.sql`)
- `farmer_leads`
- `cooperative_leads`
- `exporter_leads`
- `importer_leads`
- `country_leads`

Set environment variables in Vercel (and locally in `.env.local`):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
RESEND_API_KEY=re_xxxxxxxx
# Optional: override team notification inbox (defaults to hello@tracebud.com)
MARKETING_TEAM_NOTIFY_EMAIL=hello@tracebud.com
# Optional: Google Analytics 4 (only loads after cookie consent)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

## Form submissions

| Form | API | Stored in | Team notified |
| --- | --- | --- | --- |
| Waitlist dialog | `POST /api/waitlist` | `waitlist_signups` + `prospects` | Email via Resend |
| Pilot application | `POST /api/leads` | `pilot_leads` | Email via Resend |

Visitor confirmation emails are sent when `RESEND_API_KEY` is set. The thank-you page only shows “Confirmation sent” when the email actually went out.

Waitlist confirmation uses the branded HTML template in `email-templates/html/waitlist-confirmation.html` (same layout as dashboard onboarding welcome email).

Create `waitlist_signups` in Supabase (see `supabase/waitlist_signups.sql`) before accepting waitlist submissions.

## Supabase Lead Forms Setup

The pilot form on `/pilot` posts to `POST /api/leads`, which inserts into dedicated Supabase tables:

- `pilot_leads` (MVP pilot program; see `supabase/pilot_leads.sql`)
- `farmer_leads`
- `cooperative_leads`
- `exporter_leads`
- `importer_leads`
- `country_leads`

## Web analytics in the root layout (always on, per [Vercel setup](https://vercel.com/docs/speed-insights/quickstart)) and **Web Analytics** + optional GA4 behind the cookie consent banner (`Accept` only). Custom conversion events use `@vercel/analytics` `track()`:

| Event | When |
| --- | --- |
| `marketing_waitlist_opened` | Waitlist dialog opened |
| `marketing_waitlist_submitted` | Waitlist form submitted successfully |
| `marketing_thank_you_viewed` | Thank-you page viewed |
| `marketing_lead_submitted` | Pilot lead form submitted |

**Enable in production**

1. Deploy the marketing app on Vercel.
2. In the Vercel project → **Analytics** → enable **Web Analytics** and **Speed Insights**.
3. Page views and custom events appear in the Vercel dashboard after visitors accept cookies.

Optional GA4: set `NEXT_PUBLIC_GA_MEASUREMENT_ID` in Vercel env vars; the script loads only after consent.

Create the tables in Supabase SQL editor. The pilot table DDL also lives in `supabase/pilot_leads.sql`:

```sql
create extension if not exists pgcrypto;

create table if not exists public.pilot_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  pilot_role text not null,
  organization_name text not null,
  contact_name text not null,
  title text,
  email text not null,
  phone text,
  country text,
  primary_commodity text,
  organization_scale text,
  eudr_readiness text,
  earliest_start text,
  success_criteria text,
  additional_notes text,
  source_page text not null,
  raw_payload jsonb not null default '{}'::jsonb
);

create table if not exists public.farmer_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  full_name text not null,
  email text not null,
  phone text,
  country text,
  primary_commodity text,
  farm_size text,
  primary_goal text,
  biggest_challenge text,
  source_page text not null,
  raw_payload jsonb not null default '{}'::jsonb
);

create table if not exists public.cooperative_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  contact_name text not null,
  cooperative_name text not null,
  email text not null,
  phone text,
  country text,
  primary_commodity text,
  cooperative_size text,
  primary_goal text,
  biggest_challenge text,
  source_page text not null,
  raw_payload jsonb not null default '{}'::jsonb
);

create table if not exists public.exporter_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  company_name text not null,
  contact_name text not null,
  email text not null,
  phone text,
  country_of_operation text not null,
  primary_commodities text not null,
  annual_export_volume text not null,
  sourcing_farmers_range text,
  current_eudr_challenges text,
  source_page text not null,
  raw_payload jsonb not null default '{}'::jsonb
);

create table if not exists public.importer_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  company_name text not null,
  contact_name text not null,
  email text not null,
  phone text,
  company_size text,
  hq_location text,
  primary_commodities text[] not null default '{}',
  annual_import_volume text,
  origin_countries text,
  current_suppliers text,
  eudr_readiness text,
  csrd_required boolean not null default false,
  specific_requirements text,
  source_page text not null,
  raw_payload jsonb not null default '{}'::jsonb
);

create table if not exists public.country_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  organization_name text not null,
  organization_type text,
  contact_name text not null,
  title text,
  email text not null,
  phone text,
  country text,
  commodities text[] not null default '{}',
  registered_producers text,
  existing_systems text,
  current_challenges text,
  integration_needs text,
  data_standards text[] not null default '{}',
  pilot_interest boolean not null default false,
  additional_info text,
  source_page text not null,
  raw_payload jsonb not null default '{}'::jsonb
);
```

## Learn More

To learn more, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [v0 Documentation](https://v0.app/docs) - learn about v0 and how to use it.

<a href="https://v0.app/chat/api/kiro/clone/stlaurentraph-ux/v0-tracebud-homepage-design" alt="Open in Kiro"><img src="https://pdgvvgmkdvyeydso.public.blob.vercel-storage.com/open%20in%20kiro.svg?sanitize=true" /></a>
<!-- deploy trigger -->
