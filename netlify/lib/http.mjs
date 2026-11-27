// Respuestas JSON compartidas por las rutas de la API.
export const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers } });
export const fail = (msg, status = 400) => json({ error: msg }, status);
export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const ID = /^[A-Za-z0-9_-]{1,40}$/;
export async function body(req) {
  try { return await req.json(); } catch { return {}; }
}
// Quién hizo algo, para dejarlo registrado.
export const who = (u) => ({ email: u.email, name: u.name || u.email, role: u.role });
