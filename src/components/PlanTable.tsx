import { euro } from '../data/budget';
import { daysBetween, fmt } from '../data/dates';
import { useStore } from '../data/store';
import type { Item } from '../data/types';
import { channelLabel, t } from '../i18n';
import { useUi } from '../ui-context';
import { DimensionTags } from './dimensions';
import { StatusPill, TypeBadge } from './ui';

export function periodText(item: Item): string {
  const end = item.endDate ?? item.date;
  if (end === item.date) return fmt(item.date, 'EEEEEE d MMM yyyy');
  return `${fmt(item.date, 'd MMM')} – ${fmt(end, 'd MMM yyyy')}`;
}

/** Share of the period that has passed, 0–1. */
function elapsed(item: Item, today: string): number {
  const end = item.endDate ?? item.date;
  const total = daysBetween(item.date, end) + 1;
  return Math.min(1, Math.max(0, (daysBetween(item.date, today) + 1) / total));
}

export function PlanTable({ items, showMedium, showElapsed, showType, label }: {
  items: Item[];
  showMedium?: boolean;
  showElapsed?: boolean;
  showType?: boolean;
  label: string;
}) {
  const store = useStore();
  const { openItem } = useUi();
  return (
    <div className="mc-table-wrap">
      <table className="mc-table mc-plan-table" aria-label={label}>
        <thead>
          <tr>
            <th data-col="date">{showElapsed ? t.plan.period : t.plan.date}</th>
            <th>{t.plan.title}</th>
            <th data-col="channel">{showMedium ? t.plan.format : t.plan.channel}</th>
            {showMedium && <th data-col="medium">{t.plan.medium}</th>}
            <th data-col="owner">{t.plan.owner}</th>
            <th data-col="status">{t.plan.status}</th>
            <th data-col="amount" className="mc-num">{t.plan.planned}</th>
            <th data-col="amount" className="mc-num">{t.plan.spent}</th>
            <th data-col="todos">{t.plan.todos}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((i) => {
            const todos = store.todosFor(i.id);
            const done = todos.filter((t) => t.done).length;
            const running = showElapsed && i.date <= store.today && (i.endDate ?? i.date) >= store.today;
            const over = i.budgetPlanned != null && i.budgetActual != null && i.budgetActual > i.budgetPlanned;
            return (
              <tr key={i.id} onClick={() => openItem(i.id)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && openItem(i.id)}>
                <td className="mc-nowrap">
                  {periodText(i)}
                  {running && <span className="mc-progress" title={t.plan.elapsed(Math.round(elapsed(i, store.today) * 100))}><span style={{ width: `${elapsed(i, store.today) * 100}%` }} /></span>}
                </td>
                <td>
                  <span className="mc-table-title">{showType && <TypeBadge type={i.type} />}{i.title}</span>
                  <DimensionTags item={i} />
                </td>
                <td>{channelLabel(i.channel)}</td>
                {showMedium && <td>{i.medium || <span className="mc-muted">–</span>}</td>}
                <td>{i.owner || <span className="mc-muted">{t.common.nobody}</span>}</td>
                <td><StatusPill status={i.status} /></td>
                <td className="mc-num">{i.budgetPlanned != null ? euro(i.budgetPlanned) : <span className="mc-muted">–</span>}</td>
                <td className="mc-num" data-over={over || undefined}>{i.budgetActual != null ? euro(i.budgetActual) : <span className="mc-muted">–</span>}</td>
                <td className="mc-nowrap">{todos.length ? `${done}/${todos.length}` : <span className="mc-muted">–</span>}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
