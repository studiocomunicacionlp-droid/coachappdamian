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

// Reintenta si Netlify Blobs falla un instante (red o límite momentáneo).
export async function retry(fn, tries = 4) {
  for (let i = 0; ; i++) {
    try { return await fn(); } catch (e) {
      if (i >= tries - 1) throw e;
      console.warn('blobs reintento', i + 1, e?.message);
      await new Promise((r) => setTimeout(r, 150 * 2 ** i + Math.random() * 100));
    }
  }
}
export const getJSON = (key) => retry(() => store().get(key, { type: 'json' }));
export const setJSON = (key, v) => retry(() => store().setJSON(key, v));
export const del = (key) => retry(() => store().delete(key));

export async function listKeys(prefix) {
  return (await listEntries(prefix)).map((b) => b.key);
}
const listEntries = (prefix) => retry(async () => {
  const out = [];
  for await (const page of store().list({ prefix, paginate: true })) out.push(...page.blobs);
  return out;
});

// Copia en memoria de cada documento según su versión (etag): mientras la función
// sigue "despierta", no vuelve a bajar los que no cambiaron. Así abrir el panel
// con muchos alumnos es rápido y no se corta por tiempo.
const cache = new Map();
async function getCached(key, etag) {
  const c = cache.get(key);
  if (etag && c && c.etag === etag) return c.data;
  const r = await retry(() => store().getWithMetadata(key, { type: 'json' }));
  if (!r) { cache.delete(key); return null; }
  // se guarda con la versión que dio la lista: si cambió en el medio, la próxima vez se vuelve a leer
  if (etag) cache.set(key, { etag, data: r.data });
  return r.data;
}

// Hace las lecturas de a poco (no todas juntas) para no saturar el almacenamiento.
async function mapLimit(list, n, fn) {
  const out = new Array(list.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, list.length) }, async () => {
    while (i < list.length) { const j = i++; out[j] = await fn(list[j]); }
  }));
  return out;
}

export async function listJSON(prefix) {
  const entries = await listEntries(prefix);
  const vals = await mapLimit(entries, 8, (b) => getCached(b.key, b.etag));
  // devuelve copias, para que nadie modifique la copia guardada en memoria
  return vals.filter(Boolean).map((v) => structuredClone(v));
}

// Lee, modifica y guarda un documento sin pisar cambios que lleguen al mismo tiempo.
export async function updateJSON(key, fn, { create = false } = {}) {
  for (let i = 0; i < 8; i++) {
    const cur = await retry(() => store().getWithMetadata(key, { type: 'json' }));
    if (!cur && !create) return null;
    const doc = cur ? cur.data : undefined;
    const next = await fn(doc);
    if (next === undefined) return doc;
    const res = await retry(() => cur
      ? store().setJSON(key, next, { onlyIfMatch: cur.etag })
      : store().setJSON(key, next, { onlyIfNew: true }));
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
