-- Phase 8: consent and audit boundary for optional AI processing.
create type public.ai_job_kind as enum ('prescription_scan','report_explanation');
create type public.ai_job_status as enum ('queued','processing','completed','failed','cancelled');
create table public.ai_processing_consents (
  id uuid primary key default gen_random_uuid(), document_id uuid not null references public.documents(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade, user_id uuid not null references public.profiles(id) on delete cascade,
  purpose public.ai_job_kind not null, retain_result boolean not null default false, accepted_at timestamptz not null default now()
);
create table public.ai_processing_jobs (
  id uuid primary key default gen_random_uuid(), document_id uuid not null references public.documents(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade, requested_by uuid not null references public.profiles(id) on delete restrict,
  kind public.ai_job_kind not null, status public.ai_job_status not null default 'queued', result jsonb, error_code text,
  expires_at timestamptz, created_at timestamptz not null default now(), completed_at timestamptz
);
create index ai_jobs_document_idx on public.ai_processing_jobs(document_id, created_at desc);
alter table public.ai_processing_consents enable row level security; alter table public.ai_processing_jobs enable row level security;
create policy "ai consent: household members manage" on public.ai_processing_consents for all to authenticated using (public.is_household_member(household_id)) with check (user_id=(select auth.uid()) and public.is_household_member(household_id));
create policy "ai jobs: household members view" on public.ai_processing_jobs for select to authenticated using (public.is_household_member(household_id));
create policy "ai jobs: requester creates" on public.ai_processing_jobs for insert to authenticated with check (requested_by=(select auth.uid()) and public.is_household_member(household_id));
