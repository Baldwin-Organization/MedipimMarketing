import { addMonths, addQuarters, addWeeks, addYears, endOfMonth, endOfWeek, getQuarter, startOfMonth, startOfQuarter, startOfWeek, startOfYear } from 'date-fns';
import { useMemo, useState } from 'react';
import { TodayPanel } from '../components/TodayPanel';
import { ItemChip, TodoEntry, useDayDrop } from '../components/entries';
import { CountrySelect, FilterSelect } from '../components/filters';
import { Button, Segmented, ToggleChipGroup } from '../components/ui';
import { fmt, fmtDate, fromIso, shiftIso, toIso, weekdayNames } from '../data/dates';
import { audienceOptions, matchesCountry, productOptions, type CountryFilter } from '../data/dimensions';
import { ITEM_TYPES, OWNERS, TYPE_META } from '../data/meta';
import { itemOnDay, type ScheduledTodo } from '../data/schedule';
import { useStore } from '../data/store';
import type { Audience, IsoDate, Item, ItemType, ProductType } from '../data/types';
import { channelLabel, itemText, t, typePlural } from '../i18n';
import { useUi } from '../ui-context';
import { DayList, QuarterOverview, YearOverview } from './CalendarOverview';
import { PageHeader } from './PageHeader';

type View = 'jaar' | 'kwartaal' | 'maand' | 'week' | 'lijst';
const VIEWS: View[] = ['jaar', 'kwartaal', 'maand', 'week', 'lijst'];
const WEEK = { weekStartsOn: 1 as const };
const MAX_IN_CELL = 4;

interface Filters {
  types: ItemType[];
  channel: string;
  owner: string;
  campaign: string;
  audience: Audience | '';
  product: ProductType | '';
  country: CountryFilter;
  showTodos: boolean;
}

const NO_FILTERS = { types: [], channel: '', owner: '', campaign: '', audience: '', product: '', country: '' } satisfies Omit<Filters, 'showTodos'>;

function useCalendarState() {
  const [view, setView] = useState<View>(() => {
    const stored = sessionStorage.getItem('mc-view') as View | null;
    return stored && VIEWS.includes(stored) ? stored : 'maand';
  });
  const [anchor, setAnchor] = useState<IsoDate>(() => toIso(new Date()));
  const changeView = (v: View) => {
    sessionStorage.setItem('mc-view', v);
    setView(v);
  };
  return { view, setView: changeView, anchor, setAnchor };
}

