import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Button, Card, EmptyState, Icon, Pill, Stat, TypeBadge } from '../components/ui';
import { euro } from '../data/budget';
import { countryName } from '../data/dimensions';
import {
  actionsIn, bySource, change, daysOf, fetchSource, funnel, perWeek,
  type AnalyticsData, type SearchData, type Source, type TeamleaderData,
} from '../data/impact';
import { useStore } from '../data/store';
import type { IsoDate, Item } from '../data/types';
import { itemTitle, t } from '../i18n';
import { useUi } from '../ui-context';
import { PageHeader } from './PageHeader';

/** Teamleader is followed from the start of November 2026, when the website began sending its requests there. */
export const IMPACT_FROM: IsoDate = '2026-11-01';

const num = (n: number, digits = 0) => n.toLocaleString(t.numberLocale, { maximumFractionDigits: digits, minimumFractionDigits: digits });
const pct = (n: number) => `${num(n * 100, 1)}%`;

function useSources(from: IsoDate, to: IsoDate) {
  const [search, setSearch] = useState<Source<SearchData>>({ state: 'loading' });
  const [analytics, setAnalytics] = useState<Source<AnalyticsData>>({ state: 'loading' });
  const [teamleader, setTeamleader] = useState<Source<TeamleaderData>>({ state: 'loading' });
  const load = useCallback((fresh = false) => {
    setSearch({ state: 'loading' });
    setAnalytics({ state: 'loading' });
    setTeamleader({ state: 'loading' });
    fetchSource<SearchData>('search', from, to, fresh).then(setSearch);
    fetchSource<AnalyticsData>('analytics', from, to, fresh).then(setAnalytics);
    fetchSource<TeamleaderData>('teamleader', from, to, fresh).then(setTeamleader);
  }, [from, to]);
  useEffect(() => { load(); }, [load]);
  return { search, analytics, teamleader, reload: () => load(true) };
}

export function ImpactView() {
  const store = useStore();
  const [from, setFrom] = useState<IsoDate>(IMPACT_FROM);
  const [to, setTo] = useState<IsoDate>(store.today);
  const { search, analytics, teamleader, reload } = useSources(from, to);
  const actions = actionsIn(store.items, from, to);
  const valid = from <= to;

  return (
    <div className="mc-page">
      <PageHeader
        title={t.impact.title}
        subtitle={t.impact.subtitle}
        actions={
          <div className="mc-impact-period">
            <label>
              <span>{t.impact.from}</span>
              <input type="date" className="mc-input" value={from} max={to} onChange={(e) => e.target.value && setFrom(e.target.value)} />
            </label>
            <label>
              <span>{t.impact.to}</span>
              <input type="date" className="mc-input" value={to} min={from} max={store.today} onChange={(e) => e.target.value && setTo(e.target.value)} />
            </label>
            <Button variant="outlined" intent="secondary" startIcon="refresh" onClick={reload} disabled={!valid}>{t.impact.refresh}</Button>
          </div>
        }
      />

      <div className="mc-stats">
        <Stat label={t.impact.newDeals} icon="sell" tone="brand"
          value={teamleader.state === 'ready' ? num(teamleader.data.deals.length) : '–'}
          hint={teamleader.state === 'ready' ? t.impact.dealValue(euro(teamleader.data.deals.reduce((n, d) => n + d.value, 0))) : t.impact.source.teamleader} />
        <Stat label={t.impact.clicks} icon="query_stats" tone="neutral"
          value={search.state === 'ready' ? num(search.data.total.clicks) : '–'}
          hint={search.state === 'ready' ? changeText(search.data.total.clicks, search.data.previous.clicks) : t.impact.source.search} />
        <Stat label={t.impact.sessions} icon="monitoring" tone="neutral"
          value={analytics.state === 'ready' ? num(analytics.data.total.sessions) : '–'}
          hint={analytics.state === 'ready' ? changeText(analytics.data.total.sessions, analytics.data.previous.sessions) : t.impact.source.analytics} />
        <Stat label={t.impact.keyEvents} icon="flag" tone="neutral"
          value={analytics.state === 'ready' ? num(analytics.data.total.keyEvents) : '–'}
          hint={analytics.state === 'ready' ? changeText(analytics.data.total.keyEvents, analytics.data.previous.keyEvents) : t.impact.source.analytics} />
      </div>

      <Card title={t.impact.teamleaderTitle} icon="sell">
        <SourceState source={teamleader} name={t.impact.source.teamleader}>
          {(data) => <TeamleaderPanel data={data} from={from} to={to} />}
        </SourceState>
      </Card>

      <Card title={t.impact.searchTitle} icon="query_stats">
        <SourceState source={search} name={t.impact.source.search}>
          {(data) => <SearchPanel data={data} from={from} to={to} actions={actions} />}
        </SourceState>
      </Card>

      <Card title={t.impact.analyticsTitle} icon="monitoring">
        <SourceState source={analytics} name={t.impact.source.analytics}>
          {(data) => <AnalyticsPanel data={data} from={from} to={to} actions={actions} />}
        </SourceState>
      </Card>
    </div>
  );
}

