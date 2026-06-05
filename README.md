# Sub-50 10k Coach

A cloud-backed mobile web app for training towards a sub-50 minute 10k.

## What it does now

- Email magic-link login via Supabase
- Cloud run log
- Manual run entry
- 12-week 10k training plan
- Target pacing for intervals, tempo runs and long runs
- Basic adaptive coaching notes based on recent runs and effort
- 10k prediction using a standard race-time power model
- JSON backup export
- Strava OAuth connection and import endpoint skeleton

## Stack

- Next.js
- Supabase Auth and Postgres
- Vercel hosting
- Strava API integration

## Setup

1. Create a Supabase project.
2. In Supabase SQL editor, run `supabase/schema.sql`.
3. Create a Vercel project from this folder or GitHub repo.
4. Add environment variables from `.env.example`.
5. In Supabase Auth settings, add your Vercel URL as an allowed redirect URL.
6. In Strava API settings, set the callback domain to your Vercel domain.

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Strava import

The app has routes for:

- `/api/strava/connect`
- `/api/strava/callback`
- `/api/strava/import`

The homepage currently includes a Connect Strava button. To trigger import, send a POST request to `/api/strava/import`. A visible Import button should be added after confirming your Strava app credentials and API access.

## Important caveat

Strava developer access and terms can change. The app is designed to remain useful with manual logging even if Strava access is restricted.
