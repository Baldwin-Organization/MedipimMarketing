import { addMonths, differenceInCalendarMonths, getDate, getDaysInMonth, startOfMonth } from 'date-fns';
import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { CountrySelect, FilterSelect } from '../components/filters';
import { DimensionTags } from '../components/dimensions';
import { ParticipationLegend, ParticipationPicker } from '../components/participation';
import { Button, Checkbox, EmptyState, Icon, JiraBadge, LateBadge, Segmented, StatusPill } from '../components/ui';
import { withParticipation } from '../data/budget';
import { daysBetween, fmt, fmtDate, fromIso, toIso } from '../data/dates';
import { audienceOptions, matchesCountry, productOptions, todoLabel, type CountryFilter } from '../data/dimensions';
import { CHANNELS, OWNERS, STATUSES, participationKey, type ParticipationKey } from '../data/meta';
import { useStore } from '../data/store';
import type { Audience, Item, ItemStatus, Participation, ProductType } from '../data/types';
import { channelLabel, itemText, itemTitle, statusLabel, t } from '../i18n';
import { useUi } from '../ui-context';
import { PageHeader } from './PageHeader';

/** Months are equally wide so the grid stays regular; days are spread within their month. */
const MONTH_PX = 320;
const MIN_MONTHS = 6;
/** Room a label needs before the next event can share its lane. */
const LABEL_PX = 210;
const ATTENDING: Participation[] = ['exposant', 'bezoeker'];
const EventsMap = lazy(() => import('./EventsMap'));

interface EventFilters {
  participation: ParticipationKey[];
  channel: string;
  status: ItemStatus | '';
  owner: string;
  audience: Audience | '';
  product: ProductType | '';
  country: CountryFilter;
}
const NO_FILTERS: EventFilters = { participation: [], channel: '', status: '', owner: '', audience: '', product: '', country: '' };

export function EventsView() {
  const store = useStore();
  const { openItem } = useUi();
  const { today } = store;
  const [scope, setScope] = useState<'komend' | 'alle'>('komend');
  const [view, setView] = useState<'tijdlijn' | 'kaart'>('tijdlijn');
  const [filters, setFilters] = useState<EventFilters>(NO_FILTERS);
  const set = <K extends keyof EventFilters>(key: K) => (value: EventFilters[K]) => setFilters((f) => ({ ...f, [key]: value }));
  const allEvents = store.items.filter((i) => i.type === 'event');
  const channels = [...new Set([...CHANNELS.event, ...allEvents.map((e) => e.channel)])];
  const active = Object.values(filters).filter((v) => (Array.isArray(v) ? v.length : v)).length;
  const toggleParticipation = (k: ParticipationKey) =>
    setFilters((f) => ({ ...f, participation: f.participation.includes(k) ? f.participation.filter((p) => p !== k) : [...f.participation, k] }));
  const matchesOthers = (i: Item) =>
    (!filters.channel || i.channel === filters.channel) &&
    (!filters.status || i.status === filters.status) &&
    (!filters.owner || i.owner === filters.owner) &&
    (!filters.audience || i.audiences.includes(filters.audience)) &&
    (!filters.product || i.productTypes.includes(filters.product)) &&
    matchesCountry(i, filters.country);
  const matches = (i: Item) => matchesOthers(i) && (!filters.participation.length || filters.participation.includes(participationKey(i.participation)));
  const filtered = allEvents.filter(matches).sort((a, b) => a.date.localeCompare(b.date));
  const participationCounts = new Map<ParticipationKey, number>();
  allEvents
    .filter((e) => (e.endDate ?? e.date) >= today && matchesOthers(e))
    .forEach((e) => participationCounts.set(participationKey(e.participation), (participationCounts.get(participationKey(e.participation)) ?? 0) + 1));
  const upcoming = filtered.filter((e) => (e.endDate ?? e.date) >= today);
  const events = scope === 'alle' ? filtered : upcoming;
  const scopeToggle = <Segmented label={t.common.show} value={scope} onChange={setScope} options={[{ value: 'komend', label: t.common.upcoming }, { value: 'alle', label: t.common.all }]} />;

  return (
    <div className="mc-page">
      <PageHeader
        title={t.events.title}
        subtitle={t.events.subtitle}
        actions={<Button startIcon="add" onClick={() => openItem(undefined, { type: 'event', channel: 'Beurs', date: today, endDate: today })}>{t.events.newEvent}</Button>}
      />
      <div className="mc-filters" aria-label={t.common.filters}>
        <CountrySelect value={filters.country} items={allEvents} onChange={set('country')} />
        <FilterSelect label={t.dims.productShort} value={filters.product} options={productOptions()} onChange={set('product')} />
        <FilterSelect label={t.dims.audience} value={filters.audience} options={audienceOptions()} onChange={set('audience')} />
        <FilterSelect label={t.events.kind} value={filters.channel} options={channels.map((c) => ({ value: c, label: channelLabel(c) }))} onChange={set('channel')} />
        <FilterSelect label={t.events.status} value={filters.status} options={STATUSES.map((s) => ({ value: s, label: statusLabel(s) }))} onChange={set('status')} />
        <FilterSelect label={t.events.owner} value={filters.owner} options={OWNERS} onChange={set('owner')} />
        {active > 0 && (
          <Button variant="text" size="small" onClick={() => setFilters(NO_FILTERS)}>
            {t.common.clearFilters(active)}
          </Button>
        )}
        <span className="mc-muted">{t.events.upcomingCount(upcoming.length)}</span>
      </div>
      <ParticipationLegend counts={participationCounts} active={filters.participation} onToggle={toggleParticipation} />
      <div className="mc-view-bar">
        <Segmented
          label={t.events.views.label}
          value={view}
          onChange={setView}
          options={[{ value: 'tijdlijn', label: t.events.views.timeline, icon: 'calendar_month' }, { value: 'kaart', label: t.events.views.map, icon: 'language' }]}
        />
        {view === 'kaart' && scopeToggle}
      </div>
      {view === 'kaart' ? (
        <Suspense fallback={<p className="mc-muted">{t.events.map.loading}</p>}>
          <EventsMap events={events} />
        </Suspense>
      ) : (
        <>
          <Timeline events={upcoming} />
          <div className="mc-section-bar">
            <h2>{t.events.prep}</h2>
            {scopeToggle}
          </div>
          {events.length === 0 ? (
            <EmptyState icon="storefront" title={allEvents.length ? t.events.noneFound : t.events.nonePlanned}>
              {allEvents.length ? t.events.noneFoundHint : t.events.nonePlannedHint}
            </EmptyState>
          ) : (
            <ol className="mc-event-timeline">
              {events.map((e) => <EventCard key={e.id} event={e} />)}
            </ol>
          )}
        </>
      )}
    </div>
  );
}

