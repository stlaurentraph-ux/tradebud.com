# v0-tracebud-homepage-design

This is a [Next.js](https://nextjs.org) project bootstrapped with [v0](https://v0.app).

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

The forms on `/farmers`, `/exporters`, `/importers`, and `/countries` post to `POST /api/leads`, which inserts into dedicated Supabase tables:

- `farmer_leads`
- `cooperative_leads`
- `exporter_leads`
- `importer_leads`
- `country_leads`

Set environment variables in Vercel (and locally in `.env.local`):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

Create the tables in Supabase SQL editor:

```sql
create extension if not exists pgcrypto;

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
