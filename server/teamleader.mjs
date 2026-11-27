/**
 * Deals created in Teamleader within a period, with their phase, source and value.
 * https://developer.focus.teamleader.eu/docs/authentication
 */
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const TOKEN_URL = 'https://focus.teamleader.eu/oauth2/access_token';
const API_URL = 'https://api.focus.teamleader.eu/';

function notConfigured() {
  return Object.assign(new Error('Teamleader is not connected'), { code: 'not_configured' });
}

/** Each refresh token works once, so the next one must survive a restart: it goes on the volume. */
const tokenFile = () => join(process.env.TOKEN_DIR ?? '/data', 'teamleader.json');

function saved() {
  try {
    return JSON.parse(readFileSync(tokenFile(), 'utf8'));
  } catch {
    return null;
  }
}

function save(tokens) {
  const path = tokenFile();
  if (!existsSync(join(path, '..'))) mkdirSync(join(path, '..'), { recursive: true });
  writeFileSync(`${path}.tmp`, JSON.stringify(tokens), { mode: 0o600 });
  renameSync(`${path}.tmp`, path);
}

let pending = null;

async function accessToken() {
  if (process.env.TEAMLEADER_ACCESS_TOKEN) return process.env.TEAMLEADER_ACCESS_TOKEN;
  const current = saved();
  if (current && current.expires_at > Date.now() + 60_000) return current.access_token;
  const { TEAMLEADER_CLIENT_ID: id, TEAMLEADER_CLIENT_SECRET: secret, TEAMLEADER_REFRESH_TOKEN: initial } = process.env;
  const refresh = current?.refresh_token ?? initial;
  if (!id || !secret || !refresh) throw notConfigured();
  pending ??= (async () => {
    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: new URLSearchParams({ client_id: id, client_secret: secret, refresh_token: refresh, grant_type: 'refresh_token' }),
    });
    const answer = await res.json().catch(() => ({}));
    if (!res.ok || !answer.access_token || !answer.refresh_token) throw new Error(`Teamleader token refresh answered ${res.status}`);
    const tokens = { access_token: answer.access_token, refresh_token: answer.refresh_token, expires_at: Date.now() + (answer.expires_in ?? 3600) * 1000 };
    save(tokens);
    return tokens.access_token;
  })().finally(() => { pending = null; });
  return pending;
}

async function call(endpoint, body) {
  const res = await fetch(API_URL + endpoint, {
    method: 'POST',
    headers: { Authorization: `Bearer ${await accessToken()}`, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Teamleader ${endpoint} answered ${res.status}`);
  return (await res.json()).data ?? [];
}

async function all(endpoint, body) {
  const rows = [];
  for (let number = 1; number <= 50; number++) {
    const page = await call(endpoint, { ...body, page: { size: 100, number } });
    rows.push(...page);
    if (page.length < 100) break;
  }
  return rows;
}

/** Name and country of the companies and contacts the deals are for, a list call per kind. */
async function customers(refs) {
  const ids = (type) => [...new Set(refs.filter((c) => c.type === type).map((c) => c.id))];
  const [companies, contacts] = await Promise.all([
    ids('company').length ? all('companies.list', { filter: { ids: ids('company') } }) : [],
    ids('contact').length ? all('contacts.list', { filter: { ids: ids('contact') } }) : [],
  ]);
  const country = (c) => c.primary_address?.country ?? null;
  return new Map([
    ...companies.map((c) => [c.id, { name: c.name, country: country(c) }]),
    ...contacts.map((c) => [c.id, { name: [c.first_name, c.last_name].filter(Boolean).join(' '), country: country(c) }]),
  ]);
}

export async function teamleader(from, to) {
  const [pipelines, sources] = await Promise.all([call('dealPipelines.list', { page: { size: 100 } }), all('dealSources.list', {})]);
  const phases = (await Promise.all(pipelines.map((p) => call('dealPhases.list', { filter: { deal_pipeline_id: p.id }, page: { size: 100 } }))))
    .flatMap((list, i) => list.map((ph, order) => ({ id: ph.id, name: ph.name, order, pipeline: pipelines[i].name })));
  // Created in the period means updated since its start; the API has no filter on the creation date.
  const deals = (await all('deals.list', { filter: { updated_since: `${from}T00:00:00+00:00` }, sort: [{ field: 'created_at', order: 'desc' }] }))
    .filter((d) => d.created_at.slice(0, 10) >= from && d.created_at.slice(0, 10) <= to);
  const sourceName = new Map(sources.map((s) => [s.id, s.name]));
  const customer = await customers(deals.map((d) => d.lead?.customer).filter(Boolean));
  return {
    phases,
    deals: deals.map((d) => ({
      id: d.id,
      title: d.title,
      customer: customer.get(d.lead?.customer?.id)?.name ?? null,
      country: customer.get(d.lead?.customer?.id)?.country ?? null,
      created: d.created_at.slice(0, 10),
      status: d.status,
      phase: d.current_phase?.id ?? null,
      source: (d.source?.id && sourceName.get(d.source.id)) ?? null,
      value: d.estimated_value?.amount ?? 0,
      url: d.web_url,
    })),
  };
}
