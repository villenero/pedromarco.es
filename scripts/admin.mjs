import { createServer } from 'node:http';
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(import.meta.url), '../..');
const OBRAS_PATH = join(ROOT, 'obras.json');
const THUMBS_DIR = join(ROOT, 'public/obras/thumbs');
const OBRAS_DIR = join(ROOT, 'public/obras');
const PORT = 4000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.json': 'application/json',
};

let writing = false;

async function readObras() {
  const raw = await readFile(OBRAS_PATH, 'utf-8');
  return JSON.parse(raw);
}

async function writeObras(data) {
  while (writing) await new Promise(r => setTimeout(r, 50));
  writing = true;
  try {
    await writeFile(OBRAS_PATH, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  } finally {
    writing = false;
  }
}

async function parseBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString());
}

function json(res, data, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

async function serveFile(res, filePath) {
  try {
    const data = await readFile(filePath);
    const ext = extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;
  const method = req.method;

  try {
    // Admin HTML
    if (path === '/' || path === '/admin') {
      return serveFile(res, join(ROOT, 'scripts/admin.html'));
    }

    // API: list images
    if (path === '/api/images' && method === 'GET') {
      const files = await readdir(THUMBS_DIR);
      return json(res, files.filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f)).sort());
    }

    // API: list all obras
    if (path === '/api/obras' && method === 'GET') {
      const data = await readObras();
      return json(res, data.obras);
    }

    // API: create obra
    if (path === '/api/obras' && method === 'POST') {
      const obra = await parseBody(req);
      const data = await readObras();
      if (data.obras.some(o => o.id === obra.id)) {
        return json(res, { error: 'Ya existe una obra con ese id' }, 409);
      }
      data.obras.push(obra);
      await writeObras(data);
      return json(res, obra, 201);
    }

    // API: update obra
    const obraMatch = path.match(/^\/api\/obras\/(.+)$/);
    if (obraMatch && method === 'PUT') {
      const id = decodeURIComponent(obraMatch[1]);
      const updated = await parseBody(req);
      const data = await readObras();
      const idx = data.obras.findIndex(o => o.id === id);
      if (idx === -1) return json(res, { error: 'No encontrada' }, 404);
      data.obras[idx] = updated;
      await writeObras(data);
      return json(res, updated);
    }

    // API: delete obra
    if (obraMatch && method === 'DELETE') {
      const id = decodeURIComponent(obraMatch[1]);
      const data = await readObras();
      const idx = data.obras.findIndex(o => o.id === id);
      if (idx === -1) return json(res, { error: 'No encontrada' }, 404);
      data.obras.splice(idx, 1);
      await writeObras(data);
      return json(res, { ok: true });
    }

    // API: reorder obras
    if (path === '/api/obras/reorder' && method === 'PUT') {
      const { ids } = await parseBody(req);
      const data = await readObras();
      const ordered = ids.map(id => data.obras.find(o => o.id === id)).filter(Boolean);
      // Append any obras not in the list (safety)
      for (const o of data.obras) {
        if (!ids.includes(o.id)) ordered.push(o);
      }
      data.obras = ordered;
      await writeObras(data);
      return json(res, { ok: true });
    }

    // Static: thumbnails and full images
    if (path.startsWith('/obras/thumbs/')) {
      return serveFile(res, join(ROOT, 'public', path));
    }
    if (path.startsWith('/obras/')) {
      return serveFile(res, join(ROOT, 'public', path));
    }

    res.writeHead(404);
    res.end('Not found');
  } catch (err) {
    console.error(err);
    res.writeHead(500);
    res.end('Internal server error');
  }
});

server.listen(PORT, () => {
  console.log(`\n  Admin panel: http://localhost:${PORT}\n`);
});
