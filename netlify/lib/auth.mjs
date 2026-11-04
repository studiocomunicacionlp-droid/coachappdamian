import crypto from 'node:crypto';
import { getJSON, secrets } from './store.mjs';

export const normEmail = (e) => String(e || '').trim().toLowerCase();
export const userKey = (e) => 'users/' + encodeURIComponent(normEmail(e));

export function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString('base64url');
  const hash = crypto.scryptSync(String(pw), salt, 32).toString('base64url');
  return { salt, hash };
}
export function checkPassword(pw, user) {
  if (!user || !user.hash) return false;
  const h = crypto.scryptSync(String(pw), user.salt, 32);
  const want = Buffer.from(user.hash, 'base64url');
  return h.length === want.length && crypto.timingSafeEqual(h, want);
}

// Código de acceso fácil de dictar por WhatsApp (sin letras que se confunden).
export function accessCode() {
  const A = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += A[crypto.randomInt(A.length)];
  return s;
}

const COOKIE = 'gym_s';
const DAYS = 180;

async function sign(payload) {
  const { session } = await secrets();
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const mac = crypto.createHmac('sha256', session).update(body).digest('base64url');
  return body + '.' + mac;
}

export async function sessionCookie(user) {
  const tok = await sign({ e: normEmail(user.email), v: user.v || 0, x: Date.now() + DAYS * 864e5 });
  return `${COOKIE}=${tok}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${DAYS * 86400}`;
}
export const clearCookie = () => `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;

// Devuelve el usuario de la sesión, o null.
export async function currentUser(req) {
  const raw = (req.headers.get('cookie') || '').split(/;\s*/).find((c) => c.startsWith(COOKIE + '='));
  if (!raw) return null;
  const tok = raw.slice(COOKIE.length + 1);
  const [body, mac] = tok.split('.');
  if (!body || !mac) return null;
  const { session } = await secrets();
  const good = crypto.createHmac('sha256', session).update(body).digest();
  const got = Buffer.from(mac, 'base64url');
  if (got.length !== good.length || !crypto.timingSafeEqual(got, good)) return null;
  let p;
  try { p = JSON.parse(Buffer.from(body, 'base64url').toString()); } catch { return null; }
  if (!p.x || p.x < Date.now()) return null;
  const user = await getJSON(userKey(p.e));
  if (!user || (user.v || 0) !== p.v) return null;
  return user;
}
