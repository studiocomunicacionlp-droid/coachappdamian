// Rutas /api/summer: inscripción de Summer Training, aceptar/rechazar (queda registrado quién y cuándo)
// y armado del programa de 12 semanas.
// Cada inscripto es un students/<id> con el campo `summer` y una cuenta users/<email> de alumno.
import crypto from 'node:crypto';
import { getJSON, setJSON, del, store, retry, updateJSON } from './store.mjs';
import { normEmail, userKey, hashPassword, sessionCookie } from './auth.mjs';
import { notify } from './push.mjs';
import { notifyStaff, isStaff } from './gestoras.mjs';
import { buildPlan, cleanConfig, planLabel, cardioText } from './summer.mjs';
import { json, fail, body, EMAIL, ID, who } from './http.mjs';

const uid = () => Date.now().toString(36) + crypto.randomBytes(4).toString('hex');
const addD = (d, n) => { const x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
const settings = async () => ({ open: true, cupos: 20, ...((await getJSON('content/main'))?.summer || {}) });
const publicUser = (u) => ({ email: u.email, name: u.name || '', role: u.role, sid: u.sid || null });

// Sin sesión: saber si la inscripción está abierta, e inscribirse.
export async function summerPublic(req, seg, M) {
  if (seg[0] !== 'summer') return null;
  if (seg[1] === 'info' && M === 'GET') return json({ open: (await settings()).open !== false });
  if (seg[1] !== 'register' || M !== 'POST') return null;

  const b = await body(req);
  const name = String(b.name || '').trim().slice(0, 80);
  const email = normEmail(b.email);
  const phone = String(b.phone || '').trim().slice(0, 30);
  const password = String(b.password || '');
  if ((await settings()).open === false) return fail('La inscripción a Summer Training está cerrada por ahora', 403);
  if (!name) return fail('Escribí tu nombre y apellido');
  if (!EMAIL.test(email)) return fail('Ese mail no es válido. Revisá que esté bien escrito (ej: nombre@gmail.com)');
  if (password.length < 6) return fail('La contraseña tiene que tener al menos 6 caracteres');
  const prev = await getJSON(userKey(email));
  if (prev) {
    const orphan = prev.role === 'alumno' && !(await getJSON('students/' + prev.sid));
    if (!orphan) return fail('Ese mail ya tiene una cuenta. Tocá “Entrar” y usá tu contraseña o código.', 409);
  }
  const id = uid();
  const doc = {
    id, name, email, phone, created: Date.now(), start: '', goal: 'Summer Training', notes: '',
    plan: [], logs: {}, history: [], rpe: {}, measures: [],
    remind: { on: false, days: [1, 2, 3, 4, 5], time: '18:00', tz: 'America/Argentina/Buenos_Aires' },
    summer: { status: 'pending', registeredAt: Date.now(), log: [{ what: 'inscripción', at: Date.now() }] },
  };
  await retry(() => store().setJSON('students/' + id, doc, { onlyIfNew: true }));
  const user = { email, name, role: 'alumno', sid: id, v: (prev?.v || 0) + 1, ...hashPassword(password) };
  try { await setJSON(userKey(email), user); } catch (e) { await del('students/' + id).catch(() => {}); throw e; }
  await notifyStaff({ title: 'Nueva inscripción a Summer Training', body: `${name} (${email}) espera que la acepten.`, url: '/#summer', tag: 'summer-' + id }).catch(() => {});
  return json({ user: publicUser(user) }, 200, { 'set-cookie': await sessionCookie(user) });
}

// Con sesión.
export async function summerPrivate(req, seg, M, user) {
  if (seg[0] !== 'summer') return null;
  const staff = isStaff(user);

  // aceptar, rechazar o volver a pendiente: solo profe o gestora, y queda registrado quién fue
  if (seg[1] === 'decide' && M === 'POST') {
    if (!staff) return fail('No tenés permiso', 403);
    const { sid, action } = await body(req);
    if (!ID.test(sid || '') || !['accept', 'reject', 'pending'].includes(action)) return fail('Pedido inválido');
    const by = who(user), at = Date.now();
    const next = await updateJSON('students/' + sid, (d) => {
      if (!d?.summer) return undefined;
      const s = { ...d.summer, log: [...(d.summer.log || []), { what: action, by, at }] };
      if (action === 'accept') Object.assign(s, { status: 'accepted', acceptedBy: by, acceptedAt: at });
      if (action === 'reject') Object.assign(s, { status: 'rejected', rejectedBy: by, rejectedAt: at });
      if (action === 'pending') Object.assign(s, { status: 'pending' });
      return { ...d, summer: s };
    });
    if (!next?.summer) return fail('Esa inscripción ya no existe', 404);
    if (action === 'accept') await notify(next.email, { title: '¡Te aceptaron en Summer Training!', body: 'Entrá a la app y armá tu plan de 12 semanas.', url: '/', tag: 'summer-ok' }).catch(() => {});
    return json({ student: next });
  }

  // armar (o, para el profe/gestora, rearmar) el programa
  if (seg[1] === 'setup' && M === 'POST') {
    const b = await body(req);
    const sid = staff ? b.sid : user.sid;
    if (!ID.test(sid || '')) return fail('Pedido inválido');
    const cfg = cleanConfig(b.config);
    if (!cfg) return fail('Completá todas las opciones');
    let err = null;
    const next = await updateJSON('students/' + sid, (d) => {
      if (!d?.summer) { err = ['Esa inscripción ya no existe', 404]; return undefined; }
      if (d.summer.status !== 'accepted') { err = ['Tu inscripción todavía no fue aceptada', 403]; return undefined; }
      if (!staff && d.plan?.length) { err = ['Tu plan ya está armado. Si querés cambiarlo, escribile al profe.', 409]; return undefined; }
      const plan = buildPlan(cfg, uid, d.plan);
      const cardio = cardioText(cfg);
      return {
        ...d, plan, start: cfg.start, goal: planLabel(cfg),
        notes: !d.notes || /^Cardio:/.test(d.notes) ? cardio : d.notes,
        billing: { ...(d.billing || {}), start: cfg.start, end: addD(cfg.start, 84), price: 0, payments: d.billing?.payments || [] },
        summer: { ...d.summer, config: cfg, setupAt: Date.now(), log: [...(d.summer.log || []), { what: d.plan?.length ? 'cambio de plan' : 'plan armado', by: who(user), at: Date.now() }] },
      };
    });
    if (err) return fail(err[0], err[1]);
    if (!next) return fail('Esa inscripción ya no existe', 404);
    return json({ student: next });
  }
  return null;
}
