import { addMonths, differenceInCalendarMonths, getDate, getDaysInMonth, startOfMonth } from 'date-fns';
import { useEffect, useRef, useState } from 'react';
import { CountrySelect, FilterSelect } from '../components/filters';
import { DimensionTags } from '../components/dimensions';
import { Button, Checkbox, EmptyState, Icon, LateBadge, Segmented, StatusPill } from '../components/ui';
import { daysBetween, fmt, fmtDate, fromIso, toIso } from '../data/dates';
import { AUDIENCES, PRODUCT_TYPES, matchesCountry, type CountryFilter } from '../data/dimensions';
import { CHANNELS, OWNERS, STATUSES, STATUS_META } from '../data/meta';
import { useStore } from '../data/store';
import type { Audience, Item, ItemStatus, ProductType } from '../data/types';
import { useUi } from '../ui-context';
import { PageHeader } from './PageHeader';

/** Months are equally wide so the grid stays regular; days are spread within their month. */
const MONTH_PX = 320;
const MIN_MONTHS = 6;
/** Room a label needs before the next event can share its lane. */
const LABEL_PX = 210;

interface EventFilters {
  channel: string;
  status: ItemStatus | '';
  owner: string;
  audience: Audience | '';
  product: ProductType | '';
  country: CountryFilter;
}
const NO_FILTERS: EventFilters = { channel: '', status: '', owner: '', audience: '', product: '', country: '' };

