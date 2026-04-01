create extension if not exists pgcrypto;

create table if not exists public.contact_inquiries (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  company text,
  project_type text not null,
  message text not null,
  source text not null default 'website',
  status text not null default 'new',
  created_at timestamptz not null default now()
);

create index if not exists contact_inquiries_created_at_idx
  on public.contact_inquiries (created_at desc);

alter table public.contact_inquiries enable row level security;

drop policy if exists "Allow public website inserts" on public.contact_inquiries;
create policy "Allow public website inserts"
on public.contact_inquiries
for insert
to anon, authenticated
with check (true);
