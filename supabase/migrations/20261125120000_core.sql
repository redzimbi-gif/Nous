-- Nous v2 · noyau multi-espaces
--
-- Un compte peut appartenir à plusieurs espaces (couple, amis, famille). Chaque
-- appartenance porte un profil propre à l'espace. Toutes les tables sont
-- protégées par RLS et rien n'est ouvert au rôle « anon ». Les écritures
-- sensibles (créer / rejoindre un espace, abonnement) passent par des fonctions
-- SECURITY DEFINER ou par le rôle service.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

-- ---------------------------------------------------------------- types
create type public.space_type as enum ('couple', 'amis', 'famille');
create type public.plan_tier as enum ('free', 'plus', 'max');
create type public.member_role as enum ('admin', 'member');
create type public.member_kind as enum ('account', 'supervised');

-- ----------------------------------------------- générateur de codes d'invitation
-- 8 caractères tirés d'un alphabet de 32 symboles sans ambiguïté (ni 0/O, ni 1/I) :
-- 40 bits d'entropie, sans biais de modulo (256 est un multiple de 32).
create function private.new_invite_code() returns text
language plpgsql volatile set search_path = '' as $$
declare
  alphabet constant text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  bytes bytea := extensions.gen_random_bytes(8);
  code text := '';
  i int;
begin
  for i in 0..7 loop
    code := code || substr(alphabet, (get_byte(bytes, i) % 32) + 1, 1);
  end loop;
  return 'NOUS-' || substr(code, 1, 4) || '-' || substr(code, 5, 4);
end $$;

grant execute on function private.new_invite_code() to service_role;

-- ------------------------------------------------------------------ accounts
create table public.accounts (
  id uuid primary key references auth.users (id) on delete cascade,
  locale text not null default 'fr',
  created_at timestamptz not null default now()
);

create function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.accounts (id) values (new.id) on conflict do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- ------------------------------------------------------------------- spaces
create table public.spaces (
  id uuid primary key default gen_random_uuid(),
  type public.space_type not null,
  name text not null check (char_length(btrim(name)) between 1 and 60),
  invite_code text not null unique default private.new_invite_code(),
  palette text not null default 'default',
  together_since date,
  created_by uuid references public.accounts (id) on delete set null,
  created_at timestamptz not null default now(),
  archived_at timestamptz,
  deletion_requested_at timestamptz
);

-- ------------------------------------------------------------ space_members
-- Un profil par espace (prénom affiché, couleur, humeur). Les enfants de moins de
-- 15 ans sont des profils « supervised » : pas de compte, gérés par un parent.
create table public.space_members (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  user_id uuid references public.accounts (id) on delete set null,
  kind public.member_kind not null default 'account',
  role public.member_role not null default 'member',
  display_name text not null check (char_length(btrim(display_name)) between 1 and 40),
  color text not null default 'lilac' check (color ~ '^[a-z]{3,12}$'),
  mood text check (mood is null or char_length(mood) <= 16),
  mood_set_at timestamptz,
  simplified boolean not null default false,
  birth_date date,
  managed_by uuid references public.space_members (id) on delete set null,
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  unique (space_id, id),
  check (kind = 'account' or user_id is null),
  check (kind = 'supervised' or user_id is not null or left_at is not null)
);

create unique index space_members_one_active_account
  on public.space_members (space_id, user_id)
  where user_id is not null and left_at is null;
create index space_members_user_idx on public.space_members (user_id) where left_at is null;

-- ------------------------------------------------------------- space_modules
-- Ne stocke que les écarts avec le préréglage du type d'espace. Le noyau commun
-- (accueil, chat, agenda, photos, tâches) ne peut jamais être désactivé.
create table public.space_modules (
  space_id uuid not null references public.spaces (id) on delete cascade,
  module_key text not null check (module_key ~ '^[a-z_]{2,30}$'),
  enabled boolean not null,
  updated_at timestamptz not null default now(),
  primary key (space_id, module_key),
  check (enabled or module_key not in ('accueil', 'chat', 'agenda', 'photos', 'taches'))
);

-- --------------------------------------------------------- space_subscriptions
-- L'abonnement appartient à l'espace ; un « titulaire » paie pour tous.
-- Seul le rôle service (webhook Stripe) écrit dans cette table.
create table public.space_subscriptions (
  space_id uuid primary key references public.spaces (id) on delete cascade,
  tier public.plan_tier not null default 'free',
  holder_id uuid references public.accounts (id) on delete set null,
  status text not null default 'active' check (status in ('active', 'past_due', 'canceled')),
  current_period_end timestamptz,
  stripe_customer_id text,
  stripe_subscription_id text,
  updated_at timestamptz not null default now()
);

