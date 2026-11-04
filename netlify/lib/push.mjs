import webpush from 'web-push';
import { getJSON, updateJSON, secrets } from './store.mjs';
import { normEmail } from './auth.mjs';

export const pushKey = (email) => 'push/' + encodeURIComponent(normEmail(email));

let ready = false;
async function setup() {
  if (ready) return;
  const s = await secrets();
  webpush.setVapidDetails('mailto:avisos@example.com', s.vapidPublic, s.vapidPrivate);
  ready = true;
}

export async function addSub(email, sub) {
  await updateJSON(pushKey(email), (cur) => {
    const list = (cur?.subs || []).filter((x) => x.endpoint !== sub.endpoint);
    list.push({ endpoint: sub.endpoint, keys: sub.keys, at: Date.now() });
    return { email: normEmail(email), subs: list.slice(-6) };
  }, { create: true });
}
export async function removeSub(email, endpoint) {
  await updateJSON(pushKey(email), (cur) => cur ? { ...cur, subs: (cur.subs || []).filter((x) => x.endpoint !== endpoint) } : undefined);
}

// Manda una notificación a todos los dispositivos de una persona.
export async function notify(email, payload) {
  if (!email) return 0;
  const rec = await getJSON(pushKey(email));
  if (!rec?.subs?.length) return 0;
  await setup();
  let ok = 0;
  const dead = [];
  await Promise.all(rec.subs.map(async (sub) => {
    try {
      await webpush.sendNotification(sub, JSON.stringify(payload), { TTL: 6 * 3600 });
      ok++;
    } catch (e) {
      if (e.statusCode === 404 || e.statusCode === 410) dead.push(sub.endpoint);
      else console.error('push error', e.statusCode, e.body);
    }
  }));
  if (dead.length) await updateJSON(pushKey(email), (cur) => cur ? { ...cur, subs: cur.subs.filter((x) => !dead.includes(x.endpoint)) } : undefined);
  return ok;
}

export async function notifyProfes(payload) {
  const cfg = await getJSON('config/profe');
  if (cfg?.email) await notify(cfg.email, payload);
}
