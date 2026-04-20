-- Run in Supabase SQL editor (or migrate) before accepting pilot form submissions.
-- Align RLS with other marketing lead tables per your org policy.

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

comment on table public.pilot_leads is 'MVP pilot program applications (marketing /pilot); distinct from persona lead forms.';
