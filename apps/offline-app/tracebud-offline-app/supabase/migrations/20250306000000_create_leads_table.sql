-- Create leads table for pilot request form submissions
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  first_name text not null,
  last_name text not null,
  email text not null,
  company text not null,
  looking_for text not null check (looking_for in ('eudr-compliance', 'free-mapping', 'partnership')),
  volume text,
  message text
);

-- Enable Row Level Security (RLS)
alter table public.leads enable row level security;

-- Allow anonymous inserts (for the public lead form)
create policy "Allow anonymous inserts"
  on public.leads
  for insert
  to anon
  with check (true);

-- Only authenticated users (or service role) can read leads
create policy "Allow authenticated read"
  on public.leads
  for select
  to authenticated
  using (true);
