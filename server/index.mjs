/**
 * Serves the built app behind basic auth and answers /api/impact/* from Search Console, Google Analytics and
 * Teamleader, so no key ever reaches the browser. Settings come from the environment (on Railway) or .env.local.
 */
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import { ads, analytics, searchConsole } from './google.mjs';
import { teamleader } from './teamleader.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');

const local = join(ROOT, '.env.local');
if (existsSync(local)) {
  for (const m of readFileSync(local, 'utf8').matchAll(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/gm)) process.env[m[1]] ??= m[2].trim();
}

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json',
};

if (process.env.RAILWAY_ENVIRONMENT && !(process.env.BASIC_AUTH_USER && process.env.BASIC_AUTH_HASH)) {
  throw new Error('Set BASIC_AUTH_USER and BASIC_AUTH_HASH: the app is not served without a login.');
}

/** Checked headers, so bcrypt runs once per login instead of on every request. */
const accepted = new Set();
async function authorized(header) {
  const { BASIC_AUTH_USER: user, BASIC_AUTH_HASH: hash } = process.env;
  if (!user || !hash) return true;
  if (!header?.startsWith('Basic ')) return false;
  if (accepted.has(header)) return true;
  const [name, ...rest] = Buffer.from(header.slice(6), 'base64').toString().split(':');
  const ok = name === user && await bcrypt.compare(rest.join(':'), hash);
  if (ok) accepted.add(header);
  return ok;
}

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const ROUTES = { search: searchConsole, analytics, ads, teamleader };

/** Answers per route and period are kept a quarter of an hour; the sources update a few times a day at most. */
const cache = new Map();
const TTL = 15 * 60 * 1000;

async function api(res, url) {
  const route = ROUTES[url.pathname.replace('/api/impact/', '')];
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  if (!route || !ISO.test(from ?? '') || !ISO.test(to ?? '') || from > to) return send(res, 400, { error: 'bad_request' });
  const key = `${url.pathname}?${from}:${to}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL && url.searchParams.get('fresh') !== '1') return send(res, 200, hit.data);
  try {
    const data = await route(from, to);
    cache.set(key, { at: Date.now(), data });
    send(res, 200, data);
  } catch (err) {
    console.error(JSON.stringify({ route: url.pathname, error: String(err?.message ?? err) }));
    send(res, err?.code === 'not_configured' ? 503 : 502, { error: err?.code ?? 'upstream', message: String(err?.message ?? err) });
  }
}

function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }).end(JSON.stringify(body));
}

function file(res, pathname) {
  let path = normalize(join(DIST, decodeURIComponent(pathname)));
  if (!path.startsWith(DIST + sep) || !existsSync(path) || statSync(path).isDirectory()) {
    if (pathname.startsWith('/assets/')) return res.writeHead(404).end();
    path = join(DIST, 'index.html');
  }
  if (!existsSync(path)) return res.writeHead(404).end();
  res.writeHead(200, {
    'Content-Type': TYPES[extname(path)] ?? 'application/octet-stream',
    'Cache-Control': pathname.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache',
    'X-Content-Type-Options': 'nosniff',
  });
  createReadStream(path).pipe(res);
}

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/health') return res.writeHead(200).end();
  if (!(await authorized(req.headers.authorization))) {
    return res.writeHead(401, { 'WWW-Authenticate': 'Basic realm="Medipim Marketing"' }).end();
  }
  if (url.pathname.startsWith('/api/impact/')) return api(res, url);
  if (req.method !== 'GET' && req.method !== 'HEAD') return res.writeHead(405).end();
  file(res, url.pathname);
}).listen(Number(process.env.PORT ?? 8787), () => console.log(`listening on ${process.env.PORT ?? 8787}`));