function Timeline({ events }: { events: Item[] }) {
  const { today } = useStore();
  const { openItem } = useUi();
  const scroller = useRef<HTMLDivElement>(null);
  const start = startOfMonth(fromIso(today));
  const x = (iso: string) => {
    const d = fromIso(iso);
    return (differenceInCalendarMonths(d, start) + (getDate(d) - 1) / getDaysInMonth(d)) * MONTH_PX;
  };
  const dayPx = (iso: string) => MONTH_PX / getDaysInMonth(fromIso(iso));
  const last = events.reduce((m, e) => ((e.endDate ?? e.date) > m ? e.endDate ?? e.date : m), today);
  const monthCount = Math.max(MIN_MONTHS, differenceInCalendarMonths(fromIso(last), start) + 1);
  const months = Array.from({ length: monthCount }, (_, k) => addMonths(start, k));

  const laneEnds: number[] = [];
  const placed = events.map((e) => {
    const left = Math.max(0, x(e.date));
    const width = Math.max(x(e.endDate ?? e.date) + dayPx(e.endDate ?? e.date) - left, 8);
    let lane = laneEnds.findIndex((end) => end <= left);
    if (lane === -1) lane = laneEnds.push(0) - 1;
    laneEnds[lane] = left + width + LABEL_PX;
    return { e, left, width, lane };
  });

  const first = events[0];
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const fromToday = x(today);
    const target = first && x(first.date) - fromToday > el.clientWidth * 0.6 ? x(first.date) : fromToday;
    el.scrollTo({ left: Math.max(0, target - MONTH_PX / 4), behavior: 'smooth' });
  }, [first?.id, today]);
  const scrollBy = (months: number) => scroller.current?.scrollBy({ left: months * MONTH_PX, behavior: 'smooth' });

  return (
    <section className="mc-timeline" aria-label={t.events.timeline}>
      <div className="mc-timeline-nav">
        <Button variant="text" intent="secondary" size="small" icon="chevron_left" label={t.events.earlier} onClick={() => scrollBy(-3)} />
        <Button variant="text" intent="secondary" size="small" icon="chevron_right" label={t.events.later} onClick={() => scrollBy(3)} />
      </div>
      <div className="mc-timeline-scroll" ref={scroller} tabIndex={0} aria-label={t.events.scrollHint}>
        <div className="mc-timeline-canvas" style={{ width: monthCount * MONTH_PX, ['--lanes' as string]: Math.max(1, laneEnds.length) }}>
          <div className="mc-timeline-months">
            {months.map((m, k) => (
              <span key={m.toISOString()} style={{ width: MONTH_PX }}>
                {fmtDate(m, k === 0 || m.getMonth() === 0 ? 'MMMM yyyy' : 'MMMM')}
              </span>
            ))}
          </div>
          <div className="mc-timeline-track">
            {months.map((m) => <span key={m.toISOString()} className="mc-timeline-tick" style={{ left: x(toIso(m)) }} />)}
            <span className="mc-timeline-today" style={{ left: x(today) }}><span>{t.dates.today}</span></span>
            {placed.map(({ e, left, width, lane }) => (
              <button
                key={e.id}
                type="button"
                className="mc-timeline-event"
                data-participation={participationKey(e.participation)}
                style={{ left, ['--lane' as string]: lane }}
                title={`${itemTitle(e)} · ${fmt(e.date, 'd MMM')}${itemText(e, 'location') ? ` · ${itemText(e, 'location')}` : ''}`}
                onClick={() => openItem(e.id)}
              >
                <span className="mc-timeline-bar" style={{ width }} />
                <span className="mc-timeline-label">{itemTitle(e)}<span className="mc-timeline-sub"> · {fmt(e.date, 'd MMM')}</span></span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function EventCard({ event }: { event: Item }) {
  const store = useStore();
  const { openItem } = useUi();
  const prep = store.todosFor(event.id);
  const done = prep.filter((t) => t.done).length;
  const n = daysBetween(store.today, event.date);
  const past = (event.endDate ?? event.date) < store.today;
  const multi = event.endDate && event.endDate !== event.date;
  return (
    <li className="mc-event-card" data-past={past || undefined}>
      <div className="mc-event-rail">
        <span className="mc-event-date mc-event-date-lg" data-participation={participationKey(event.participation)}>
          <span className="mc-event-day">{fmt(event.date, 'd')}</span>
          <span className="mc-event-month">{fmt(event.date, 'MMM yyyy')}</span>
        </span>
      </div>
      <div className="mc-event-body">
        <header className="mc-event-head">
          <div>
            <h3>{itemTitle(event)}</h3>
            <p className="mc-muted mc-event-meta">
              <Icon name="event" size={16} />
              {multi ? `${fmt(event.date, 'EEE d MMM')} – ${fmt(event.endDate!, 'EEE d MMM')}` : fmt(event.date, 'EEEE d MMMM')}
              {itemText(event, 'location') && <><Icon name="storefront" size={16} />{itemText(event, 'location')}</>}
              {event.owner && <><Icon name="person" size={16} />{event.owner}</>}
            </p>
          </div>
          <div className="mc-event-side">
            <StatusPill status={event.status} />
            <span className="mc-countdown">{past ? t.common.countdown.ended : n <= 0 ? t.common.countdown.running : t.common.countdown.days(n)}</span>
            <Button variant="text" intent="secondary" size="small" icon="edit" label={t.events.edit} onClick={() => openItem(event.id)} />
          </div>
        </header>
        <div className="mc-event-participation">
          <span className="mc-field-label">{t.participationTitle}</span>
          <ParticipationPicker
            compact
            label={`${t.participationTitle}: ${itemTitle(event)}`}
            value={event.participation}
            onChange={(participation) => store.saveItem(withParticipation(event, participation), prep)}
          />
        </div>
        <DimensionTags item={event} />
        {itemText(event, 'description') && <p className="mc-event-desc">{itemText(event, 'description')}</p>}
        {prep.length === 0 ? (
          (!event.participation || ATTENDING.includes(event.participation)) && (
            <p className="mc-muted mc-checklist-empty">
              {event.participation ? t.events.noPrepGoing : t.events.noPrep}
            </p>
          )
        ) : (
          <div className="mc-checklist-head">
            <span>{t.events.prep}</span>
            <span className="mc-muted">{t.events.prepProgress(done, prep.length)}</span>
            <span className="mc-progress" aria-hidden="true"><span style={{ width: `${(done / prep.length) * 100}%` }} /></span>
          </div>
        )}
        <ul className="mc-checklist">
          {prep.map((todo) => (
            <li key={todo.id} data-done={todo.done || undefined}>
              <Checkbox checked={todo.done} onChange={() => store.toggleTodo(todo.id)} label={t.common.check(todoLabel(todo))} />
              <span className="mc-checklist-title">{todoLabel(todo)}</span>
              <JiraBadge jira={todo.jira} />
              <LateBadge days={todo.lateDays} />
              <span className="mc-muted mc-checklist-date">
                {fmt(todo.dueDate, 'd MMM')} · {offsetText(todo.offsetDays)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
}

function offsetText(days: number): string {
  if (days === 0) return t.events.onTheDay;
  if (days > 0) return t.events.daysAfter(days);
  const n = -days;
  return n >= 14 && n % 7 === 0 ? t.events.weeksBefore(n / 7) : t.events.daysBefore(n);
}
