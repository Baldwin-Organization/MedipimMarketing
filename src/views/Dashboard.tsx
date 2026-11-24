import { Link } from 'react-router-dom';
import { groupByUrgency } from '../components/TodayPanel';
import { ItemChip, TodoEntry } from '../components/entries';
import { Button, Card, EmptyState, Icon, StatusPill, TypeBadge } from '../components/ui';
import { daysBetween, fmt, relativeDay, shiftIso } from '../data/dates';
import { useStore } from '../data/store';
import { useUi } from '../ui-context';
import { PageHeader } from './PageHeader';

export function Dashboard() {
  const store = useStore();
  const { openItem } = useUi();
  const { today } = store;
  const horizon = shiftIso(today, 13);
  const groups = groupByUrgency(store.todos, today);
  const upcoming = store.items
    .filter((i) => i.date >= today && i.date <= horizon)
    .sort((a, b) => (a.date + (a.time ?? '')).localeCompare(b.date + (b.time ?? '')));
  const events = store.items
    .filter((i) => i.type === 'event' && (i.endDate ?? i.date) >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 4);

  const byDay = new Map<string, typeof upcoming>();
  upcoming.forEach((i) => byDay.set(i.date, [...(byDay.get(i.date) ?? []), i]));

  return (
    <div className="mc-page">
      <PageHeader
        title="Dashboard"
        subtitle={`${greeting()}. Vandaag is het ${fmt(today, 'EEEE d MMMM yyyy')}.`}
        actions={<Button startIcon="add" onClick={() => openItem()}>Nieuw item</Button>}
      />

      <div className="mc-stats">
        <Stat label="Te laat" value={groups.late.length} tone="error" icon="warning" hint="Rollen door naar vandaag" />
        <Stat label="Vandaag" value={groups.today.length + groups.late.length} tone="brand" icon="today" hint="To do's op je lijst" />
        <Stat label="Komende 14 dagen" value={upcoming.length} tone="neutral" icon="calendar_month" hint="Posts, mailings en calls" />
        <Stat label="Beurzen gepland" value={store.items.filter((i) => i.type === 'event' && i.date >= today).length} tone="neutral" icon="storefront" hint="Vanaf vandaag" />
      </div>

      <div className="mc-dash-grid">
        <Card title="Wat komt eraan" icon="schedule" className="mc-dash-upcoming" action={<Link className="mc-card-link" to="/kalender">Naar kalender</Link>}>
          {byDay.size === 0 ? (
            <EmptyState icon="calendar_month" title="Niets gepland de komende 14 dagen" />
          ) : (
            <ol className="mc-day-list">
              {[...byDay.entries()].map(([day, list]) => (
                <li key={day}>
                  <div className="mc-day-label">
                    <span className="mc-day-num">{fmt(day, 'd')}</span>
                    <span><span className="mc-day-name">{fmt(day, 'EEEE')}</span><span className="mc-muted">{relativeDay(day, today)}</span></span>
                  </div>
                  <ul className="mc-day-items">
                    {list.map((i) => (
                      <li key={i.id}>
                        <button type="button" className="mc-row" onClick={() => openItem(i.id)}>
                          <TypeBadge type={i.type} />
                          <span className="mc-row-main">
                            <span className="mc-row-title">{i.title}</span>
                            <span className="mc-muted">{[i.time, i.channel, i.owner].filter(Boolean).join(' · ')}</span>
                          </span>
                          <StatusPill status={i.status} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          )}
        </Card>

        <Card title="Te laat" icon="warning" className="mc-dash-late">
          {groups.late.length ? (
            <div className="mc-stack">{groups.late.map((t) => <TodoEntry key={t.id} todo={t} />)}</div>
          ) : (
            <EmptyState icon="check_circle" title="Alles bij">Geen to do's over datum.</EmptyState>
          )}
          {groups.today.length > 0 && (
            <>
              <h3 className="mc-subhead">Vandaag</h3>
              <div className="mc-stack">{groups.today.map((t) => <TodoEntry key={t.id} todo={t} />)}</div>
            </>
          )}
        </Card>

        <Card title="Beurzen en conferenties" icon="storefront" className="mc-dash-events" action={<Link className="mc-card-link" to="/beurzen">Tijdlijn</Link>}>
          <div className="mc-event-mini-list">
            {events.map((e) => {
              const prep = store.todosFor(e.id);
              const done = prep.filter((t) => t.done).length;
              const n = daysBetween(today, e.date);
              return (
                <button key={e.id} type="button" className="mc-event-mini" onClick={() => openItem(e.id)}>
                  <span className="mc-event-date">
                    <span className="mc-event-day">{fmt(e.date, 'd')}</span>
                    <span className="mc-event-month">{fmt(e.date, 'MMM')}</span>
                  </span>
                  <span className="mc-row-main">
                    <span className="mc-row-title">{e.title}</span>
                    <span className="mc-muted">{e.location}</span>
                    <span className="mc-progress" aria-label={`${done} van ${prep.length} voorbereidingen klaar`}>
                      <span style={{ width: `${prep.length ? (done / prep.length) * 100 : 0}%` }} />
                    </span>
                  </span>
                  <span className="mc-countdown">{n <= 0 ? 'nu bezig' : `nog ${n} d`}</span>
                </button>
              );
            })}
          </div>
        </Card>

        <Card title="Deze week in de kalender" icon="calendar_month" className="mc-dash-week">
          <div className="mc-week-strip">
            {Array.from({ length: 7 }, (_, k) => shiftIso(today, k)).map((d) => (
              <div key={d} className="mc-week-strip-day" data-today={d === today || undefined}>
                <span className="mc-muted">{fmt(d, 'EEE d')}</span>
                {store.items.filter((i) => i.date === d).map((i) => <ItemChip key={i.id} item={i} compact />)}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function greeting(): string {
  const h = new Date().getHours();
  return h < 12 ? 'Goedemorgen' : h < 18 ? 'Goedemiddag' : 'Goedenavond';
}

function Stat({ label, value, tone, icon, hint }: { label: string; value: number; tone: 'error' | 'brand' | 'neutral'; icon: Parameters<typeof Icon>[0]['name']; hint: string }) {
  return (
    <div className="mc-stat" data-tone={tone}>
      <span className="mc-stat-icon"><Icon name={icon} size={20} /></span>
      <span className="mc-stat-label">{label}</span>
      <span className="mc-stat-value">{value}</span>
      <span className="mc-muted">{hint}</span>
    </div>
  );
}
