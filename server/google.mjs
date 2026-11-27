/**
 * Search Console and Google Analytics (GA4), read-only, through the OAuth client of the Google Cloud project
 * medipim-marketing-machine and a refresh token from `tools/google-auth.mjs`.
 */
const SITE = 'https://www.medipim.com/';

function notConfigured(what) {
  return Object.assign(new Error(`${what} is not connected`), { code: 'not_configured' });
}

let token = null;

async function accessToken() {
  if (process.env.GOOGLE_ACCESS_TOKEN) return process.env.GOOGLE_ACCESS_TOKEN;
  if (token && token.expires > Date.now() + 60_000) return token.value;
  const { GOOGLE_CLIENT_ID: id, GOOGLE_CLIENT_SECRET: secret, GOOGLE_REFRESH_TOKEN: refresh } = process.env;
  if (!id || !secret || !refresh) throw notConfigured('Google');
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: id, client_secret: secret, refresh_token: refresh, grant_type: 'refresh_token' }),
  });
  const answer = await res.json().catch(() => ({}));
  if (!res.ok || !answer.access_token) throw new Error(`Google token refresh answered ${res.status}: ${answer.error ?? ''}`);
  token = { value: answer.access_token, expires: Date.now() + answer.expires_in * 1000 };
  return token.value;
}

async function post(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${await accessToken()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const answer = await res.json().catch(() => ({}));
  if (res.status === 403) throw Object.assign(new Error(answer.error?.message ?? 'No access'), { code: 'no_access' });
  if (!res.ok) throw new Error(`${url} answered ${res.status}: ${answer.error?.message ?? ''}`);
  return answer;
}

const DAY = 86_400_000;
const iso = (ms) => new Date(ms).toISOString().slice(0, 10);

/** The period of the same length right before, to compare with. */
export function previousPeriod(from, to) {
  const start = Date.parse(from);
  const days = (Date.parse(to) - start) / DAY + 1;
  return { from: iso(start - days * DAY), to: iso(start - DAY) };
}

async function gsc(from, to, dimensions, rowLimit = 25000) {
  const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE)}/searchAnalytics/query`;
  const answer = await post(url, { startDate: from, endDate: to, dimensions, rowLimit, dataState: 'all' });
  return (answer.rows ?? []).map((r) => ({ key: r.keys ?? [], clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position }));
}

export async function searchConsole(from, to) {
  const before = previousPeriod(from, to);
  const [days, total, totalBefore, queries, queriesBefore] = await Promise.all([
    gsc(from, to, ['date']),
    gsc(from, to, []),
    gsc(before.from, before.to, []),
    gsc(from, to, ['query'], 50),
    gsc(before.from, before.to, ['query'], 1000),
  ]);
  const earlier = new Map(queriesBefore.map((q) => [q.key[0], q.position]));
  const sum = (rows) => rows[0] ?? { clicks: 0, impressions: 0, ctr: 0, position: 0 };
  return {
    site: SITE,
    total: sum(total),
    previous: sum(totalBefore),
    days: days.map((d) => ({ date: d.key[0], clicks: d.clicks, impressions: d.impressions, position: d.position })),
    queries: queries.map((q) => ({ query: q.key[0], clicks: q.clicks, impressions: q.impressions, position: q.position, before: earlier.get(q.key[0]) ?? null })),
  };
}

/** The GA4 property "Medipim - LIVE - GA4", the stream of www.medipim.com since 2021. */
const ga4Property = () => process.env.GA4_PROPERTY_ID ?? '270238929';

async function report(id, from, to, dimensions, metrics, limit) {
  const answer = await post(`https://analyticsdata.googleapis.com/v1beta/properties/${id}:runReport`, {
    dateRanges: [{ startDate: from, endDate: to }],
    dimensions: dimensions.map((name) => ({ name })),
    metrics: metrics.map((name) => ({ name })),
    ...(limit && { limit, orderBys: [{ metric: { metricName: metrics[0] }, desc: true }] }),
  });
  return (answer.rows ?? []).map((r) => ({
    key: r.dimensionValues?.map((d) => d.value) ?? [],
    values: Object.fromEntries(metrics.map((m, i) => [m, Number(r.metricValues[i].value)])),
  }));
}

const METRICS = ['sessions', 'totalUsers', 'keyEvents'];

export async function analytics(from, to) {
  const id = ga4Property();
  const before = previousPeriod(from, to);
  const [days, total, totalBefore, channels, pages, countries] = await Promise.all([
    report(id, from, to, ['date'], METRICS),
    report(id, from, to, [], METRICS),
    report(id, before.from, before.to, [], METRICS),
    report(id, from, to, ['sessionDefaultChannelGroup'], METRICS, 12),
    report(id, from, to, ['landingPagePlusQueryString'], METRICS, 15),
    report(id, from, to, ['countryId'], METRICS, 15),
  ]);
  const empty = { sessions: 0, totalUsers: 0, keyEvents: 0 };
  const row = (r) => ({ ...r.values });
  return {
    property: id,
    total: total[0]?.values ?? empty,
    previous: totalBefore[0]?.values ?? empty,
    days: days.map((d) => ({ date: `${d.key[0].slice(0, 4)}-${d.key[0].slice(4, 6)}-${d.key[0].slice(6)}`, ...row(d) })).sort((a, b) => a.date.localeCompare(b.date)),
    channels: channels.map((c) => ({ channel: c.key[0], ...row(c) })),
    pages: pages.map((p) => ({ page: p.key[0], ...row(p) })),
    countries: countries.map((c) => ({ country: c.key[0], ...row(c) })),
  };
}
