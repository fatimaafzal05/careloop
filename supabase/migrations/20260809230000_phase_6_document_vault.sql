-- CareLoop Phase 6: private medical-record vault and explicit document consent.

create table public.document_caregiver_consents (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  caregiver_id uuid not null references public.profiles(id) on delete cascade,
  approved_by uuid not null references public.profiles(id) on delete restrict,
  approved_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique (document_id, caregiver_id)
);
create index document_caregiver_consents_caregiver_idx on public.document_caregiver_consents(caregiver_id) where revoked_at is null;

create or replace function public.ensure_document_member_household()
returns trigger language plpgsql set search_path = public as $$
begin
  if not exists (select 1 from public.family_members fm where fm.id = new.family_member_id and fm.household_id = new.household_id) then
    raise exception 'Document family member must belong to the same household';
  end if;
  return new;
end;
$$;
create trigger documents_same_household before insert or update on public.documents
for each row execute function public.ensure_document_member_household();

create or replace function public.can_read_document_storage(object_name text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.documents d
    where d.storage_path = object_name and (
      public.is_household_member(d.household_id)
      or exists (
        select 1 from public.document_caregiver_consents c
        where c.document_id = d.id and c.caregiver_id = (select auth.uid()) and c.revoked_at is null
      )
    )
  );
$$;

alter table public.document_caregiver_consents enable row level security;
create policy "document consent: owners view" on public.document_caregiver_consents
for select to authenticated using (exists (select 1 from public.documents d where d.id = document_id and public.is_household_owner(d.household_id)) or caregiver_id = (select auth.uid()));
create policy "document consent: owners manage" on public.document_caregiver_consents
for all to authenticated using (exists (select 1 from public.documents d where d.id = document_id and public.is_household_owner(d.household_id))) with check (approved_by = (select auth.uid()) and exists (select 1 from public.documents d where d.id = document_id and public.is_household_owner(d.household_id)));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('medical-records', 'medical-records', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "medical records: household members upload" on storage.objects
for insert to authenticated with check (
  bucket_id = 'medical-records'
  and public.is_household_member(((storage.foldername(name))[1])::uuid)
);
create policy "medical records: authorized readers" on storage.objects
for select to authenticated using (bucket_id = 'medical-records' and public.can_read_document_storage(name));
create policy "medical records: household members delete" on storage.objects
for delete to authenticated using (bucket_id = 'medical-records' and public.is_household_member(((storage.foldername(name))[1])::uuid));

revoke all on function public.can_read_document_storage(text) from public;
grant execute on function public.can_read_document_storage(text) to authenticated;
