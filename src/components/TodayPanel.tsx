import { urgencyOf, type ScheduledTodo, type Urgency } from '../data/schedule';
import { useStore } from '../data/store';
import { TodoEntry } from './entries';
import { t } from '../i18n';
import { Icon } from './ui';

const columns = (): { key: Urgency; label: string; empty: string }[] => [
  { key: 'late', label: t.urgency.late, empty: t.urgency.lateEmpty },
  { key: 'today', label: t.urgency.today, empty: t.urgency.todayEmpty },
  { key: 'week', label: t.urgency.week, empty: t.urgency.weekEmpty },
];

export function groupByUrgency(todos: ScheduledTodo[], today: string) {
  const groups: Record<Urgency, ScheduledTodo[]> = { late: [], today: [], week: [], later: [], done: [] };
  for (const t of todos) groups[urgencyOf(t, today)].push(t);
  groups.late.sort((a, b) => b.lateDays - a.lateDays);
  groups.week.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  return groups;
}

/** "Vandaag / Deze week": open to-dos by urgency; overdue ones have rolled forward to today. */
export function TodayPanel({ todos }: { todos: ScheduledTodo[] }) {
  const { today } = useStore();
  const groups = groupByUrgency(todos, today);
  return (
    <section className="mc-today-panel" aria-label={t.urgency.region}>
      {columns().map((c) => (
        <div key={c.key} className="mc-today-col" data-urgency={c.key}>
          <h3>
            {c.key === 'late' && <Icon name="warning" size={16} />}
            {c.label}
            <span className="mc-count">{groups[c.key].length}</span>
          </h3>
          {groups[c.key].length ? (
            <div className="mc-today-list">
              {groups[c.key].map((t) => <TodoEntry key={t.id} todo={t} />)}
            </div>
          ) : (
            <p className="mc-muted mc-today-empty">{c.empty}</p>
          )}
        </div>
      ))}
    </section>
  );
}
