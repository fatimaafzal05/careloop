-- CareLoop Phase 3: family profiles, registered-user caregiver invitations,
-- permission grants, revocation, and household activity history.

alter table public.profiles add column if not exists email text;
update public.profiles p set email = lower(u.email) from auth.users u where u.id = p.id and p.email is null;
create unique index if not exists profiles_email_lower_unique_idx on public.profiles (lower(email)) where email is not null;

create type public.caregiver_invitation_status as enum ('pending', 'accepted', 'revoked');

create table public.caregiver_invitations (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  permission public.caregiver_permission not null,
  invited_by uuid not null references public.profiles(id) on delete restrict,
  status public.caregiver_invitation_status not null default 'pending',
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  unique (household_id, recipient_id, status)
);

create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null check (char_length(action) between 1 and 120),
  entity_type text not null check (char_length(entity_type) between 1 and 80),
  entity_id uuid,
  details jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index caregiver_invitations_recipient_idx on public.caregiver_invitations(recipient_id, status);
create index caregiver_invitations_household_idx on public.caregiver_invitations(household_id, status);
create index activity_log_household_idx on public.activity_log(household_id, occurred_at desc);

-- Keep the public profile email in sync only for recipient lookup. RLS continues
-- to prevent arbitrary profile searches from browser clients.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, email)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1)),
    lower(new.email)
  );
  return new;
end;
$$;

create or replace function public.sync_profile_email()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = lower(new.email) where id = new.id;
  end if;
  return new;
end;
$$;
create trigger on_auth_user_email_updated after update of email on auth.users
for each row execute procedure public.sync_profile_email();

-- The email field is used only by the secure invitation RPC. Browser clients
-- may update presentation preferences but cannot alter invitation identity.
revoke update on public.profiles from authenticated;
grant update (display_name, avatar_url, timezone) on public.profiles to authenticated;

create or replace function public.invite_registered_caregiver(
  target_household uuid,
  recipient_email text,
  requested_permission public.caregiver_permission
)
returns uuid language plpgsql security definer set search_path = public as $$
declare target_profile uuid; invitation_id uuid;
begin
  if (select auth.uid()) is null then raise exception 'Not authenticated'; end if;
  if not public.is_household_owner(target_household) then raise exception 'Not authorized to invite caregivers'; end if;
  select id into target_profile from public.profiles where lower(email) = lower(trim(recipient_email));
  if target_profile is null then raise exception 'No registered CareLoop account matches that email'; end if;
  if target_profile = (select auth.uid()) then raise exception 'You already have household access'; end if;

  update public.caregiver_invitations
    set status = 'revoked', responded_at = now()
    where household_id = target_household and recipient_id = target_profile and status = 'pending';

  insert into public.caregiver_invitations (household_id, recipient_id, permission, invited_by)
  values (target_household, target_profile, requested_permission, (select auth.uid()))
  returning id into invitation_id;

  insert into public.activity_log (household_id, actor_id, action, entity_type, entity_id, details)
  values (target_household, (select auth.uid()), 'caregiver.invited', 'caregiver_invitation', invitation_id,
    jsonb_build_object('permission', requested_permission));
  return invitation_id;
end;
$$;

create or replace function public.accept_caregiver_invitation(invitation_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare invitation public.caregiver_invitations%rowtype;
begin
  if (select auth.uid()) is null then raise exception 'Not authenticated'; end if;
  select * into invitation from public.caregiver_invitations where id = invitation_id and status = 'pending' for update;
  if invitation.id is null or invitation.recipient_id <> (select auth.uid()) then raise exception 'Invitation is not available'; end if;

  insert into public.caregiver_access (household_id, caregiver_id, permission, granted_by, revoked_at)
  values (invitation.household_id, invitation.recipient_id, invitation.permission, invitation.invited_by, null)
  on conflict (household_id, caregiver_id) do update set permission = excluded.permission, granted_by = excluded.granted_by, granted_at = now(), revoked_at = null;
  update public.caregiver_invitations set status = 'accepted', responded_at = now() where id = invitation.id;
  insert into public.activity_log (household_id, actor_id, action, entity_type, entity_id, details)
  values (invitation.household_id, (select auth.uid()), 'caregiver.accepted', 'caregiver_access', invitation.id,
    jsonb_build_object('permission', invitation.permission));
end;
$$;

create or replace function public.revoke_caregiver(target_household uuid, target_caregiver uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_household_owner(target_household) then raise exception 'Not authorized to revoke caregivers'; end if;
  update public.caregiver_access set revoked_at = now()
    where household_id = target_household and caregiver_id = target_caregiver and revoked_at is null;
  update public.caregiver_invitations set status = 'revoked', responded_at = now()
    where household_id = target_household and recipient_id = target_caregiver and status = 'pending';
  insert into public.activity_log (household_id, actor_id, action, entity_type, details)
  values (target_household, (select auth.uid()), 'caregiver.revoked', 'caregiver_access', jsonb_build_object('caregiver_id', target_caregiver));
end;
$$;

alter table public.caregiver_invitations enable row level security;
alter table public.activity_log enable row level security;

create policy "caregiver invitations: recipients and owners view" on public.caregiver_invitations
for select to authenticated using (recipient_id = (select auth.uid()) or public.is_household_owner(household_id));
create policy "activity log: owners view" on public.activity_log
for select to authenticated using (public.is_household_owner(household_id));

revoke all on function public.invite_registered_caregiver(uuid, text, public.caregiver_permission) from public;
revoke all on function public.accept_caregiver_invitation(uuid) from public;
revoke all on function public.revoke_caregiver(uuid, uuid) from public;
grant execute on function public.invite_registered_caregiver(uuid, text, public.caregiver_permission) to authenticated;
grant execute on function public.accept_caregiver_invitation(uuid) to authenticated;
grant execute on function public.revoke_caregiver(uuid, uuid) to authenticated;
