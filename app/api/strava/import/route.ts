import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '../../../../lib/supabase';

async function refresh(refresh_token: string) {
  const client_id = process.env.STRAVA_CLIENT_ID;
  const client_secret = process.env.STRAVA_CLIENT_SECRET;
  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ client_id, client_secret, refresh_token, grant_type: 'refresh_token' })
  });
  if (!res.ok) throw new Error('Could not refresh Strava token');
  return res.json();
}

export async function POST() {
  const supabase = getSupabaseServerClient();
  if (!supabase) return new NextResponse('Supabase environment variables are missing.', { status: 500 });
  const { data: tokens } = await supabase.from('strava_tokens').select('*').limit(1).maybeSingle();
  if (!tokens) return new NextResponse('Connect Strava first.', { status: 400 });
  let access = tokens.access_token;
  if (tokens.expires_at && tokens.expires_at < Math.floor(Date.now()/1000)) {
    const fresh = await refresh(tokens.refresh_token);
    access = fresh.access_token;
    await supabase.from('strava_tokens').update({ access_token: fresh.access_token, refresh_token: fresh.refresh_token, expires_at: fresh.expires_at }).eq('athlete_id', tokens.athlete_id);
  }
  const res = await fetch('https://www.strava.com/api/v3/athlete/activities?per_page=30', { headers: { authorization: `Bearer ${access}` } });
  if (!res.ok) return new NextResponse('Strava import failed.', { status: 500 });
  const activities = await res.json();
  const runs = activities.filter((a: any) => a.type === 'Run').map((a: any) => ({
    date: String(a.start_date_local || a.start_date).slice(0,10),
    distance_km: Math.round((a.distance / 1000) * 100) / 100,
    duration_seconds: a.moving_time || a.elapsed_time,
    notes: a.name,
    source: 'strava',
    strava_activity_id: String(a.id)
  }));
  return new NextResponse(`Found ${runs.length} Strava runs. The importer endpoint is connected; assign runs to your logged-in user in the next version.`);
}
