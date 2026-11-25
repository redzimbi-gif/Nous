-- Tests d'isolation : chaque cas simule une requête authentifiée (rôle « authenticated »
-- et claims JWT) et vérifie ce qu'un utilisateur peut, ou ne peut pas, voir ou écrire.
-- Un échec lève une exception et arrête le script (ON_ERROR_STOP).

create schema test;
grant usage on schema test to anon, authenticated;

-- Renvoie le message d'erreur d'une requête, ou NULL si elle réussit.
create function test.fails(q text) returns text language plpgsql as $$
begin execute q; return null; exception when others then return sqlerrm; end $$;

create function test.login(uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, false);
end $$;

create function test.v(k text) returns text language sql stable as $$ select current_setting('test.' || k) $$;
create function test.u(k text) returns uuid language sql stable as $$ select current_setting('test.' || k)::uuid $$;

grant execute on all functions in schema test to anon, authenticated;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'leo@example.test'),
  ('00000000-0000-0000-0000-0000000000a2', 'camille@example.test'),
  ('00000000-0000-0000-0000-0000000000a3', 'intrus@example.test');

do $$ begin assert (select count(*) from public.accounts) = 3, 'le trigger crée un compte par utilisateur'; end $$;

-- ===================================================== A crée un espace Couple
set role authenticated;
select test.login('00000000-0000-0000-0000-0000000000a1');
select public.create_space('Léo & Camille', 'couple', 'Léo', 'lilac') as sid \gset
select set_config('test.sid', :'sid', false) \g /dev/null
select invite_code as code from public.spaces where id = :'sid' \gset
select set_config('test.code', :'code', false) \g /dev/null
select id as a_member from public.space_members where space_id = :'sid' \gset
select set_config('test.a_member', :'a_member', false) \g /dev/null

do $$ begin
  assert (select count(*) from public.spaces) = 1, 'A voit son espace';
  assert (select tier from public.space_subscriptions) = 'free', 'abonnement gratuit par défaut';
  assert (select role from public.space_members) = 'admin', 'le créateur est admin';
end $$;

-- ===================================================== un intrus ne voit rien
reset role; set role authenticated;
select test.login('00000000-0000-0000-0000-0000000000a3');
do $$ begin
  assert (select count(*) from public.spaces) = 0, 'C ne voit aucun espace';
  assert (select count(*) from public.space_members) = 0, 'C ne voit aucun membre';
  assert (select count(*) from public.space_subscriptions) = 0, 'C ne voit aucun abonnement';
  assert (select count(*) from public.tasks) = 0, 'C ne voit aucune tâche';
  assert test.fails(format('insert into public.tasks (space_id, title) values (%L, %L)', test.u('sid'), 'intrus')) is not null, 'C ne peut pas écrire de tâche';
  assert test.fails('insert into public.spaces (type, name) values (''couple'', ''pirate'')') is not null, 'insertion directe dans spaces interdite';
  assert test.fails(format('insert into public.space_members (space_id, user_id, display_name) values (%L, auth.uid(), %L)', test.u('sid'), 'intrus')) is not null, 'insertion directe dans space_members interdite';
end $$;

-- ===================================================== force brute sur les codes
select (public.join_space('NOUS-ZZZZ-ZZZZ', 'Intrus', 'sky') ->> 'status') as s1 \gset
select set_config('test.s1', :'s1', false) \g /dev/null
do $$ begin assert test.v('s1') = 'invalid_code', 'mauvais code refusé'; end $$;
select (public.join_space('NOUS-ZZZZ-ZZZY', 'Intrus', 'sky') ->> 'status') from generate_series(1, 7) \g /dev/null
select (public.join_space(:'code', 'Intrus', 'sky') ->> 'status') as s2 \gset
select set_config('test.s2', :'s2', false) \g /dev/null
do $$ begin assert test.v('s2') = 'too_many_attempts', 'après 8 échecs, même le bon code est refusé'; end $$;

-- ===================================================== B rejoint avec le code
reset role; set role authenticated;
select test.login('00000000-0000-0000-0000-0000000000a2');
select (public.join_space(lower(:'code'), 'Camille', 'rose') ->> 'status') as s3 \gset
select set_config('test.s3', :'s3', false) \g /dev/null
do $$ begin assert test.v('s3') = 'joined', 'B rejoint avec le code (insensible à la casse)'; end $$;
select (public.join_space(:'code', 'Camille', 'rose') ->> 'status') as s4 \gset
select set_config('test.s4', :'s4', false) \g /dev/null
do $$ begin assert test.v('s4') = 'already_member', 'rejoindre deux fois est idempotent'; end $$;
select id as b_member from public.space_members where space_id = :'sid' and user_id = auth.uid() \gset
select set_config('test.b_member', :'b_member', false) \g /dev/null

do $$ begin
  assert (select count(*) from public.space_members) = 2, 'B voit les deux membres';
  assert (select count(*) from public.spaces) = 1, 'B voit l''espace';
end $$;

-- ===================================================== le couple est limité à deux personnes
reset role;
delete from private.join_attempts;  -- remet le compteur de tentatives à zéro
set role authenticated;
select test.login('00000000-0000-0000-0000-0000000000a3');
select (public.join_space(:'code', 'Intrus', 'sky') ->> 'status') as s5 \gset
select set_config('test.s5', :'s5', false) \g /dev/null
do $$ begin assert test.v('s5') = 'space_full', 'un couple n''accepte pas de troisième membre'; end $$;

