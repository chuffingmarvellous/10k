import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '../../../../lib/supabase';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  if (!code) return new NextResponse('No Strava code was returned.', { status: 400 });
  const client_id = process.env.STRAVA_CLIENT_ID;
  const client_secret = process.env.STRAVA_CLIENT_SECRET;
  if (!client_id || !client_secret) return new NextResponse('Strava environment variables are missing.', { status: 500 });

  const tokenRes = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ client_id, client_secret, code, grant_type: 'authorization_code' })
  });
  const token = await tokenRes.json();
  if (!tokenRes.ok) return NextResponse.json(token, { status: 500 });

  const supabase = getSupabaseServerClient();
  if (supabase && token.athlete?.id) {
    await supabase.from('strava_tokens').upsert({
      athlete_id: String(token.athlete.id),
      access_token: token.access_token,
      refresh_token: token.refresh_token,
      expires_at: token.expires_at
    });
  }
  return NextResponse.redirect(new URL('/?strava=connected', req.url));
}
