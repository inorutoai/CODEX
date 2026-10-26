#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node scripts/local-env.mjs
compose=(docker compose --env-file dev/.env.local-stack -f dev/compose.yml)
"${compose[@]}" up -d --wait db
"${compose[@]}" exec -T db psql -U postgres -v ON_ERROR_STOP=1 < dev/bootstrap.sql >/dev/null
"${compose[@]}" up -d auth rest gateway
for attempt in $(seq 1 60); do
 if curl -fsS --connect-timeout 2 --max-time 3 http://127.0.0.1:54321/auth/v1/health >/dev/null 2>&1; then break; fi
 if [ "$attempt" = 60 ]; then echo 'Auth did not become ready.' >&2; exit 1; fi
 sleep 1
done
"${compose[@]}" exec -T db psql -U postgres -v ON_ERROR_STOP=1 < dev/bootstrap.sql >/dev/null
for migration in supabase/migrations/*.sql; do
 version=$(basename "$migration" .sql)
 applied=$("${compose[@]}" exec -T db psql -U postgres -Atc "select count(*) from dev_setup.migrations where version='$version'")
 if [ "$applied" = 0 ]; then
  { cat "$migration"; printf '\ninsert into dev_setup.migrations(version) values (%s);\n' "'$version'"; } | "${compose[@]}" exec -T db psql -U postgres -v ON_ERROR_STOP=1 --single-transaction >/dev/null
 fi
done
"${compose[@]}" exec -T db psql -U postgres -c "NOTIFY pgrst, 'reload schema';" >/dev/null
echo 'Local PostgreSQL, Supabase Auth and PostgREST are ready.'
