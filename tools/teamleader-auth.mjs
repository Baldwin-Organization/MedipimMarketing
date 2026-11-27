#!/usr/bin/env node
/**
 * Authorizes the impact page's own Teamleader connection once.
 *
 *     node tools/teamleader-auth.mjs
 *
 * Reads TEAMLEADER_CLIENT_ID and TEAMLEADER_CLIENT_SECRET from .env.local (the integration the website uses,
 * whose redirect address is http://localhost:8976/teamleader). Someone with a Teamleader account approves in the
 * browser. A refresh token works once and the server keeps the next one, so this one goes straight to Railway and
 * never to the terminal or .env.local. The access token, valid for an hour, goes into .env.local for local testing.
 */
import { spawnSync } from 'node:child_process';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { chmodSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ENV = join(ROOT, '.env.local');
const REDIRECT = 'http://localhost:8976/teamleader';

function readEnv() {
  if (!existsSync(ENV)) return {};
  return Object.fromEntries(readFileSync(ENV, 'utf8').split('\n')
    .map((l) => l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/)).filter(Boolean).map((m) => [m[1], m[2].trim().replace(/^['"]|['"]$/g, '')]));
}

function writeEnv(name, value) {
  const lines = existsSync(ENV) ? readFileSync(ENV, 'utf8').split('\n').filter((l) => l && !l.startsWith(`${name}=`)) : [];
  writeFileSync(ENV, [...lines, `${name}=${value}`].join('\n') + '\n');
  chmodSync(ENV, 0o600);
}

function waitForCode(state) {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url, REDIRECT);
      if (url.pathname !== '/teamleader') { res.writeHead(404).end(); return; }
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Teamleader answered. You can close this tab.\n');
      server.close();
      const q = Object.fromEntries(url.searchParams);
      const given = Buffer.from(q.state ?? '');
      if (q.error) reject(new Error(`Teamleader refused: ${q.error}`));
      else if (given.length !== state.length || !timingSafeEqual(given, Buffer.from(state))) reject(new Error('The answer does not belong to this run.'));
      else resolve(q.code);
    }).listen(8976, '127.0.0.1');
  });
}

const env = readEnv();
const clientId = env.TEAMLEADER_CLIENT_ID;
const clientSecret = env.TEAMLEADER_CLIENT_SECRET;
if (!clientId || !clientSecret) throw new Error('Set TEAMLEADER_CLIENT_ID and TEAMLEADER_CLIENT_SECRET in .env.local.');

const state = randomBytes(24).toString('base64url');
const url = `https://focus.teamleader.eu/oauth2/authorize?${new URLSearchParams({ client_id: clientId, response_type: 'code', redirect_uri: REDIRECT, state })}`;
console.log(`Approve the integration in the browser. If it does not open:\n  ${url}\n`);
spawnSync('open', [url]);
const code = await waitForCode(state);

const res = await fetch('https://focus.teamleader.eu/oauth2/access_token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
  body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, code, grant_type: 'authorization_code', redirect_uri: REDIRECT }),
});
const tokens = await res.json();
if (!tokens.refresh_token || !tokens.access_token) throw new Error(`Teamleader answered ${res.status} without tokens.`);

for (const [name, value] of Object.entries({ TEAMLEADER_CLIENT_ID: clientId, TEAMLEADER_CLIENT_SECRET: clientSecret, TEAMLEADER_REFRESH_TOKEN: tokens.refresh_token })) {
  const done = spawnSync('railway', ['variable', 'set', name, '--stdin', '--skip-deploys'], { cwd: ROOT, input: value, stdio: ['pipe', 'ignore', 'inherit'] });
  if (done.status !== 0) throw new Error(`railway could not set ${name}.`);
  console.log(`${name} set on Railway`);
}
writeEnv('TEAMLEADER_ACCESS_TOKEN', tokens.access_token);
console.log('TEAMLEADER_ACCESS_TOKEN is in .env.local for local testing; it expires in an hour.');
