-- Albums de photos : un album regroupe des photos de la bibliothèque commune.
-- Une photo peut figurer dans plusieurs albums ; supprimer un album ne supprime jamais les photos,
-- et supprimer une photo la retire de tous les albums.

create table public.albums (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by text not null,
  created_at timestamptz not null default now()
);

create table public.album_photos (
  album_id uuid not null references public.albums(id) on delete cascade,
  photo_id uuid not null references public.photos(id) on delete cascade,
  added_by text,
  added_at timestamptz not null default now(),
  primary key (album_id, photo_id)
);

create index album_photos_photo_id_idx on public.album_photos (photo_id);

-- Même modèle d'accès que les autres tables de l'application.
alter table public.albums enable row level security;
alter table public.album_photos enable row level security;

create policy "anon full access" on public.albums for all to anon using (true) with check (true);
create policy "anon full access" on public.album_photos for all to anon using (true) with check (true);

grant select, insert, update, delete on public.albums, public.album_photos to anon, authenticated;

-- Pour que l'autre personne voie les albums bouger en direct.
alter publication supabase_realtime add table public.albums, public.album_photos;
