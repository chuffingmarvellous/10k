'use client';

import { useEffect, useMemo, useState } from 'react';
import { getSupabaseBrowserClient } from '../lib/supabase';
import { Run, formatPace, generatePlan, paceSecondsPerKm } from '../lib/training';

function secondsFromTime(input: string) {
  const parts = input.split(':').map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return Number(input) || 0;
}

function timeFromSeconds(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function Page() {
  const supabase = getSupabaseBrowserClient();
  const [runs, setRuns] = useState<Run[]>([]);
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0,10), distance: '6', time: '33:00', effort: '5', notes: '' });

  async function load() {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user?.id || null);
    if (!user) return;
    const { data } = await supabase.from('runs').select('*').eq('user_id', user.id).order('date', { ascending: false });
    setRuns((data || []) as Run[]);
  }

  useEffect(() => { load(); }, []);

  const plan = useMemo(() => generatePlan(runs), [runs]);

  async function sendMagicLink() {
    if (!supabase) { setMessage('Supabase is not configured yet. Add the environment variables in Vercel.'); return; }
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
    setMessage(error ? error.message : 'Check your email for the login link.');
  }

  async function addRun() {
    const run = { date: form.date, distance_km: Number(form.distance), duration_seconds: secondsFromTime(form.time), effort: Number(form.effort), notes: form.notes, source: 'manual' };
    if (!userId || !supabase) { setRuns([run, ...runs]); setMessage('Saved on this screen only. Log in to save to the cloud.'); return; }
    const { error } = await supabase.from('runs').insert({ ...run, user_id: userId });
    if (error) setMessage(error.message); else { setMessage('Run saved.'); load(); }
  }

  async function importStrava() {
    setMessage('Importing from Strava...');
    const res = await fetch('/api/strava/import', { method: 'POST' });
    const text = await res.text();
    setMessage(text);
    load();
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify({ exported_at: new Date().toISOString(), runs }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '10k-coach-backup.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  return <main className="wrap">
    <section className="hero">
      <h1>10k Coach</h1>
      <p>Adaptive training for a sub-50 September 10k.</p>
      <div className="stat"><span>Predicted 10k</span><b>{timeFromSeconds(plan.predicted)}</b></div>
      <p>{plan.status}</p>
    </section>

    <section className="card">
      <h2>Login</h2>
      {userId ? <p>Logged in. Your runs are saved to Supabase.</p> : <>
        <input placeholder="email address" value={email} onChange={e => setEmail(e.target.value)} />
        <button onClick={sendMagicLink}>Email me a login link</button>
      </>}
    </section>

    <section className="card">
      <h2>Add run</h2>
      <div className="grid">
        <label>Date<input type="date" value={form.date} onChange={e => setForm({...form, date:e.target.value})}/></label>
        <label>Distance km<input value={form.distance} onChange={e => setForm({...form, distance:e.target.value})}/></label>
        <label>Time mm:ss<input value={form.time} onChange={e => setForm({...form, time:e.target.value})}/></label>
        <label>Effort 1-10<input value={form.effort} onChange={e => setForm({...form, effort:e.target.value})}/></label>
      </div>
      <textarea placeholder="Notes" value={form.notes} onChange={e => setForm({...form, notes:e.target.value})}/>
      <button onClick={addRun}>Save run</button>
      <button className="secondary" onClick={exportJson}>Export backup</button>
      <a className="button secondary" href="/api/strava/connect">Connect Strava</a>
      <button className="secondary" onClick={importStrava}>Import Strava runs</button>
      {message && <p className="msg">{message}</p>}
    </section>

    <section className="card">
      <h2>This week</h2>
      {plan.workouts.map(w => <div className="workout" key={w.title}><b>{w.title}</b><p>{w.detail}</p></div>)}
    </section>

    <section className="card">
      <h2>Run log</h2>
      {!runs.length && <p>No runs yet.</p>}
      {runs.map((r, i) => <div className="run" key={r.id || i}>
        <b>{r.date}</b><span>{r.distance_km} km · {timeFromSeconds(r.duration_seconds)} · {formatPace(paceSecondsPerKm(r))}</span>
        {r.notes && <small>{r.notes}</small>}
      </div>)}
    </section>
  </main>;
}
