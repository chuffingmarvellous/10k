import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { NextResponse } from 'next/server';

async function refresh(token: any) {
  if (token.expires_at * 1000 > Date.now() + 60000) return token;

  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: token.refresh_token,
    }),
  });

  return await res.json();
}

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }

  const { data: token } = await supabase
    .from('strava_tokens')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!token) {
    return NextResponse.json({ error: 'Strava not connected' }, { status: 400 });
  }

  const t = await refresh(token);

  if (t.access_token !== token.access_token) {
    await supabase.from('strava_tokens').upsert({
      user_id: user.id,
      access_token: t.access_token,
      refresh_token: t.refresh_token,
      expires_at: t.expires_at,
      athlete_id: t.athlete?.id ?? token.athlete_id,
      updated_at: new Date().toISOString(),
    });
  }

  const after = Math.floor((Date.now() - 1000 * 60 * 60 * 24 * 120) / 1000);
  const res = await fetch(`https://www.strava.com/api/v3/athlete/activities?after=${after}&per_page=100`, {
    headers: { Authorization: `Bearer ${t.access_token}` },
  });

  const acts = await res.json();

  if (!res.ok) {
    return NextResponse.json(acts, { status: 500 });
  }

  const runs = acts
    .filter((a: any) => a.type === 'Run')
    .map((a: any) => ({
      user_id: user.id,
      run_date: a.start_date_local.slice(0, 10),
      distance_km: Math.round((a.distance / 1000) * 100) / 100,
      moving_time_seconds: a.moving_time,
      notes: a.name,
      source: 'strava',
      strava_activity_id: a.id,
    }));

  for (const r of runs) {
    await supabase.from('runs').upsert(r, { onConflict: 'strava_activity_id' });
  }

  return NextResponse.json({ imported: runs.length });
}
