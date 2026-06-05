export type Run = {
  id?: string;
  date: string;
  distance_km: number;
  duration_seconds: number;
  effort?: number | null;
  notes?: string | null;
  source?: string | null;
};

export function paceSecondsPerKm(run: Run) {
  return run.duration_seconds / Math.max(run.distance_km, 0.01);
}

export function formatPace(seconds: number) {
  if (!Number.isFinite(seconds)) return 'n/a';
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}/km`;
}

export function predicted10kSeconds(runs: Run[]) {
  const valid = runs.filter(r => r.distance_km >= 3 && r.duration_seconds > 0);
  if (!valid.length) return 51 * 60 + 30;
  const recent = [...valid].sort((a,b) => b.date.localeCompare(a.date)).slice(0, 6);
  const predictions = recent.map(r => r.duration_seconds * Math.pow(10 / r.distance_km, 1.06));
  return predictions.reduce((a,b) => a + b, 0) / predictions.length;
}

export function generatePlan(runs: Run[]) {
  const pred = predicted10kSeconds(runs);
  const target = 50 * 60;
  const targetPace = target / 10;
  const currentPace = pred / 10;
  const easy = Math.max(currentPace + 65, targetPace + 45);
  const tempo = Math.max(targetPace + 8, currentPace - 8);
  const interval = Math.max(targetPace - 20, currentPace - 25);
  const longKm = Math.min(12, Math.max(7, 6 + Math.floor(runs.length / 3)));
  const gap = pred - target;
  let status = 'Good start. Build consistency before chasing speed.';
  if (gap < 0) status = 'You are trending under 50 minutes. Protect consistency and avoid overcooking easy runs.';
  else if (gap < 90) status = 'You are close. Tempo work and controlled intervals should move the needle.';
  else status = 'The target is realistic, but the priority is regular mileage and one quality session each week.';
  return {
    predicted: pred,
    status,
    workouts: [
      { title: 'Easy run', detail: `35-45 minutes relaxed at about ${formatPace(easy)}. You should be able to talk.` },
      { title: 'Intervals', detail: `Warm up, then 5 x 800m at about ${formatPace(interval)} with 2 minutes easy jog. Cool down.` },
      { title: 'Tempo run', detail: `10 minutes easy, then 20 minutes steady at about ${formatPace(tempo)}, then easy jog home.` },
      { title: 'Long easy run', detail: `${longKm} km easy, no faster than ${formatPace(easy)}.` }
    ]
  };
}
