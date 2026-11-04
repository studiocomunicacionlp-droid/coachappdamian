// Genera los íconos de la app (node tools/icons.mjs). Requiere Playwright.
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');

const html = (size, pad, bg) => `<!doctype html><html><head>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@900&display=block">
<style>html,body{margin:0;width:${size}px;height:${size}px;background:${bg}}
.b{position:absolute;inset:${pad}px;border-radius:${Math.round((size - pad * 2) * 0.24)}px;background:#ffd21a;display:grid;place-items:center}
.t{font-family:'Big Shoulders Display';font-weight:900;color:#0a0a09;font-size:${Math.round((size - pad * 2) * 0.66)}px;line-height:1;letter-spacing:-.02em;transform:translateY(4%)}</style></head>
<body><div class="b"><div class="t">12</div></div></body></html>`;

const badge = (size) => `<!doctype html><html><head>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@900&display=block">
<style>html,body{margin:0;width:${size}px;height:${size}px;background:transparent;display:grid;place-items:center}
.t{font-family:'Big Shoulders Display';font-weight:900;color:#fff;font-size:${Math.round(size * 0.8)}px;line-height:1}</style></head><body><div class="t">12</div></body></html>`;

const out = [
  ['public/icons/icon-192.png', 192, html(192, 0, '#0a0a09')],
  ['public/icons/icon-512.png', 512, html(512, 0, '#0a0a09')],
  ['public/icons/maskable-512.png', 512, html(512, 96, '#0a0a09')],
  ['public/icons/apple-touch-icon.png', 180, html(180, 0, '#0a0a09')],
  ['public/icons/badge-72.png', 72, badge(72)],
];
const b = await chromium.launch();
for (const [file, size, h] of out) {
  const p = await b.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
  await p.setContent(h, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: file, omitBackground: file.includes('badge') });
  await p.close();
}
await b.close();
console.log('ok');
