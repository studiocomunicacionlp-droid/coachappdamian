// Prueba de punta a punta: profe y alumno usando la app al mismo tiempo.
// Uso: NODE_PATH=$(npm root -g) node test/e2e.mjs
import { createRequire } from 'node:module';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { start } from './server.mjs';
const { chromium, devices } = createRequire(import.meta.url)('playwright');

const SHOTS = process.env.SHOTS || '';
const app = await start(8899);
const browser = await chromium.launch();
const errors = [];
const watch = (p, who) => { p.on('pageerror', (e) => errors.push(who + ': ' + e.message)); p.on('console', (m) => m.type() === 'error' && !/Failed to load resource|fonts/.test(m.text()) && errors.push(who + ' console: ' + m.text())); };
const shot = async (p, name) => SHOTS && p.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: false });
const step = (t) => console.log('✓', t);

try {
  // ---- profe crea su cuenta ----
  const pc = await browser.newContext({ viewport: { width: 1200, height: 900 } });
  const P = await pc.newPage(); watch(P, 'profe');
  await P.goto(app.url);
  await P.getByText('Crear cuenta del profe').waitFor();
  await shot(P, '01-setup');
  await P.fill('#lf-name', 'Dami');
  await P.fill('#lf-email', 'Profe@Test.com');
  await P.fill('#lf-pw', 'secreto123');
  await P.click('#lf-go');
  await P.getByText('Alumnos 0').waitFor();
  step('cuenta del profe creada');
  await P.waitForTimeout(800);
  await P.click('[data-tt="plantillas"]');
  await P.getByText('Glúteo 12 semanas').waitFor();
  step('plantillas iniciales creadas');
  await P.click('[data-tt="alumnos"]');

  // ---- alta de alumna ----
  await P.click('#new');
  await P.fill('#nf-name', 'Cintia');
  await P.fill('#nf-email', 'cintia@test.com');
  await P.fill('#nf-goal', 'Glúteo y tren inferior');
  await P.click('#nf-save');
  await P.getByText('Listo, ya puede entrar').waitFor();
  const code = (await P.locator('.drawer .rec-v').textContent()).trim();
  assert.match(code, /^[A-Z2-9]{6}$/);
  await shot(P, '02-codigo');
  step('alumna creada, código ' + code);
  // indicaciones del profe en el plan
  await P.fill('[data-f="weight"] >> nth=0', '40');
  await P.locator('[data-f="weight"] >> nth=0').press('Tab');
  await P.waitForTimeout(900);

  // ---- alumna entra desde el celular ----
  const ac = await browser.newContext({ ...devices['iPhone 13'] });
  const A = await ac.newPage(); watch(A, 'alumna');
  await A.goto(app.url);
  await A.fill('#lf-email', 'CINTIA@test.com ');
  await A.fill('#lf-pw', code.toLowerCase());
  await A.click('#lf-go');
  await A.getByText('Hola, Cintia').waitFor();
  await shot(A, '03-alumna-home');
  step('alumna entra con email y código');
  await A.click('#go');
  await A.getByRole('heading', { name: 'Día 1' }).waitFor();
  const first = A.locator('article.ex').first();
  assert.equal((await first.locator('.rec-v').textContent()).replace(/\s/g, ''), '40kg');
  step('ve el peso indicado por el profe');
  await first.locator('.stepper input').fill('42,5');
  await first.locator('.stepper input').press('Enter');
  await first.locator('.stepper input').blur();
  for (let k = 0; k < 4; k++) { await A.locator('article.ex').first().locator('.set').nth(k).click(); await A.waitForTimeout(80); }
  await A.locator('article.ex').first().locator('[data-c]').click();
  const exId = (await A.locator('article.ex').first().getAttribute('id')).slice(3);
  await A.fill('#m-' + exId, '¿La pausa es arriba o abajo?');
  await A.click(`[data-send="${exId}"]`);
  await A.waitForTimeout(1200);
  await shot(A, '04-alumna-dia');
  step('alumna marca series, peso y comenta');

  // alumna no puede tocar el plan ni ver a otros
  const sec = await A.evaluate(async () => {
    const d = await (await fetch('/api/data')).json();
    const sid = d.students[0].id;
    const r1 = await fetch('/api/ops', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ops: [{ k: 's', id: sid, op: 'set', p: ['plan', 0, 'phase'], v: 'Pico' }] }) });
    const r2 = await fetch('/api/ops', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ops: [{ k: 't', id: 't-glu', op: 'remove', p: [] }] }) });
    const r3 = await fetch('/api/students', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ student: { id: 'x1', email: 'a@b.co' } }) });
    return { n: d.students.length, t: d.templates.length, s1: r1.status, s2: r2.status, s3: r3.status, kg: Object.values(d.students[0].logs)[0]?.kg };
  });
  assert.deepEqual([sec.n, sec.t, sec.s1, sec.s2, sec.s3], [1, 0, 403, 403, 404]);
  assert.equal(sec.kg, 42.5);
  step('permisos: la alumna no puede editar el plan ni plantillas');
  const anon = await (await fetch(app.url + '/api/data')).status;
  assert.equal(anon, 401);
  step('sin sesión no se ve nada');

  // ---- profe ve el aviso y responde ----
  await P.click('#back');
  await P.reload();
  await P.getByText('Cintia comentó en Hip Thrust').waitFor();
  await shot(P, '05-profe-avisos');
  step('profe ve el comentario en Avisos');
  await P.getByText('Cintia comentó en Hip Thrust').click();
  await P.fill('#rp-' + exId, 'Arriba, apretando glúteo 1 segundo.');
  await P.click(`[data-rp="${exId}"]`);
  await P.waitForTimeout(900);
  step('profe responde');

  // ---- alumna recibe respuesta (actualización al volver a la app) ----
  await A.click('#back');
  await A.reload();
  await A.getByText('Tu profe te respondió').waitFor();
  step('alumna ve la respuesta');

  // ---- medidas con foto ----
  await A.click('[data-sec="med"]');
  await A.click('#m-new');
  await A.fill('#mf-weight', '62,4');
  await A.fill('#mf-waist', '71');
  const png = fs.readFileSync('public/icons/icon-512.png');
  await A.setInputFiles('#mf-photo', { name: 'foto.png', mimeType: 'image/png', buffer: png });
  await A.getByText('Foto lista').waitFor();
  await A.click('#mf-save');
  await A.getByText('Medición guardada').waitFor();
  const img = A.locator('.photo img').first();
  await img.waitFor();
  assert.ok(await img.evaluate((i) => i.complete && i.naturalWidth > 0));
  await shot(A, '06-medidas');
  step('medidas y foto guardadas');

  // ---- cambios en paralelo no se pisan ----
  await A.waitForTimeout(1000);
  await P.reload();
  const final = await P.evaluate(async () => (await (await fetch('/api/data')).json()).students[0]);
  assert.equal(final.measures.length, 1);
  assert.ok(final.measures[0].photo.startsWith('/api/photo/'));
  assert.equal(Object.values(final.logs).find((l) => l.msgs)?.msgs.length, 2);
  assert.equal(final.plan[0].days[0].exercises[0].weight, '40');
  step('el servidor tiene todo junto');

  const final0 = final;
  // ---- mentalidad, alimentación y premios ----
  await P.goto(app.url + '/#mentalidad');
  await P.click('#mi-new');
  await P.fill('#mi-title', 'La constancia le gana a la motivación');
  await P.fill('#mi-url', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  await P.fill('#mi-text', 'Miralo antes de entrenar.');
  await P.click('#mi-save');
  await P.click('#mi-new');
  await P.click('[data-mt="text"]');
  await P.fill('#mi-title', 'Regla de los 2 días');
  await P.fill('#mi-text', 'Nunca faltes dos días seguidos.\nSi faltaste ayer, hoy vas.');
  await P.click('#mi-save');
  await P.getByText('Regla de los 2 días').waitFor();
  await shot(P, '08-profe-mentalidad');
  step('profe carga video y texto en Mentalidad');
  await P.click('[data-tt="premios"]');
  await P.click('#rw-new');
  await P.fill('#rw-prize', 'Asesoría 1:1 de 30 minutos');
  await P.selectOption('#rw-type', 'total');
  await P.fill('#rw-prize', 'Asesoría 1:1 de 30 minutos');
  await P.fill('#rw-goal', '1');
  await P.click('#rw-save');
  await P.click('#rw-new');
  await P.fill('#rw-prize', 'Remera del gym');
  await P.click('#rw-save');
  await P.getByText('Remera del gym').waitFor();
  await shot(P, '09-profe-premios');
  step('profe crea premios');
  await P.goto(app.url + '/#alumno-' + final0.id + '-comida');
  await P.fill('#fd-notes', '2 litros de agua por día.');
  await P.locator('#fd-notes').blur();
  await P.click('#fd-add');
  await P.locator('.mealed textarea').last().fill('Avena con banana y café');
  await P.locator('.mealed textarea').last().blur();
  await P.click('#fd-add');
  await P.locator('.mealed textarea').last().fill('Pollo, arroz y ensalada');
  await P.locator('.mealed textarea').last().blur();
  await P.waitForTimeout(900);
  await shot(P, '10-profe-comida');
  step('profe carga el plan de alimentación');

  // alumna: completa el día 1 y gana el premio
  await A.goto(app.url + '/#dia-1-1');
  await A.reload();
  await A.getByRole('heading', { name: 'Día 1' }).waitFor();
  const nEx = await A.locator('article.ex').count();
  for (let i = 0; i < nEx; i++) {
    const sets = A.locator('article.ex').nth(i).locator('.set:not(.on)');
    while (await sets.count()) { await sets.first().click(); await A.waitForTimeout(40); }
  }
  await A.getByText('Día 1 completo').waitFor();
  await A.click('#rest-skip').catch(() => {});
  await A.waitForTimeout(1200);
  await A.click('#back');
  await A.click('[data-sec="premios"]');
  await A.getByText('¡Ganado!').waitFor();
  await shot(A, '11-alumna-premios');
  step('alumna gana el premio al completar el entrenamiento');
  await A.click('[data-sec="mente"]');
  await A.getByText('Regla de los 2 días').waitFor();
  await A.click('[data-yt]');
  await A.locator('.yt iframe').waitFor();
  await shot(A, '12-alumna-mentalidad');
  await A.click('[data-sec="comida"]');
  await A.getByText('Avena con banana y café').waitFor();
  await shot(A, '13-alumna-comida');
  step('alumna ve mentalidad y alimentación');
  const forb = await A.evaluate(async () => (await fetch('/api/ops', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ops: [{ k: 'c', id: 'main', op: 'set', p: ['mind'], v: [] }] }) })).status);
  assert.equal(forb, 403);
  step('alumna no puede tocar el contenido del profe');
  await P.goto(app.url + '/#alumnos');
  await P.reload();
  await P.getByText('Cintia ganó: Asesoría 1:1 de 30 minutos').click();
  await P.click('[data-rg]');
  await P.getByText(/Entregado el/).waitFor();
  await shot(P, '14-profe-entregado');
  step('profe ve el aviso del premio y lo marca entregado');

  // ---- código nuevo invalida el anterior ----
  await P.goto(app.url + '/#alumno-' + final.id + '-data');
  await P.click('#d-code');
  await P.locator('.drawer .rec-v').waitFor();
  await A.reload();
  await A.locator('#lf').waitFor();
  step('al generar código nuevo, la sesión vieja se cierra');

  // ---- recordatorios programados ----
  const { runReminders } = await import('../netlify/functions/reminders.mjs');
  const n = await runReminders(new Date());
  assert.equal(typeof n, 'number');
  step('función de recordatorios corre sin errores');

  await shot(P, '07-profe-datos');
  if (errors.length) { console.log(errors.join('\n')); process.exitCode = 1; } else console.log('\nTodo OK, sin errores en consola');
} catch (e) {
  console.error(e); console.log(errors.join('\n')); process.exitCode = 1;
} finally {
  await browser.close();
  await app.close();
}
