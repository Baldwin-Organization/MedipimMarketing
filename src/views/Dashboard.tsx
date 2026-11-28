import { startOfISOWeek } from 'date-fns';
import { Link } from 'react-router-dom';
import { groupByUrgency } from '../components/TodayPanel';
import { ItemChip, TodoEntry } from '../components/entries';
import { Button, Card, EmptyState, Stat, StatusPill, TypeBadge } from '../components/ui';
import { daysBetween, fmt, fromIso, relativeDay, shiftIso, toIso } from '../data/dates';
import { participationKey } from '../data/meta';
import { useStore } from '../data/store';
import { channelLabel, itemText, itemTitle, participationLabel, t } from '../i18n';
import { useUi } from '../ui-context';
import { ChannelMix } from './ChannelMix';
import { PageHeader } from './PageHeader';

export function Dashboard() {
  const store = useStore();
  const { openItem } = useUi();
  const { today } = store;
  const horizon = shiftIso(today, 13);
  const groups = groupByUrgency(store.todos, today);
  /** Sunday of the working week; on Saturday and Sunday that is the coming week. */
  const weekEnd = shiftIso(toIso(startOfISOWeek(fromIso(shiftIso(today, 2)))), 6);
  const production = store.todos
    .filter((t) => t.phase === 'maken' && !t.done && t.displayDate <= weekEnd)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const upcoming = store.items
    .filter((i) => i.date >= today && i.date <= horizon)
    .sort((a, b) => (a.date + (a.time ?? '')).localeCompare(b.date + (b.time ?? '')));
  const events = store.items
    .filter((i) => i.type === 'event' && (i.participation === 'exposant' || i.participation === 'bezoeker') && (i.endDate ?? i.date) >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 4);

  const byDay = new Map<string, typeof upcoming>();
  upcoming.forEach((i) => byDay.set(i.date, [...(byDay.get(i.date) ?? []), i]));

  return (
    <div className="mc-page">
      <PageHeader
        title={t.dashboard.title}
        subtitle={`${t.dashboard.greeting(new Date().getHours())}. ${t.dashboard.todayIs(fmt(today, 'EEEE d MMMM yyyy'))}`}
        actions={<Button startIcon="add" onClick={() => openItem()}>{t.common.newItem}</Button>}
      />

      <div className="mc-stats">
        <Stat label={t.dashboard.statLate} value={groups.late.length} tone="error" icon="warning" hint={t.dashboard.statLateHint} />
        <Stat label={t.dashboard.statToday} value={groups.today.length + groups.late.length} tone="brand" icon="today" hint={t.dashboard.statTodayHint} />
        <Stat label={t.dashboard.statUpcoming} value={upcoming.length} tone="neutral" icon="calendar_month" hint={t.dashboard.statUpcomingHint} />
        <Stat label={t.dashboard.statEvents} value={store.items.filter((i) => i.type === 'event' && i.date >= today).length} tone="neutral" icon="storefront" hint={t.dashboard.statEventsHint} />
      </div>

      <div className="mc-dash-grid">
        <div className="mc-dash-col">
          <Card title={t.dashboard.upcoming} icon="schedule" className="mc-dash-upcoming" action={<Link className="mc-card-link" to="/kalender">{t.dashboard.toCalendar}</Link>}>
            {byDay.size === 0 ? (
              <EmptyState icon="calendar_month" title={t.dashboard.nothingPlanned} />
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
                              <span className="mc-row-title">{itemTitle(i)}</span>
                              <span className="mc-muted">{[i.time, channelLabel(i.channel), i.owner].filter(Boolean).join(' · ')}</span>
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
          <ChannelMix />
        </div>

        <div className="mc-dash-col">
          <Card title={t.dashboard.production} icon="edit" className="mc-dash-production">
            <p className="mc-muted">{t.dashboard.productionHint}</p>
            {production.length ? (
              <div className="mc-stack">{production.map((t) => <TodoEntry key={t.id} todo={t} />)}</div>
            ) : (
              <EmptyState icon="check_circle" title={t.dashboard.noProduction} />
            )}
          </Card>

          <Card title={t.dashboard.late} icon="warning" className="mc-dash-late">
            {groups.late.length ? (
              <div className="mc-stack">{groups.late.map((t) => <TodoEntry key={t.id} todo={t} />)}</div>
            ) : (
              <EmptyState icon="check_circle" title={t.dashboard.allDone}>{t.dashboard.noLate}</EmptyState>
            )}
            {groups.today.length > 0 && (
              <>
                <h3 className="mc-subhead">{t.dashboard.today}</h3>
                <div className="mc-stack">{groups.today.map((t) => <TodoEntry key={t.id} todo={t} />)}</div>
              </>
            )}
          </Card>

          <Card title={t.dashboard.events} icon="storefront" className="mc-dash-events" action={<Link className="mc-card-link" to="/beurzen">{t.dashboard.timeline}</Link>}>
            {events.length === 0 && <EmptyState icon="storefront" title={t.dashboard.noEventsAttending} />}
            <div className="mc-event-mini-list">
              {events.map((e) => {
                const prep = store.todosFor(e.id);
                const done = prep.filter((t) => t.done).length;
                const n = daysBetween(today, e.date);
                return (
                  <button key={e.id} type="button" className="mc-event-mini" onClick={() => openItem(e.id)}>
                    <span className="mc-event-date" data-participation={participationKey(e.participation)} title={participationLabel(e.participation)}>
                      <span className="mc-event-day">{fmt(e.date, 'd')}</span>
                      <span className="mc-event-month">{fmt(e.date, 'MMM')}</span>
                    </span>
                    <span className="mc-row-main">
                      <span className="mc-row-title">{itemTitle(e)}</span>
                      <span className="mc-muted">{itemText(e, 'location')}</span>
                      <span className="mc-progress" aria-label={t.dashboard.prepDone(done, prep.length)}>
                        <span style={{ width: `${prep.length ? (done / prep.length) * 100 : 0}%` }} />
                      </span>
                    </span>
                    <span className="mc-countdown">{n <= 0 ? t.common.countdown.running : t.common.countdown.daysShort(n)}</span>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        <Card title={t.dashboard.thisWeek} icon="calendar_month" className="mc-dash-week">
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
