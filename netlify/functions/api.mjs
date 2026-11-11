import crypto from 'node:crypto';
import { getJSON, setJSON, del, store, listJSON, listKeys, updateJSON, secrets, retry } from '../lib/store.mjs';
import { normEmail, userKey, hashPassword, checkPassword, accessCode, sessionCookie, clearCookie, currentUser } from '../lib/auth.mjs';
import { allowed, applyOp, exName } from '../lib/logic.mjs';
import { addSub, removeSub, notify, notifyProfes, pushKey } from '../lib/push.mjs';

export const config = { path: '/api/*' };

const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers } });
const fail = (msg, status = 400) => json({ error: msg }, status);
const ID = /^[A-Za-z0-9_-]{1,40}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const publicUser = (u) => u && { email: u.email, name: u.name || '', role: u.role, sid: u.sid || null };

async function body(req) {
  try { return await req.json(); } catch { return {}; }
}

export default async (req, context) => {
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/api\/?/, '').replace(/\/$/, '');
  const seg = path.split('/');
  const M = req.method;
  try {
    // ---------- sin sesión ----------
    if (path === 'me' && M === 'GET') {
      const u = await currentUser(req);
      const profe = await getJSON('config/profe');
      return json({ user: publicUser(u), needsSetup: !profe });
    }
    if (path === 'setup' && M === 'POST') {
      const b = await body(req);
      const email = normEmail(b.email);
      if (!EMAIL.test(email)) return fail('Escribí un email válido');
      if (String(b.password || '').length < 6) return fail('La contraseña tiene que tener al menos 6 caracteres');
      const res = await store().setJSON('config/profe', { email, at: Date.now() }, { onlyIfNew: true });
      if (res.modified === false) return fail('La cuenta del profe ya fue creada', 409);
      const user = { email, name: String(b.name || '').trim(), role: 'profe', v: 0, ...hashPassword(b.password) };
      await setJSON(userKey(email), user);
      return json({ user: publicUser(user) }, 200, { 'set-cookie': await sessionCookie(user) });
    }
    if (path === 'login' && M === 'POST') {
      const b = await body(req);
      const email = normEmail(b.email);
      const user = await getJSON(userKey(email));
      if (user?.lockUntil && user.lockUntil > Date.now()) return fail('Demasiados intentos. Probá de nuevo en unos minutos.', 429);
      const pw = String(b.password || '').trim();
      if (!user || !(checkPassword(pw, user) || checkPassword(pw.toUpperCase(), user))) {
        if (user) await updateJSON(userKey(email), (u) => { const n = (u.fails || 0) + 1; return { ...u, fails: n >= 8 ? 0 : n, lockUntil: n >= 8 ? Date.now() + 10 * 60e3 : u.lockUntil }; });
        return fail('Email o contraseña incorrectos', 401);
      }
      if (user.fails) await updateJSON(userKey(email), (u) => ({ ...u, fails: 0 }));
      return json({ user: publicUser(user) }, 200, { 'set-cookie': await sessionCookie(user) });
    }
    if (path === 'logout' && M === 'POST') return json({ ok: true }, 200, { 'set-cookie': clearCookie() });

    // ---------- con sesión ----------
    const user = await currentUser(req);
    if (!user) return fail('Tenés que iniciar sesión', 401);
    const profe = user.role === 'profe';

    if (path === 'data' && M === 'GET') {
      if (profe) {
        const [students, templates, content] = await Promise.all([listJSON('students/'), listJSON('templates/'), getJSON('content/main')]);
        students.sort((a, b) => (a.created || 0) - (b.created || 0));
        templates.sort((a, b) => (a.created || 0) - (b.created || 0));
        return json({ students, templates, content });
      }
      const [s, content] = await Promise.all([getJSON('students/' + user.sid), getJSON('content/main')]);
      return json({ students: s ? [s] : [], templates: [], content });
    }

    if (path === 'ops' && M === 'POST') {
      const { ops } = await body(req);
      if (!Array.isArray(ops) || ops.length > 2000) return fail('Pedido inválido');
      for (const op of ops) if (!allowed(user, op)) return fail('No tenés permiso para ese cambio', 403);
      const groups = new Map();
      for (const op of ops) {
        const key = ({ s: 'students/', t: 'templates/', c: 'content/' })[op.k] + op.id;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(op);
      }
      for (const [key, list] of groups) {
        if (list.some((o) => o.op === 'remove')) { await del(key); continue; }
        const isStudent = key.startsWith('students/');
        let before = null, after = null, emailMove = null;
        const res = await updateJSON(key, (doc) => {
          before = doc ? JSON.parse(JSON.stringify(doc)) : null;
          let d = doc ? JSON.parse(JSON.stringify(doc)) : key === 'content/main' ? { id: 'main' } : null;
          for (const op of list) {
            if (op.op === 'put') { d = op.v && typeof op.v === 'object' ? op.v : d; if (d) d.id = list[0].id; continue; }
            if (!d) return undefined; // el documento ya no existe
            d = applyOp(d, op);
          }
          if (!d) return undefined;
          if (!d.created) d.created = before?.created || Date.now();
          after = d;
          return d;
        }, { create: key === 'content/main' || (!isStudent && list.some((o) => o.op === 'put')) });
        if (!res && isStudent) return fail('Ese alumno ya no existe', 404);
        if (isStudent && before && after) {
          if (normEmail(before.email) !== normEmail(after.email)) emailMove = [before.email, after.email];
          await sideEffects(before, after);
        }
        if (emailMove) {
          const err = await moveEmail(emailMove[0], emailMove[1], after.id);
          if (err) {
            await updateJSON(key, (d) => d && { ...d, email: emailMove[0] });
            return fail(err, 409);
          }
        }
      }
      return json({ ok: true });
    }

    // alta de alumno: crea su ficha y su cuenta, y devuelve el código de acceso
    if (path === 'students' && M === 'POST' && profe) {
      const { student } = await body(req);
      if (!student || typeof student !== 'object') return fail('No llegaron los datos del alumno, probá de nuevo');
      if (!ID.test(student.id || '')) student.id = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
      if (!String(student.name || '').trim()) return fail('Escribí el nombre del alumno');
      const email = normEmail(student.email);
      if (!EMAIL.test(email)) return fail('Ese email no es válido. Revisá que esté bien escrito (ej: nombre@gmail.com)');
      const prev = await getJSON(userKey(email));
      if (prev) {
        // cuenta que quedó sola (alumno borrado o alta que se cortó a la mitad): se reutiliza
        const orphan = prev.role === 'alumno' && !(await getJSON('students/' + prev.sid));
        if (!orphan) return fail(prev.role === 'profe' ? 'Ese email es el de la cuenta del profe, usá otro' : 'Ya hay un alumno con ese email', 409);
      }
      const code = accessCode();
      const doc = { ...student, email, created: Date.now() };
      const r = await retry(() => store().setJSON('students/' + student.id, doc, { onlyIfNew: true }));
      if (r && r.modified === false) return fail('Ese alumno ya existe, actualizá la página', 409);
      try {
        await setJSON(userKey(email), { email, name: student.name, role: 'alumno', sid: student.id, v: 0, ...hashPassword(code) });
      } catch (e) {
        await del('students/' + student.id).catch(() => {});
        throw e;
      }
      return json({ student: doc, code });
    }
    if (seg[0] === 'students' && seg[2] === 'code' && M === 'POST' && profe) {
      const s = await getJSON('students/' + seg[1]);
      if (!s) return fail('Ese alumno no existe', 404);
      const code = accessCode();
      const email = normEmail(s.email);
      const cur = await getJSON(userKey(email));
      await setJSON(userKey(email), { email, name: s.name, role: 'alumno', sid: s.id, v: (cur?.v || 0) + 1, ...hashPassword(code) });
      return json({ code });
    }
    if (seg[0] === 'students' && seg.length === 2 && M === 'DELETE' && profe) {
      const s = await getJSON('students/' + seg[1]);
      if (!s) return json({ ok: true });
      const safe = async (what, fn) => { try { await fn(); } catch (e) { console.error('borrar alumno:', what, e); } };
      await del('students/' + s.id);
      if (s.email) {
        await safe('cuenta', async () => { const u = await getJSON(userKey(s.email)); if (u && u.role === 'alumno') await del(userKey(s.email)); });
        await safe('avisos', () => del(pushKey(s.email)));
      }
      await safe('fotos', async () => { const photos = await listKeys('photos/' + s.id + '/'); for (const k of photos) await del(k); });
      return json({ ok: true });
    }

    if (path === 'password' && M === 'POST') {
      const b = await body(req);
      if (!checkPassword(String(b.old || '').trim(), user) && !checkPassword(String(b.old || '').trim().toUpperCase(), user)) return fail('La contraseña actual no es correcta', 401);
      if (String(b.password || '').length < 6) return fail('La contraseña nueva tiene que tener al menos 6 caracteres');
      const next = await updateJSON(userKey(user.email), (u) => ({ ...u, ...hashPassword(b.password), v: (u.v || 0) + 1 }));
      return json({ ok: true }, 200, { 'set-cookie': await sessionCookie(next) });
    }

    // fotos de progreso
    if (path === 'photo' && M === 'POST') {
      const b = await body(req);
      const sid = profe ? b.sid : user.sid;
      if (!ID.test(sid || '')) return fail('Datos inválidos');
      const m = /^data:image\/(jpeg|png|webp);base64,(.+)$/.exec(b.data || '');
      if (!m) return fail('Imagen inválida');
      const buf = Buffer.from(m[2], 'base64');
      if (buf.length > 900e3) return fail('La foto es muy pesada');
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
      await store().set(`photos/${sid}/${id}`, buf, { metadata: { type: 'image/' + m[1] } });
      return json({ url: `/api/photo/${sid}/${id}` });
    }
    if (seg[0] === 'photo' && seg.length === 3 && M === 'GET') {
      const [, sid, id] = seg;
      if (!profe && user.sid !== sid) return fail('No autorizado', 403);
      if (!ID.test(sid) || !ID.test(id)) return fail('No encontrada', 404);
      const r = await store().getWithMetadata(`photos/${sid}/${id}`, { type: 'arrayBuffer' });
      if (!r) return fail('No encontrada', 404);
      return new Response(r.data, { headers: { 'content-type': r.metadata?.type || 'image/jpeg', 'cache-control': 'private, max-age=31536000, immutable' } });
    }

    // notificaciones
    if (path === 'push/key' && M === 'GET') return json({ key: (await secrets()).vapidPublic });
    if (path === 'push/subscribe' && M === 'POST') {
      const { sub } = await body(req);
      if (!sub?.endpoint || !/^https:\/\//.test(sub.endpoint) || !sub.keys?.p256dh || !sub.keys?.auth) return fail('Suscripción inválida');
      await addSub(user.email, sub);
      return json({ ok: true });
    }
    if (path === 'push/unsubscribe' && M === 'POST') {
      const { endpoint } = await body(req);
      if (endpoint) await removeSub(user.email, endpoint);
      return json({ ok: true });
    }
    if (path === 'push/test' && M === 'POST') {
      const n = await notify(user.email, { title: 'Avisos activados', body: 'Así te van a llegar los avisos de la app.', url: '/' });
      return json({ sent: n });
    }

    return fail('No encontrado', 404);
  } catch (e) {
    console.error(e);
    return fail(e.message === 'conflict' ? 'Hubo un cruce de cambios, probá de nuevo' : 'No se pudo guardar por un problema momentáneo. Esperá unos segundos y probá de nuevo.', 500);
  }
};

