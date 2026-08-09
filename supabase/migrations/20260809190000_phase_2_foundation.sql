-- CareLoop Phase 2: identity, household tenancy, and protected health records.
-- Run through the Supabase CLI or SQL editor. This migration intentionally creates
-- no service-role bypass path for browser clients.

create extension if not exists pgcrypto;

create type public.household_role as enum ('owner', 'member');
create type public.medication_log_status as enum ('taken', 'skipped', 'snoozed');
create type public.appointment_status as enum ('scheduled', 'completed', 'cancelled');
create type public.document_category as enum ('prescription', 'lab_report', 'imaging', 'vaccination', 'insurance', 'other');
create type public.caregiver_permission as enum ('view', 'medicines', 'appointments', 'emergency', 'full');
create type public.notification_type as enum ('medication', 'refill', 'appointment', 'system');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 120),
  avatar_url text,
  timezone text not null default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.household_members (
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.household_role not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

create table public.family_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 1 and 160),
  relationship text not null check (char_length(relationship) between 1 and 60),
  date_of_birth date,
  blood_group text,
  allergies text,
  conditions text,
  emergency_contacts jsonb not null default '[]'::jsonb,
  insurance_notes text,
  health_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.medications (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  family_member_id uuid not null references public.family_members(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 160),
  dosage text not null check (char_length(dosage) between 1 and 120),
  form text,
  schedule jsonb not null default '{}'::jsonb,
  meal_instruction text,
  start_date date,
  end_date date,
  refill_date date,
  notes text,
  is_paused boolean not null default false,
  is_archived boolean not null default false,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date is null or start_date is null or end_date >= start_date)
);

create table public.medication_logs (
  id uuid primary key default gen_random_uuid(),
  medication_id uuid not null references public.medications(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  scheduled_for timestamptz not null,
  status public.medication_log_status not null,
  recorded_at timestamptz not null default now(),
  recorded_by uuid not null references public.profiles(id) on delete restrict,
  note text,
  unique (medication_id, scheduled_for)
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  family_member_id uuid not null references public.family_members(id) on delete cascade,
  doctor_name text,
  specialty text,
  facility_name text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text,
  purpose text,
  notes text,
  follow_up_at timestamptz,
  status public.appointment_status not null default 'scheduled',
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at >= starts_at)
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  family_member_id uuid not null references public.family_members(id) on delete cascade,
  category public.document_category not null,
  title text not null check (char_length(title) between 1 and 200),
  storage_path text not null unique,
  mime_type text not null,
  byte_size bigint not null check (byte_size > 0),
  document_date date,
  clinician_name text,
  notes text,
  is_archived boolean not null default false,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.emergency_profiles (
  family_member_id uuid primary key references public.family_members(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  blood_group text,
  allergies text,
  medical_conditions text,
  emergency_contacts jsonb not null default '[]'::jsonb,
  preferred_hospital text,
  insurance_details text,
  important_notes text,
  updated_by uuid not null references public.profiles(id) on delete restrict,
  updated_at timestamptz not null default now()
);

create table public.caregiver_access (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  caregiver_id uuid not null references public.profiles(id) on delete cascade,
  permission public.caregiver_permission not null,
  granted_by uuid not null references public.profiles(id) on delete restrict,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique (household_id, caregiver_id)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  household_id uuid references public.households(id) on delete cascade,
  type public.notification_type not null,
  title text not null,
  body text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  reason text,
  requested_at timestamptz not null default now(),
  status text not null default 'requested' check (status in ('requested', 'in_review', 'completed', 'cancelled'))
);

create index household_members_user_id_idx on public.household_members(user_id);
create index family_members_household_id_idx on public.family_members(household_id);
create index medications_household_id_idx on public.medications(household_id);
create index medication_logs_household_id_idx on public.medication_logs(household_id);
create index appointments_household_id_idx on public.appointments(household_id);
create index documents_household_id_idx on public.documents(household_id);
create index emergency_profiles_household_id_idx on public.emergency_profiles(household_id);
create index caregiver_access_caregiver_id_idx on public.caregiver_access(caregiver_id) where revoked_at is null;
create index notifications_user_id_idx on public.notifications(user_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger households_updated_at before update on public.households for each row execute function public.set_updated_at();
create trigger family_members_updated_at before update on public.family_members for each row execute function public.set_updated_at();
create trigger medications_updated_at before update on public.medications for each row execute function public.set_updated_at();
create trigger appointments_updated_at before update on public.appointments for each row execute function public.set_updated_at();
create trigger documents_updated_at before update on public.documents for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1)));
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

-- SECURITY DEFINER helpers avoid recursive RLS evaluation. They are not exposed
-- through the API and use a fixed search_path.
create or replace function public.is_household_member(target_household uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.household_members hm
    where hm.household_id = target_household and hm.user_id = (select auth.uid())
  );
$$;

create or replace function public.is_household_owner(target_household uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.household_members hm
    where hm.household_id = target_household
      and hm.user_id = (select auth.uid())
      and hm.role = 'owner'
  );
$$;

create or replace function public.create_household(household_name text)
returns uuid language plpgsql security definer set search_path = public as $$
declare new_household_id uuid;
begin
  if (select auth.uid()) is null then raise exception 'Not authenticated'; end if;
  if char_length(trim(household_name)) not between 2 and 120 then raise exception 'Invalid household name'; end if;
  insert into public.households (name, created_by)
  values (trim(household_name), (select auth.uid()))
  returning id into new_household_id;
  insert into public.household_members (household_id, user_id, role)
  values (new_household_id, (select auth.uid()), 'owner');
  return new_household_id;
