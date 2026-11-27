#!/usr/bin/env node
/**
 * Authorizes the impact page's read-only access to Search Console and Google Analytics once.
 *
 *     node tools/google-auth.mjs path/to/client_secret_….json
 *
 * The client is a Desktop app in the Google Cloud project medipim-marketing-machine. Someone whose Google account
 * can read Search Console and GA4 of www.medipim.com approves in the browser. The client and the refresh token go
 * straight to Railway, never to the terminal; the access token, valid for an hour, goes into .env.local for local
 * testing.
 */
import { spawnSync } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import { chmodSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ENV = join(ROOT, '.env.local');
const SCOPES = ['https://www.googleapis.com/auth/webmasters.readonly', 'https://www.googleapis.com/auth/analytics.readonly'];

const file = process.argv[2];
if (!file) throw new Error('Pass the path of the client JSON.');
const { client_id: clientId, client_secret: clientSecret } = JSON.parse(readFileSync(file, 'utf8')).installed;

function writeEnv(name, value) {
  const lines = existsSync(ENV) ? readFileSync(ENV, 'utf8').split('\n').filter((l) => l && !l.startsWith(`${name}=`)) : [];
  writeFileSync(ENV, [...lines, `${name}=${value}`].join('\n') + '\n');
  chmodSync(ENV, 0o600);
}

const state = randomBytes(24).toString('base64url');
const verifier = randomBytes(48).toString('base64url');
const challenge = createHash('sha256').update(verifier).digest('base64url');

const { code, redirect } = await new Promise((resolve, reject) => {
  const server = createServer((req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    if (url.pathname !== '/') { res.writeHead(404).end(); return; }
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Google answered. You can close this tab.\n');
    server.close();
    if (url.searchParams.get('error')) reject(new Error(`Google refused: ${url.searchParams.get('error')}`));
    else if (url.searchParams.get('state') !== state) reject(new Error('The answer does not belong to this run.'));
    else resolve({ code: url.searchParams.get('code'), redirect: `http://127.0.0.1:${server.address()?.port ?? port}` });
  });
  let port;
  server.listen(0, '127.0.0.1', () => {
    port = server.address().port;
    const auth = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
      client_id: clientId, redirect_uri: `http://127.0.0.1:${port}`, response_type: 'code', scope: SCOPES.join(' '),
      access_type: 'offline', prompt: 'consent', state, code_challenge: challenge, code_challenge_method: 'S256',
    })}`;
    console.log(`Approve in the browser. If it does not open:\n  ${auth}\n`);
    spawnSync('open', [auth]);
  });
});

const res = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, code, code_verifier: verifier, grant_type: 'authorization_code', redirect_uri: redirect }),
});
const tokens = await res.json();
if (!tokens.refresh_token || !tokens.access_token) throw new Error(`Google answered ${res.status} without tokens.`);
const granted = tokens.scope?.split(' ') ?? [];
const missing = SCOPES.filter((s) => !granted.includes(s));
if (missing.length) throw new Error(`Not granted: ${missing.join(', ')}. Tick both boxes and run again.`);

for (const [name, value] of Object.entries({ GOOGLE_CLIENT_ID: clientId, GOOGLE_CLIENT_SECRET: clientSecret, GOOGLE_REFRESH_TOKEN: tokens.refresh_token })) {
  const done = spawnSync('railway', ['variable', 'set', name, '--stdin', '--skip-deploys'], { cwd: ROOT, input: value, stdio: ['pipe', 'ignore', 'inherit'] });
  if (done.status !== 0) throw new Error(`railway could not set ${name}.`);
  console.log(`${name} set on Railway`);
}
writeEnv('GOOGLE_ACCESS_TOKEN', tokens.access_token);
console.log('GOOGLE_ACCESS_TOKEN is in .env.local for local testing; it expires in an hour.');
