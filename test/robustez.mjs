// Prueba de los arreglos de estabilidad: reintentos sin duplicar, lecturas en memoria y respuestas grandes.
// Uso: node test/robustez.mjs
import assert from 'node:assert/strict';
import zlib from 'node:zlib';
import { start } from './server.mjs';
import { store } from '../netlify/lib/store.mjs';

const app = await start(8898);
const step = (t) => console.log('✓', t);
let cookie = '';
const call = async (path, body, headers = {}) => {
  const r = await fetch(app.url + '/api/' + path, { method: body ? 'POST' : 'GET', headers: { 'content-type': 'application/json', cookie, ...headers }, body: body && JSON.stringify(body) });
  const sc = r.headers.get('set-cookie'); if (sc) cookie = sc.split(';')[0];
  return r;
};
try {
  await call('setup', { email: 'p@t.com', password: 'secreto123', name: 'P' });
  const r = await (await call('students', { student: { id: 'al1', name: 'Ana', email: 'ana@t.com', plan: [], logs: {}, history: [] } })).json();
  assert.ok(r.code);

  // el mismo envío dos veces (reintento) se guarda una sola vez
  const batch = { bid: 'abc123xyz', ops: [{ k: 's', id: 'al1', op: 'push', p: ['history'], v: { date: '2026-11-27' } }] };
  assert.equal((await call('ops', batch)).status, 200);
  assert.equal((await call('ops', batch)).status, 200);
  let d = await (await call('data')).json();
  assert.equal(d.students[0].history.length, 1);
  assert.equal(d.students[0]._b, undefined);
  // un envío distinto sí se suma
  await call('ops', { ...batch, bid: 'otro12345' });
  d = await (await call('data')).json();
  assert.equal(d.students[0].history.length, 2);
  step('un reintento no duplica cambios');

  // la copia en memoria se actualiza cuando cambia el documento
  await call('ops', { bid: 'tres12345', ops: [{ k: 's', id: 'al1', op: 'set', p: ['goal'], v: 'fuerza' }] });
  d = await (await call('data')).json();
  assert.equal(d.students[0].goal, 'fuerza');
  d.students[0].goal = 'tocado';
  d = await (await call('data')).json();
  assert.equal(d.students[0].goal, 'fuerza');
  step('lecturas en memoria siempre al día');

  // con muchos alumnos la respuesta sale comprimida
  const big = 'x'.repeat(300e3);
  for (let i = 0; i < 8; i++) await store().setJSON('students/big' + i, { id: 'big' + i, name: 'B', relleno: big });
  const res = await call('data', null, { 'accept-encoding': 'gzip' });
  assert.equal(res.headers.get('content-encoding'), 'gzip');
  const raw = Buffer.from(await res.arrayBuffer());
  const parsed = JSON.parse((raw[0] === 0x1f ? zlib.gunzipSync(raw) : raw).toString());
  assert.equal(parsed.students.length, 9);
  step('respuesta grande comprimida');
  console.log('\nTodo OK');
} finally {
  await app.close();
}
