/**
 * HUI PRO — Node.js backend
 * - GET  /api/data  → trả về bundle JSON đã lưu (hoặc null nếu chưa có)
 * - POST /api/data  → lưu bundle JSON vào file (atomic write)
 * - /*              → serve static files từ dist/, SPA fallback về index.html
 *
 * Không cần dependencies ngoài — chỉ dùng Node.js built-ins.
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DATA_DIR  = process.env.DATA_DIR  || './data';
const DATA_FILE = path.join(DATA_DIR, 'hui.json');
const DIST_DIR  = path.join(__dirname, 'dist');
const PORT      = Number(process.env.PORT) || 3000;
const API_SECRET = process.env.API_SECRET || '';

if (!API_SECRET) {
  console.warn('[HUI PRO] ⚠️  API_SECRET chưa được đặt — /api/data không được bảo vệ!');
  console.warn('[HUI PRO]    Đặt API_SECRET trong .env để bảo mật dữ liệu.');
}

const MIME = {
  '.html':  'text/html; charset=utf-8',
  '.js':    'application/javascript',
  '.css':   'text/css',
  '.png':   'image/png',
  '.jpg':   'image/jpeg',
  '.jpeg':  'image/jpeg',
  '.svg':   'image/svg+xml',
  '.ico':   'image/x-icon',
  '.woff':  'font/woff',
  '.woff2': 'font/woff2',
  '.json':  'application/json',
};

/** Collect request body as a string */
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end',  ()  => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

/** Serve a file, or fall back to index.html for SPA routing */
function serveFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const isHtml = ext === '.html';
  try {
    const data = fs.readFileSync(filePath);
    res.writeHead(200, {
      'Content-Type':  MIME[ext] || 'application/octet-stream',
      'Cache-Control': isHtml ? 'no-cache, no-store' : 'public, max-age=31536000, immutable',
    });
    res.end(data);
  } catch {
    // File not found → serve index.html (SPA client-side routing)
    try {
      const html = fs.readFileSync(path.join(DIST_DIR, 'index.html'));
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
      res.end(html);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
  }
}

/** Returns true if request carries a valid API key (or no secret is configured). */
function isAuthorized(req) {
  if (!API_SECRET) return true;
  return req.headers['x-api-key'] === API_SECRET;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost`);

  // ── API: GET /api/data ────────────────────────────────────────────────
  if (url.pathname === '/api/data' && req.method === 'GET') {
    res.setHeader('Content-Type', 'application/json');
    if (!isAuthorized(req)) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }
    try {
      if (fs.existsSync(DATA_FILE)) {
        res.writeHead(200);
        res.end(fs.readFileSync(DATA_FILE, 'utf8'));
      } else {
        res.writeHead(200);
        res.end('null'); // no data yet
      }
    } catch (e) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // ── API: POST /api/data ───────────────────────────────────────────────
  if (url.pathname === '/api/data' && req.method === 'POST') {
    res.setHeader('Content-Type', 'application/json');
    if (!isAuthorized(req)) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }
    try {
      const body = await readBody(req);
      JSON.parse(body); // validate: reject malformed JSON early
      fs.mkdirSync(DATA_DIR, { recursive: true });
      // Atomic write: write to .tmp then rename to avoid partial reads
      const tmp = DATA_FILE + '.tmp';
      fs.writeFileSync(tmp, body, 'utf8');
      fs.renameSync(tmp, DATA_FILE);
      res.writeHead(200);
      res.end(JSON.stringify({ ok: true, savedAt: new Date().toISOString() }));
    } catch (e) {
      res.writeHead(400);
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // ── Static files ──────────────────────────────────────────────────────
  const reqPath  = url.pathname === '/' ? '/index.html' : url.pathname;
  const filePath = path.join(DIST_DIR, reqPath);

  // Prevent path traversal
  if (!filePath.startsWith(DIST_DIR)) {
    res.writeHead(403);
    res.end();
    return;
  }

  serveFile(res, filePath);
});

// Ensure data directory exists
fs.mkdirSync(DATA_DIR, { recursive: true });

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[HUI PRO] Server: http://localhost:${PORT}`);
  console.log(`[HUI PRO] Data:   ${DATA_FILE}`);
});
