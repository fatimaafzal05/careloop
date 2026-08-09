# CareLoop launch checklist

Status: **draft — do not deploy until every production item is complete.**

## Application and Supabase

- [ ] Apply every migration in timestamp order to staging, then production.
- [ ] Configure `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `NEXT_PUBLIC_SITE_URL` in each environment.
- [ ] Confirm email verification, password-reset, and redirect URLs in Supabase Auth.
- [ ] Confirm `medical-records` is private and test Storage RLS with two unrelated households.
- [ ] Create a non-production admin user through a controlled database operation; never expose a role-management screen to normal users.
- [ ] Configure an AI processor only after privacy/security review, provider agreement review, and retention settings are approved.

## Security and privacy

- [ ] Run cross-household RLS tests for every table and Storage object policy.
- [ ] Test caregiver permission grants, consented document access, QR share expiry/revocation, and account deletion request handling.
- [ ] Review CSP/security headers against any production integrations.
- [ ] Configure rate limiting, error monitoring, backups, and incident-response ownership.
- [ ] Complete Privacy Policy, Terms, Cookie Notice, and Medical Disclaimer with legal review.

## Launch operations

- [ ] Configure domain, HTTPS, email sender, support mailbox, and on-call contact.
- [ ] Add privacy-preserving analytics only; do not collect document contents or health event details.
- [ ] Validate sitemap, SEO metadata, accessibility, mobile layouts, slow-network states, and support flow.
- [ ] Perform final desktop/mobile journeys with a dedicated fictional test household.
