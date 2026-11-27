// Prueba de punta a punta de Summer Training y de la gestora.
// Uso: NODE_PATH=$(npm root -g) node test/summer.mjs   (SHOTS=carpeta para guardar capturas)
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import { start } from './server.mjs';
const { chromium, devices } = createRequire(import.meta.url)('playwright');

const SHOTS = process.env.SHOTS || '';
const app = await start(8898);
const browser = await chromium.launch();
const errors = [];
const watch = (p, who) => { p.on('pageerror', (e) => errors.push(who + ': ' + e.message)); p.on('console', (m) => m.type() === 'error' && !/Failed to load resource|fonts/.test(m.text()) && errors.push(who + ' console: ' + m.text())); };
const shot = async (p, name) => SHOTS && p.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true });
const step = (t) => console.log('✓', t);
const api = (p, path, body, method) => p.evaluate(async ([path, body, method]) => {
  const r = await fetch('/api/' + path, { method: method || (body ? 'POST' : 'GET'), headers: { 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, body: await r.json().catch(() => ({})) };
}, [path, body, method]);

try {
  // ---- profe crea su cuenta y una gestora ----
  const pc = await browser.newContext({ viewport: { width: 1200, height: 900 } });
  const P = await pc.newPage(); watch(P, 'profe');
  await P.goto(app.url);
  await P.getByText('Crear cuenta del profe').waitFor();
  await P.fill('#lf-name', 'Dami'); await P.fill('#lf-email', 'profe@test.com'); await P.fill('#lf-pw', 'secreto123');
  await P.click('#lf-go');
  await P.getByText('Alumnos 0').waitFor();
  await P.click('#g-new');
  await P.fill('#g-name', 'Lucia'); await P.fill('#g-email', 'lucia@test.com');
  await P.click('#g-save');
  await P.getByText('entra con su email y este código').waitFor();
  const gcode = (await P.locator('.drawer .rec-v').last().textContent()).trim();
  assert.match(gcode, /^[A-Z2-9]{6}$/);
  step('profe crea la gestora, código ' + gcode);

  // ---- una persona nueva se inscribe desde el celular ----
  const ac = await browser.newContext({ ...devices['iPhone 13'] });
  const A = await ac.newPage(); watch(A, 'inscripta');
  await A.goto(app.url);
  await A.click('#lf-summer');
  await A.getByText('Inscribite').waitFor();
  await shot(A, 's1-registro');
  await A.fill('#rf-name', 'Ana López'); await A.fill('#rf-email', 'Ana@Mail.com'); await A.fill('#rf-tel', '11 5555 5555'); await A.fill('#rf-pw', 'clave123');
  await A.click('#rf-go');
  await A.getByText('Esperando confirmación').waitFor();
  await shot(A, 's2-espera');
  step('se inscribe y queda pendiente');
  // no puede aceptarse sola ni armarse el plan
  assert.equal((await api(A, 'summer/decide', { sid: 'x', action: 'accept' })).status, 403);
  assert.equal((await api(A, 'summer/setup', { config: { sex: 'F', days: 4, goal: 'dev', level: 'beg', start: '2026-11-30' } })).status, 403);
  const me = (await api(A, 'me')).body.user;
  assert.equal((await api(A, 'ops', { ops: [{ k: 's', id: me.sid, op: 'set', p: ['summer', 'status'], v: 'accepted' }] })).status, 403);
  step('la inscripta no se puede aceptar sola');

  // ---- la gestora entra y acepta ----
  const gc = await browser.newContext({ viewport: { width: 1200, height: 900 } });
  const G = await gc.newPage(); watch(G, 'gestora');
  await G.goto(app.url);
  await G.fill('#lf-email', 'lucia@test.com'); await G.fill('#lf-pw', gcode.toLowerCase());
  await G.click('#lf-go');
  await G.getByText('Gestora', { exact: true }).waitFor();
  assert.equal(await G.locator('#g-new').count(), 0, 'la gestora no crea gestoras');
  await G.click('[data-tt="summer"]');
  await G.getByText('Esperando aprobación').waitFor();
  await G.getByText('Ana López').waitFor();
  await shot(G, 's3-gestora-pendientes');
  await G.click('[data-dec="accept"]');
  await G.getByText('Aceptado por Lucia (Gestora)').waitFor();
  await shot(G, 's4-gestora-aceptado');
  step('la gestora ve la pestaña Summer y acepta (queda su nombre)');
  // no puede falsear quién aceptó
  assert.equal((await api(G, 'ops', { ops: [{ k: 's', id: me.sid, op: 'set', p: ['summer', 'acceptedBy'], v: { name: 'Otro' } }] })).status, 403);

  // ---- la inscripta arma su plan ----
  await A.click('#sum-check');
  await A.getByText('Armá tu plan').waitFor();
  await A.click('[data-c="days"][data-v="3"]');
  await A.click('[data-c="goal"][data-v="dev"]');
  await shot(A, 's5-armar-plan');
  await A.click('#s-go');
  await A.getByText('Hola, Ana López').waitFor();
  await A.getByText('Qué hacer esta semana').waitFor();
  await shot(A, 's6-home');
  const data = (await api(A, 'data')).body.students[0];
  assert.equal(data.plan.length, 12);
  assert.equal(data.plan[0].days.length, 3);
  assert.equal(data.summer.config.level, 'beg');
  assert.ok(data.plan[0].days[0].exercises.every((e) => e.sets === 2), 'principiante: 2 series');
  assert.equal((await api(A, 'summer/setup', { config: { sex: 'F', days: 5, goal: 'dev', level: 'inter', start: '2026-11-30' } })).status, 409);
  step('arma su plan de 12 semanas (Femenino · 3 días · principiante)');
  await A.click('#go');
  await A.getByRole('heading', { name: 'Día 1' }).waitFor();
  await A.locator('article.ex').first().locator('.set').first().click();
  await A.waitForTimeout(900);
  await shot(A, 's7-dia');
  step('entrena el día 1');

  // ---- el profe ve todo separado y quién aceptó ----
  await P.reload();
  await P.getByText('Alumnos 0').waitFor();
  await P.click('[data-tt="summer"]');
  await P.getByText('Aceptado por Lucia (Gestora)').waitFor();
  await P.click('[data-sum]');
  await P.click('.tab[data-t="data"]');
  await P.getByText('Summer Training', { exact: true }).waitFor();
  await P.getByText(/Aceptado por Lucia \(Gestora\) el/).waitFor();
  await P.locator('#sum-det summary').click();
  await P.click('[data-c="level"][data-v="inter"]');
  await P.click('#s-go');
  await P.getByText('Programa guardado').waitFor();
  await shot(P, 's8-profe-ficha');
  const after = (await api(P, 'data')).body.students.find((s) => s.summer);
  assert.equal(after.summer.config.level, 'inter');
  const ex0 = after.plan[0].days[0].exercises[0];
  assert.ok(after.logs[ex0.id], 'se conserva lo registrado');
  step('el profe ve quién aceptó y le sube el nivel sin perder lo registrado');

  // ---- cerrar la inscripción ----
  await P.evaluate(() => { location.hash = 'summer'; });
  await P.locator('#sum-open').uncheck();
  await P.waitForTimeout(900);
  const nc = await browser.newContext();
  const N = await nc.newPage(); watch(N, 'nuevo');
  await N.goto(app.url);
  assert.equal((await api(N, 'summer/info')).body.open, false);
  assert.equal((await api(N, 'summer/register', { name: 'X', email: 'x@x.com', password: '123456' })).status, 403);
  step('con la inscripción cerrada nadie nuevo se anota');

  // ---- quitar la gestora ----
  await P.click('[data-tt="alumnos"]');
  await P.click('[data-gdel="lucia@test.com"]');
  await P.click('[data-gdel="lucia@test.com"]');
  await P.getByText('Gestora quitada').waitFor();
  assert.equal((await api(G, 'data')).status, 401);
  step('al quitar la gestora pierde el acceso');

  if (errors.length) throw new Error('Errores en consola:\n' + errors.join('\n'));
  console.log('\nTodo OK, sin errores en consola');
} catch (e) {
  console.error(e);
  if (errors.length) console.error(errors.join('\n'));
  process.exitCode = 1;
} finally {
  await browser.close();
  await app.close();
}
