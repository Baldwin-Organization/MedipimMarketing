import { addMonths, startOfMonth } from 'date-fns';
import { useState } from 'react';
import { DimensionTags } from '../components/dimensions';
import { Button, Checkbox, EmptyState, Icon, LateBadge, Segmented, StatusPill } from '../components/ui';
import { daysBetween, fmt, fmtDate, toIso } from '../data/dates';
import { useStore } from '../data/store';
import type { Item } from '../data/types';
import { useUi } from '../ui-context';
import { PageHeader } from './PageHeader';

const MONTHS_SHOWN = 6;
/** Above this many events the labels no longer fit and only show on hover or focus. */
const MAX_LABELLED = 8;

export function EventsView() {
  const store = useStore();
  const { openItem } = useUi();
  const { today } = store;
  const [scope, setScope] = useState<'komend' | 'alle'>('komend');
  const events = store.items
    .filter((i) => i.type === 'event' && (scope === 'alle' || (i.endDate ?? i.date) >= today))
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="mc-page">
      <PageHeader
        title="Beurzen en conferenties"
        subtitle="Tijdlijn van de komende events, met de voorbereidingschecklist per event."
        actions={<Button startIcon="add" onClick={() => openItem(undefined, { type: 'event', channel: 'Beurs', date: today, endDate: today })}>Nieuw event</Button>}
      />
      <Timeline events={events.filter((e) => (e.endDate ?? e.date) >= today)} />
      <div className="mc-section-bar">
        <h2>Voorbereiding</h2>
        <Segmented label="Toon" value={scope} onChange={setScope} options={[{ value: 'komend', label: 'Komend' }, { value: 'alle', label: 'Alle' }]} />
      </div>
      {events.length === 0 ? (
        <EmptyState icon="storefront" title="Geen events gepland">Voeg een beurs of conferentie toe om de voorbereiding te plannen.</EmptyState>
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
  const start = startOfMonth(new Date());
  const end = addMonths(start, MONTHS_SHOWN);
  const startIso = toIso(start);
  const total = daysBetween(startIso, toIso(end));
  const pos = (iso: string) => Math.min(100, Math.max(0, (daysBetween(startIso, iso) / total) * 100));
  const months = Array.from({ length: MONTHS_SHOWN }, (_, k) => addMonths(start, k));
  const inRange = events.filter((e) => e.date < toIso(end));
  return (
    <section className="mc-timeline" aria-label={`Tijdlijn van de komende ${MONTHS_SHOWN} maanden`} data-compact={inRange.length > MAX_LABELLED || undefined}>
      <div className="mc-timeline-months">
        {months.map((m) => <span key={m.toISOString()}>{fmtDate(m, 'MMMM')}</span>)}
      </div>
      <div className="mc-timeline-track">
        {months.map((m) => <span key={m.toISOString()} className="mc-timeline-tick" style={{ left: `${pos(toIso(m))}%` }} />)}
        <span className="mc-timeline-today" style={{ left: `${pos(today)}%` }}><span>vandaag</span></span>
        {inRange.map((e, k) => (
          <button
            key={e.id}
            type="button"
            className="mc-timeline-event"
            data-lane={k % 2}
            data-align={pos(e.date) > 70 ? 'end' : undefined}
            style={{ left: `${pos(e.date)}%`, width: `max(var(--mp-space-2), ${pos(e.endDate ?? e.date) - pos(e.date) + 100 / total}%)` }}
            title={`${e.title} · ${fmt(e.date, 'd MMM')}`}
            onClick={() => openItem(e.id)}
          >
            <span className="mc-timeline-label">{e.title}<span className="mc-muted"> · {fmt(e.date, 'd MMM')}</span></span>
          </button>
        ))}
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