async function moveEmail(oldEmail, newEmail, sid) {
  const ne = normEmail(newEmail);
  if (!EMAIL.test(ne)) return 'Ese email no es válido';
  const taken = await getJSON(userKey(ne));
  if (taken) return 'Ya hay alguien con ese email';
  const u = await getJSON(userKey(oldEmail));
  if (u) {
    await setJSON(userKey(ne), { ...u, email: ne, sid });
    await del(userKey(oldEmail));
    const p = await getJSON(pushKey(oldEmail));
    if (p) { await setJSON(pushKey(ne), { ...p, email: ne }); await del(pushKey(oldEmail)); }
  }
  return null;
}

// Avisos al instante: comentarios nuevos y esfuerzo alto.
function msgSet(doc) {
  const out = new Map();
  for (const [exId, l] of Object.entries(doc?.logs || {})) (l?.msgs || []).forEach((m, i) => out.set(`${exId}|${i}|${m.from}|${m.text}`, { exId, ...m }));
  return out;
}
async function sideEffects(before, after) {
  const a = msgSet(before), b = msgSet(after);
  const jobs = [];
  for (const [k, m] of b) {
    if (a.has(k)) continue;
    if (m.from === 'alumno') jobs.push(notifyProfes({ title: `${after.name} comentó en ${exName(after, m.exId)}`, body: m.text, url: `/#alumno-${after.id}-prog`, tag: 'msg-' + after.id }));
    if (m.from === 'profe') jobs.push(notify(after.email, { title: 'Tu profe te respondió', body: m.text, url: '/#rutina', tag: 'reply' }));
  }
  for (const [k, v] of Object.entries(after.rpe || {})) {
    if (v >= 9 && before.rpe?.[k] !== v) {
      const [w, d] = k.split('-').map(Number);
      jobs.push(notifyProfes({ title: `${after.name} marcó esfuerzo ${v}/10`, body: `Semana ${w + 1}, día ${d + 1}. Revisá las cargas.`, url: `/#alumno-${after.id}-prog`, tag: 'rpe-' + after.id }));
    }
  }
  await Promise.allSettled(jobs);
}
