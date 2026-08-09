-- CareLoop Phase 7: private emergency profiles and opt-in public QR cards.

create table public.emergency_shares (
  id uuid primary key default gen_random_uuid(),
  family_member_id uuid not null references public.family_members(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  token uuid not null unique default gen_random_uuid(),
  shared_fields text[] not null check (array_length(shared_fields, 1) > 0 and shared_fields <@ array['blood_group','allergies','medical_conditions','current_medicines','emergency_contacts','preferred_hospital','insurance_details']::text[]),
  expires_at timestamptz,
  revoked_at timestamptz,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);
create index emergency_shares_token_idx on public.emergency_shares(token) where revoked_at is null;

create or replace function public.ensure_emergency_share_household()
returns trigger language plpgsql set search_path = public as $$
begin
  if not exists (select 1 from public.family_members fm where fm.id = new.family_member_id and fm.household_id = new.household_id) then raise exception 'Emergency share profile must belong to the same household'; end if;
  return new;
end;
$$;
create trigger emergency_shares_same_household before insert or update on public.emergency_shares for each row execute function public.ensure_emergency_share_household();

create or replace function public.create_emergency_share(target_member uuid, fields text[], expiry timestamptz default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare h uuid; result_token uuid;
begin
  select household_id into h from public.family_members where id = target_member;
  if h is null or not public.can_manage_household(h, 'emergency') then raise exception 'Not authorized'; end if;
  insert into public.emergency_shares (family_member_id, household_id, shared_fields, expires_at, created_by)
  values (target_member, h, fields, expiry, (select auth.uid())) returning token into result_token;
  return result_token;
end;
$$;

create or replace function public.get_public_emergency_card(share_token uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_strip_nulls(jsonb_build_object(
    'name', fm.full_name,
    'blood_group', case when 'blood_group'=any(es.shared_fields) then ep.blood_group end,
    'allergies', case when 'allergies'=any(es.shared_fields) then ep.allergies end,
    'medical_conditions', case when 'medical_conditions'=any(es.shared_fields) then ep.medical_conditions end,
    'current_medicines', case when 'current_medicines'=any(es.shared_fields) then coalesce((select jsonb_agg(jsonb_build_object('name',m.name,'dosage',m.dosage)) from public.medications m where m.family_member_id=fm.id and not m.is_archived), '[]'::jsonb) end,
    'emergency_contacts', case when 'emergency_contacts'=any(es.shared_fields) then ep.emergency_contacts end,
    'preferred_hospital', case when 'preferred_hospital'=any(es.shared_fields) then ep.preferred_hospital end,
    'insurance_details', case when 'insurance_details'=any(es.shared_fields) then ep.insurance_details end
  )) from public.emergency_shares es join public.family_members fm on fm.id=es.family_member_id left join public.emergency_profiles ep on ep.family_member_id=fm.id
  where es.token=share_token and es.revoked_at is null and (es.expires_at is null or es.expires_at > now());
$$;

alter table public.emergency_shares enable row level security;
create policy "emergency shares: managers view" on public.emergency_shares for select to authenticated using (public.can_manage_household(household_id, 'emergency'));
create policy "emergency shares: managers revoke" on public.emergency_shares for update to authenticated using (public.can_manage_household(household_id, 'emergency')) with check (public.can_manage_household(household_id, 'emergency'));
revoke all on function public.create_emergency_share(uuid, text[], timestamptz) from public;
revoke all on function public.get_public_emergency_card(uuid) from public;
grant execute on function public.create_emergency_share(uuid, text[], timestamptz) to authenticated;
grant execute on function public.get_public_emergency_card(uuid) to anon, authenticated;
