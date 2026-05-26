create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text,
  google_id text unique,
  refresh_token text,
  created_at timestamptz not null default now()
);

create index if not exists users_email_idx on public.users (email);
create index if not exists users_google_id_idx on public.users (google_id);
