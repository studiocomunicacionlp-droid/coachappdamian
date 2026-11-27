// Gestoras: cuentas con acceso a toda la app (igual que el profe). Las crea el profe.
// Se guardan como users/<email> con role 'gestora' y en la lista config/gestoras.
import { getJSON, setJSON, del, updateJSON } from './store.mjs';
import { normEmail, userKey, hashPassword, accessCode } from './auth.mjs';
import { pushKey, notify } from './push.mjs';
import { json, fail, body, EMAIL } from './http.mjs';

export const isStaff = (u) => u?.role === 'profe' || u?.role === 'gestora';

export async function gestoras() {
  return (await getJSON('config/gestoras'))?.list || [];
}

// Avisa al profe y a las gestoras (ej. una inscripción nueva de Summer).
export async function notifyStaff(payload) {
  const cfg = await getJSON('config/profe');
  const emails = [cfg?.email, ...(await gestoras()).map((g) => g.email)].filter(Boolean);
  await Promise.allSettled(emails.map((e) => notify(e, payload)));
}

// Rutas /api/staff (solo el profe).
export async function staffRoutes(req, seg, M, user) {
  if (seg[0] !== 'staff') return null;
  if (user.role !== 'profe') return fail('Solo el profe puede manejar las gestoras', 403);

  if (seg.length === 1 && M === 'GET') return json({ list: await gestoras() });

  if (seg.length === 1 && M === 'POST') {
    const b = await body(req);
    const email = normEmail(b.email), name = String(b.name || '').trim().slice(0, 80);
    if (!name) return fail('Escribí el nombre');
    if (!EMAIL.test(email)) return fail('Ese email no es válido');
    const prev = await getJSON(userKey(email));
    if (prev && !(prev.role === 'alumno' && !(await getJSON('students/' + prev.sid)))) return fail('Ese email ya tiene una cuenta en la app, usá otro', 409);
    const code = accessCode();
    await setJSON(userKey(email), { email, name, role: 'gestora', v: (prev?.v || 0) + 1, ...hashPassword(code) });
    await updateJSON('config/gestoras', (cur) => ({ list: [...(cur?.list || []).filter((g) => g.email !== email), { email, name, at: Date.now(), by: user.name || user.email }] }), { create: true });
    return json({ list: await gestoras(), code });
  }

  if (seg[1] === 'code' && M === 'POST') {
    const email = normEmail((await body(req)).email);
    const u = await getJSON(userKey(email));
    if (!u || u.role !== 'gestora') return fail('Esa gestora no existe', 404);
    const code = accessCode();
    await setJSON(userKey(email), { ...u, ...hashPassword(code), v: (u.v || 0) + 1, fails: 0 });
    return json({ code });
  }

  if (seg.length === 2 && M === 'DELETE') {
    const email = normEmail(decodeURIComponent(seg[1]));
    const u = await getJSON(userKey(email));
    if (u && u.role === 'gestora') await del(userKey(email));
    await del(pushKey(email)).catch(() => {});
    await updateJSON('config/gestoras', (cur) => cur ? { list: (cur.list || []).filter((g) => g.email !== email) } : undefined);
    return json({ list: await gestoras() });
  }
  return fail('No encontrado', 404);
}