-- -------------------------------------------------------------------- tasks
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 200),
  category text check (category is null or char_length(category) <= 30),
  assignee_id uuid,
  due_on date,
  created_by uuid,
  created_at timestamptz not null default now(),
  done_at timestamptz,
  done_by uuid,
  -- Les membres référencés doivent appartenir au même espace.
  foreign key (space_id, assignee_id) references public.space_members (space_id, id) on delete set null (assignee_id),
  foreign key (space_id, created_by) references public.space_members (space_id, id) on delete set null (created_by),
  foreign key (space_id, done_by) references public.space_members (space_id, id) on delete set null (done_by)
);
create index tasks_space_idx on public.tasks (space_id, done_at, created_at desc);

-- ------------------------------------------------ tentatives de rejoindre (anti-force brute)
create table private.join_attempts (
  user_id uuid not null,
  at timestamptz not null default now()
);
create index join_attempts_idx on private.join_attempts (user_id, at desc);

-- ------------------------------------------------------- fonctions d'appartenance
create function private.is_member(_space uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.space_members m
    where m.space_id = _space and m.user_id = (select auth.uid()) and m.left_at is null
  );
$$;

create function private.is_admin(_space uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.space_members m
    where m.space_id = _space and m.user_id = (select auth.uid()) and m.left_at is null and m.role = 'admin'
  );
$$;

-- Membre d'un espace non archivé : peut écrire.
create function private.can_write(_space uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.space_members m
    join public.spaces s on s.id = m.space_id
    where m.space_id = _space and m.user_id = (select auth.uid()) and m.left_at is null and s.archived_at is null
  );
$$;

create function private.can_admin(_space uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.space_members m
    join public.spaces s on s.id = m.space_id
    where m.space_id = _space and m.user_id = (select auth.uid()) and m.left_at is null
      and m.role = 'admin' and s.archived_at is null
  );
$$;

