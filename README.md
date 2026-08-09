# CareLoop

> A calm, private place for families to keep everyday health information together.

<p align="center">
  <a href="https://careloop-xi.vercel.app"><strong>Try CareLoop</strong></a>
  &nbsp;&middot;&nbsp;
  <a href="#inside-careloop">See what is inside</a>
  &nbsp;&middot;&nbsp;
  <a href="#running-it-locally">Run it locally</a>
</p>

Family health information usually lives in too many places: a prescription on the kitchen counter, an appointment in somebody's phone, a report buried in an email, and an emergency contact everyone assumes someone else has saved. CareLoop brings those small but important details into one thoughtful home.

It is designed for people looking after themselves, children, parents, partners, or anyone who depends on them. The goal is not to make health care feel clinical or complicated. It is to make the next small task easier to find and easier to handle.

## A quick look

| Your family’s care, in one place | A simple, friendly start |
| --- | --- |
| ![CareLoop landing page](./public/careloop-landing.jpg) | ![CareLoop account creation page](./public/careloop-signup.jpg) |

The screens above use fictional content only. Never upload real family or health information to this repository.

## Inside CareLoop

**A shared family space**

Create profiles for the people you care for, including the details that are useful when life gets busy: allergies, conditions, emergency contacts, insurance notes, and personal health notes. Household owners can invite caregivers and choose exactly what they may access.

**Medicines without the mental load**

Keep medicines, doses, schedules, refill dates, and notes together. CareLoop makes it easy to log a dose as taken, skipped, or snoozed, while showing a clear picture of the day’s routine. It never tells anyone to start, stop, or change a medicine.

**Appointments and the bigger picture**

Save upcoming visits, follow-ups, provider details, and notes. The timeline puts appointments and personal health events in date order so a family’s story is easier to follow.

**Records that are ready when you need them**

Store prescriptions, lab reports, scans, vaccination cards, and insurance documents in a private records vault. Files are intended to stay private, with carefully scoped sharing rather than public links.

**Emergency information, with consent**

Each family profile can have an emergency card with the information the owner chooses to include. A QR card can expose only those selected fields; it never shares the full account, documents, or private notes.

## Built with care

CareLoop is a health-organisation tool, not a medical provider. It does not provide medical diagnosis, treatment recommendations, or emergency guidance. If something feels urgent, contact a qualified healthcare professional or local emergency service.

The app uses household-scoped access controls, private document storage, and explicit consent flows for sensitive sharing. Any AI-supported workflow is informational only, requires a clear opt-in, and never adds a medicine automatically. This project does not claim HIPAA compliance or any other legal certification; a public launch still needs independent legal, privacy, and security review.

## Built with

- Next.js 16, TypeScript, and Tailwind CSS
- Supabase Auth, Postgres, Row Level Security, and Storage
- Zod for validation and QR support for opted-in emergency cards

## Running it locally

You will need Node.js and a Supabase project.

```bash
npm install
Copy-Item .env.example .env.local
```

Add your browser-safe Supabase values to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Then apply the migrations in `supabase/migrations/` to a fresh Supabase project, in filename order. The full walkthrough is in [SUPABASE_SETUP.md](./SUPABASE_SETUP.md).

Start the app with:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Before you ship

Run the checks below before deploying changes:

```bash
npm run lint
npm run release:check
npm run build
```

For production setup, review the [launch checklist](./LAUNCH_CHECKLIST.md) and [QA report](./QA_REPORT.md). Do not commit `.env.local`, service-role keys, production exports, or real health data.

## Helpful project notes

- [Supabase setup guide](./SUPABASE_SETUP.md)
- [Launch checklist](./LAUNCH_CHECKLIST.md)
- [QA report](./QA_REPORT.md)

## License and legal review

No open-source license has been selected yet. Choose one before accepting contributions. The included Privacy Policy, Terms of Service, Medical Disclaimer, and Cookie Notice are working drafts and need legal review before public launch.
