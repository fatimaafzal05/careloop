-- Repair accounts created before the CareLoop profile trigger existed, then
-- make household creation self-healing for any future edge case.

insert into public.profiles (id, display_name, email)
select
  user_record.id,
  case
    when char_length(trim(coalesce(nullif(user_record.raw_user_meta_data ->> 'full_name', ''), split_part(coalesce(user_record.email, ''), '@', 1)))) between 2 and 120
      then left(trim(coalesce(nullif(user_record.raw_user_meta_data ->> 'full_name', ''), split_part(coalesce(user_record.email, ''), '@', 1))), 120)
    else 'CareLoop member'
  end,
  lower(user_record.email)
from auth.users as user_record
left join public.profiles as profile on profile.id = user_record.id
where profile.id is null
on conflict (id) do nothing;

create or replace function public.create_household(household_name text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  current_user_id uuid := (select auth.uid());
  new_household_id uuid;
  current_email text;
  current_name text;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;
  if char_length(trim(household_name)) not between 2 and 120 then
    raise exception 'Invalid household name';
  end if;

  select
    lower(email),
    case
      when char_length(trim(coalesce(nullif(raw_user_meta_data ->> 'full_name', ''), split_part(coalesce(email, ''), '@', 1)))) between 2 and 120
        then left(trim(coalesce(nullif(raw_user_meta_data ->> 'full_name', ''), split_part(coalesce(email, ''), '@', 1))), 120)
      else 'CareLoop member'
    end
  into current_email, current_name
  from auth.users
  where id = current_user_id;

  insert into public.profiles (id, display_name, email)
  values (current_user_id, current_name, current_email)
  on conflict (id) do nothing;

  insert into public.households (name, created_by)
  values (trim(household_name), current_user_id)
  returning id into new_household_id;

  insert into public.household_members (household_id, user_id, role)
  values (new_household_id, current_user_id, 'owner');

  return new_household_id;
end;
$$;

revoke all on function public.create_household(text) from public, anon;
grant execute on function public.create_household(text) to authenticated;