create function private.my_member(_space uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select m.id from public.space_members m
  where m.space_id = _space and m.user_id = (select auth.uid()) and m.left_at is null
  limit 1;
$$;

grant execute on function private.is_member(uuid), private.is_admin(uuid), private.can_write(uuid),
  private.can_admin(uuid), private.my_member(uuid) to authenticated;

-- ---------------------------------------------------------------- RLS : activation
alter table public.accounts enable row level security;
alter table public.spaces enable row level security;
alter table public.space_members enable row level security;
alter table public.space_modules enable row level security;
alter table public.space_subscriptions enable row level security;
alter table public.tasks enable row level security;
alter table private.join_attempts enable row level security;

-- Aucun privilège par défaut : on accorde ensuite au plus juste.
revoke all on public.accounts, public.spaces, public.space_members, public.space_modules,
  public.space_subscriptions, public.tasks from anon, authenticated;

-- accounts
create policy accounts_select_own on public.accounts for select to authenticated
  using (id = (select auth.uid()));
create policy accounts_update_own on public.accounts for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
grant select on public.accounts to authenticated;
grant update (locale) on public.accounts to authenticated;

-- spaces : lecture pour les membres, modification de quelques champs par les admins.
create policy spaces_select_member on public.spaces for select to authenticated
  using (private.is_member(id));
create policy spaces_update_admin on public.spaces for update to authenticated
  using (private.can_admin(id)) with check (private.can_admin(id));
grant select (id, type, name, invite_code, palette, together_since, created_at, archived_at)
  on public.spaces to authenticated;
grant update (name, palette, together_since) on public.spaces to authenticated;

-- space_members : chacun modifie son propre profil ; un parent gère les profils enfants.
create policy members_select on public.space_members for select to authenticated
  using (private.is_member(space_id));
create policy members_update_self on public.space_members for update to authenticated
  using (user_id = (select auth.uid()) and left_at is null and private.can_write(space_id))
  with check (user_id = (select auth.uid()));
create policy members_update_managed on public.space_members for update to authenticated
  using (kind = 'supervised' and left_at is null and private.can_admin(space_id))
  with check (kind = 'supervised' and private.can_admin(space_id));
grant select on public.space_members to authenticated;
grant update (display_name, color, mood, mood_set_at, simplified) on public.space_members to authenticated;

-- space_modules : lecture pour les membres, écriture pour les admins.
create policy modules_select on public.space_modules for select to authenticated
  using (private.is_member(space_id));
create policy modules_write on public.space_modules for all to authenticated
  using (private.can_admin(space_id)) with check (private.can_admin(space_id));
grant select, insert, update, delete on public.space_modules to authenticated;

-- space_subscriptions : lecture seule, sans les identifiants Stripe.
create policy subscriptions_select on public.space_subscriptions for select to authenticated
  using (private.is_member(space_id));
grant select (space_id, tier, holder_id, status, current_period_end, updated_at)
  on public.space_subscriptions to authenticated;

-- tasks
create policy tasks_select on public.tasks for select to authenticated
  using (private.is_member(space_id));
create policy tasks_insert on public.tasks for insert to authenticated
  with check (private.can_write(space_id) and created_by = private.my_member(space_id));
create policy tasks_update on public.tasks for update to authenticated
  using (private.can_write(space_id))
  with check (private.can_write(space_id) and (done_by is null or done_by = private.my_member(space_id)));
create policy tasks_delete on public.tasks for delete to authenticated
  using (private.can_write(space_id) and (created_by = private.my_member(space_id) or private.can_admin(space_id)));
grant select, insert, delete on public.tasks to authenticated;
grant update (title, category, assignee_id, due_on, done_at, done_by) on public.tasks to authenticated;

-- ---------------------------------------------------------------- fonctions métier
-- Créer un espace : l'auteur en devient administrateur, l'abonnement démarre en gratuit.
create function public.create_space(
  p_name text, p_type public.space_type, p_display_name text, p_color text default 'lilac'
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := (select auth.uid());
  sid uuid;
  active_spaces int;
begin
  if uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;

  select count(*) into active_spaces from public.space_members m
  where m.user_id = uid and m.left_at is null;
  if active_spaces >= 12 then raise exception 'too_many_spaces'; end if;

  insert into public.spaces (type, name, created_by) values (p_type, btrim(p_name), uid) returning id into sid;
  insert into public.space_members (space_id, user_id, role, display_name, color)
    values (sid, uid, 'admin', btrim(p_display_name), coalesce(p_color, 'lilac'));
  insert into public.space_subscriptions (space_id) values (sid);
  return sid;
end $$;

-- Rejoindre un espace avec son code. Renvoie un statut plutôt qu'une erreur pour que
-- les tentatives ratées restent enregistrées (une exception annulerait la transaction).
create function public.join_space(p_code text, p_display_name text, p_color text default 'lilac')
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := (select auth.uid());
  code text := upper(btrim(coalesce(p_code, '')));
  s public.spaces;
  attempts int;
  active_count int;
  cap int;
begin
  if uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;

  delete from private.join_attempts where at < now() - interval '1 day';
  select count(*) into attempts from private.join_attempts a
  where a.user_id = uid and a.at > now() - interval '15 minutes';
  if attempts >= 8 then return jsonb_build_object('status', 'too_many_attempts'); end if;

  select * into s from public.spaces sp where sp.invite_code = code and sp.archived_at is null;
  if not found then
    insert into private.join_attempts (user_id) values (uid);
    return jsonb_build_object('status', 'invalid_code');
  end if;

  perform pg_advisory_xact_lock(hashtextextended(s.id::text, 0));

  if exists (select 1 from public.space_members m where m.space_id = s.id and m.user_id = uid and m.left_at is null) then
    return jsonb_build_object('status', 'already_member', 'space_id', s.id);
  end if;

  select count(*) into active_count from public.space_members m
  where m.space_id = s.id and m.left_at is null and m.kind = 'account';
  cap := case s.type when 'couple' then 2 when 'famille' then 20 else 30 end;
  if active_count >= cap then return jsonb_build_object('status', 'space_full'); end if;

  insert into public.space_members (space_id, user_id, role, display_name, color)
    values (s.id, uid, 'member', btrim(p_display_name), coalesce(p_color, 'lilac'));
  return jsonb_build_object('status', 'joined', 'space_id', s.id);
end $$;

-- Générer un nouveau code (l'ancien cesse immédiatement de fonctionner).
create function public.regenerate_invite_code(p_space uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare new_code text;
begin
  if not private.can_admin(p_space) then raise exception 'forbidden' using errcode = '42501'; end if;
  update public.spaces set invite_code = private.new_invite_code() where id = p_space returning invite_code into new_code;
  return new_code;
end $$;

revoke execute on function public.create_space(text, public.space_type, text, text) from public, anon;
revoke execute on function public.join_space(text, text, text) from public, anon;
revoke execute on function public.regenerate_invite_code(uuid) from public, anon;
grant execute on function public.create_space(text, public.space_type, text, text) to authenticated;
grant execute on function public.join_space(text, text, text) to authenticated;
grant execute on function public.regenerate_invite_code(uuid) to authenticated;
