-- CareLoop Phase 4: medication integrity and user-controlled reminder settings.

create table public.notification_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  medication_reminders boolean not null default true,
  refill_alerts boolean not null default true,
  appointment_reminders boolean not null default true,
  timezone text not null default 'UTC',
  updated_at timestamptz not null default now()
);

create trigger notification_preferences_updated_at before update on public.notification_preferences
for each row execute function public.set_updated_at();

create or replace function public.ensure_medication_member_household()
returns trigger language plpgsql set search_path = public as $$
begin
  if not exists (select 1 from public.family_members fm where fm.id = new.family_member_id and fm.household_id = new.household_id) then
    raise exception 'Medication family member must belong to the same household';
  end if;
  return new;
end;
$$;
create trigger medications_same_household before insert or update on public.medications
for each row execute function public.ensure_medication_member_household();

alter table public.notification_preferences enable row level security;
create policy "notification preferences: users manage their own" on public.notification_preferences
for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
