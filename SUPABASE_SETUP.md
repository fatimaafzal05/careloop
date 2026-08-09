# Supabase setup — Phase 2

1. Create a Supabase project and enable email/password authentication.
2. In Authentication → URL Configuration, add `http://localhost:3000/auth/callback` and your eventual production callback URL.
3. Copy `.env.example` to `.env.local`, adding only the project URL and publishable key. Never expose a service-role key to the browser or commit it.
4. Apply every migration in `supabase/migrations/` in timestamp order, including `20260809250000_phase_8_ai_consent.sql`.
5. Create two test accounts and two households. Verify that one account cannot select, insert, update, or delete the other household’s records through the API.

The migrations create a profile automatically from `auth.users`, use a session-refresh proxy, and enable RLS on every application table. The browser client uses only Supabase’s publishable key; data boundaries are enforced by Postgres policies. Caregiver invitations resolve only registered accounts through a security-definer RPC; the email used for that lookup is not browser-editable.
