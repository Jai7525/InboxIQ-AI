create table if not exists public.emails (
  id text not null,
  account_email text not null references public.users(email) on delete cascade,
  thread_id text,
  sender text not null,
  recipient text,
  subject text not null,
  snippet text not null default '',
  body text not null default '',
  received_at timestamptz not null,
  category text not null default 'personal',
  priority integer not null default 5,
  threat_level text not null default 'safe',
  threat_score double precision not null default 0,
  suggested_actions jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  primary key (account_email, id)
);

create index if not exists emails_account_received_at_idx on public.emails (account_email, received_at desc);
create index if not exists emails_account_category_idx on public.emails (account_email, category);
create index if not exists emails_account_threat_idx on public.emails (account_email, threat_level);

create table if not exists public.email_metadata (
  account_email text not null,
  email_id text not null,
  category text not null,
  priority integer not null,
  sender text not null,
  summary text not null,
  created_at timestamptz null default now(),
  constraint email_metadata_pkey primary key (account_email, email_id)
);

alter table if exists public.email_metadata
  add column if not exists account_email text;

alter table if exists public.email_metadata
  alter column account_email set not null;

create unique index if not exists email_metadata_account_email_id_idx
  on public.email_metadata (account_email, email_id);

create index if not exists email_metadata_account_idx
  on public.email_metadata (account_email);
