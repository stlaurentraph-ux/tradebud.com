-- Run in Supabase SQL editor before accepting waitlist form submissions.

create extension if not exists pgcrypto;

create table if not exists public.waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  email text not null,
  first_name text not null,
  last_name text not null,
  organisation text not null,
  role text not null,
  commodity text not null,
  producer_range text not null,
  source_page text not null default '/',
  raw_payload jsonb not null default '{}'::jsonb
);

create unique index if not exists waitlist_signups_email_lower_idx
  on public.waitlist_signups (lower(email));

comment on table public.waitlist_signups is 'Marketing site waitlist dialog submissions.';
