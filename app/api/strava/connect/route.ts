import { NextResponse } from 'next/server';
export async function GET(){
 const clientId=process.env.STRAVA_CLIENT_ID; const site=process.env.NEXT_PUBLIC_SITE_URL;
 if(!clientId||!site) return NextResponse.json({error:'Missing STRAVA_CLIENT_ID or NEXT_PUBLIC_SITE_URL'}, {status:500});
 const redirect=encodeURIComponent(`${site}/api/strava/callback`);
 const scope=encodeURIComponent('read,activity:read_all');
 return NextResponse.redirect(`https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirect}&approval_prompt=auto&scope=${scope}`);
}
