create extension if not exists pgcrypto;

create table public.photos (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null,
  caption text,
  sender_name text not null,
  created_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_name text not null,
  content text,
  photo_id uuid references public.photos(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  event_date date not null,
  event_time time,
  all_day boolean not null default true,
  category text not null default 'autre',
  created_by text not null,
  created_at timestamptz not null default now()
);
