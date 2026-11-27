// Corre sola cada 30 minutos y manda el recordatorio de entrenamiento
// a cada alumno a la hora y los días que eligió.
import { listJSON, updateJSON } from '../lib/store.mjs';
import { curWeek, todayIdx, localNow } from '../lib/logic.mjs';
import { notify } from '../lib/push.mjs';

export const config = { schedule: '*/30 * * * *' };

export async function runReminders(now = new Date()) {
  const students = await listJSON('students/');
  let sent = 0;
  for (const s of students) {
    // si falla con un alumno, sigue con los demás
    try { sent += await remindOne(s, now); } catch (e) { console.error('recordatorio', s.id, e?.message); }
  }
  return sent;
}

async function remindOne(s, now) {
  const r = s.remind;
  if (!r?.on || !Array.isArray(r.days) || !r.time || !s.email) return 0;
  const t = localNow(r.tz, now);
  if (!r.days.includes(t.weekday)) return 0;
  const [hh, mm] = String(r.time).split(':').map(Number);
  const at = hh * 60 + (mm || 0);
  // dentro de la hora siguiente a la elegida, y una sola vez por día
  if (t.minutes < at || t.minutes > at + 60) return 0;
  if (r.lastSent === t.date) return 0;
  if ((s.history || []).some((h) => h.date === t.date)) return 0; // ya entrenó hoy
  const cw = curWeek(s), ti = todayIdx(s, cw);
  if (ti < 0) return 0;
  const w = s.plan?.[cw];
  if (!w) return 0;
  const ok = await notify(s.email, { title: `Hoy te toca el Día ${ti + 1}`, body: `Semana ${cw + 1} · ${w.phase}. ¡Vamos!`, url: `/#dia-${cw + 1}-${ti + 1}`, tag: 'remind' });
  await updateJSON('students/' + s.id, (d) => d && { ...d, remind: { ...d.remind, lastSent: t.date } });
  return ok;
}

export default async () => {
  const n = await runReminders();
  console.log('recordatorios enviados:', n);
};