-- ===================================================== tâches
reset role; set role authenticated;
select test.login('00000000-0000-0000-0000-0000000000a1');
insert into public.tasks (space_id, title, created_by) values (:'sid', 'Appeler le garagiste', :'a_member') returning id as tid \gset
select set_config('test.tid', :'tid', false) \g /dev/null
do $$ begin
  assert test.fails(format('insert into public.tasks (space_id, title, created_by) values (%L, %L, %L)', test.u('sid'), 'usurpation', test.u('b_member'))) is not null, 'on ne peut pas créer une tâche au nom d''un autre';
end $$;

reset role; set role authenticated;
select test.login('00000000-0000-0000-0000-0000000000a2');
do $$ begin
  assert (select count(*) from public.tasks) = 1, 'B voit la tâche de A';
  assert test.fails(format('update public.tasks set done_at = now(), done_by = %L where id = %L', test.u('a_member'), test.u('tid'))) is not null, 'B ne peut pas cocher au nom de A';
end $$;
update public.tasks set done_at = now(), done_by = :'b_member' where id = :'tid';
do $$ begin assert (select done_by from public.tasks) = test.u('b_member'), 'B coche la tâche'; end $$;

-- ===================================================== colonnes protégées, droits d'admin
do $$
declare n int;
begin
  assert test.fails(format('update public.spaces set invite_code = %L where id = %L', 'NOUS-HACK-HACK', test.u('sid'))) is not null, 'invite_code non modifiable directement';
  update public.spaces set name = 'Renommé par B' where id = test.u('sid');
  get diagnostics n = row_count;
  assert n = 0, 'un simple membre ne peut pas renommer l''espace';
  update public.space_members set display_name = 'Camille B.' where id = test.u('b_member');
  get diagnostics n = row_count;
  assert n = 1, 'B modifie son propre profil';
  update public.space_members set display_name = 'Piraté' where id = test.u('a_member');
  get diagnostics n = row_count;
  assert n = 0, 'B ne modifie pas le profil de A';
  assert test.fails(format('update public.space_members set role = ''admin'' where id = %L', test.u('b_member'))) is not null, 'le rôle n''est pas modifiable par le membre';
  assert test.fails(format('insert into public.space_modules values (%L, ''jeux'', false)', test.u('sid'))) is not null, 'un membre ne règle pas les modules';
  assert test.fails(format('select public.regenerate_invite_code(%L)', test.u('sid'))) is not null, 'un membre ne régénère pas le code';
  assert test.fails('select stripe_customer_id from public.space_subscriptions') is not null, 'identifiants Stripe illisibles';
  assert test.fails(format('update public.space_subscriptions set tier = ''max'' where space_id = %L', test.u('sid'))) is not null, 'un membre ne change pas la formule';
end $$;

reset role; set role authenticated;
select test.login('00000000-0000-0000-0000-0000000000a1');
do $$
declare n int;
begin
  update public.spaces set name = 'Léo et Camille' where id = test.u('sid');
  get diagnostics n = row_count;
  assert n = 1, 'l''admin renomme l''espace';
  insert into public.space_modules (space_id, module_key, enabled) values (test.u('sid'), 'jeux', false);
  assert (select count(*) from public.space_modules) = 1, 'l''admin désactive un module optionnel';
  assert test.fails(format('insert into public.space_modules values (%L, ''chat'', false)', test.u('sid'))) is not null, 'le noyau commun ne se désactive pas';
end $$;
select public.regenerate_invite_code(:'sid') as newcode \gset
select set_config('test.newcode', :'newcode', false) \g /dev/null
do $$ begin assert test.v('newcode') <> test.v('code') and test.v('newcode') ~ '^NOUS-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$', 'nouveau code bien formé et différent'; end $$;

-- ===================================================== anon n'accède à rien
reset role; set role anon;
do $$ begin
  assert test.fails('select * from public.spaces') is not null, 'anon ne lit pas spaces';
  assert test.fails('select * from public.tasks') is not null, 'anon ne lit pas tasks';
  assert test.fails(format('select public.join_space(%L, %L, %L)', 'x', 'x', 'x')) is not null, 'anon ne peut pas appeler join_space';
  assert test.fails('select public.create_space(''x'', ''couple'', ''x'', ''lilac'')') is not null, 'anon ne peut pas créer d''espace';
end $$;

-- ===================================================== intégrité entre espaces
reset role; set role authenticated;
select test.login('00000000-0000-0000-0000-0000000000a1');
select public.create_space('La bande', 'amis', 'Léo', 'sun') as sid2 \gset
select set_config('test.sid2', :'sid2', false) \g /dev/null
select id as a2_member from public.space_members where space_id = :'sid2' \gset
select set_config('test.a2_member', :'a2_member', false) \g /dev/null
do $$ begin
  assert test.fails(format('insert into public.tasks (space_id, title, created_by, assignee_id) values (%L, %L, %L, %L)', test.u('sid2'), 'cross', test.u('a2_member'), test.u('b_member'))) is not null,
    'une tâche ne peut pas être assignée à un membre d''un autre espace';
end $$;

-- ===================================================== espace archivé : lecture seule
reset role;
update public.spaces set archived_at = now() where id = :'sid';
set role authenticated;
select test.login('00000000-0000-0000-0000-0000000000a1');
do $$ begin
  assert (select count(*) from public.tasks where space_id = test.u('sid')) = 1, 'un espace archivé reste lisible';
  assert test.fails(format('insert into public.tasks (space_id, title, created_by) values (%L, %L, %L)', test.u('sid'), 'après archivage', test.u('a_member'))) is not null, 'un espace archivé n''accepte plus d''écriture';
end $$;

reset role;
select 'OK' as resultat;
