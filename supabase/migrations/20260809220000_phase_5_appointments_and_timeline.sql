-- CareLoop Phase 5: appointment integrity and household health timeline.

create type public.health_event_type as enum ('vaccination', 'symptom', 'health_note', 'other');

create table public.health_events (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  family_member_id uuid not null references public.family_members(id) on delete cascade,
  type public.health_event_type not null,
  occurred_at timestamptz not null,
  title text not null check (char_length(title) between 1 and 180),
  notes text,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index health_events_household_occurred_idx on public.health_events(household_id, occurred_at desc);
create trigger health_events_updated_at before update on public.health_events for each row execute function public.set_updated_at();

create or replace function public.ensure_appointment_member_household()
returns trigger language plpgsql set search_path = public as $$
begin
  if not exists (select 1 from public.family_members fm where fm.id = new.family_member_id and fm.household_id = new.household_id) then
    raise exception 'Appointment family member must belong to the same household';
  end if;
  return new;
end;
$$;
create trigger appointments_same_household before insert or update on public.appointments
for each row execute function public.ensure_appointment_member_household();

create or replace function public.ensure_health_event_member_household()
returns trigger language plpgsql set search_path = public as $$
begin
  if not exists (select 1 from public.family_members fm where fm.id = new.family_member_id and fm.household_id = new.household_id) then
    raise exception 'Health event family member must belong to the same household';
  end if;
  return new;
end;
$$;
create trigger health_events_same_household before insert or update on public.health_events
for each row execute function public.ensure_health_event_member_household();

alter table public.health_events enable row level security;
create policy "health events: view with household access" on public.health_events
for select to authenticated using (public.can_view_household(household_id));
create policy "health events: household members manage" on public.health_events
for all to authenticated using (public.can_manage_household(household_id, 'family')) with check (public.can_manage_household(household_id, 'family') and created_by = (select auth.uid()));