export function EventsView() {
  const store = useStore();
  const { openItem } = useUi();
  const { today } = store;
  const [scope, setScope] = useState<'komend' | 'alle'>('komend');
  const [filters, setFilters] = useState<EventFilters>(NO_FILTERS);
  const set = <K extends keyof EventFilters>(key: K) => (value: EventFilters[K]) => setFilters((f) => ({ ...f, [key]: value }));
  const allEvents = store.items.filter((i) => i.type === 'event');
  const channels = [...new Set([...CHANNELS.event, ...allEvents.map((e) => e.channel)])];
  const active = Object.values(filters).filter(Boolean).length;
  const matches = (i: Item) =>
    (!filters.channel || i.channel === filters.channel) &&
    (!filters.status || i.status === filters.status) &&
    (!filters.owner || i.owner === filters.owner) &&
    (!filters.audience || i.audiences.includes(filters.audience)) &&
    (!filters.product || i.productTypes.includes(filters.product)) &&
    matchesCountry(i, filters.country);
  const filtered = allEvents.filter(matches).sort((a, b) => a.date.localeCompare(b.date));
  const upcoming = filtered.filter((e) => (e.endDate ?? e.date) >= today);
  const events = scope === 'alle' ? filtered : upcoming;

  return (
    <div className="mc-page">
      <PageHeader
        title="Beurzen en conferenties"
        subtitle="Tijdlijn van de komende events, met de voorbereidingschecklist per event."
        actions={<Button startIcon="add" onClick={() => openItem(undefined, { type: 'event', channel: 'Beurs', date: today, endDate: today })}>Nieuw event</Button>}
      />
      <div className="mc-filters" aria-label="Filters">
        <CountrySelect value={filters.country} items={allEvents} onChange={set('country')} />
        <FilterSelect label="Product" value={filters.product} options={PRODUCT_TYPES} onChange={set('product')} />
        <FilterSelect label="Doelgroep" value={filters.audience} options={AUDIENCES} onChange={set('audience')} />
        <FilterSelect label="Soort" value={filters.channel} options={channels} onChange={set('channel')} />
        <FilterSelect label="Status" value={filters.status} options={STATUSES.map((s) => ({ value: s, label: STATUS_META[s].label }))} onChange={set('status')} />
        <FilterSelect label="Eigenaar" value={filters.owner} options={OWNERS} onChange={set('owner')} />
        {active > 0 && (
          <Button variant="text" size="small" onClick={() => setFilters(NO_FILTERS)}>
            Filters wissen ({active})
          </Button>
        )}
        <span className="mc-muted">{upcoming.length} {upcoming.length === 1 ? 'komend event' : 'komende events'}</span>
      </div>
      <Timeline events={upcoming} />
      <div className="mc-section-bar">
        <h2>Voorbereiding</h2>
        <Segmented label="Toon" value={scope} onChange={setScope} options={[{ value: 'komend', label: 'Komend' }, { value: 'alle', label: 'Alle' }]} />
      </div>
      {events.length === 0 ? (
        <EmptyState icon="storefront" title={allEvents.length ? 'Geen events gevonden' : 'Geen events gepland'}>
          {allEvents.length ? 'Pas de filters aan of toon ook afgelopen events.' : 'Voeg een beurs of conferentie toe om de voorbereiding te plannen.'}
        </EmptyState>
      ) : (
        <ol className="mc-event-timeline">
          {events.map((e) => <EventCard key={e.id} event={e} />)}
        </ol>
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
    <section className="mc-timeline" aria-label="Tijdlijn van de komende events">
      <div className="mc-timeline-nav">
        <Button variant="text" intent="secondary" size="small" icon="chevron_left" label="Eerder" onClick={() => scrollBy(-3)} />
        <Button variant="text" intent="secondary" size="small" icon="chevron_right" label="Later" onClick={() => scrollBy(3)} />
      </div>
      <div className="mc-timeline-scroll" ref={scroller} tabIndex={0} aria-label="Scroll horizontaal door de maanden">
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
            <span className="mc-timeline-today" style={{ left: x(today) }}><span>vandaag</span></span>
            {placed.map(({ e, left, width, lane }) => (
              <button
                key={e.id}
                type="button"
                className="mc-timeline-event"
                data-status={e.status}
                style={{ left, ['--lane' as string]: lane }}
                title={`${e.title} · ${fmt(e.date, 'd MMM')}${e.location ? ` · ${e.location}` : ''}`}
                onClick={() => openItem(e.id)}
              >
                <span className="mc-timeline-bar" style={{ width }} />
                <span className="mc-timeline-label">{e.title}<span className="mc-timeline-sub"> · {fmt(e.date, 'd MMM')}</span></span>
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
        <span className="mc-event-date mc-event-date-lg">
          <span className="mc-event-day">{fmt(event.date, 'd')}</span>
          <span className="mc-event-month">{fmt(event.date, 'MMM yyyy')}</span>
        </span>
      </div>
      <div className="mc-event-body">
        <header className="mc-event-head">
          <div>
            <h3>{event.title}</h3>
            <p className="mc-muted mc-event-meta">
              <Icon name="event" size={16} />
              {multi ? `${fmt(event.date, 'EEE d MMM')} – ${fmt(event.endDate!, 'EEE d MMM')}` : fmt(event.date, 'EEEE d MMMM')}
              {event.location && <><Icon name="storefront" size={16} />{event.location}</>}
              {event.owner && <><Icon name="person" size={16} />{event.owner}</>}
            </p>
          </div>
          <div className="mc-event-side">
            <StatusPill status={event.status} />
            <span className="mc-countdown">{past ? 'afgelopen' : n <= 0 ? 'nu bezig' : `nog ${n} dagen`}</span>
            <Button variant="text" intent="secondary" size="small" icon="edit" label="Event bewerken" onClick={() => openItem(event.id)} />
          </div>
        </header>
        <DimensionTags item={event} />
        {event.description && <p className="mc-event-desc">{event.description}</p>}
        {prep.length === 0 ? (
          <p className="mc-muted mc-checklist-empty">
            Nog geen voorbereiding. Beslissen jullie te gaan? Open het event en voeg de standaard to do's toe.
          </p>
        ) : (
          <div className="mc-checklist-head">
            <span>Voorbereiding</span>
            <span className="mc-muted">{done} van {prep.length} klaar</span>
            <span className="mc-progress" aria-hidden="true"><span style={{ width: `${(done / prep.length) * 100}%` }} /></span>
          </div>
        )}
        <ul className="mc-checklist">
          {prep.map((t) => (
            <li key={t.id} data-done={t.done || undefined}>
              <Checkbox checked={t.done} onChange={() => store.toggleTodo(t.id)} label={`${t.title} afvinken`} />
              <span className="mc-checklist-title">{t.title}</span>
              <LateBadge days={t.lateDays} />
              <span className="mc-muted mc-checklist-date">
                {fmt(t.dueDate, 'd MMM')} · {t.offsetDays < 0 ? `${Math.abs(t.offsetDays) >= 14 && Math.abs(t.offsetDays) % 7 === 0 ? `${Math.abs(t.offsetDays) / 7} weken` : `${Math.abs(t.offsetDays)} d`} vooraf` : t.offsetDays === 0 ? 'op de dag' : `${t.offsetDays} d na`}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
}
