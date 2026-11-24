import { addMonths, addQuarters, addWeeks, addYears, endOfMonth, endOfWeek, getQuarter, startOfMonth, startOfQuarter, startOfWeek, startOfYear } from 'date-fns';
import { useMemo, useState } from 'react';
import { TodayPanel } from '../components/TodayPanel';
import { ItemChip, TodoEntry, useDayDrop } from '../components/entries';
import { Button, Segmented, ToggleChipGroup } from '../components/ui';
import { fmt, fmtDate, fromIso, shiftIso, toIso } from '../data/dates';
import { AUDIENCES, EXISTING_MARKETS_SORTED, PRODUCT_TYPES, countryName, isExistingMarket, matchesCountry, type CountryFilter } from '../data/dimensions';
import { ITEM_TYPES, OWNERS, TYPE_META } from '../data/meta';
import { itemOnDay, type ScheduledTodo } from '../data/schedule';
import { useStore } from '../data/store';
import type { Audience, IsoDate, Item, ItemType, ProductType } from '../data/types';
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
  const campaigns = [...new Set(store.items.map((i) => i.campaign).filter(Boolean))].sort();
  const newMarkets = [...new Set(store.items.flatMap((i) => i.countries))].filter((c) => !isExistingMarket(c))
    .sort((a, b) => countryName(a).localeCompare(countryName(b), 'nl'));

  const matches = (i: Item) =>
    (!filters.types.length || filters.types.includes(i.type)) &&
    (!filters.channel || i.channel === filters.channel) &&
    (!filters.owner || i.owner === filters.owner) &&
    (!filters.campaign || i.campaign === filters.campaign) &&
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
    kwartaal: `K${getQuarter(quarterStart)} ${fmtDate(quarterStart, 'yyyy')} · ${fmtDate(quarterStart, 'MMMM')} – ${fmtDate(addMonths(quarterStart, 2), 'MMMM')}`,
    maand: fmt(anchor, 'MMMM yyyy'),
    week: `Week ${fmt(range.start, 'I')} · ${fmt(range.start, 'd MMM')} – ${fmt(range.end, 'd MMM yyyy')}`,
    lijst: fmt(anchor, 'MMMM yyyy'),
  }[view];
  const openMonth = (day: IsoDate) => { setAnchor(day); setView('maand'); };
  const openWeek = (day: IsoDate) => { setAnchor(day); setView('week'); };

  const itemsOn = (day: IsoDate) =>
    items.filter((i) => itemOnDay(i, day)).sort((a, b) => Number(b.type === 'event') - Number(a.type === 'event') || (a.time ?? '').localeCompare(b.time ?? ''));
  const todosOn = (day: IsoDate) => (filters.showTodos ? todos.filter((t) => t.displayDate === day && !t.done) : []);
  const activeFilters = filters.types.length + [filters.channel, filters.owner, filters.campaign, filters.audience, filters.product, filters.country].filter(Boolean).length;

  return (
    <div className="mc-page mc-page-calendar">
      <PageHeader
        title="Kalender"
        subtitle="Sleep items of to do's naar een andere dag. To do's die over datum zijn, schuiven automatisch door naar vandaag."
        actions={<Button startIcon="add" onClick={() => openItem(undefined, { date: store.today })}>Nieuw item</Button>}
      />

      <TodayPanel todos={todos} />

      <div className="mc-cal-toolbar">
        <div className="mc-cal-nav">
          <Button variant="outlined" intent="secondary" icon="chevron_left" label="Vorige" onClick={() => step(-1)} />
          <Button variant="outlined" intent="secondary" onClick={() => setAnchor(store.today)}>Vandaag</Button>
          <Button variant="outlined" intent="secondary" icon="chevron_right" label="Volgende" onClick={() => step(1)} />
          <h2 className="mc-cal-period">{periodLabel}</h2>
        </div>
        <Segmented
          label="Weergave"
          value={view}
          onChange={setView}
          options={[
            { value: 'jaar', label: 'Jaar', icon: 'calendar_month' },
            { value: 'kwartaal', label: 'Kwartaal', icon: 'space_dashboard' },
            { value: 'maand', label: 'Maand', icon: 'grid_view' },
            { value: 'week', label: 'Week', icon: 'view_column' },
            { value: 'lijst', label: 'Lijst', icon: 'view_list' },
          ]}
        />
      </div>

      <div className="mc-filters" aria-label="Filters">
        <ToggleChipGroup
          label="Type"
          value={filters.types}
          onChange={(types) => setFilters((f) => ({ ...f, types }))}
          options={ITEM_TYPES.map((t) => ({ value: t, label: TYPE_META[t].plural, icon: TYPE_META[t].icon, accent: TYPE_META[t].accent }))}
        />
        <FilterSelect label="Kanaal" value={filters.channel} options={channels} onChange={(channel) => setFilters((f) => ({ ...f, channel }))} />
        <FilterSelect label="Eigenaar" value={filters.owner} options={OWNERS} onChange={(owner) => setFilters((f) => ({ ...f, owner }))} />
        <FilterSelect label="Campagne" value={filters.campaign} options={campaigns} onChange={(campaign) => setFilters((f) => ({ ...f, campaign }))} />
        <FilterSelect label="Doelgroep" value={filters.audience} options={AUDIENCES} onChange={(audience) => setFilters((f) => ({ ...f, audience }))} />
        <FilterSelect label="Product" value={filters.product} options={PRODUCT_TYPES} onChange={(product) => setFilters((f) => ({ ...f, product }))} />
        <select
          className="mc-input mc-filter-select"
          aria-label="Land"
          value={filters.country}
          data-active={!!filters.country || undefined}
          onChange={(e) => setFilters((f) => ({ ...f, country: e.target.value }))}
        >
          <option value="">Land: alle</option>
          <option value="markt:bestaand">Alle bestaande markten</option>
          <option value="markt:nieuw">Alle nieuwe markten</option>
          <optgroup label="Bestaande markten">
            {EXISTING_MARKETS_SORTED.map((c) => <option key={c} value={c}>Land: {countryName(c)}</option>)}
          </optgroup>
          {newMarkets.length > 0 && (
            <optgroup label="Nieuwe markten">
              {newMarkets.map((c) => <option key={c} value={c}>Land: {countryName(c)}</option>)}
            </optgroup>
          )}
        </select>
        <ToggleChipGroup
          label="To do's"
          value={filters.showTodos ? ['todos'] : []}
          onChange={(v) => setFilters((f) => ({ ...f, showTodos: v.includes('todos') }))}
          options={[{ value: 'todos', label: "To do's tonen", icon: 'checklist' }]}
        />
        {activeFilters > 0 && (
          <Button variant="text" size="small" onClick={() => setFilters((f) => ({ ...f, ...NO_FILTERS }))}>
            Filters wissen ({activeFilters})
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
          {['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'].map((d) => <div key={d} className="mc-grid-head">{d}</div>)}
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

function FilterSelect<T extends string>({ label, value, options, onChange }: {
  label: string;
  value: T | '';
  options: (T | { value: T; label: string })[];
  onChange: (v: T | '') => void;
}) {
  return (
    <select className="mc-input mc-filter-select" aria-label={label} value={value} data-active={!!value || undefined} onChange={(e) => onChange(e.target.value as T | '')}>
      <option value="">{label}: alle</option>
      {options.map((o) => {
        const { value: v, label: l } = typeof o === 'string' ? { value: o, label: o } : o;
        return <option key={v} value={v}>{label}: {l}</option>;
      })}
    </select>
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
        <button type="button" className="mc-cell-date" aria-label={`Nieuw item op ${fmt(day, 'd MMMM')}`} onClick={() => openItem(undefined, { date: day })}>
          {view === 'week' && <span className="mc-cell-weekday">{fmt(day, 'EEEE')}</span>}
          <span className="mc-cell-num">{fmt(day, 'd')}</span>
        </button>
      </div>
      <div className="mc-cell-body">
        {shown.map((e) => (e.kind === 'item' ? <ItemChip key={e.i.id} item={e.i} day={day} /> : <TodoEntry key={e.t.id} todo={e.t} showItem={view === 'week'} compact />))}
        {hidden > 0 && <button type="button" className="mc-more" onClick={onMore}>+{hidden} meer</button>}
      </div>
    </div>
  );
}