export function CalendarView() {
  const store = useStore();
  const { openItem } = useUi();
  const { view, setView, anchor, setAnchor } = useCalendarState();
  const [filters, setFilters] = useState<Filters>({ ...NO_FILTERS, showTodos: true });

  const channels = [...new Set(store.items.map((i) => i.channel))].sort();
  const campaigns = [...new Set(store.items.map((i) => itemText(i, 'campaign')).filter(Boolean))].sort();

  const matches = (i: Item) =>
    (!filters.types.length || filters.types.includes(i.type)) &&
    (!filters.channel || i.channel === filters.channel) &&
    (!filters.owner || i.owner === filters.owner) &&
    (!filters.campaign || itemText(i, 'campaign') === filters.campaign) &&
    (!filters.audience || i.audiences.includes(filters.audience)) &&
    (!filters.product || i.productTypes.includes(filters.product)) &&
    matchesCountry(i, filters.country);

  const items = useMemo(() => store.items.filter(matches), [store.items, filters]); // eslint-disable-line react-hooks/exhaustive-deps
  const visibleIds = useMemo(() => new Set(items.map((i) => i.id)), [items]);
  const todos = useMemo(
    () => store.todos.filter((t) => visibleIds.has(t.itemId) && (!filters.owner || (t.owner ?? store.itemsById.get(t.itemId)?.owner) === filters.owner)),
    [store.todos, visibleIds, filters.owner, store.itemsById],
  );

  const range = useMemo(() => {
    const d = fromIso(anchor);
    if (view === 'week') return { start: toIso(startOfWeek(d, WEEK)), end: toIso(endOfWeek(d, WEEK)) };
    if (view === 'lijst') return { start: toIso(startOfMonth(d)), end: toIso(endOfMonth(d)) };
    if (view === 'jaar' || view === 'kwartaal') return { start: toIso(startOfMonth(d)), end: toIso(startOfMonth(d)) };
    return { start: toIso(startOfWeek(startOfMonth(d), WEEK)), end: toIso(endOfWeek(endOfMonth(d), WEEK)) };
  }, [anchor, view]);

  const days = useMemo(() => {
    const out: IsoDate[] = [];
    for (let d = range.start; d <= range.end; d = shiftIso(d, 1)) out.push(d);
    return out;
  }, [range]);

  const stepBy = { jaar: addYears, kwartaal: addQuarters, maand: addMonths, week: addWeeks, lijst: addMonths }[view];
  const step = (dir: 1 | -1) => setAnchor(toIso(stepBy(fromIso(anchor), dir)));
  const quarterStart = startOfQuarter(fromIso(anchor));
  const periodLabel = {
    jaar: fmt(anchor, 'yyyy'),
    kwartaal: `${t.dates.quarter}${getQuarter(quarterStart)} ${fmtDate(quarterStart, 'yyyy')} · ${fmtDate(quarterStart, 'MMMM')} – ${fmtDate(addMonths(quarterStart, 2), 'MMMM')}`,
    maand: fmt(anchor, 'MMMM yyyy'),
    week: `${t.dates.week} ${fmt(range.start, 'I')} · ${fmt(range.start, 'd MMM')} – ${fmt(range.end, 'd MMM yyyy')}`,
    lijst: fmt(anchor, 'MMMM yyyy'),
  }[view];
  const openMonth = (day: IsoDate) => { setAnchor(day); setView('maand'); };
  const openWeek = (day: IsoDate) => { setAnchor(day); setView('week'); };

  const itemsOn = (day: IsoDate) =>
    items.filter((i) => itemOnDay(i, day)).sort((a, b) => Number(!!b.endDate) - Number(!!a.endDate) || (a.time ?? '').localeCompare(b.time ?? ''));
  const todosOn = (day: IsoDate) => (filters.showTodos ? todos.filter((t) => t.displayDate === day && !t.done) : []);
  const activeFilters = filters.types.length + [filters.channel, filters.owner, filters.campaign, filters.audience, filters.product, filters.country].filter(Boolean).length;

  return (
    <div className="mc-page mc-page-calendar">
      <PageHeader
        title={t.calendar.title}
        subtitle={t.calendar.subtitle}
        actions={<Button startIcon="add" onClick={() => openItem(undefined, { date: store.today })}>{t.common.newItem}</Button>}
      />

      <TodayPanel todos={todos} />

      <div className="mc-cal-toolbar">
        <div className="mc-cal-nav">
          <Button variant="outlined" intent="secondary" icon="chevron_left" label={t.common.previous} onClick={() => step(-1)} />
          <Button variant="outlined" intent="secondary" onClick={() => setAnchor(store.today)}>{t.common.today}</Button>
          <Button variant="outlined" intent="secondary" icon="chevron_right" label={t.common.next} onClick={() => step(1)} />
          <h2 className="mc-cal-period">{periodLabel}</h2>
        </div>
        <Segmented
          label={t.calendar.view}
          value={view}
          onChange={setView}
          options={[
            { value: 'jaar', label: t.calendar.views.jaar, icon: 'calendar_month' },
            { value: 'kwartaal', label: t.calendar.views.kwartaal, icon: 'space_dashboard' },
            { value: 'maand', label: t.calendar.views.maand, icon: 'grid_view' },
            { value: 'week', label: t.calendar.views.week, icon: 'view_column' },
            { value: 'lijst', label: t.calendar.views.lijst, icon: 'view_list' },
          ]}
        />
      </div>

      <div className="mc-filters" aria-label={t.common.filters}>
        <ToggleChipGroup
          label={t.calendar.type}
          value={filters.types}
          onChange={(types) => setFilters((f) => ({ ...f, types }))}
          options={ITEM_TYPES.map((type) => ({ value: type, label: typePlural(type), icon: TYPE_META[type].icon, accent: TYPE_META[type].accent }))}
        />
        <FilterSelect label={t.calendar.channel} value={filters.channel} options={channels.map((c) => ({ value: c, label: channelLabel(c) }))} onChange={(channel) => setFilters((f) => ({ ...f, channel }))} />
        <FilterSelect label={t.calendar.owner} value={filters.owner} options={OWNERS} onChange={(owner) => setFilters((f) => ({ ...f, owner }))} />
        <FilterSelect label={t.calendar.theme} value={filters.campaign} options={campaigns} onChange={(campaign) => setFilters((f) => ({ ...f, campaign }))} />
        <FilterSelect label={t.dims.audience} value={filters.audience} options={audienceOptions()} onChange={(audience) => setFilters((f) => ({ ...f, audience }))} />
        <FilterSelect label={t.dims.productShort} value={filters.product} options={productOptions()} onChange={(product) => setFilters((f) => ({ ...f, product }))} />
        <CountrySelect value={filters.country} items={store.items} onChange={(country) => setFilters((f) => ({ ...f, country }))} />
        <ToggleChipGroup
          label={t.calendar.todos}
          value={filters.showTodos ? ['todos'] : []}
          onChange={(v) => setFilters((f) => ({ ...f, showTodos: v.includes('todos') }))}
          options={[{ value: 'todos', label: t.calendar.showTodos, icon: 'checklist' }]}
        />
        {activeFilters > 0 && (
          <Button variant="text" size="small" onClick={() => setFilters((f) => ({ ...f, ...NO_FILTERS }))}>
            {t.common.clearFilters(activeFilters)}
          </Button>
        )}
      </div>

      {view === 'jaar' ? (
        <YearOverview first={startOfYear(fromIso(anchor))} items={items} onOpenMonth={openMonth} onOpenDay={openWeek} />
      ) : view === 'kwartaal' ? (
        <QuarterOverview first={quarterStart} items={items} onOpenMonth={openMonth} onOpenDay={openWeek} />
      ) : view === 'lijst' ? (
        <DayList days={days} itemsOn={itemsOn} todosOn={todosOn} />
      ) : (
        <div className="mc-grid" data-view={view}>
          {weekdayNames('EEEEEE').map((d) => <div key={d} className="mc-grid-head">{d}</div>)}
          {days.map((day) => (
            <DayCell
              key={day}
              day={day}
              view={view}
              outside={view === 'maand' && fmt(day, 'M') !== fmt(anchor, 'M')}
              items={itemsOn(day)}
              todos={todosOn(day)}
              onMore={() => openWeek(day)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DayCell({ day, view, outside, items, todos, onMore }: { day: IsoDate; view: View; outside: boolean; items: Item[]; todos: ScheduledTodo[]; onMore: () => void }) {
  const store = useStore();
  const { openItem } = useUi();
  const drop = useDayDrop(day);
  const isToday = day === store.today;
  const limit = view === 'maand' ? MAX_IN_CELL : Infinity;
  const entries = [...items.map((i) => ({ kind: 'item' as const, i })), ...todos.map((t) => ({ kind: 'todo' as const, t }))];
  const shown = entries.slice(0, limit);
  const hidden = entries.length - shown.length;
  return (
    <div className="mc-cell" data-outside={outside || undefined} data-today={isToday || undefined} data-past={day < store.today || undefined} data-day={day} {...drop}>
      <div className="mc-cell-head">
        <button type="button" className="mc-cell-date" aria-label={t.common.newItemOn(fmt(day, 'd MMMM'))} onClick={() => openItem(undefined, { date: day })}>
          {view === 'week' && <span className="mc-cell-weekday">{fmt(day, 'EEEE')}</span>}
          <span className="mc-cell-num">{fmt(day, 'd')}</span>
        </button>
      </div>
      <div className="mc-cell-body">
        {shown.map((e) => (e.kind === 'item' ? <ItemChip key={e.i.id} item={e.i} day={day} /> : <TodoEntry key={e.t.id} todo={e.t} showItem={view === 'week'} compact />))}
        {hidden > 0 && <button type="button" className="mc-more" onClick={onMore}>{t.common.more(hidden)}</button>}
      </div>
    </div>
  );
}
