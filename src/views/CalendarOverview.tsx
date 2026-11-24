import { addMonths, endOfMonth, endOfWeek, getISOWeek, startOfMonth, startOfWeek } from 'date-fns';
import { ItemChip, TodoEntry, useDayDrop } from '../components/entries';
import { fmt, fmtDate, relativeDay, shiftIso, toIso, weekdayNames } from '../data/dates';
import { TYPE_META } from '../data/meta';
import { itemOnDay, type ScheduledTodo } from '../data/schedule';
import { useStore } from '../data/store';
import type { IsoDate, Item } from '../data/types';
import { itemTitle, t } from '../i18n';
import { useUi } from '../ui-context';

const WEEK = { weekStartsOn: 1 as const };

function dayRange(start: IsoDate, end: IsoDate): IsoDate[] {
  const out: IsoDate[] = [];
  for (let d = start; d <= end; d = shiftIso(d, 1)) out.push(d);
  return out;
}

function periodLabel(item: Item): string {
  const end = item.endDate ?? item.date;
  if (end === item.date) return fmt(item.date, 'd MMM');
  return fmt(item.date, 'MMM') === fmt(end, 'MMM') ? `${fmt(item.date, 'd')}–${fmt(end, 'd MMM')}` : `${fmt(item.date, 'd MMM')} – ${fmt(end, 'd MMM')}`;
}

interface OverviewProps {
  first: Date;
  items: Item[];
  onOpenMonth: (month: IsoDate) => void;
  onOpenDay: (day: IsoDate) => void;
}

/** Twelve months from `first`, each with a mini calendar and the first few items. */
export function YearOverview(props: OverviewProps) {
  return <MonthGrid {...props} months={12} limit={4} />;
}

/** Three months from `first`, each with a mini calendar and every item. */
export function QuarterOverview(props: OverviewProps) {
  return <MonthGrid {...props} months={3} />;
}

function MonthGrid({ first, items, months, limit, onOpenMonth, onOpenDay }: OverviewProps & { months: number; limit?: number }) {
  return (
    <div className="mc-overview" data-months={months}>
      {Array.from({ length: months }, (_, k) => addMonths(first, k)).map((m) => (
        <MonthSummary key={m.toISOString()} month={m} items={items} limit={limit} onOpenMonth={onOpenMonth} onOpenDay={onOpenDay} />
      ))}
    </div>
  );
}

function MonthSummary({ month, items, limit = Infinity, onOpenMonth, onOpenDay }: { month: Date; items: Item[]; limit?: number } & Pick<OverviewProps, 'onOpenMonth' | 'onOpenDay'>) {
  const { today } = useStore();
  const start = toIso(startOfMonth(month));
  const end = toIso(endOfMonth(month));
  const inMonth = items
    .filter((i) => i.date <= end && (i.endDate ?? i.date) >= start)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? '').localeCompare(b.time ?? ''));
  const shown = inMonth.slice(0, limit);
  const days = dayRange(toIso(startOfWeek(startOfMonth(month), WEEK)), toIso(endOfWeek(endOfMonth(month), WEEK)));

  return (
    <section className="mc-month-card" aria-label={fmtDate(month, 'MMMM yyyy')}>
      <header className="mc-month-card-head">
        <button type="button" className="mc-month-card-title" onClick={() => onOpenMonth(start)}>{fmtDate(month, 'MMMM')}</button>
        <span className="mc-muted">{inMonth.length ? t.calendar.items(inMonth.length) : t.calendar.empty}</span>
      </header>
      <div className="mc-mini-cal" role="grid" aria-label={t.calendar.daysIn(fmtDate(month, 'MMMM'))}>
        {weekdayNames('EEEEE').map((d, k) => <span key={k} className="mc-mini-head" aria-hidden="true">{d}</span>)}
        {days.map((day) => {
          if (day < start || day > end) return <span key={day} />;
          const on = inMonth.filter((i) => itemOnDay(i, day));
          const accents = [...new Set(on.map((i) => TYPE_META[i.type].accent))].slice(0, 3);
          return (
            <button
              key={day}
              type="button"
              className="mc-mini-day"
              data-today={day === today || undefined}
              data-busy={on.length > 0 || undefined}
              aria-label={`${fmt(day, 'd MMMM')}${on.length ? `, ${t.calendar.items(on.length)}` : ''}`}
              title={on.map((i) => itemTitle(i)).join('\n') || undefined}
              onClick={() => onOpenDay(day)}
            >
              {fmt(day, 'd')}
              {accents.length > 0 && (
                <span className="mc-mini-dots" aria-hidden="true">
                  {accents.map((a) => <span key={a} data-accent={a} />)}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {shown.length > 0 && (
        <ul className="mc-month-items">
          {shown.map((i) => (
            <li key={i.id}>
              <span className="mc-month-item-date">{periodLabel(i)}</span>
              <ItemChip item={i} compact />
            </li>
          ))}
        </ul>
      )}
      {inMonth.length > shown.length && (
        <button type="button" className="mc-more" onClick={() => onOpenMonth(start)}>{t.common.more(inMonth.length - shown.length)}</button>
      )}
    </section>
  );
}

/** Every day of the period under each other, empty days included, grouped per week. */
export function DayList({ days, itemsOn, todosOn }: { days: IsoDate[]; itemsOn: (d: IsoDate) => Item[]; todosOn: (d: IsoDate) => ScheduledTodo[] }) {
  const { today } = useStore();
  return (
    <ol className="mc-agenda mc-day-list-view">
      {days.map((d, k) => (
        <ListDay key={d} day={d} today={today} weekStart={k === 0 || fmt(d, 'i') === '1'} items={itemsOn(d)} todos={todosOn(d)} />
      ))}
    </ol>
  );
}

function ListDay({ day, today, weekStart, items, todos }: { day: IsoDate; today: IsoDate; weekStart: boolean; items: Item[]; todos: ScheduledTodo[] }) {
  const { openItem } = useUi();
  const drop = useDayDrop(day);
  const empty = !items.length && !todos.length;
  const weekend = Number(fmt(day, 'i')) >= 6;
  return (
    <>
      {weekStart && <li className="mc-list-week" aria-hidden="true">{t.dates.week} {getISOWeek(new Date(`${day}T12:00`))}</li>}
      <li className="mc-agenda-day" data-today={day === today || undefined} data-empty={empty || undefined} data-weekend={weekend || undefined} data-day={day} {...drop}>
        <button type="button" className="mc-agenda-date mc-list-date" aria-label={t.common.newItemOn(fmt(day, 'd MMMM'))} onClick={() => openItem(undefined, { date: day })}>
          <span className="mc-day-num">{fmt(day, 'd')}</span>
          <span><span className="mc-day-name">{fmt(day, 'EEEE')}</span><span className="mc-muted">{relativeDay(day, today)}</span></span>
        </button>
        <div className="mc-agenda-entries">
          {items.map((i) => <ItemChip key={i.id} item={i} day={day} />)}
          {todos.map((t) => <TodoEntry key={t.id} todo={t} />)}
        </div>
      </li>
    </>
  );
}
