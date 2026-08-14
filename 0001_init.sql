-- Schéma initial de "Nous" : chat, photos, agenda partagés.
--
-- Modèle de sécurité : l'app protège son entrée avec un code secret
-- (middleware Next.js), pas avec l'authentification Supabase. Ce projet
-- Supabase est dédié à cette seule app (rien d'autre n'y vit), donc les
-- policies RLS ci-dessous ouvrent l'accès complet au rôle "anon" sur ces
-- trois tables + ce bucket uniquement — quiconque a passé le code secret
-- peut tout lire/écrire, ce qui est le comportement voulu pour un espace
-- partagé à deux.

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

create index messages_created_at_idx on public.messages (created_at);
create index events_event_date_idx on public.events (event_date);

alter table public.photos enable row level security;
alter table public.messages enable row level security;
alter table public.events enable row level security;

create policy "anon full access" on public.photos
  for all to anon using (true) with check (true);

create policy "anon full access" on public.messages
  for all to anon using (true) with check (true);

create policy "anon full access" on public.events
  for all to anon using (true) with check (true);

-- Realtime pour le chat en direct
alter publication supabase_realtime add table public.messages;

-- Bucket de stockage privé pour les photos (images uniquement, 15 Mo max)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'nous-photos',
  'nous-photos',
  false,
  15728640,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/gif']
)
on conflict (id) do nothing;

create policy "anon full access to nous-photos" on storage.objects
  for all to anon
  using (bucket_id = 'nous-photos')
  with check (bucket_id = 'nous-photos');