end;
$$;

create or replace function public.caregiver_permission_for(target_household uuid)
returns public.caregiver_permission language sql stable security definer set search_path = public as $$
  select ca.permission from public.caregiver_access ca
  where ca.household_id = target_household and ca.caregiver_id = (select auth.uid()) and ca.revoked_at is null
  limit 1;
$$;

create or replace function public.can_view_household(target_household uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_household_member(target_household)
    or public.caregiver_permission_for(target_household) is not null;
$$;

create or replace function public.can_manage_household(target_household uuid, capability text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.household_members hm
    where hm.household_id = target_household and hm.user_id = (select auth.uid())
  ) or public.caregiver_permission_for(target_household) = 'full'
    or (capability = 'medicines' and public.caregiver_permission_for(target_household) = 'medicines')
    or (capability = 'appointments' and public.caregiver_permission_for(target_household) = 'appointments')
    or (capability = 'emergency' and public.caregiver_permission_for(target_household) = 'emergency');
$$;

alter table public.profiles enable row level security;
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.family_members enable row level security;
alter table public.medications enable row level security;
alter table public.medication_logs enable row level security;
alter table public.appointments enable row level security;
alter table public.documents enable row level security;
alter table public.emergency_profiles enable row level security;
alter table public.caregiver_access enable row level security;
alter table public.notifications enable row level security;
alter table public.account_deletion_requests enable row level security;

create policy "profiles: users read themselves" on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "profiles: users update themselves" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "households: visible to members" on public.households for select to authenticated using (public.is_household_member(id));
create policy "households: owners update" on public.households for update to authenticated using (public.is_household_owner(id)) with check (public.is_household_owner(id));

create policy "household_members: visible to household" on public.household_members for select to authenticated using (public.is_household_member(household_id));
create policy "household_members: owners manage" on public.household_members for all to authenticated using (public.is_household_owner(household_id)) with check (public.is_household_owner(household_id));

create policy "family_members: view with household access" on public.family_members for select to authenticated using (public.can_view_household(household_id));
create policy "family_members: household members manage" on public.family_members for all to authenticated using (public.can_manage_household(household_id, 'family')) with check (public.can_manage_household(household_id, 'family'));

create policy "medications: view with household access" on public.medications for select to authenticated using (public.can_view_household(household_id));
create policy "medications: permitted caregivers manage" on public.medications for all to authenticated using (public.can_manage_household(household_id, 'medicines')) with check (public.can_manage_household(household_id, 'medicines'));
create policy "medication_logs: view with household access" on public.medication_logs for select to authenticated using (public.can_view_household(household_id));
create policy "medication_logs: permitted caregivers manage" on public.medication_logs for all to authenticated using (public.can_manage_household(household_id, 'medicines')) with check (public.can_manage_household(household_id, 'medicines') and recorded_by = (select auth.uid()));

create policy "appointments: view with household access" on public.appointments for select to authenticated using (public.can_view_household(household_id));
create policy "appointments: permitted caregivers manage" on public.appointments for all to authenticated using (public.can_manage_household(household_id, 'appointments')) with check (public.can_manage_household(household_id, 'appointments'));

create policy "documents: household members only" on public.documents for select to authenticated using (public.is_household_member(household_id));
create policy "documents: household members manage" on public.documents for all to authenticated using (public.is_household_member(household_id)) with check (public.is_household_member(household_id));

create policy "emergency: authorized access" on public.emergency_profiles for select to authenticated using (public.is_household_member(household_id) or public.caregiver_permission_for(household_id) in ('emergency', 'full'));
create policy "emergency: authorized management" on public.emergency_profiles for all to authenticated using (public.can_manage_household(household_id, 'emergency')) with check (public.can_manage_household(household_id, 'emergency') and updated_by = (select auth.uid()));

create policy "caregiver_access: owners read" on public.caregiver_access for select to authenticated using (caregiver_id = (select auth.uid()) or public.is_household_owner(household_id));
create policy "caregiver_access: owners manage" on public.caregiver_access for all to authenticated using (public.is_household_owner(household_id)) with check (public.is_household_owner(household_id));

create policy "notifications: users access themselves" on public.notifications for select to authenticated using (user_id = (select auth.uid()));
create policy "notifications: users mark themselves" on public.notifications for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "deletion_requests: users create own" on public.account_deletion_requests for insert to authenticated with check (user_id = (select auth.uid()));
create policy "deletion_requests: users read own" on public.account_deletion_requests for select to authenticated using (user_id = (select auth.uid()));

revoke all on function public.is_household_member(uuid) from public;
revoke all on function public.is_household_owner(uuid) from public;
revoke all on function public.create_household(text) from public;
revoke all on function public.caregiver_permission_for(uuid) from public;
revoke all on function public.can_view_household(uuid) from public;
revoke all on function public.can_manage_household(uuid, text) from public;
grant execute on function public.is_household_member(uuid) to authenticated;
grant execute on function public.is_household_owner(uuid) to authenticated;
grant execute on function public.create_household(text) to authenticated;
grant execute on function public.caregiver_permission_for(uuid) to authenticated;
grant execute on function public.can_view_household(uuid) to authenticated;
grant execute on function public.can_manage_household(uuid, text) to authenticated;
