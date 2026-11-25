#!/usr/bin/env bash
# Rejoue les migrations sur une base vierge puis exécute les tests d'isolation (RLS).
# Usage : DATABASE_URL=postgres://postgres:postgres@localhost:54329/postgres bash supabase/tests/run.sh
# La base visée est entièrement recréée : n'utilise jamais une base qui contient des données.
set -euo pipefail
cd "$(dirname "$0")/../.."
: "${DATABASE_URL:?Définis DATABASE_URL vers une base Postgres jetable (superutilisateur).}"
PSQL=(psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q)

"${PSQL[@]}" <<'SQL'
drop schema if exists public cascade;
drop schema if exists private cascade;
drop schema if exists auth cascade;
drop schema if exists extensions cascade;
drop schema if exists test cascade;
create schema public;
do $$
declare r text;
begin
  foreach r in array array['anon', 'authenticated', 'service_role'] loop
    if exists (select 1 from pg_roles where rolname = r) then
      execute format('drop owned by %I', r);
      execute format('drop role %I', r);
    end if;
  end loop;
end $$;
SQL
"${PSQL[@]}" -f supabase/tests/stub.sql
for f in supabase/migrations/*.sql; do
  echo "→ $f"
  "${PSQL[@]}" -f "$f"
done
"${PSQL[@]}" -f supabase/tests/rls.sql
echo "OK : toutes les vérifications RLS passent."
