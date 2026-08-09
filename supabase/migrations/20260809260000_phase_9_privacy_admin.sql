-- Phase 9: internal operations, audit trail, and privacy-control foundation.
create type public.app_role as enum ('user','admin');
alter table public.profiles add column if not exists role public.app_role not null default 'user';
create table public.audit_log (id uuid primary key default gen_random_uuid(), actor_id uuid references public.profiles(id) on delete set null, action text not null, entity_type text not null, entity_id uuid, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now());
create table public.support_tickets (id uuid primary key default gen_random_uuid(), user_id uuid references public.profiles(id) on delete set null, subject text not null, body text not null, status text not null default 'open', created_at timestamptz not null default now());
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.profiles where id=(select auth.uid()) and role='admin') $$;
alter table public.audit_log enable row level security; alter table public.support_tickets enable row level security;
create policy "audit: admins only" on public.audit_log for select to authenticated using (public.is_admin());
create policy "tickets: users view own" on public.support_tickets for select to authenticated using (user_id=(select auth.uid()) or public.is_admin());
create policy "tickets: users create own" on public.support_tickets for insert to authenticated with check (user_id=(select auth.uid()));
create policy "tickets: admins update" on public.support_tickets for update to authenticated using (public.is_admin());
revoke all on function public.is_admin() from public; grant execute on function public.is_admin() to authenticated;
