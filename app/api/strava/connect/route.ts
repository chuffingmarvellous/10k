import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const redirect = `${new URL(req.url).origin}/api/strava/callback`;
  if (!clientId) return new NextResponse('STRAVA_CLIENT_ID is not set in Vercel.', { status: 500 });
  const url = new URL('https://www.strava.com/oauth/authorize');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirect);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('approval_prompt', 'auto');
  url.searchParams.set('scope', 'read,activity:read_all');
  return NextResponse.redirect(url);
}
