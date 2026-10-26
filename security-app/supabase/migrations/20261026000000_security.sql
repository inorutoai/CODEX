-- 個人別の管理領域。組織内共有は別途メンバーシップ設計を追加する。
create table public.sites (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 name text not null check (length(trim(name)) between 1 and 100),
 url text not null check (length(url) <= 2048 and url ~ '^https?://[^/@[:space:]]+([/:?].*)?$' and url !~ '^https?://[^/]*@'),
 description text not null default '' check (length(description) <= 2000),
 created_at timestamptz not null default now(),
 unique(id,owner_id)
);
create table public.issues (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 site_id uuid not null,
 title text not null check (length(trim(title)) between 1 and 200),
 severity text not null check (severity in ('critical','high','medium','low')),
 status text not null default 'open' check (status in ('open','in_progress','resolved')),
 description text not null default '' check (length(description)<=5000),
 remediation text not null default '' check (length(remediation)<=5000),
 due_date date,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 foreign key(site_id,owner_id) references public.sites(id,owner_id) on delete restrict
);
create index sites_owner on public.sites(owner_id);
create index issues_owner_status on public.issues(owner_id,status);
create index issues_site on public.issues(site_id,owner_id);
create table public.audit_events (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 entity_type text not null,
 entity_id uuid not null,
 entity_label text not null,
 action text not null,
 created_at timestamptz not null default now()
);
create index audit_owner_time on public.audit_events(owner_id,created_at desc);
alter table public.sites enable row level security;
alter table public.issues enable row level security;
alter table public.audit_events enable row level security;
create policy sites_select on public.sites for select to authenticated using ((select auth.uid())=owner_id);
create policy sites_insert on public.sites for insert to authenticated with check ((select auth.uid())=owner_id);
create policy sites_update on public.sites for update to authenticated using ((select auth.uid())=owner_id) with check ((select auth.uid())=owner_id);
create policy sites_delete on public.sites for delete to authenticated using ((select auth.uid())=owner_id);
create policy issues_select on public.issues for select to authenticated using ((select auth.uid())=owner_id);
create policy issues_insert on public.issues for insert to authenticated with check ((select auth.uid())=owner_id);
create policy issues_update on public.issues for update to authenticated using ((select auth.uid())=owner_id) with check ((select auth.uid())=owner_id);
create policy issues_delete on public.issues for delete to authenticated using ((select auth.uid())=owner_id);
create policy audit_select on public.audit_events for select to authenticated using ((select auth.uid())=owner_id);
revoke all on public.sites,public.issues,public.audit_events from anon,authenticated;
grant select,insert,update,delete on public.sites,public.issues to authenticated;
grant select on public.audit_events to authenticated;
create function public.record_security_change() returns trigger language plpgsql security definer set search_path='' as $$
declare item jsonb;
begin
 if TG_OP='DELETE' then item=to_jsonb(old); else item=to_jsonb(new); end if;
 insert into public.audit_events(owner_id,entity_type,entity_id,entity_label,action)
 values ((item->>'owner_id')::uuid,TG_TABLE_NAME,(item->>'id')::uuid,coalesce(item->>'name',item->>'title'),TG_OP);
 if TG_OP='DELETE' then return old; end if;
 return new;
end $$;
revoke all on function public.record_security_change() from public,anon,authenticated;
create function public.protect_security_fields() returns trigger language plpgsql set search_path='' as $$
begin
 if new.owner_id is distinct from old.owner_id or new.id is distinct from old.id or new.created_at is distinct from old.created_at then
  raise exception 'Immutable ownership and identity' using errcode='42501';
 end if;
 if TG_TABLE_NAME='issues' then new.updated_at=now(); end if;
 return new;
end $$;
revoke all on function public.protect_security_fields() from public,anon,authenticated;
create trigger protect_site before update on public.sites for each row execute function public.protect_security_fields();
create trigger protect_issue before update on public.issues for each row execute function public.protect_security_fields();
create trigger audit_site after insert or update or delete on public.sites for each row execute function public.record_security_change();
create trigger audit_issue after insert or update or delete on public.issues for each row execute function public.record_security_change();
