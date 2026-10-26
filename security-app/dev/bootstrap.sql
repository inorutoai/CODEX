\getenv local_password POSTGRES_PASSWORD
select format('create role authenticator noinherit login password %L', :'local_password') where not exists(select 1 from pg_roles where rolname='authenticator') \gexec
select 'create role anon nologin' where not exists(select 1 from pg_roles where rolname='anon') \gexec
select 'create role authenticated nologin' where not exists(select 1 from pg_roles where rolname='authenticated') \gexec
select format('create role supabase_auth_admin noinherit login createrole password %L', :'local_password') where not exists(select 1 from pg_roles where rolname='supabase_auth_admin') \gexec
grant anon,authenticated to authenticator;
create schema if not exists auth authorization supabase_auth_admin;
grant usage on schema public to anon,authenticated;
grant usage on schema auth to anon,authenticated;
create or replace function auth.uid() returns uuid language sql stable as $$
 select coalesce(nullif(current_setting('request.jwt.claim.sub',true),''),nullif(current_setting('request.jwt.claims',true),'')::jsonb ->> 'sub')::uuid
$$;
grant execute on function auth.uid() to anon,authenticated;
create schema if not exists dev_setup;
revoke all on schema dev_setup from public;
create table if not exists dev_setup.migrations (version text primary key);
alter function auth.uid() owner to supabase_auth_admin;
