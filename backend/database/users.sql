create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text,
  google_id text unique,
  access_token text,
  refresh_token text,
  token_payload jsonb,
  created_at timestamptz not null default now()
);

alter table if exists public.users
  add column if not exists access_token text;

alter table if exists public.users
  add column if not exists token_payload jsonb;

create index if not exists users_email_idx on public.users (email);
create index if not exists users_google_id_idx on public.users (google_id);

alter table public.users enable row level security;

drop policy if exists "Users see own profile" on public.users;
create policy "Users see own profile"
  on public.users
  for select
  using (auth.jwt() ->> 'email' = email);

drop policy if exists "Users update own profile" on public.users;
create policy "Users update own profile"
  on public.users
  for update
  using (auth.jwt() ->> 'email' = email)
  with check (auth.jwt() ->> 'email' = email);
