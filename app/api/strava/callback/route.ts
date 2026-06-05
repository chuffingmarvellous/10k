import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
export async function GET(req:NextRequest){
 const code=req.nextUrl.searchParams.get('code'); if(!code) return NextResponse.json({error:'No code returned by Strava'}, {status:400});
 const supabase=createRouteHandlerClient({cookies}); const {data:{user}}=await supabase.auth.getUser(); if(!user) return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/?strava=login_required`);
 const res=await fetch('https://www.strava.com/oauth/token',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({client_id:process.env.STRAVA_CLIENT_ID,client_secret:process.env.STRAVA_CLIENT_SECRET,code,grant_type:'authorization_code'})});
 const tok=await res.json(); if(!res.ok) return NextResponse.json(tok,{status:500});
 await supabase.from('strava_tokens').upsert({user_id:user.id,access_token:tok.access_token,refresh_token:tok.refresh_token,expires_at:tok.expires_at,athlete_id:tok.athlete?.id,updated_at:new Date().toISOString()});
 return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/?strava=connected`);
}
