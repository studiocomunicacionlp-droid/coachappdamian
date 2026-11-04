// Reglas de la app que también necesita el servidor.

const BAD = new Set(['__proto__', 'prototype', 'constructor']);
const STUDENT_PATHS = new Set(['logs', 'history', 'rpe', 'measures', 'remind', 'seen']);

export function allowed(user, op) {
  if (!op || !Array.isArray(op.p) || op.p.some((x) => BAD.has(String(x)))) return false;
  if (!['set', 'del', 'push', 'put', 'remove'].includes(op.op)) return false;
  if (op.k !== 's' && op.k !== 't' && op.k !== 'c') return false;
  if (op.k === 'c' && (op.id !== 'main' || op.op === 'remove')) return false;
  if (typeof op.id !== 'string' || !/^[A-Za-z0-9_-]{1,40}$/.test(op.id)) return false;
  if (user.role === 'profe') {
    // altas y bajas de alumnos van por su propio camino (crean/borran la cuenta)
    return !(op.k === 's' && (op.op === 'put' || op.op === 'remove'));
  }
  if (user.role === 'alumno') {
    return op.k === 's' && op.id === user.sid && ['set', 'del', 'push'].includes(op.op) && STUDENT_PATHS.has(op.p[0]);
  }
  return false;
}

export function applyOp(doc, op) {
  const p = op.p;
  if (op.op === 'put') return op.v;
  if (!p.length) return op.op === 'set' ? op.v : doc;
  let o = doc;
  for (let i = 0; i < p.length - 1; i++) {
    const k = p[i];
    if (o[k] === null || typeof o[k] !== 'object') o[k] = typeof p[i + 1] === 'number' ? [] : {};
    o = o[k];
  }
  const last = p[p.length - 1];
  if (op.op === 'set') o[last] = op.v;
  else if (op.op === 'del') { if (Array.isArray(o)) o.splice(last, 1); else delete o[last]; }
  else if (op.op === 'push') { if (!Array.isArray(o[last])) o[last] = []; o[last].push(op.v); }
  return doc;
}

export function isDone(s, e) {
  const l = s.logs?.[e.id];
  return !!(l && l.sets && l.sets.length >= e.sets && l.sets.slice(0, e.sets).every(Boolean));
}
function wkP(s, w) {
  let a = 0, b = 0;
  w.days.forEach((d) => d.exercises.forEach((e) => { a++; if (isDone(s, e)) b++; }));
  return a ? b / a : 0;
}
export function curWeek(s) {
  const i = (s.plan || []).findIndex((w) => wkP(s, w) < 1);
  return i < 0 ? (s.plan || []).length - 1 : i;
}
export function todayIdx(s, wi) {
  const w = s.plan?.[wi];
  return w ? w.days.findIndex((d) => !(d.exercises.length > 0 && d.exercises.every((e) => isDone(s, e)))) : -1;
}
export function exName(s, exId) {
  for (const w of s.plan || []) for (const d of w.days) for (const e of d.exercises) if (e.id === exId) return e.name;
  return 'un ejercicio';
}

// Fecha y hora local para una zona horaria (por defecto Argentina).
export function localNow(tz, now = new Date()) {
  let zone = tz || 'America/Argentina/Buenos_Aires';
  let parts;
  try {
    parts = new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', weekday: 'short' }).formatToParts(now);
  } catch {
    return localNow('America/Argentina/Buenos_Aires', now);
  }
  const g = (t) => parts.find((x) => x.type === t)?.value;
  const wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(g('weekday'));
  return { date: `${g('year')}-${g('month')}-${g('day')}`, minutes: +g('hour') * 60 + +g('minute'), weekday: wd };
}