function changeText(now: number, before: number, lowerIsBetter = false) {
  const c = change(now, before);
  if (c === null) return t.impact.noComparison;
  return t.impact.vsPrevious(`${c > 0 ? '+' : ''}${pct(lowerIsBetter ? -c : c)}`);
}

function SourceState<T>({ source, name, children }: { source: Source<T>; name: string; children: (data: T) => ReactNode }) {
  if (source.state === 'loading') return <div className="mc-skeleton" aria-busy="true" />;
  if (source.state === 'ready') return <>{children(source.data)}</>;
  const text = source.state === 'not_configured' ? t.impact.notConfigured(name)
    : source.state === 'no_access' ? t.impact.noAccess(name)
    : t.impact.failed(name);
  return (
    <EmptyState icon="warning" title={text}>
      {source.state === 'no_access' ? t.impact.grantAccess : source.message}
    </EmptyState>
  );
}

function TeamleaderPanel({ data, from, to }: { data: TeamleaderData; from: IsoDate; to: IsoDate }) {
  const stages = funnel(data);
  const max = Math.max(1, ...stages.map((s) => s.count));
  const sources = bySource(data.deals);
  const missing = data.deals.filter((d) => !d.source).length;
  const weeks = perWeek(data.deals.map((d) => d.created), from, to);
  const phaseName = new Map(data.phases.map((p) => [p.id, p.name]));
  if (!data.deals.length) return <EmptyState icon="sell" title={t.impact.noDeals} />;
  return (
    <div className="mc-impact-panel">
      <div className="mc-impact-columns">
        <section>
          <h3 className="mc-impact-sub">{t.impact.perPhase}</h3>
          <ul className="mc-breakdown">
            {stages.map((s) => (
              <li key={s.phase.id}>
                <span>{s.phase.name}</span>
                <span className="mc-num">{num(s.count)} · {euro(s.value)}</span>
                <span className="mc-budget-bar"><span data-kind="actual" style={{ width: `${(s.count / max) * 100}%` }} /></span>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h3 className="mc-impact-sub">{t.impact.perSource}</h3>
          <ul className="mc-impact-list">
            {sources.map((s) => (
              <li key={s.source ?? 'none'}><span className={s.source ? '' : 'mc-muted'}>{s.source ?? t.impact.noSource}</span><span className="mc-num">{num(s.count)}</span></li>
            ))}
          </ul>
          {missing > 0 && <p className="mc-impact-note"><Icon name="warning" size={16} />{t.impact.missingSource(missing, data.deals.length)}</p>}
        </section>
        <section>
          <h3 className="mc-impact-sub">{t.impact.perWeek}</h3>
          <Bars values={weeks.map((w) => ({ key: w.week, value: w.count, label: t.impact.weekOf(w.week, w.count) }))} />
        </section>
      </div>
      <div className="mc-table-wrap">
        <table className="mc-table" aria-label={t.impact.dealsTable}>
          <thead>
            <tr><th>{t.impact.created}</th><th>{t.impact.customer}</th><th>{t.impact.deal}</th><th>{t.impact.phase}</th><th>{t.impact.sourceCol}</th><th className="mc-num">{t.impact.value}</th></tr>
          </thead>
          <tbody>
            {data.deals.map((d) => (
              <tr key={d.id}>
                <td className="mc-nowrap">{d.created}</td>
                <td className={d.customer ? '' : 'mc-muted'}>{d.customer ?? '–'}</td>
                <td><a href={d.url} target="_blank" rel="noreferrer" className="mc-impact-link">{d.title}<Icon name="open_in_new" size={14} /></a></td>
                <td>{(d.phase && phaseName.get(d.phase)) ?? '–'}{d.status === 'won' && <> <Pill tone="success">{t.impact.won}</Pill></>}{d.status === 'lost' && <> <Pill tone="error">{t.impact.lost}</Pill></>}</td>
                <td className={d.source ? '' : 'mc-muted'}>{d.source ?? t.impact.noSource}</td>
                <td className="mc-num">{euro(d.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SearchPanel({ data, from, to, actions }: { data: SearchData; from: IsoDate; to: IsoDate; actions: Item[] }) {
  const { total, previous } = data;
  const byDay = new Map(data.days.map((d) => [d.date, d.clicks]));
  return (
    <div className="mc-impact-panel">
      <dl className="mc-impact-figures">
        <Figure label={t.impact.clicks} value={num(total.clicks)} hint={changeText(total.clicks, previous.clicks)} />
        <Figure label={t.impact.impressions} value={num(total.impressions)} hint={changeText(total.impressions, previous.impressions)} />
        <Figure label={t.impact.ctr} value={pct(total.ctr)} hint={changeText(total.ctr, previous.ctr)} />
        <Figure label={t.impact.position} value={num(total.position, 1)} hint={changeText(total.position, previous.position, true)} />
      </dl>
      <DailyChart title={t.impact.clicksPerDay} from={from} to={to} values={byDay} actions={actions} note={t.impact.searchLag} />
      <div className="mc-table-wrap">
        <table className="mc-table" aria-label={t.impact.topQueries}>
          <thead>
            <tr><th>{t.impact.query}</th><th className="mc-num">{t.impact.clicks}</th><th className="mc-num">{t.impact.impressions}</th><th className="mc-num">{t.impact.position}</th><th className="mc-num">{t.impact.positionChange}</th></tr>
          </thead>
          <tbody>
            {data.queries.map((q) => <tr key={q.query}>
              <td>{q.query}</td>
              <td className="mc-num">{num(q.clicks)}</td>
              <td className="mc-num">{num(q.impressions)}</td>
              <td className="mc-num">{num(q.position, 1)}</td>
              <td className="mc-num"><PositionChange now={q.position} before={q.before} /></td>
            </tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** A lower position is better, so moving from 8 to 5 is a gain of 3. */
function PositionChange({ now, before }: { now: number; before: number | null }) {
  if (before === null) return <span className="mc-muted">{t.impact.newQuery}</span>;
  const gain = before - now;
  if (Math.abs(gain) < 0.5) return <span className="mc-muted"><Icon name="trending_flat" size={16} /></span>;
  return (
    <span className="mc-impact-change" data-up={gain > 0 || undefined}>
      <Icon name={gain > 0 ? 'trending_up' : 'trending_down'} size={16} />{num(Math.abs(gain), 1)}
    </span>
  );
}

function AnalyticsPanel({ data, from, to, actions }: { data: AnalyticsData; from: IsoDate; to: IsoDate; actions: Item[] }) {
  const { total, previous } = data;
  const byDay = new Map(data.days.map((d) => [d.date, d.sessions]));
  return (
    <div className="mc-impact-panel">
      <dl className="mc-impact-figures">
        <Figure label={t.impact.sessions} value={num(total.sessions)} hint={changeText(total.sessions, previous.sessions)} />
        <Figure label={t.impact.users} value={num(total.totalUsers)} hint={changeText(total.totalUsers, previous.totalUsers)} />
        <Figure label={t.impact.keyEvents} value={num(total.keyEvents)} hint={changeText(total.keyEvents, previous.keyEvents)} />
      </dl>
      <DailyChart title={t.impact.sessionsPerDay} from={from} to={to} values={byDay} actions={actions} />
      <div className="mc-impact-columns">
        <MetricTable title={t.impact.channels} rows={data.channels.map((c) => ({ key: c.channel, ...c }))} />
        <MetricTable title={t.impact.countries} rows={data.countries.map((c) => ({ key: c.country === '(not set)' ? c.country : countryName(c.country), ...c }))} />
      </div>
      <MetricTable title={t.impact.landingPages} rows={data.pages.map((p) => ({ key: p.page, ...p }))} />
    </div>
  );
}

function MetricTable({ title, rows }: { title: string; rows: { key: string; sessions: number; keyEvents: number }[] }) {
  return (
    <section>
      <h3 className="mc-impact-sub">{title}</h3>
      <div className="mc-table-wrap">
        <table className="mc-table" aria-label={title}>
          <thead><tr><th>{title}</th><th className="mc-num">{t.impact.sessions}</th><th className="mc-num">{t.impact.keyEvents}</th></tr></thead>
          <tbody>
            {rows.map((r) => <tr key={r.key}><td className="mc-impact-key">{r.key}</td><td className="mc-num">{num(r.sessions)}</td><td className="mc-num">{num(r.keyEvents)}</td></tr>)}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Figure({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="mc-impact-figure">
      <dt>{label}</dt>
      <dd>{value}</dd>
      <dd className="mc-muted">{hint}</dd>
    </div>
  );
}

function Bars({ values }: { values: { key: string; value: number; label: string }[] }) {
  const max = Math.max(1, ...values.map((v) => v.value));
  return (
    <div className="mc-impact-bars" role="img" aria-label={values.map((v) => v.label).join(', ')}>
      {values.map((v) => <span key={v.key} title={v.label} style={{ height: `${(v.value / max) * 100}%` }} data-empty={!v.value || undefined} />)}
    </div>
  );
}

/** A bar per day, with the planner's actions marked underneath on their start day. */
function DailyChart({ title, from, to, values, actions, note }: { title: string; from: IsoDate; to: IsoDate; values: Map<IsoDate, number>; actions: Item[]; note?: string }) {
  const { openItem } = useUi();
  const days = daysOf(from, to);
  const onDay = (day: IsoDate) => actions.filter((a) => a.date === day);
  return (
    <section>
      <h3 className="mc-impact-sub">{title}</h3>
      <Bars values={days.map((d) => ({ key: d, value: values.get(d) ?? 0, label: `${d}: ${num(values.get(d) ?? 0)}` }))} />
      <div className="mc-impact-marks" style={{ gridTemplateColumns: `repeat(${days.length}, 1fr)` }}>
        {days.map((d) => {
          const list = onDay(d);
          return (
            <span key={d}>
              {list.length > 0 && (
                <button type="button" className="mc-impact-mark" title={list.map((i) => `${d} · ${itemTitle(i)}`).join('\n')} aria-label={list.map((i) => itemTitle(i)).join(', ')} onClick={() => openItem(list[0].id)}>
                  <TypeBadge type={list[0].type} />
                </button>
              )}
            </span>
          );
        })}
      </div>
      <p className="mc-muted mc-impact-caption">
        <span>{days[0]}</span>
        <span>{actions.length ? t.impact.marks(actions.length) : t.impact.noActions}{note ? ` · ${note}` : ''}</span>
        <span>{days.at(-1)}</span>
      </p>
    </section>
  );
}
