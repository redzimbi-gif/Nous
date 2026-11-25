-- Armoire à réfs : catégorie (restaurants, activités…), note libre, et aperçu du lien
-- (titre, description, image du site) mémorisé après la première lecture.
-- Colonnes facultatives : les réfs existantes ne changent pas (sans catégorie, elles s'affichent dans « Références »).
alter table public.refs
  add column if not exists category text,
  add column if not exists note text,
  add column if not exists preview jsonb;
