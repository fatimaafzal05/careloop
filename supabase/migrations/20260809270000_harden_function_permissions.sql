-- CareLoop security hardening: functions must never be callable anonymously
-- unless they are an intentionally public, token-gated emergency-card lookup.

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.sync_profile_email() from public, anon, authenticated;

-- RLS helper functions run with the caller's auth.uid() and are never exposed
-- to anonymous users. Authenticated execution is retained because these
-- helpers are evaluated by the database while applying row-level policies.
revoke all on function public.is_household_member(uuid) from public, anon;
revoke all on function public.is_household_owner(uuid) from public, anon;
revoke all on function public.caregiver_permission_for(uuid) from public, anon;
revoke all on function public.can_view_household(uuid) from public, anon;
revoke all on function public.can_manage_household(uuid, text) from public, anon;
revoke all on function public.can_read_document_storage(text) from public, anon;
revoke all on function public.is_admin() from public, anon;

-- Signed-in workflow RPCs are deliberately limited to authenticated users.
revoke all on function public.create_household(text) from public, anon;
revoke all on function public.invite_registered_caregiver(uuid, text, public.caregiver_permission) from public, anon;
revoke all on function public.accept_caregiver_invitation(uuid) from public, anon;
revoke all on function public.revoke_caregiver(uuid, uuid) from public, anon;
revoke all on function public.create_emergency_share(uuid, text[], timestamptz) from public, anon;

-- A public emergency card is the only anonymous RPC. Its UUID share token is
-- generated server-side, checked for expiry/revocation, and returns only the
-- explicitly selected fields.
revoke all on function public.get_public_emergency_card(uuid) from public;
grant execute on function public.get_public_emergency_card(uuid) to anon, authenticated;
