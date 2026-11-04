// Servidor local para probar la app sin Netlify: simula Netlify Blobs y las funciones.
// Uso: node test/server.mjs [puerto]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { BlobsServer } from '@netlify/blobs/server';

export async function start(port = 8888, dir = fs.mkdtempSync(path.join(os.tmpdir(), 'blobs-'))) {
  const token = 'local';
  const blobs = new BlobsServer({ directory: dir, token, port: 0 });
  const { port: bport } = await blobs.start();
  globalThis.netlifyBlobsContext = Buffer.from(JSON.stringify({ edgeURL: `http://localhost:${bport}`, uncachedEdgeURL: `http://localhost:${bport}`, token, siteID: 'local' })).toString('base64');
  const api = (await import('../netlify/functions/api.mjs')).default;
  const root = path.resolve('public');
  const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${port}`);
    if (url.pathname.startsWith('/api/')) {
      const chunks = [];
      for await (const c of req) chunks.push(c);
      const body = chunks.length ? Buffer.concat(chunks) : undefined;
      const r = await api(new Request(url, { method: req.method, headers: req.headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : body }), {});
      const h = {};
      r.headers.forEach((v, k) => (h[k] = v));
      res.writeHead(r.status, h);
      res.end(Buffer.from(await r.arrayBuffer()));
      return;
    }
    let f = path.join(root, url.pathname === '/' ? 'index.html' : url.pathname);
    if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(root, 'index.html');
    res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(res);
  });
  await new Promise((r) => server.listen(port, r));
  return { server, blobs, url: `http://localhost:${port}`, close: async () => { server.close(); await blobs.stop(); } };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const s = await start(+process.argv[2] || 8888);
  console.log('App local en', s.url);
}
