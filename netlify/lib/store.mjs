// Almacenamiento: Netlify Blobs (viene incluido en Netlify, no hay que activar nada).
// Claves:
//   users/<email>        cuenta de acceso (profe o alumno)
//   students/<id>        todo lo de un alumno (plan, registros, medidas, pagos...)
//   templates/<id>       plantillas de planificación
//   photos/<id>          fotos de progreso (jpg)
//   push/<email>         suscripciones a notificaciones de cada usuario
//   config/secrets       claves internas generadas solas (firma de sesión, claves push)
import { getStore } from '@netlify/blobs';
import crypto from 'node:crypto';

let _store;
export function store() {
  if (!_store) _store = getStore({ name: 'gym', consistency: 'strong' });
  return _store;
}

export const getJSON = (key) => store().get(key, { type: 'json' });
export const setJSON = (key, v) => store().setJSON(key, v);
export const del = (key) => store().delete(key);

export async function listKeys(prefix) {
  const out = [];
  for await (const page of store().list({ prefix, paginate: true })) out.push(...page.blobs.map((b) => b.key));
  return out;
}

export async function listJSON(prefix) {
  const keys = await listKeys(prefix);
  const vals = await Promise.all(keys.map((k) => getJSON(k)));
  return vals.filter(Boolean);
}

// Lee, modifica y guarda un documento sin pisar cambios que lleguen al mismo tiempo.
export async function updateJSON(key, fn, { create = false } = {}) {
  for (let i = 0; i < 8; i++) {
    const cur = await store().getWithMetadata(key, { type: 'json' });
    if (!cur && !create) return null;
    const doc = cur ? cur.data : undefined;
    const next = await fn(doc);
    if (next === undefined) return doc;
    const res = cur
      ? await store().setJSON(key, next, { onlyIfMatch: cur.etag })
      : await store().setJSON(key, next, { onlyIfNew: true });
    if (res.modified !== false) return next;
    await new Promise((r) => setTimeout(r, 40 + Math.random() * 120));
  }
  throw new Error('conflict');
}

let _secrets;
export async function secrets() {
  if (_secrets) return _secrets;
  let s = await getJSON('config/secrets');
  if (!s) {
    const { default: webpush } = await import('web-push');
    const v = webpush.generateVAPIDKeys();
    const fresh = { session: crypto.randomBytes(32).toString('base64url'), vapidPublic: v.publicKey, vapidPrivate: v.privateKey };
    const res = await store().setJSON('config/secrets', fresh, { onlyIfNew: true });
    s = res.modified === false ? await getJSON('config/secrets') : fresh;
  }
  _secrets = s;
  return s;
}
