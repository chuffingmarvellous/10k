# 10k Coach

This version deliberately uses only `@supabase/supabase-js`, not the Supabase Next.js helper packages. That avoids the Vercel build error about missing `createRouteHandlerClient`.

## Vercel environment variables

Required for login and run saving:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Optional for Strava:

- `STRAVA_CLIENT_ID`
- `STRAVA_CLIENT_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY`

## Supabase setup

Open Supabase, go to SQL Editor, and run `supabase-schema.sql`.

## Strava note

The Strava connection route obtains and stores a token. The current import route proves the connection and fetches recent runs, but it does not yet assign imported runs to a Supabase user. Manual logging and cloud saving are functional once Supabase auth is configured.
